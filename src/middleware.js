import { NextResponse } from 'next/server';

export function middleware(request) {
    const session = request.cookies.get('session');
    const { pathname } = request.nextUrl;

    // If trying to access login page while authenticated, redirect to home
    if (pathname === '/login') {
        if (session?.value === 'authenticated') {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // Protect all other routes
    if (!session || session.value !== 'authenticated') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|auth|_next/static|_next/image|favicon.ico).*)',
    ],
};
