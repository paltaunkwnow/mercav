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
  '/login',
  '/register',
  '/inversores',
  '/feed',
  '/faq',
];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isPublicPath = publicPaths.includes(pathname) || 
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
};
