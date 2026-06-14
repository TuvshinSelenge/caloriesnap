import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith("/api/auth")
  );

  if (!req.auth && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
