import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "wellness_platform_secure_jwt_token_key_2026_super_safe"
);

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tokenVersion: number;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("wellness_session")?.value;

  // 1. Proteksi Interface Admin: /admin/*
  if (pathname.startsWith("/admin")) {
    // Tampilan desktop-required dapat diakses langsung oleh perangkat mobile tanpa loop otentikasi
    if (pathname.startsWith("/admin/desktop-required")) {
      return NextResponse.next();
    }

    // Deteksi jika perangkat adalah mobile (Admin Control bersifat Desktop Only)
    const userAgent = request.headers.get("user-agent") || "";
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (isMobile) {
      return NextResponse.redirect(new URL("/admin/desktop-required", request.url));
    }

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/?auth=signin&target=admin", request.url));
    }

    try {
      const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
      const tokenData = payload as unknown as TokenPayload;

      if (tokenData.role !== "SUPERADMIN") {
        // Bukan superadmin -> alihkan ke user dashboard
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized_admin", request.url));
      }
    } catch {
      // Token tidak valid atau kedaluwarsa
      const response = NextResponse.redirect(new URL("/?auth=signin&target=admin", request.url));
      response.cookies.delete("wellness_session");
      return response;
    }
  }

  // 2. Proteksi Interface User Dashboard PWA: /dashboard/*
  if (pathname.startsWith("/dashboard")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/?auth=signin&target=dashboard", request.url));
    }

    try {
      await jwtVerify(sessionCookie, SECRET_KEY);
    } catch {
      const response = NextResponse.redirect(new URL("/?auth=signin", request.url));
      response.cookies.delete("wellness_session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
