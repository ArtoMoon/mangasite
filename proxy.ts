import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isApi = req.nextUrl.pathname.startsWith("/api");
    const isStaff = token?.role === "admin" || token?.role === "mod";
    const hasAccess = isStaff;

    if (!hasAccess) {
      if (isApi) {
        return new NextResponse(
          JSON.stringify({ error: "Yetkisiz erişim. Bu alana erişim yetkiniz bulunmuyor." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Korumak istediğimiz sayfalar ve API rotaları
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
