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
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
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
        <form onSubmit={handleSubmit} className="border border-[#bec092]/20 bg-background p-6 space-y-6 rounded-2xl">
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
                    className="w-full px-4 py-3 bg-background border border-border text-foreground text-sm placeholder:text-foreground focus:border-[#bec092] focus:outline-none transition-colors rounded-xl"
                />
            </div>

            <div className="bg-background p-4 border border-border rounded-xl">
                <PaymentElement
                    options={{
                        layout: "tabs",
                    }}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading || !stripe || !elements}
                className="w-full py-4 text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl bg-[#bec092] text-black hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? "PROCESANDO..." : "PAGAR AHORA"}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground tracking-[0.1em]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#bec092]" />
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
            <div className="border border-[#bec092]/20 bg-background p-8 flex flex-col items-center justify-center space-y-6 rounded-2xl">
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
                    className="px-8 py-4 bg-[#bec092] text-black rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isInitializing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isInitializing ? "CONECTANDO STRIPE..." : "PROCEDER AL PAGO"}
                </button>

                <Link
                    href={`/negocio/${businessId}/tienda`}
                    className="inline-flex items-center gap-2 text-[10px] text-muted-foreground tracking-[0.15em] hover:text-[#bec092] transition-colors uppercase"
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
            colorPrimary: "#bec092",
            colorDanger: "#DC2626",
            borderRadius: "12px",
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
