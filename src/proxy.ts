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
            new URL(isClient ? "/dashboard/mis-citas" : "/dashboard", nextUrl)
        );
    }

    // ─── Protect role-based routes ───
    if (pathname.startsWith("/dashboard")) {
        if (!isLoggedIn) {
            const loginUrl = new URL("/login", nextUrl);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return Response.redirect(loginUrl);
        }

        const businessOnlyPrefixes = [
            "/dashboard/citas",
            "/dashboard/horarios",
            "/dashboard/pagos",
            "/dashboard/inventario",
            "/dashboard/pedidos",
            "/dashboard/turnos",
            "/dashboard/clientes",
            "/dashboard/configuracion/clinica",
            "/dashboard/configuracion/organizacion",
            "/dashboard/configuracion/apis",
            "/dashboard/configuracion/planes",
        ];
        const clientOnlyPrefixes = [
            "/dashboard/disponibilidad",
            "/dashboard/mis-citas",
            "/dashboard/mis-pagos",
        ];

        if (
            isClient &&
            businessOnlyPrefixes.some((route) => pathname.startsWith(route))
        ) {
            return Response.redirect(new URL("/dashboard/mis-citas", nextUrl));
        }

        if (
            !isClient &&
            clientOnlyPrefixes.some((route) => pathname.startsWith(route))
        ) {
            return Response.redirect(new URL("/dashboard", nextUrl));
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
