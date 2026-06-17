import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { users, profiles } from "./users";
import { appointments } from "./appointments";
import { schedules, blockedDates } from "./schedules";
import { products, stockMovements } from "./products";
import { orders, orderItems } from "./orders";
import { payments } from "./payments";
import { clientBusinesses } from "./client_businesses";

// ─── Tenants ─────────────────────────────────────────────
export const tenantsRelations = relations(tenants, ({ many }) => ({
    users: many(users),
    appointments: many(appointments),
    schedules: many(schedules),
    blockedDates: many(blockedDates),
    products: many(products),
    stockMovements: many(stockMovements),
    orders: many(orders),
    payments: many(payments),
    clientBusinesses: many(clientBusinesses),
}));

// ─── Users & Profiles ────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [users.tenantId],
        references: [tenants.id],
    }),
    linkedBusiness: one(tenants, {
        fields: [users.linkedBusinessId],
        references: [tenants.id],
        relationName: "linkedBusiness",
    }),
    profile: one(profiles, {
        fields: [users.id],
        references: [profiles.userId],
    }),
    clientAppointments: many(appointments, { relationName: "clientAppointments" }),
    staffAppointments: many(appointments, { relationName: "staffAppointments" }),
    staffSchedules: many(schedules),
    staffBlockedDates: many(blockedDates),
    clientOrders: many(orders),
    stockMovements: many(stockMovements),
    clientBusinesses: many(clientBusinesses),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
    user: one(users, {
        fields: [profiles.userId],
        references: [users.id],
    }),
}));

// ─── Appointments ────────────────────────────────────────
export const appointmentsRelations = relations(appointments, ({ one }) => ({
    tenant: one(tenants, {
        fields: [appointments.tenantId],
        references: [tenants.id],
    }),
    client: one(users, {
        fields: [appointments.clientId],
        references: [users.id],
        relationName: "clientAppointments",
    }),
    staff: one(users, {
        fields: [appointments.staffId],
        references: [users.id],
        relationName: "staffAppointments",
    }),
}));

// ─── Schedules ───────────────────────────────────────────
export const schedulesRelations = relations(schedules, ({ one }) => ({
    tenant: one(tenants, {
        fields: [schedules.tenantId],
        references: [tenants.id],
    }),
    staff: one(users, {
        fields: [schedules.staffId],
        references: [users.id],
    }),
}));

export const blockedDatesRelations = relations(blockedDates, ({ one }) => ({
    tenant: one(tenants, {
        fields: [blockedDates.tenantId],
        references: [tenants.id],
    }),
    staff: one(users, {
        fields: [blockedDates.staffId],
        references: [users.id],
    }),
}));

// ─── Products & Inventory ────────────────────────────────
export const productsRelations = relations(products, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [products.tenantId],
        references: [tenants.id],
    }),
    stockMovements: many(stockMovements),
    orderItems: many(orderItems),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
    tenant: one(tenants, {
        fields: [stockMovements.tenantId],
        references: [tenants.id],
    }),
    product: one(products, {
        fields: [stockMovements.productId],
        references: [products.id],
    }),
    user: one(users, {
        fields: [stockMovements.userId],
        references: [users.id],
    }),
}));

// ─── Orders ──────────────────────────────────────────────
export const ordersRelations = relations(orders, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [orders.tenantId],
        references: [tenants.id],
    }),
    client: one(users, {
        fields: [orders.clientId],
        references: [users.id],
    }),
    items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
}));

// ─── Payments ────────────────────────────────────────────
export const paymentsRelations = relations(payments, ({ one }) => ({
    tenant: one(tenants, {
        fields: [payments.tenantId],
        references: [tenants.id],
    }),
}));

// ─── Client Businesses ───────────────────────────────────
export const clientBusinessesRelations = relations(clientBusinesses, ({ one }) => ({
    client: one(users, {
        fields: [clientBusinesses.clientId],
        references: [users.id],
    }),
    tenant: one(tenants, {
        fields: [clientBusinesses.tenantId],
        references: [tenants.id],
    }),
}));
