import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const session = cookies().get("session");

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/orders/:path*"]
};
