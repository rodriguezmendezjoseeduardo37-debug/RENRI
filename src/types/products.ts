import { z } from "zod";

// ─── Product ─────────────────────────────────────────────
export interface Product {
    id: string;
    tenantId: string;
    name: string;
    description: string | null;
    sku: string | null;
    price: string;
    cost: string | null;
    stock: number;
    lowStockAlert: number;
    category: string | null;
    imageUrl: string | null;
    isPublic: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ─── Stock Movement ──────────────────────────────────────
export interface StockMovement {
    id: string;
    productId: string;
    tenantId: string;
    type: "add" | "subtract";
    quantity: number;
    reason: string | null;
    userId: string | null;
    userName?: string;
    createdAt: string;
}

// ─── Zod Schemas ─────────────────────────────────────────
export const createProductSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().optional(),
    sku: z.string().optional(),
    price: z.string().min(1, "El precio es obligatorio"),
    cost: z.string().optional(),
    stock: z.number().int().min(0).default(0),
    lowStockAlert: z.number().int().min(0).default(5),
    category: z.string().optional(),
    imageUrl: z.string().optional(),
    isPublic: z.boolean().default(false),
});

export type CreateProductInput = z.infer<typeof createProductSchema> & {
    tenantId: string;
};

export const updateProductSchema = createProductSchema.partial();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
