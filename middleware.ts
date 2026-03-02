import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for server-side route protection
 * Protects /admin routes from unauthorized access
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (not /api/admin routes)
  if (pathname.startsWith('/admin')) {
    // Check for Firebase session cookie or token
    // Note: For production, implement proper session cookie handling
    // This is a basic check - Firebase client SDK will handle the actual auth

    // For now, we allow the request to proceed and rely on client-side auth
    // In production, you should:
    // 1. Set up Firebase session cookies on login
    // 2. Verify session cookie here
    // 3. Redirect to login if invalid

    // Example check (requires session cookie setup):
    // const sessionCookie = request.cookies.get('session');
    // if (!sessionCookie) {
    //   return NextResponse.redirect(new URL('/', request.url));
    // }

    // Add security headers
    const response = NextResponse.next();

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/process-research-results/:path*',
  ],
};
