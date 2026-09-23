import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-cookies";

/**
 * Optimistic check only. It looks for a session cookie so that logged-out
 * visitors get redirected instead of rendering an admin shell, and it does not
 * verify the cookie. Real authorization happens in `requireAdmin` / `assertAdmin`,
 * which every admin page, route handler and server action calls for itself.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path((?!login).*)", "/admin"],
};
