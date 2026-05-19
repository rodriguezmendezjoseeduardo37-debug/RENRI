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
    const [elementReady, setElementReady] = useState(false);
    const [elementError, setElementError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;
        setIsLoading(true);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {},
                redirect: "if_required"
            });

            if (error) {
                const errorMessages: Record<string, string> = {
                    card_declined: "Tarjeta rechazada. Verifica tus datos o intenta con otra.",
                    insufficient_funds: "Fondos insuficientes. Intenta con otra tarjeta.",
                    expired_card: "Tarjeta expirada.",
                    incorrect_cvc: "CVC incorrecto.",
                    processing_error: "Error al procesar. Intenta de nuevo.",
                    incorrect_number: "Número de tarjeta incorrecto.",
                };

                const friendlyMessage =
                    errorMessages[error.decline_code ?? ""] ??
                    errorMessages[error.code ?? ""] ??
                    error.message ??
                    "Error procesando el pago";

                toast.error(friendlyMessage);
            } else if (paymentIntent && paymentIntent.status === "succeeded") {
                toast.success("Pago exitoso");
                onSuccess?.();
                window.location.reload();
            } else {
                toast.error("El pago no pudo completarse. Intenta de nuevo.");
            }
        } catch {
            toast.error("Error inesperado al procesar el pago.");
        }

        setIsLoading(false);
    };

    if (elementError) {
        return (
            <div className="border border-destructive/30 bg-background p-6 space-y-4 text-center">
                <p className="text-sm text-foreground font-medium">
                    No se pudo cargar el formulario de pago.
                </p>
                <p className="text-xs text-muted-foreground">{elementError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase border border-border hover:border-foreground transition-colors"
                >
                    REINTENTAR
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="border border-border bg-background p-6 space-y-6">
            <h3 className="text-[14px] font-bold tracking-[0.2em] text-foreground uppercase border-b border-border pb-4 mb-6">
                PROCESAR DIGITALMENTE (STRIPE)
            </h3>

            <div className="bg-background p-4 border border-border">
                {!elementReady && (
                    <div className="flex items-center justify-center py-6">
                        <span className="text-xs text-muted-foreground tracking-[0.1em]">CARGANDO STRIPE...</span>
                    </div>
                )}
                <PaymentElement
                    options={{
                        layout: "tabs",
                        // Force dark minimalist overrides down through the iframe using Appearance API 
                        // if we want to be fully custom, but default dark is usually acceptable.
                    }}
                    onReady={() => setElementReady(true)}
                    onLoadError={(event) => {
                        console.warn("Stripe PaymentElement load error:", event);
                        setElementError(
                            "Error al cargar Stripe. Verifica tu conexión e intenta de nuevo."
                        );
                    }}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading || !stripe || !elements || !elementReady}
                className="w-full border border-white bg-background text-foreground py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-primary-foreground transition-colors disabled:opacity-50"
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
            <div className="border border-border bg-background p-6 flex flex-col items-center justify-center space-y-4">
                <h3 className="text-[14px] font-bold tracking-[0.2em] text-muted-foreground uppercase text-center">
                    PAGO EN LINEA CONFIGURADO
                </h3>
                <button
                    onClick={initializePayment}
                    disabled={isInitializing}
                    className="px-6 py-3 border border-border text-foreground text-[10px] font-bold tracking-[0.2em] uppercase hover:border-foreground transition-colors disabled:opacity-50"
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
