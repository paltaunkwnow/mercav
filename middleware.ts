import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/',
  '/anuncios',
  '/servicios',
  '/empleos',
  '/precios',
  '/preguntas-frecuentes',
  '/por-que-mercav',
  '/nosotros',
  '/terminos',
  '/privacidad',
  '/cookies',
  '/aviso-legal',
  '/contacto',
  '/soporte',
  '/explorar',
  '/buscar',
  '/herramientas',
  '/login',
  '/register',
  '/inversores',
  '/feed',
  '/faq',
];

// Only these Pwn API calls may run without a session (exposure returns a boolean only).
const pwnPublicApi: Array<{ method: string; path: string }> = [
  { method: 'POST', path: '/api/pwn/exposure' },
];

function isPwnPublicApi(req: NextRequest, pathname: string) {
  const path = pathname.replace(/\/$/, '');
  return pwnPublicApi.some((route) => route.method === req.method && route.path === path);
}

type HitBucket = { count: number; resetAt: number };
const apiHits = new Map<string, HitBucket>();

function clientAddress(req: NextRequest) {
  return (
    req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip')?.trim() ||
    req.ip ||
    'local'
  );
}

function apiBudget(pathname: string) {
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
  const key = `${pathname.split('/').slice(0, 4).join('/')}:${clientAddress(req)}`;
  const bucket = apiHits.get(key);
  if (!bucket || now > bucket.resetAt) {
    if (apiHits.size > 5000) apiHits.clear();
    apiHits.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > apiBudget(pathname);
}

function apiMaySkipSession(req: NextRequest, pathname: string) {
  const path = pathname.replace(/\/$/, '');
  if (req.method === 'GET') {
    const publicReads = ['/api/jobs', '/api/services', '/api/spaces', '/api/search', '/api/posts', '/api/users'];
    if (publicReads.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return true;
    if (path === '/api/kosher/places' || /^\/api\/kosher\/places\/[a-z0-9-]+$/.test(path)) return true;
  }
  return (
    path.startsWith('/api/auth') ||
    path.startsWith('/api/location') ||
    path === '/api/webhook/stripe' ||
    path === '/api/pwn/internal/cycle' ||
    isPwnPublicApi(req, pathname)
  );
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const host = req.headers.get('host')?.split(':')[0]?.toLowerCase();
  let { pathname } = req.nextUrl;

  if (
    host === 'pwn.mercav.lat' &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/pwn') &&
    pathname !== '/login' &&
    pathname !== '/register'
  ) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === '/' ? '/pwn' : `/pwn${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (host === 'kosher.mercav.lat' && /^\/(empleos|mensajes)(\/|$)/.test(pathname)) {
    return NextResponse.redirect(new URL(`${pathname}${req.nextUrl.search}`, 'https://mercav.lat'));
  }

  if (
    host === 'kosher.mercav.lat' &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/kosher') &&
    pathname !== '/login' &&
    pathname !== '/register'
  ) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === '/' ? '/kosher' : `/kosher${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith('/api/') && rateLimited(req, pathname)) {
    return NextResponse.json(
      { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } },
    );
  }

  if (pathname.startsWith('/api/') && !token && !apiMaySkipSession(req, pathname)) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 401, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  if (pathname === '/api/pwn' || pathname.startsWith('/api/pwn/')) {
    const cronPath = pathname.replace(/\/$/, '') === '/api/pwn/internal/cycle';
    if (!token && !cronPath && !isPwnPublicApi(req, pathname)) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    if (!token) return NextResponse.next();
  }

  const isPublicPath = publicPaths.includes(pathname) ||
                       pathname.startsWith('/legal/') ||
                       pathname === '/pwn' ||
                       pathname.startsWith('/pwn/') ||
                       pathname === '/kosher' ||
                       pathname.startsWith('/kosher/') ||
                       pathname.startsWith('/api/kosher/') ||
                       pathname.startsWith('/api/auth') ||
                       pathname.startsWith('/api/location') ||
                       pathname.startsWith('/_next') ||
                       pathname.startsWith('/favicon.ico') ||
                       pathname === '/perfil' ||
                       pathname.match(/^\/perfil\/[^\/]+$/);
                       
  const isDynamicPublicPath = 
    (pathname.startsWith('/anuncios/') && !pathname.includes('/mis-espacios') && !pathname.includes('/publicar')) ||
    (pathname.startsWith('/servicios/') && !pathname.includes('/mis-servicios') && !pathname.includes('/ordenes') && !pathname.includes('/publicar')) ||
    (pathname.startsWith('/empleos/') && !pathname.includes('/mis-vacantes') && !pathname.includes('/mis-postulaciones') && !pathname.includes('/publicar'));

  const isAuthPath = pathname === '/login' || pathname === '/register';
  const isAdminPath = pathname.startsWith('/admin');
  const userRoles = (token?.roles as string[]) || [];
  const isAdmin = userRoles.includes('ADMIN');
  const isSanctioned = !!token?.isSanctioned;

  // Sanction check - redirect ANY path except /sancion and public/auth assets
  if (isSanctioned && pathname !== '/sancion' && !pathname.startsWith('/api/auth') && !pathname.startsWith('/_next')) {
     return NextResponse.redirect(new URL('/sancion', req.url));
  }

  // Prevent accessing /sancion if not sanctioned
  if (pathname === '/sancion' && !isSanctioned) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Admin access control
  if (isAdminPath && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is already logged in as Admin, redirect from login/register to admin dashboard
  if (isAuthPath && token && isAdmin) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  // If user is already logged in (non-admin), redirect from login/register to user dashboard
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Protected routes check
  if (!token && !isPublicPath && !isDynamicPublicPath) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}


export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|uploads|logo.png|404.html|index.html).*)'],
};
// creado por pato dev y askforvini
