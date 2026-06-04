import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { SECURITY_HEADERS } from '@/lib/security';

const isProtectedRoute = createRouteMatcher([
  '/',
  '/entries(.*)',
  '/journal(.*)',
  '/admin(.*)',
  '/api/auth/validate-session(.*)',
  '/api/auth/logout(.*)',
  '/api/journal(.*)',
  '/api/security/dashboard(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  const response = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
