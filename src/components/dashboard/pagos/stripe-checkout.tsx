"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { processPayment } from "@/actions/payments";
import { toast } from "sonner";

// Load Stripe outside component to avoid recreation
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
    clientSecret: string;
    onSuccess?: () => void;
}

function CheckoutForm({ onSuccess }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;
        setIsLoading(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL ignored if redirect is false inside some flows, but we must configure it if redirecting
                // return_url: `${window.location.origin}/dashboard/pagos/confirmacion`,
            },
            redirect: "if_required"
        });

        if (error) {
            toast.error(error.message || "Error procesando el pago");
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            toast.success("Pago exitoso");
            onSuccess?.();
            // Optional: force reload page or wait for Webhook vs local state sync
            window.location.reload();
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="border border-[#222222] bg-[#0a0a0a] p-6 space-y-6">
            <h3 className="text-[14px] font-bold tracking-[0.2em] text-white uppercase border-b border-[#222222] pb-4 mb-6">
                PROCESAR DIGITALMENTE (STRIPE)
            </h3>

            <div className="bg-black p-4 border border-[#333333]">
                <PaymentElement
                    options={{
                        layout: "tabs",
                        // Force dark minimalist overrides down through the iframe using Appearance API 
                        // if we want to be fully custom, but default dark is usually acceptable.
                    }}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading || !stripe || !elements}
                className="w-full border border-white bg-black text-white py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
                {isLoading ? "CARGANDO..." : "PAGAR AHORA"}
            </button>
        </form>
    );
}

export function StripeCheckoutWrapper({ paymentId, onSuccess }: { paymentId: string, onSuccess?: () => void }) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);

    // Grab secret from backend Intent when user wants to pay
    const initializePayment = async () => {
        try {
            setIsInitializing(true);
            const { clientSecret } = await processPayment(paymentId);
            if (clientSecret) {
                setClientSecret(clientSecret);
            } else {
                toast.error("No se pudo obtener la sesión de pago");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Fallo técnico al iniciar Stripe";
            toast.error(message);
        } finally {
            setIsInitializing(false);
        }
    };

    if (!clientSecret) {
        return (
            <div className="border border-[#222222] bg-[#0a0a0a] p-6 flex flex-col items-center justify-center space-y-4">
                <h3 className="text-[14px] font-bold tracking-[0.2em] text-[#888888] uppercase text-center">
                    PAGO EN LINEA CONFIGURADO
                </h3>
                <button
                    onClick={initializePayment}
                    disabled={isInitializing}
                    className="px-6 py-3 border border-[#444444] text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:border-white transition-colors disabled:opacity-50"
                >
                    {isInitializing ? "CONECTANDO STRIPE..." : "INICIAR TERMINAL DIGITAL"}
                </button>
            </div>
        );
    }

    // Pass styling via Appearance API
    const appearance = {
        theme: 'night' as const,
        variables: {
            fontFamily: 'monospace',
            colorBackground: '#000000',
            colorText: '#ffffff',
            colorPrimary: '#ffffff',
            colorDanger: '#ff4444',
            borderRadius: '0px',
        },
    };

    return (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
            <CheckoutForm clientSecret={clientSecret} onSuccess={onSuccess} />
        </Elements>
    );
}
