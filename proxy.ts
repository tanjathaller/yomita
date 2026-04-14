import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-auth-constants";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/favicon.ico") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/favicon";
    url.search = "";
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  if (search) {
    loginUrl.searchParams.set("next", `${pathname}${search}`);
  } else {
    loginUrl.searchParams.set("next", pathname);
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/favicon.ico"],
};
