import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proxy homepage to Framer
  if (pathname === "/") {
    return NextResponse.rewrite(new URL("https://sharesaathi.framer.website"));
  }

  // Proxy Framer static assets
  if (pathname.startsWith("/framer/")) {
    return NextResponse.rewrite(
      new URL(`https://sharesaathi.framer.website${pathname}`)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/framer/:path*"],
};
