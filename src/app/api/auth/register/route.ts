import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, tenants } from "@/db/schema";
import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string(),
    accountType: z.enum(["servicios", "pyme", "cliente"]),
}).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { name, email, password, accountType } = parsed.data;

        // Check if user already exists
        const [existing] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existing) {
            return NextResponse.json(
                { error: "Ya existe una cuenta con este correo electrónico" },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        if (accountType === "cliente") {
            // Client: create a default tenant and assign CLIENT role
            const [tenant] = await db
                .insert(tenants)
                .values({
                    name: `${name}'s Account`,
                    slug: email.split("@")[0] + "-" + Date.now(),
                    plan: "starter",
                    accountType: "cliente",
                })
                .returning();

            await db.insert(users).values({
                tenantId: tenant.id,
                email,
                name,
                passwordHash,
                role: "CLIENT",
                isVerified: false,
            });
        } else {
            // Servicios / PYME: create tenant + user with OWNER role
            const planMap = { servicios: "starter", pyme: "pro" } as const;

            const [tenant] = await db
                .insert(tenants)
                .values({
                    name: `${name}'s Business`,
                    slug: email.split("@")[0] + "-" + Date.now(),
                    plan: planMap[accountType],
                    accountType,
                })
                .returning();

            await db.insert(users).values({
                tenantId: tenant.id,
                email,
                name,
                passwordHash,
                role: "OWNER",
                isVerified: false,
            });
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
