/**
 * Shared application constants.
 */

/** Default tax rate (IVA) — used in order calculations on both client and server. */
export const TAX_RATE = 0.16;

/**
 * RENRI platform commission rates per payment type.
 * These are taken as application_fee via Stripe Connect Destination Charges.
 * The fee is deducted from the payment before it reaches the business's connected account.
 *
 * Revenue model:
 * - appointment: 2.5% — commission on service bookings paid online
 * - order:       3.0% — commission on product sales through the public store
 * - subscription: 0%  — RENRI plan subscriptions are handled separately (Stripe direct)
 *
 * Note: Stripe's own processing fee (~3.6% + $3 MXN) is separate and paid by the
 * receiving connected account unless `passFeeToClient` is enabled on the product.
 */
export const COMMISSION_RATES = {
    appointment: 0.025,
    order: 0.03,
    subscription: 0,
} as const;
