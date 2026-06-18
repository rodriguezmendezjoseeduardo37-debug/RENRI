import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { tenants, users, verificationTokens } from "@/db/schema";
import { sendVerificationEmail } from "@/lib/emails";
import crypto from "crypto";

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string(),
    accountType: z.enum(["servicios", "pyme", "cliente"]),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos invalidos", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { name, email, password, accountType } = parsed.data;

        const [existing] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        const passwordHash = await bcrypt.hash(password, 12);

        if (existing) {
            if (accountType !== "cliente") {
                return NextResponse.json(
                    { error: "Ya existe una cuenta con este correo electronico" },
                    { status: 409 }
                );
            }

            if (existing.role !== "CLIENT") {
                return NextResponse.json(
                    { error: "Ese correo ya esta en uso por una cuenta administrativa" },
                    { status: 409 }
                );
            }

            if (existing.passwordHash) {
                return NextResponse.json(
                    { error: "Ya existe una cuenta con este correo electronico" },
                    { status: 409 }
                );
            }

            await db
                .update(users)
                .set({
                    name,
                    passwordHash,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, existing.id));

            if (!existing.isVerified) {
                const token = crypto.randomBytes(32).toString("hex");
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24);

                await db.insert(verificationTokens).values({
                    identifier: email,
                    token,
                    expiresAt,
                }).onConflictDoUpdate({
                    target: verificationTokens.identifier,
                    set: { token, expiresAt },
                });

                await sendVerificationEmail({
                    to: email,
                    token,
                    businessName: "RENRI",
                });
            }

            return NextResponse.json(
                { success: true, activatedExistingClient: true },
                { status: 201 }
            );
        }

        await db.transaction(async (tx) => {
            if (accountType === "cliente") {
                const [tenant] = await tx
                    .insert(tenants)
                    .values({
                        name: `${name}'s Account`,
                        slug: `${email.split("@")[0]}-${Date.now()}`,
                        plan: "starter",
                        accountType: "cliente",
                    })
                    .returning();

                await tx.insert(users).values({
                    tenantId: tenant.id,
                    email,
                    name,
                    passwordHash,
                    role: "CLIENT",
                    isVerified: false,
                });
                return;
            }

            const [tenant] = await tx
                .insert(tenants)
                .values({
                    name: `${name}'s Business`,
                    slug: `${email.split("@")[0]}-${Date.now()}`,
                    plan: "starter",
                    accountType,
                })
                .returning();

            await tx.insert(users).values({
                tenantId: tenant.id,
                email,
                name,
                passwordHash,
                role: "OWNER",
                isVerified: false,
            });
        });

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await db.insert(verificationTokens).values({
            identifier: email,
            token,
            expiresAt,
        }).onConflictDoUpdate({
            target: verificationTokens.identifier,
            set: { token, expiresAt },
        });

        await sendVerificationEmail({
            to: email,
            token,
            businessName: "RENRI",
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
