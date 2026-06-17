import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.redirect(new URL("/login?error=MissingToken", req.url));
    }

    try {
        const [verificationToken] = await db
            .select()
            .from(verificationTokens)
            .where(eq(verificationTokens.token, token))
            .limit(1);

        if (!verificationToken) {
            return NextResponse.redirect(new URL("/login?error=InvalidToken", req.url));
        }

        if (new Date() > new Date(verificationToken.expiresAt)) {
            return NextResponse.redirect(new URL("/login?error=TokenExpired", req.url));
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, verificationToken.identifier))
            .limit(1);

        if (!user) {
            return NextResponse.redirect(new URL("/login?error=UserNotFound", req.url));
        }

        await db
            .update(users)
            .set({ isVerified: true, updatedAt: new Date() })
            .where(eq(users.id, user.id));

        await db
            .delete(verificationTokens)
            .where(eq(verificationTokens.identifier, verificationToken.identifier));

        return NextResponse.redirect(new URL("/verify", req.url));
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.redirect(new URL("/login?error=VerificationFailed", req.url));
    }
}
