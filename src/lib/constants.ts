/**
 * Shared application constants.
 */

/** Default tax rate (IVA) — used in order calculations on both client and server. */
export const TAX_RATE = 0.16;

/**
 * RENRI platform commission rates per payment type.
 * - appointment: 0%   (services — no commission)
 * - order:       0%   (product sales — no commission)
 * - subscription: 0%  (RENRI plan subscription — handled separately)
 */
export const COMMISSION_RATES = {
    appointment: 0,
    order: 0,
    subscription: 0,
} as const;
