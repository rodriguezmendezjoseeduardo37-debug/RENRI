import Stripe from "stripe";

// Inicialización lazy del cliente de Stripe.
//
// No usamos un fallback placeholder (p. ej. "sk_test_placeholder"): eso
// enmascara una configuración faltante y provoca errores crípticos de
// autenticación de Stripe en runtime. En su lugar, fallamos con un mensaje
// claro la primera vez que se intenta usar el cliente sin clave.
//
// La inicialización es lazy (no a nivel de módulo) para no romper builds ni
// entornos donde el módulo se importa pero nunca se llama (CI sin secretos,
// análisis estático, etc.).
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

let stripeClient: Stripe | null = null;

function getStripeServer(): Stripe {
    if (!stripeSecretKey) {
        throw new Error(
            "STRIPE_SECRET_KEY no está configurada. Define la variable de entorno " +
            "para poder procesar pagos con Stripe."
        );
    }
    if (!stripeClient) {
        stripeClient = new Stripe(stripeSecretKey, {
            apiVersion: "2026-02-25.clover",
            typescript: true,
        });
    }
    return stripeClient;
}

/**
 * Cliente de Stripe (server-side).
 *
 * Proxy que inicializa el cliente real de forma perezosa en el primer acceso
 * a una propiedad. Conserva la API habitual: `stripeServer.paymentIntents.create(...)`.
 * Lanza un error claro si `STRIPE_SECRET_KEY` no está configurada.
 */
export const stripeServer = new Proxy({} as Stripe, {
    get(_target, prop, receiver) {
        const client = getStripeServer();
        const value = Reflect.get(client, prop, receiver);
        return typeof value === "function" ? value.bind(client) : value;
    },
});

export const getStripeClient = () => {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
};

export async function createPaymentIntent(
    amount: number,
    currency: string = "mxn",
    metadata: Record<string, string> = {},
    stripeConnectAccountId?: string | null,
    applicationFeeAmount?: number,
    transferGroup?: string
) {
    const amountInCents = Math.round(amount * 100);

    const params: Stripe.PaymentIntentCreateParams = {
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata,
    };

    if (transferGroup) {
        params.transfer_group = transferGroup;
    } else if (stripeConnectAccountId) {
        // If only one account is provided and no group, use Destination Charges
        params.transfer_data = {
            destination: stripeConnectAccountId,
        };

        if (applicationFeeAmount && applicationFeeAmount > 0) {
            params.application_fee_amount = Math.round(applicationFeeAmount);
        }
    }

    return stripeServer.paymentIntents.create(params);
}

/**
 * Creates a manual transfer from the platform balance to a connected account.
 * Useful for complex splits (e.g. paying staff/service providers separately).
 */
export async function createTransfer(
    amount: number,
    destinationAccountId: string,
    description?: string,
    metadata?: Record<string, string>
) {
    return stripeServer.transfers.create({
        amount: Math.round(amount * 100),
        currency: "mxn",
        destination: destinationAccountId,
        description,
        metadata,
    });
}

// ─── Stripe Connect — Accounts v2 (recipient config) ──────
// Modelo: Destination Charges SIN on_behalf_of → la cuenta conectada actúa
// como "recipient" (recibe transfers a su Stripe Balance y hace payouts a su
// banco). RENRI es el Merchant of Record y cobra la comisión vía
// application_fee_amount. Ver createPaymentIntent (transfer_data.destination).

/**
 * Crea una cuenta conectada Accounts **v2** con configuración de *recipient*.
 * El KYC y la cuenta bancaria se recogen después vía el onboarding alojado
 * de Stripe (createAccountOnboardingLinkV2).
 */
export async function createConnectedAccountV2(params: {
    email: string;
    displayName?: string;
    tenantId: string;
    userId: string;
}): Promise<string> {
    const account = await stripeServer.v2.core.accounts.create({
        contact_email: params.email,
        display_name: params.displayName,
        identity: {
            country: "mx",
            entity_type: "individual",
        },
        configuration: {
            recipient: {
                capabilities: {
                    stripe_balance: {
                        // Recibir transfers (Destination Charges) a su Stripe Balance.
                        // El payout al banco se habilita durante el onboarding.
                        stripe_transfers: { requested: true },
                    },
                },
            },
        },
        defaults: {
            currency: "mxn",
            // Stripe EXIGE fijar ambos cuando la cuenta es recipient con la
            // capability stripe_transfers. Deben ser coherentes con el perfil
            // de plataforma de Connect:
            //  - losses_collector "stripe": Stripe asume el saldo negativo
            //    (coincide con el perfil de plataforma).
            //  - fees_collector "application": RENRI (la plataforma) cobra su
            //    comisión vía application_fee_amount en los Destination Charges.
            responsibilities: {
                fees_collector: "application",
                losses_collector: "stripe",
            },
        },
        dashboard: "none", // cuenta gestionada por la plataforma, sin dashboard propio
        metadata: {
            tenantId: params.tenantId,
            userId: params.userId,
            platform: "renri",
        },
    });

    return account.id;
}

/**
 * Genera un enlace de onboarding alojado por Stripe (Accounts v2) para que el
 * negocio complete su verificación de identidad y datos bancarios.
 */
export async function createAccountOnboardingLinkV2(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
): Promise<string> {
    const accountLink = await stripeServer.v2.core.accountLinks.create({
        account: accountId,
        use_case: {
            type: "account_onboarding",
            account_onboarding: {
                configurations: ["recipient"],
                refresh_url: refreshUrl,
                return_url: returnUrl,
            },
        },
    });

    return accountLink.url;
}

/**
 * Lee el estado de una cuenta conectada v2.
 *
 * `chargesEnabled` aquí significa "la cuenta puede recibir fondos" (capability
 * stripe_transfers activa), que es lo relevante en el modelo recipient/
 * Destination Charges. Se mantiene el nombre para compatibilidad con la UI.
 */
export async function getConnectAccountStatus(stripeAccountId: string) {
    const account = await stripeServer.v2.core.accounts.retrieve(stripeAccountId, {
        include: ["configuration.recipient"],
    });

    const balance = account.configuration?.recipient?.capabilities?.stripe_balance;
    const transfersActive = balance?.stripe_transfers?.status === "active";
    const payoutsActive = balance?.payouts?.status === "active";

    return {
        id: account.id,
        chargesEnabled: transfersActive,
        payoutsEnabled: payoutsActive,
        detailsSubmitted: transfersActive,
        displayName: account.display_name ?? null,
    };
}

/**
 * Indica si `accountId` es una cuenta válida y accesible vía la API v2.
 *
 * Devuelve `false` cuando la cuenta no es usable por esta plataforma en v2:
 *   - Cuenta legacy creada con la API v1 / inexistente → StripeInvalidRequestError
 *   - Cuenta a la que la API key no tiene acceso         → StripePermissionError
 * En ambos casos hay que recrear la cuenta en v2.
 *
 * Los errores transitorios (red, 5xx, rate limit, etc.) se relanzan para NO
 * descartar por error una cuenta válida.
 */
export async function isV2Account(accountId: string): Promise<boolean> {
    try {
        await stripeServer.v2.core.accounts.retrieve(accountId);
        return true;
    } catch (err) {
        if (
            err instanceof Stripe.errors.StripeInvalidRequestError ||
            err instanceof Stripe.errors.StripePermissionError
        ) {
            return false;
        }
        throw err;
    }
}

export async function createStripeCustomer(email: string, name?: string, tenantId?: string) {
    const customerParams: Stripe.CustomerCreateParams = {
        email,
        metadata: tenantId ? { tenantId } : undefined,
    };

    if (name) customerParams.name = name;
    return stripeServer.customers.create(customerParams);
}

export async function getPaymentIntent(id: string) {
    return stripeServer.paymentIntents.retrieve(id);
}

export async function refundPayment(paymentIntentId: string, amount?: number) {
    const params: Stripe.RefundCreateParams = { payment_intent: paymentIntentId };
    if (amount) params.amount = Math.round(amount * 100);
    return stripeServer.refunds.create(params);
}
