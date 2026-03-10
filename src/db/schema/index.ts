// ─── Schema Barrel Export ────────────────────────────────
// Re-exports every table and enum from the schema modules.

export { tenants, planEnum } from "./tenants";

export { users, profiles, userRoleEnum } from "./users";

export { appointments, appointmentStatusEnum } from "./appointments";

export * from "./schedules"; // already exports schedules, now blockedDates too

export { turns, turnStatusEnum } from "./turns";

export { products, stockMovements, stockMovementTypeEnum } from "./products";

export { orders, orderItems, orderStatusEnum } from "./orders";

export {
    payments,
    referenceTypeEnum,
    paymentStatusEnum,
} from "./payments";
