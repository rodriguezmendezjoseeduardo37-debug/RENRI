import Stripe from "stripe";
import { signSignedToken } from "@/lib/signed-token";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripeServer = new Stripe(stripeSecretKey, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
});

export const getStripeClient = () => {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
};

export async function createPaymentIntent(
    amount: number,
    currency: string = "mxn",
    metadata: Record<string, string> = {},
    stripeConnectAccountId?: string | null,
    applicationFeeAmount?: number
) {
    const amountInCents = Math.round(amount * 100);

    if (stripeConnectAccountId) {
        const params: Stripe.PaymentIntentCreateParams = {
            amount: amountInCents,
            currency: currency.toLowerCase(),
            metadata,
        };

        if (applicationFeeAmount && applicationFeeAmount > 0) {
            params.application_fee_amount = Math.round(applicationFeeAmount);
        }

        return stripeServer.paymentIntents.create(params, {
            stripeAccount: stripeConnectAccountId,
        });
    }

    return stripeServer.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata,
    });
}

export async function createConnectOnboardingLink(
    tenantId: string,
    userId: string,
    redirectUrl: string
): Promise<string> {
    const state = signSignedToken(
        {
            kind: "stripe-connect",
            tenantId,
            userId,
        },
        60 * 15
    );

    const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
        scope: "read_write",
        redirect_uri: redirectUrl,
        state,
        "stripe_user[business_type]": "company",
    });

    return `https://connect.stripe.com/express/oauth/authorize?${params.toString()}`;
}

export async function exchangeConnectCode(code: string): Promise<{
    stripeAccountId: string;
    stripeAccountEnabled: boolean;
}> {
    const response = await stripeServer.oauth.token({
        grant_type: "authorization_code",
        code,
    });

    const account = await stripeServer.accounts.retrieve(response.stripe_user_id!);

    return {
        stripeAccountId: response.stripe_user_id!,
        stripeAccountEnabled: account.charges_enabled ?? false,
    };
}

export async function getConnectAccountStatus(stripeAccountId: string) {
    const account = await stripeServer.accounts.retrieve(stripeAccountId);
    return {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        displayName: account.settings?.dashboard?.display_name ?? null,
    };
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
