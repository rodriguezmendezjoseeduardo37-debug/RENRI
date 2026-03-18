import { z } from "zod";

/**
 * Esquemas de validacion centralizados para el proyecto RENRI
 * Utilizados en Server Actions y formularios
 */

// PAGOS

export const CreatePaymentSchema = z.object({
    referenceId: z.string().uuid("ID de referencia invalido"),
    referenceType: z.enum(["appointment", "order"]),
    amount: z.number().positive("El monto debe ser positivo"),
    currency: z.string().length(3).default("MXN"),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

export const ProcessPaymentSchema = z.object({
    paymentId: z.string().uuid("ID de pago invalido"),
});

export type ProcessPaymentInput = z.infer<typeof ProcessPaymentSchema>;

export const MarkPaymentAsPaidSchema = z.object({
    paymentId: z.string().uuid("ID de pago invalido"),
    stripePaymentIntentId: z.string().optional(),
});

export type MarkPaymentAsPaidInput = z.infer<typeof MarkPaymentAsPaidSchema>;

export const RefundPaymentSchema = z.object({
    paymentId: z.string().uuid("ID de pago invalido"),
});

export type RefundPaymentInput = z.infer<typeof RefundPaymentSchema>;

// CITAS (APPOINTMENTS)

export const CreateAppointmentSchema = z.object({
    clientId: z.string().uuid("Cliente invalido"),
    staffId: z.string().uuid("Profesional invalido"),
    serviceName: z.string().min(1, "Nombre de servicio requerido").max(255),
    date: z.string().date("Fecha invalida"),
    startTime: z.string().time("Hora de inicio invalida"),
    endTime: z.string().time("Hora de fin invalida"),
    notes: z.string().max(2000).optional(),
    amount: z.string().regex(/^\d+(\.\d{2})?$/, "Monto invalido").optional(),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

export const UpdateAppointmentSchema = z.object({
    appointmentId: z.string().uuid("ID de cita invalido"),
    serviceName: z.string().min(1).max(255).optional(),
    date: z.string().date().optional(),
    startTime: z.string().time().optional(),
    endTime: z.string().time().optional(),
    notes: z.string().max(2000).optional(),
    status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
});

export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;

// ORDENES

export const CreateOrderSchema = z.object({
    clientId: z.string().uuid("Cliente invalido"),
    items: z.array(z.object({
        productId: z.string().uuid("Producto invalido"),
        quantity: z.number().int().positive("Cantidad debe ser positiva"),
        price: z.string().regex(/^\d+(\.\d{2})?$/),
    })).min(1, "Minimo 1 producto"),
    notes: z.string().max(2000).optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderSchema = z.object({
    orderId: z.string().uuid("ID de orden invalido"),
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
    notes: z.string().max(2000).optional(),
});

export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;

// USUARIOS

export const CreateUserSchema = z.object({
    email: z.string().email("Email invalido"),
    name: z.string().min(1, "Nombre requerido").max(255),
    role: z.enum(["OWNER", "ADMIN", "STAFF", "CLIENT"]),
    password: z.string().min(8, "Minimo 8 caracteres"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
    userId: z.string().uuid("ID de usuario invalido"),
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    role: z.enum(["OWNER", "ADMIN", "STAFF", "CLIENT"]).optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// PRODUCTOS

export const CreateProductSchema = z.object({
    name: z.string().min(1, "Nombre requerido").max(255),
    description: z.string().max(1000).optional(),
    price: z.string().regex(/^\d+(\.\d{2})?$/, "Precio invalido"),
    stock: z.number().int().nonnegative("Stock no puede ser negativo"),
    sku: z.string().min(1).max(100).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = z.object({
    productId: z.string().uuid("ID de producto invalido"),
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    price: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
    stock: z.number().int().nonnegative().optional(),
});

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// HORARIOS

export const CreateScheduleSchema = z.object({
    staffId: z.string().uuid("Profesional invalido"),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().time("Hora de inicio invalida"),
    endTime: z.string().time("Hora de fin invalida"),
});

export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;

// TENANT

export const UpdateTenantSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    logoUrl: z.string().url().optional(),
    clinicalSettings: z.record(z.string(), z.any()).optional(),
    billingSettings: z.record(z.string(), z.any()).optional(),
});

export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
