import { NextResponse } from 'next/server';
import {
  APP_HOME,
  KOSHER_HOST,
  KOSHER_URL,
  PWN_HOST,
  SITE_HOST,
  SITE_URL,
  appPathFor,
  isKosherHostPath,
  isNoindexPath,
  isSharedPath,
} from '@/lib/seo/site';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { looksLikeInterceptor } from '@/lib/security/unusual-traffic';
import { API_HOST, isMercavOrigin } from '@/lib/api/origins';
import { apiRouteGroup, evictHitBuckets, pwnCsrfBlockReason, type HitBucket } from '@/lib/pwn/request-guard';

const publicPaths = [
  '/',
  '/inicio',
  '/anuncios',
  '/servicios',
  '/empleos',
  '/precios',
  '/preguntas-frecuentes',
  '/por-que-mercav',
  // Páginas de producto para los buscadores.
  '/caja',
  '/planillas',
  '/fidelizacion',
  '/nosotros',
  '/terminos',
  '/privacidad',
  '/cookies',
  '/aviso-legal',
  '/contacto',
  '/soporte',
  '/buscar',
  '/herramientas',
  '/login',
  '/register',
  '/inversores',
  '/pitch',
  '/feed',
  // Está en el sitemap: sin esto, los buscadores y quien llega por un link caían en el login.
  '/changelog',
  // Páginas de estado: las tiene que poder ver cualquiera (antes mandaban al login).
  '/maintenance',
  '/offline',
  '/forbidden',
  '/1337',
];

// Only these Pwn API calls may run without a session (exposure returns a boolean only).
const pwnPublicApi: Array<{ method: string; path: string }> = [
  { method: 'POST', path: '/api/pwn/exposure' },
  { method: 'POST', path: '/api/pwn/passwords/range' },
];

function isPwnPublicApi(req: NextRequest, pathname: string) {
  const path = pathname.replace(/\/$/, '');
  return pwnPublicApi.some((route) => route.method === req.method && route.path === path);
}

function isPwnCronPath(pathname: string) {
  const path = pathname.replace(/\/$/, '');
  return path === '/api/pwn/internal/cycle' || path === '/api/pwn/internal/forums';
}

const apiHits = new Map<string, HitBucket>();
const MAX_HIT_BUCKETS = 5000;

function clientAddress(req: NextRequest) {
  return (
    req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip')?.trim() ||
    req.ip ||
    'local'
  );
}

function apiBudget(pathname: string) {
  // Leer la sesión es barato y NextAuth lo hace en cada carga y al volver a la pestaña: con 20 por minuto, una oficina
  // detrás de una IP (o el NAT de una operadora móvil) quedaba como desconectada. El tope estricto queda para entrar,
  // registrarse y recuperar la contraseña, que sin reCAPTCHA es la defensa contra fuerza bruta.
  if (pathname === '/api/auth/session' || pathname === '/api/auth/csrf' || pathname === '/api/auth/providers') return 300;
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/contact') || pathname.startsWith('/api/location')) return 20;
  if (pathname.startsWith('/api/pwn/exposure')) return 12;
  if (
    pathname.startsWith('/api/search') ||
    pathname.startsWith('/api/jobs') ||
    pathname.startsWith('/api/services') ||
    pathname.startsWith('/api/spaces') ||
    pathname.startsWith('/api/users') ||
    pathname.startsWith('/api/posts') ||
    pathname.startsWith('/api/feed')
  ) {
    return 40;
  }
  return 120;
}

function rateLimited(req: NextRequest, pathname: string) {
  const now = Date.now();
  // Por grupo de ruta: un id o un segmento inventado en la URL no abre un balde nuevo.
  const key = `${apiRouteGroup(pathname)}:${clientAddress(req)}`;
  const bucket = apiHits.get(key);
  if (!bucket || now > bucket.resetAt) {
    // Se liberan los baldes vencidos y después los más viejos; nunca se vacía el mapa de todos.
    evictHitBuckets(apiHits, now, MAX_HIT_BUCKETS);
    apiHits.delete(key);
    apiHits.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > apiBudget(pathname);
}

// Escrituras a /api/pwn: mismo origen y JSON (ver lib/pwn/request-guard). El cron y /passwords/range siguen andando.
function pwnCsrfBlocked(req: NextRequest, pathname: string) {
  return pwnCsrfBlockReason({
    method: req.method,
    pathname,
    secFetchSite: req.headers.get('sec-fetch-site'),
    contentType: req.headers.get('content-type'),
    contentLength: req.headers.get('content-length'),
    transferEncoding: req.headers.get('transfer-encoding'),
    authorization: req.headers.get('authorization'),
    origin: req.headers.get('origin'),
  });
}

function apiMaySkipSession(req: NextRequest, pathname: string) {
  const path = pathname.replace(/\/$/, '');
  if (req.method === 'GET') {
    const publicReads = ['/api/jobs', '/api/services', '/api/spaces', '/api/search', '/api/posts', '/api/users'];
    if (publicReads.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return true;
    if (path === '/api/kosher/places' || /^\/api\/kosher\/places\/[a-z0-9-]+$/.test(path)) return true;
    // Calendario suscripto: Google, Apple u Outlook lo leen sin sesión; el token del link es la llave.
    if (/^\/api\/calendar\/feed\/[A-Za-z0-9_-]{40,60}(\.ics)?$/.test(path)) return true;
  }
  return (
    path.startsWith('/api/auth') ||
    path.startsWith('/api/location') ||
    // Fidelización: the customer's card works without a Mercav account (the routes rate-limit themselves).
    path === '/api/loyalty' ||
    path.startsWith('/api/loyalty/') ||
    path === '/api/webhook/stripe' ||
    path === '/api/security/unusual' ||
    isPwnCronPath(path) ||
    isPwnPublicApi(req, pathname)
  );
}

// 307 while the host split rolls out: browsers don't cache it, so a wrong rule is easy to undo.
// Switch to 308 once app.mercav.lat is stable so search engines move the old URLs.
function moved(target: URL) {
  return NextResponse.redirect(target, 307);
}

/**
 * Splits the product across hosts. Only applies to the production hostnames, so 127.0.0.1:1337
 * and Vercel previews keep serving every route from one origin.
 * - pwn.mercav.lat/x        → app.mercav.lat/pwn/x
 * - mercav.lat/<app route>  → app.mercav.lat/<app route>   (only the public site stays)
 * - app.mercav.lat/         → app.mercav.lat/inicio
 * - app.mercav.lat/<public> → mercav.lat/<public>
 * - <cualquiera>/kosher/x   → kosher.mercav.lat/x
 * /api, /_next and shared utility pages are never moved: webhooks and OAuth callbacks keep working.
 */
function productHostRedirect(req: NextRequest, host: string | undefined, pathname: string): NextResponse | null {
  if (!host || pathname.startsWith('/api') || pathname.startsWith('/_next') || isSharedPath(pathname)) return null;
  const search = req.nextUrl.search;
  const kosherPath = pathname === '/kosher' || pathname.startsWith('/kosher/');

  if (host === SITE_HOST) {
    if (kosherPath) return moved(new URL(`${pathname.slice(7) || '/'}${search}`, KOSHER_URL));
    return null;
  }

  return null;
}

/**
 * api.mercav.lat: cada ruta es la misma de /api (api.mercav.lat/jobs = /api/jobs; /api/jobs también anda).
 * Pasa por los mismos controles que /api y responde con CORS a los dominios de Mercav (ver lib/api/client.ts).
 */
function withApiHeaders(res: NextResponse, req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin && isMercavOrigin(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', req.headers.get('access-control-request-headers') || 'Content-Type, Authorization');
    res.headers.set('Access-Control-Expose-Headers', 'Content-Disposition, Retry-After');
    res.headers.set('Access-Control-Max-Age', '600');
  }
  res.headers.append('Vary', 'Origin');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

async function handle(req: NextRequest): Promise<NextResponse> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const host = req.headers.get('host')?.split(':')[0]?.toLowerCase();
  let { pathname } = req.nextUrl;

  const apiHost = host === API_HOST;
  if (apiHost) {
    // El preflight de CORS no lleva cookies: se contesta acá y withApiHeaders le pone los permisos.
    if (req.method === 'OPTIONS') return new NextResponse(null, { status: 204 });
    if (pathname === '/') return NextResponse.json({ name: 'Mercav API', status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
    if (pathname !== '/api' && !pathname.startsWith('/api/')) pathname = `/api${pathname}`;
  }
  // La ruta canónica viaja al layout (x-mercav-path), que arma el <link rel="canonical"> y el og:url de cada página.
  const forwarded = new Headers(req.headers);
  forwarded.set('x-mercav-path', appPathFor(host, req.nextUrl.pathname));
  // En api.mercav.lat la respuesta que sigue es la ruta de /api; en el resto de los dominios, la misma URL.
  const pass = () =>
    apiHost ? NextResponse.rewrite(new URL(`${pathname}${req.nextUrl.search}`, req.url)) : NextResponse.next({ request: { headers: forwarded } });

  if (
    looksLikeInterceptor(req.headers.get('user-agent')) &&
    pathname !== '/1337' &&
    !pathname.startsWith('/api/security/unusual') &&
    !pathname.startsWith('/_next')
  ) {
    return NextResponse.redirect(new URL('/1337?src=proxy', req.url));
  }

  const hostRedirect = productHostRedirect(req, host, pathname);
  if (hostRedirect) return hostRedirect;

  // On kosher.mercav.lat only Kosher's own sections stay (isKosherHostPath, shared with the chrome's hostHref).
  // Public-site pages go straight to mercav.lat.
  if (host === KOSHER_HOST && !isKosherHostPath(pathname)) {
    return NextResponse.redirect(new URL(`${pathname}${req.nextUrl.search}`, SITE_URL));
  }

  // Shared utility pages (/1337, /maintenance…) are served as they are: /kosher/1337 doesn't exist.
  if (
    host === KOSHER_HOST &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/kosher') &&
    pathname !== '/login' &&
    pathname !== '/register' &&
    !isSharedPath(pathname)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === '/' ? '/kosher' : `/kosher${pathname}`;
    return NextResponse.rewrite(url, { request: { headers: forwarded } });
  }

  // PWN rewrite on pwn.mercav.lat
  if (
    host === PWN_HOST &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/pwn') &&
    pathname !== '/login' &&
    pathname !== '/register' &&
    !isSharedPath(pathname)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === '/' ? '/pwn' : `/pwn${pathname}`;
    return NextResponse.rewrite(url, { request: { headers: forwarded } });
  }

  if (pathname.startsWith('/api/') && rateLimited(req, pathname)) {
    return NextResponse.json(
      { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } },
    );
  }

  if (pwnCsrfBlocked(req, pathname)) {
    return NextResponse.json(
      { success: false, error: 'Solicitud bloqueada: tiene que venir de Mercav y en formato JSON.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (pathname.startsWith('/api/') && !token && !apiMaySkipSession(req, pathname)) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 401, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  if (pathname === '/api/pwn' || pathname.startsWith('/api/pwn/')) {
    const cronPath = isPwnCronPath(pathname);
    if (!token && !cronPath && !isPwnPublicApi(req, pathname)) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    if (!token) return pass();
  }

  const isPublicPath = publicPaths.includes(pathname) ||
                       pathname.startsWith('/legal/') ||
                       // Feriados por país: páginas públicas para los buscadores.
                       pathname === '/feriados' ||
                       pathname.startsWith('/feriados/') ||
                       pathname === '/pwn' ||
                       pathname.startsWith('/pwn/') ||
                       pathname === '/kosher' ||
                       pathname.startsWith('/kosher/') ||
                       // Fidelización: join page, customer card and self-service stamp (no login).
                       pathname === '/c' ||
                       pathname.startsWith('/c/') ||
                       pathname.startsWith('/api/kosher/') ||
                       pathname.startsWith('/api/auth') ||
                       pathname.startsWith('/api/location') ||
                       pathname === '/api/security/unusual' ||
                       pathname.startsWith('/herramientas/') ||
                       // Public catalog reads already cleared the API gate above; don't bounce them to /login.
                       (pathname.startsWith('/api/') && apiMaySkipSession(req, pathname)) ||
                       pathname.startsWith('/_next') ||
                       pathname.startsWith('/favicon.ico') ||
                       pathname === '/perfil' ||
                       pathname.match(/^\/perfil\/[^\/]+$/);
                       
  const isDynamicPublicPath = 
    (pathname.startsWith('/anuncios/') && !pathname.includes('/mis-espacios') && !pathname.includes('/publicar')) ||
    (pathname.startsWith('/servicios/') && !pathname.includes('/mis-servicios') && !pathname.includes('/publicar')) ||
    (pathname.startsWith('/empleos/') && !pathname.includes('/mis-empleos') && !pathname.includes('/publicar'));

  const isAuthPath = pathname === '/login' || pathname === '/register';
  const isAdminPath = pathname.startsWith('/admin');
  const userRoles = (token?.roles as string[]) || [];
  const isAdmin = userRoles.includes('ADMIN');
  const isSanctioned = !!token?.isSanctioned;

  // Sanction check - redirect ANY path except /sancion and public/auth assets
  if (isSanctioned && pathname !== '/sancion' && !pathname.startsWith('/api/auth') && !pathname.startsWith('/_next')) {
     if (apiHost) return NextResponse.json({ success: false, error: 'Tu cuenta está sancionada.' }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
     return NextResponse.redirect(new URL('/sancion', req.url));
  }

  // Prevent accessing /sancion if not sanctioned
  if (pathname === '/sancion' && !isSanctioned) {
    return NextResponse.redirect(new URL(APP_HOME, req.url));
  }

  // Admin access control
  if (isAdminPath && !isAdmin) {
    return NextResponse.redirect(new URL(APP_HOME, req.url));
  }

  // If user is already logged in as Admin, redirect from login/register to admin dashboard
  if (isAuthPath && token && isAdmin) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  // If user is already logged in (non-admin), redirect from login/register to callbackUrl (same-site path) or the app home.
  // Sin esto, quien abría "Crear mi cuenta" desde su tarjeta con la sesión ya iniciada perdía la vuelta.
  if (isAuthPath && token) {
    const cb = req.nextUrl.searchParams.get('callbackUrl');
    const safe = cb && cb.startsWith('/') && !cb.startsWith('//') && !cb.includes('\\') && !cb.includes('://');
    return NextResponse.redirect(new URL(safe ? cb : APP_HOME, req.url));
  }

  // Protected routes check
  if (!token && !isPublicPath && !isDynamicPublicPath) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return pass();
}


// Buscadores: las áreas privadas van con noindex. La URL canónica la escribe el layout en el HTML (x-mercav-path):
// un encabezado Link no sirve porque Next lo pisa con el suyo de precarga de fuentes.
export async function middleware(req: NextRequest) {
  const host = req.headers.get('host')?.split(':')[0]?.toLowerCase();
  if (host === API_HOST) return withApiHeaders(await handle(req), req);
  const res = await handle(req);
  const { pathname } = req.nextUrl;
  if (req.method === 'GET' && !pathname.startsWith('/api/') && !pathname.startsWith('/_next') && res.status < 300) {
    if (isNoindexPath(appPathFor(host, pathname))) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|mervi|uploads|videos|icons|logo.png|robots.txt|sitemap.xml|manifest.webmanifest|icon.png|apple-icon.png|opengraph-image|twitter-image).*)'],
};
// creado por pato dev y askforvini
