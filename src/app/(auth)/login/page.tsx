"use client";

import { motion } from "framer-motion";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Chrome, Loader2 } from "lucide-react";
import { RenriMark } from "@/components/renri-mark";

const ACCOUNT_TYPES = [
    { value: "servicios", label: "Servicios", description: "Inicio en citas y horarios" },
    { value: "pyme", label: "NEGOCIO", description: "Inicio en inventario y ventas" },
    { value: "cliente", label: "Cliente", description: "Agendar citas y comprar" },
] as const;

type AccountType = (typeof ACCOUNT_TYPES)[number]["value"];

const loginSchema = z.object({
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    accountType: z.enum(["servicios", "pyme", "cliente"]).optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginForm() {
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<AccountType>("cliente");
    const searchParams = useSearchParams();
    
    const isClientLogin = selectedType === "cliente";
    const defaultPath = isClientLogin ? "/cliente/mis-citas" : "/dashboard";
    
    let callbackUrl = searchParams.get("callbackUrl") || defaultPath;
    const isClientPath = callbackUrl.includes("/cliente");
    const isDashboardPath = callbackUrl.includes("/dashboard");
    
    // Ignore callbackUrl if it points to a different module than the one selected
    // Note: This prevents the bug where logging out from /cliente and selecting /pyme 
    // forces the user back into /cliente.
    if (isClientLogin && !isClientPath) {
        callbackUrl = defaultPath;
    } else if (!isClientLogin && !isDashboardPath) {
        callbackUrl = defaultPath;
    }

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { accountType: "cliente" },
    });

    async function onSubmit(data: LoginValues) {
        setError(null);
        document.cookie = `renri_active_module=${selectedType}; path=/; max-age=2592000; samesite=lax`;
        
        // EXPLICIT ROOT OVERRIDE: We ignore any existing callbackUrl from history/URLs
        // and strictly send the user to the panel they chose on screen.
        const enforcePath = selectedType === "cliente" ? "/cliente/mis-citas" : "/dashboard";

        const result = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
            callbackUrl: enforcePath,
        });

        if (result?.error) {
            setError("Credenciales inválidas. Intenta de nuevo.");
        } else if (result?.url) {
            window.location.href = result.url;
        }
    }

    function handleGoogleSignIn() {
        setIsGoogleLoading(true);
        document.cookie = `renri_register_account_type=${selectedType}; path=/; max-age=600; samesite=lax`;
        document.cookie = `renri_active_module=${selectedType}; path=/; max-age=2592000; samesite=lax`;
        signIn("google", { callbackUrl }, { prompt: "select_account" });
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md"
        >
            <div className="text-center space-y-2 pt-8 mb-8">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="mx-auto mb-2 flex flex-col items-center gap-3 text-foreground"
                >
                    <RenriMark size={56} />
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        RENRI
                    </h1>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h2 className="text-2xl text-foreground font-semibold tracking-tight">Iniciar Sesión</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Ingresa a tu cuenta para continuar
                    </p>
                </motion.div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="space-y-6"
            >
                <div className="space-y-3">
                    <Label className="text-foreground font-medium">Módulo</Label>
                    <div className="grid grid-cols-3 gap-3">
                        {ACCOUNT_TYPES.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => {
                                    setSelectedType(type.value);
                                    setValue("accountType", type.value);
                                }}
                                className={`rounded-xl border p-3 text-left transition-all duration-300 ${selectedType === type.value
                                    ? "border-foreground bg-foreground/10 text-foreground"
                                    : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                                    }`}
                            >
                                <div className="text-sm font-semibold">{type.label}</div>
                                <div className="text-[11px] mt-1 opacity-70 leading-tight">
                                    {type.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full border-border bg-card hover:bg-accent text-foreground h-[52px] rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] group"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                >
                    <div className="absolute left-1.5 bg-background rounded-full p-2 flex items-center justify-center shadow-sm">
                        {isGoogleLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                        ) : (
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-[18px] h-[18px]">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                <path fill="none" d="M0 0h48v48H0z"></path>
                            </svg>
                        )}
                    </div>
                    <span className="text-[15px] font-semibold tracking-wide">Iniciar sesión con Google</span>
                </Button>

                <div className="relative py-2">
                    <Separator className="bg-border" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[13px] text-muted-foreground">
                        o con email
                    </span>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-foreground/10 border border-border/20 p-3 text-sm text-foreground">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground font-medium">
                            Correo electrónico
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/50 h-12 rounded-xl transition-all"
                            {...register("email", { required: true })}
                        />
                        {errors.email && (
                            <p className="text-xs text-foreground">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label htmlFor="password" className="text-foreground font-medium">
                            Contraseña
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/50 h-12 rounded-xl transition-all"
                            {...register("password", { required: true })}
                        />
                        {errors.password && (
                            <p className="text-xs text-foreground">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 liquid-button hover:bg-foreground/90 rounded-xl shadow-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] mt-6"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Iniciar Sesión
                    </Button>
                </form>

                <p className="text-center text-[13px] text-muted-foreground pt-4">
                    ¿No tienes cuenta?{" "}
                    <Link
                        href="/register"
                        className="text-foreground font-medium hover:text-foreground transition-colors"
                    >
                        Regístrate
                    </Link>
                </p>
            </motion.div>
        </motion.div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent relative px-4 overflow-hidden">
            <Suspense fallback={
                <div className="w-full max-w-md flex flex-col items-center justify-center space-y-8">
                    <div className="flex flex-col items-center gap-3 text-foreground">
                        <RenriMark size={56} />
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            RENRI
                        </h1>
                    </div>
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}
