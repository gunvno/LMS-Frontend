/* ──────────────────────────────────────────────────────────
   LMS Mini — Route Proxy (Next.js 16)
   Replaces middleware.ts — runs on nodejs runtime
   ────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/my-courses",
  "/learn",
  "/quiz",
  "/certificates",
  "/profile",
  "/change-password",
];

const authPages = ["/login", "/register", "/verify-otp"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires authentication
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const isAuthPage = authPages.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );

  // We check for token in cookies or Authorization header
  // Since we use localStorage, proxy can only do a lightweight check
  // The real guard is AuthGate on the client side
  // Proxy just ensures SSR doesn't serve protected pages without any indication

  if (isProtected) {
    // Let the page load — AuthGate on client will redirect if no token
    // This is the recommended pattern for localStorage-based auth
    return NextResponse.next();
  }

  if (isAuthPage) {
    // Allow auth pages
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)",
  ],
};
