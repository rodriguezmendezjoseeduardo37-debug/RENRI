import Stripe from "stripe";

// Initialize Stripe server client
export const stripeServer = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_123", {
    typescript: true,
});

export const getStripeClient = () => {
    // Return publishable key for client-side loadStripe inside components
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
};

// Helper: createPaymentIntent
export async function createPaymentIntent(
    amount: number, // expecting amount in main currency units or cents depending on currency (usually cents for MXN/USD)
    currency: string = "mxn",
    metadata: Record<string, string> = {}
) {
    // Stripe expects amounts in the smallest unit (cents for USD/MXN)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripeServer.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata,
    });

    return paymentIntent;
}

// Helper: createStripeCustomer
export async function createStripeCustomer(email: string, name?: string, tenantId?: string) {
    const customerParams: Stripe.CustomerCreateParams = {
        email,
        metadata: tenantId ? { tenantId } : undefined,
    };

    if (name) customerParams.name = name;

    const customer = await stripeServer.customers.create(customerParams);
    return customer;
}

// Helper: getPaymentIntent
export async function getPaymentIntent(id: string) {
    return await stripeServer.paymentIntents.retrieve(id);
}

// Helper: refundPayment
export async function refundPayment(paymentIntentId: string, amount?: number) {
    const params: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
    };

    if (amount) {
        params.amount = Math.round(amount * 100);
    }

    const refund = await stripeServer.refunds.create(params);
    return refund;
}
