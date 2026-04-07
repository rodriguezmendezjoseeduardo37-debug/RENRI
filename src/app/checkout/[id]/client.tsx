"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { processOrderPayment } from "@/actions/checkout";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";

function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [cardholderName, setCardholderName] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        if (!cardholderName.trim()) {
            toast.error("Ingresa el nombre del titular de la tarjeta.");
            return;
        }

        setIsLoading(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                payment_method_data: {
                    billing_details: {
                        name: cardholderName.trim(),
                    },
                },
            },
            redirect: "if_required",
        });

        if (error) {
            toast.error(error.message || "Error procesando el pago");
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            toast.success("¡Pago validado exitosamente!");
            window.location.reload();
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="border border-border bg-background p-6 space-y-6">
            <h3 className="text-[14px] font-bold tracking-[0.2em] text-foreground uppercase border-b border-border pb-4 mb-6">
                PAGAR CON TARJETA
            </h3>

            {/* Cardholder name — collected by us and passed to Stripe */}
            <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">
                    NOMBRE DEL TITULAR
                </label>
                <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    required
                    placeholder="Como aparece en la tarjeta"
                    className="w-full px-4 py-3 bg-background border border-border text-foreground text-sm placeholder:text-foreground focus:border-white focus:outline-none transition-colors"
                />
            </div>

            <div className="bg-background p-4 border border-border">
                <PaymentElement
                    options={{
                        layout: "tabs",
                    }}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading || !stripe || !elements}
                className="w-full py-4 text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl shadow-sm hover:shadow bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all disabled:opacity-50"
            >
                {isLoading ? "PROCESANDO..." : "PAGAR AHORA"}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground tracking-[0.1em]">
                <ShieldCheck className="w-3.5 h-3.5" />
                PAGO SEGURO PROCESADO POR STRIPE
            </div>
        </form>
    );
}

interface CheckoutClientProps {
    paymentId: string;
    businessId: string;
}

export function CheckoutClient({ paymentId, businessId }: CheckoutClientProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);

    const initializePayment = async () => {
        try {
            setIsInitializing(true);
            const result = await processOrderPayment(paymentId);
            if (result.clientSecret) {
                setClientSecret(result.clientSecret);
                setStripeAccountId(result.stripeAccountId ?? null);
            } else {
                toast.error("No se pudo iniciar la sesión de pago.");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Error al conectar con Stripe.";
            toast.error(message);
        } finally {
            setIsInitializing(false);
        }
    };

    if (!clientSecret) {
        return (
            <div className="border border-border bg-background p-8 flex flex-col items-center justify-center space-y-6">
                <div className="text-center space-y-2">
                    <h3 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">
                        PAGO EN LÍNEA
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Procesamos pagos de forma segura con Stripe
                    </p>
                </div>

                <button
                    onClick={initializePayment}
                    disabled={isInitializing}
                    className="px-8 py-4 bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-secondary transition-colors disabled:opacity-50"
                >
                    {isInitializing ? "CONECTANDO STRIPE..." : "PROCEDER AL PAGO"}
                </button>

                <Link
                    href={`/negocio/${businessId}/tienda`}
                    className="inline-flex items-center gap-2 text-[10px] text-muted-foreground tracking-[0.15em] hover:text-foreground transition-colors uppercase"
                >
                    <ArrowLeft className="w-3 h-3" />
                    VOLVER A LA TIENDA
                </Link>
            </div>
        );
    }

    const appearance = {
        theme: isDark ? ("night" as const) : ("stripe" as const),
        variables: {
            fontFamily: "monospace",
            colorBackground: isDark ? "#0A0A0A" : "#FFFFFF",
            colorText: isDark ? "#ffffff" : "#0A0A0A",
            colorPrimary: isDark ? "#ffffff" : "#0A0A0A",
            colorDanger: "#DC2626",
            borderRadius: "4px",
        },
    };

    // Load Stripe scoped to the connected account so Elements match the PaymentIntent
    const connectedStripe = loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
    );

    return (
        <Elements stripe={connectedStripe} options={{ clientSecret, appearance }}>
            <CheckoutForm />
        </Elements>
    );
}
