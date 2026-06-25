"use client";

import { useState, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { processOrderPayment, confirmOrderPayment } from "@/actions/checkout";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTheme } from "next-themes";

interface CheckoutFormProps {
    paymentId: string;
    checkoutToken: string;
}

function CheckoutForm({ paymentId, checkoutToken }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [elementReady, setElementReady] = useState(false);
    const [elementError, setElementError] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [cardholderName, setCardholderName] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        if (!cardholderName.trim()) {
            toast.error("Ingresa el nombre del titular de la tarjeta.");
            return;
        }

        setIsLoading(true);

        try {
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
                // Handle specific Stripe error codes for better UX
                const errorMessages: Record<string, string> = {
                    card_declined: "Tu tarjeta fue rechazada. Verifica tus datos o intenta con otra tarjeta.",
                    insufficient_funds: "Fondos insuficientes. Intenta con otra tarjeta.",
                    expired_card: "Tu tarjeta ha expirado. Usa otra tarjeta.",
                    incorrect_cvc: "El código de seguridad (CVC) es incorrecto.",
                    processing_error: "Error al procesar. Intenta de nuevo en unos momentos.",
                    incorrect_number: "El número de tarjeta es incorrecto.",
                };

                const friendlyMessage =
                    errorMessages[error.decline_code ?? ""] ??
                    errorMessages[error.code ?? ""] ??
                    error.message ??
                    "Error procesando el pago. Intenta de nuevo.";

                toast.error(friendlyMessage);
                setIsLoading(false);
                return;
            }

            if (paymentIntent && paymentIntent.status === "succeeded") {
                // Verify with Stripe server-side and update DB immediately
                try {
                    const confirmation = await confirmOrderPayment(paymentId, checkoutToken);
                    if (confirmation.success) {
                        setPaymentSuccess(true);
                        toast.success("¡Pago completado exitosamente!");
                    } else {
                        // Stripe says it hasn't succeeded yet server-side
                        toast.error(confirmation.message ?? "El pago aún no se ha confirmado. Espera unos momentos.");
                    }
                } catch {
                    // Server action failed but Stripe confirmed success — show success anyway
                    // The webhook will eventually update the DB
                    setPaymentSuccess(true);
                    toast.success("¡Pago procesado! Tu pedido será confirmado en breve.");
                }
            } else if (paymentIntent && paymentIntent.status === "requires_action") {
                // 3D Secure or other authentication — Stripe handles this automatically
                toast.info("Se requiere autenticación adicional...");
            } else {
                toast.error("El pago no pudo completarse. Intenta de nuevo.");
            }
        } catch {
            toast.error("Error inesperado al procesar el pago.");
        }

        setIsLoading(false);
    };

    if (paymentSuccess) {
        return (
            <div className="border border-foreground/20 bg-background p-4 sm:p-6 md:p-8 space-y-4 rounded-2xl text-center">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-foreground/20 blur-xl rounded-full" />
                    <CheckCircle2 className="w-12 h-12 text-foreground relative z-10 mx-auto" />
                </div>
                <h3 className="text-lg font-bold tracking-[0.1em] text-foreground uppercase">
                    ¡PAGO COMPLETADO!
                </h3>
                <p className="text-xs text-muted-foreground">
                    Tu pedido ha sido confirmado. Recibirás un correo de confirmación.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase liquid-control text-foreground hover:bg-foreground/5 transition-all rounded-full"
                >
                    VER ESTADO DEL PEDIDO
                </button>
            </div>
        );
    }

    if (elementError) {
        return (
            <div className="border border-destructive/30 bg-background p-4 sm:p-6 space-y-4 rounded-2xl text-center">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                <p className="text-sm text-foreground font-medium">
                    No se pudo cargar el formulario de pago.
                </p>
                <p className="text-xs text-muted-foreground">{elementError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase border border-border hover:border-foreground transition-colors rounded-xl"
                >
                    REINTENTAR
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="border border-foreground/20 bg-background p-4 sm:p-6 md:p-8 space-y-6 rounded-2xl">
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
                    className="w-full px-4 py-3 bg-background border border-border text-foreground text-sm placeholder:text-foreground focus:border-foreground focus:outline-none transition-colors rounded-xl"
                />
            </div>

            <div className="bg-background p-4 border border-border rounded-xl relative">
                {!elementReady && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-xs text-muted-foreground tracking-[0.1em]">CARGANDO FORMULARIO...</span>
                    </div>
                )}
                <PaymentElement
                    options={{
                        layout: "tabs",
                    }}
                    onReady={() => setElementReady(true)}
                    onLoadError={(event) => {
                        console.warn("Stripe PaymentElement load error:", event);
                        setElementError(
                            "Error al cargar Stripe. Verifica tu conexión a internet e intenta de nuevo."
                        );
                    }}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading || !stripe || !elements || !elementReady}
                className="w-full py-4 text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl liquid-button hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? "PROCESANDO..." : "PAGAR AHORA"}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground tracking-[0.1em]">
                <ShieldCheck className="w-3.5 h-3.5 text-foreground" />
                PAGO SEGURO PROCESADO POR STRIPE
            </div>
        </form>
    );
}

interface CheckoutClientProps {
    paymentId: string;
    businessId: string;
    checkoutToken: string;
}

export function CheckoutClient({ paymentId, businessId, checkoutToken }: CheckoutClientProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);

    const initializePayment = async () => {
        try {
            setIsInitializing(true);
            const result = await processOrderPayment(paymentId, checkoutToken);
            if (result.clientSecret) {
                setClientSecret(result.clientSecret);
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

    // Memoize Stripe instance to avoid re-creating the promise on every render.
    // NOTE: We use Destination Charges (transfer_data.destination), which means
    // the PaymentIntent lives on the PLATFORM account, not the connected account.
    // Therefore Elements must be loaded WITHOUT stripeAccount.
    const connectedStripe = useMemo(() => {
        if (!clientSecret) return null;
        return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    }, [clientSecret]);

    const appearance = useMemo(() => ({
        theme: isDark ? ("night" as const) : ("stripe" as const),
        variables: {
            fontFamily: "monospace",
            colorBackground: isDark ? "#0A0A0A" : "#FFFFFF",
            colorText: isDark ? "#ffffff" : "#0A0A0A",
            colorPrimary: "#0a0a0a",
            colorDanger: "#DC2626",
            borderRadius: "12px",
        },
    }), [isDark]);

    if (!clientSecret || !connectedStripe) {
        return (
            <div className="border border-foreground/20 bg-background p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center space-y-6 rounded-2xl">
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
                    className="px-8 py-4 liquid-button rounded-full text-[11px] font-bold tracking-[0.2em] uppercase hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isInitializing && <Loader2 className="w-4 h-4 animate-spin" />}
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

    return (
        <Elements stripe={connectedStripe} options={{ clientSecret, appearance }}>
            <CheckoutForm paymentId={paymentId} checkoutToken={checkoutToken} />
        </Elements>
    );
}
