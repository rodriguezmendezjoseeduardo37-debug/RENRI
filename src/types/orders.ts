// ─── Order ────────────────────────────────────────────────
export type OrderStatus = "pending" | "processing" | "completed" | "cancelled" | "refunded";

export interface Order {
    id: string;
    tenantId: string;
    clientId: string | null;
    clientName: string | null;
    clientEmail: string | null;
    status: OrderStatus;
    subtotal: string;
    tax: string;
    total: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName?: string | null;
    quantity: number;
    unitPrice: string;
    subtotal: string;
}

export interface OrderWithItems extends Order {
    items: OrderItem[];
}

export interface CreateOrderInput {
    tenantId: string;
    clientName?: string;
    clientEmail?: string;
    clientId?: string;
    notes?: string;
    items: {
        productId: string;
        quantity: number;
    }[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    pending: "PENDIENTE",
    processing: "EN PROCESO",
    completed: "COMPLETADO",
    cancelled: "CANCELADO",
    refunded: "REEMBOLSADO",
};
