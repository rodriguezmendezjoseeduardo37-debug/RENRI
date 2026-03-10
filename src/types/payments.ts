import { z } from "zod";

export interface Payment {
    id: string;
    tenantId: string;
    referenceId: string;
    referenceType: "appointment" | "order";
    stripePaymentIntentId: string | null;
    stripePaymentMethod: string | null;
    amount: string | number; // Drizzle numeric comes back as string sometimes
    currency: string;
    status: "pending" | "processing" | "completed" | "failed" | "refunded";
    paidAt: Date | null;
    createdAt: Date;
}

export interface RevenueStats {
    total: number;
    count: number;
    average: number;
    by_day: {
        date: string;
        amount: number;
    }[];
}

export const createPaymentSchema = z.object({
    referenceId: z.string().uuid(),
    referenceType: z.enum(["appointment", "order"]),
    amount: z.number().positive(),
    tenantId: z.string().uuid(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
