import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ── Route protection proxy (Next.js 16 — Edge-compatible) ────────────────────
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ambil JWT token dari cookie (tanpa DB, Edge-safe)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const isAdmin = token?.role === "Admin";

  // ── Public: Login page ────────────────────────────────────────────────────
  if (pathname === "/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ── Root → redirect ───────────────────────────────────────────────────────
  if (pathname === "/") {
    return NextResponse.redirect(
      isLoggedIn ? new URL("/dashboard", req.url) : new URL("/login", req.url)
    );
  }

  // ── Dashboard → requires auth ─────────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin-only routes
    const adminRoutes = ["/dashboard/admin"];
    if (adminRoutes.some((r) => pathname.startsWith(r)) && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
