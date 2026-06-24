import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const redirectUrl = new URL("/dashboard/configuracion/planes", req.url);

    redirectUrl.searchParams.set("success", "true");
    redirectUrl.searchParams.set("pending", "true");

    return NextResponse.redirect(redirectUrl);
}
