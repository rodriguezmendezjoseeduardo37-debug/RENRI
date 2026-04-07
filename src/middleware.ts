import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const { pathname } = nextUrl;
    const isLoggedIn = !!req.auth;
    const userRole = (req.auth?.user as { role?: string } | undefined)?.role;
    const isClient = userRole === "CLIENT";

    // ─── Tenant resolver: read subdomain from Host header ───
    let requestHeaders: Headers | undefined;
    const host = req.headers.get("host") ?? "";
    const parts = host.split(".");
    if (parts.length >= 3) {
        requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-tenant-slug", parts[0]);
    }

    const AUTH_ROUTES = ["/login", "/register"];
    const PUBLIC_ROUTES = ["/login", "/register", "/auth/error", "/", "/portal"];

    // ─── Redirect logged-in users away from auth pages ───
    if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && isLoggedIn) {
        return Response.redirect(
            new URL(isClient ? "/cliente/mis-citas" : "/dashboard", nextUrl)
        );
    }

    // ─── Protect authenticated routes ───
    if (pathname.startsWith("/dashboard")) {
        if (!isLoggedIn) {
            const loginUrl = new URL("/login", nextUrl);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return Response.redirect(loginUrl);
        }
        
        // Block clients from accessing business dashboards
        if (isClient) {
            return Response.redirect(new URL("/cliente/mis-citas", nextUrl));
        }
    }

    if (pathname.startsWith("/cliente")) {
        if (!isLoggedIn) {
            const loginUrl = new URL("/login", nextUrl);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return Response.redirect(loginUrl);
        }
    }

    if (pathname.startsWith("/superadmin")) {
        if (!isLoggedIn) {
            const loginUrl = new URL("/login", nextUrl);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return Response.redirect(loginUrl);
        }

        if (userRole !== "SUPER_ADMIN") {
            return Response.redirect(new URL("/unauthorized", nextUrl));
        }
    }

    // Allow public routes without headers if not multi-tenant
    if (PUBLIC_ROUTES.some((r) => pathname === r || (r !== "/" && pathname.startsWith(r)))) {
        if (requestHeaders) {
            return NextResponse.next({ request: { headers: requestHeaders } });
        }
        return;
    }

    // If nothing returned, pass the headers anyway
    if (requestHeaders) {
        return NextResponse.next({ request: { headers: requestHeaders } });
    }
});

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
