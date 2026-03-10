"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const ACCOUNT_TYPES = [
    { value: "servicios", label: "Servicios", description: "Citas, turnos, horarios" },
    { value: "pyme", label: "PYME", description: "Inventario, pedidos, ventas" },
    { value: "cliente", label: "Cliente", description: "Agendar citas y comprar" },
] as const;

type AccountType = (typeof ACCOUNT_TYPES)[number]["value"];

const registerSchema = z
    .object({
        name: z.string().min(2, "Mínimo 2 caracteres"),
        email: z.string().email("Correo electrónico inválido"),
        password: z.string().min(6, "Mínimo 6 caracteres"),
        confirmPassword: z.string(),
        accountType: z.enum(["servicios", "pyme", "cliente"]),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<AccountType>("servicios");
    const router = useRouter();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { accountType: "servicios" },
    });

    async function onSubmit(data: RegisterValues) {
        setError(null);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const body = await res.json();
                setError(body.error ?? "Error al registrarse");
                return;
            }

            // Auto sign-in after registration
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                setError("Cuenta creada, pero no se pudo iniciar sesión automáticamente.");
                router.push("/login");
            } else {
                router.push("/dashboard");
            }
        } catch {
            setError("Error de conexión. Intenta de nuevo.");
        }
    }

    function handleGoogleSignIn() {
        setIsGoogleLoading(true);
        signIn("google", { callbackUrl: "/dashboard" });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(0,0%,3.9%)] px-4 py-8">
            <Card className="w-full max-w-md bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto mb-2">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            ProHUB
                        </h1>
                    </div>
                    <CardTitle className="text-xl text-white">Crear Cuenta</CardTitle>
                    <CardDescription className="text-[hsl(0,0%,63.9%)]">
                        Empieza a gestionar tu negocio hoy
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Google OAuth */}
                    <Button
                        variant="outline"
                        className="w-full border-[hsl(0,0%,14.9%)] bg-transparent text-white hover:bg-[hsl(0,0%,14.9%)] h-11"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                    >
                        {isGoogleLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Chrome className="mr-2 h-4 w-4" />
                        )}
                        Registrarse con Google
                    </Button>

                    <div className="relative">
                        <Separator className="bg-[hsl(0,0%,14.9%)]" />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[hsl(0,0%,7%)] px-3 text-xs text-[hsl(0,0%,45.1%)]">
                            o con email
                        </span>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        {/* Account type selector */}
                        <div className="space-y-2">
                            <Label className="text-[hsl(0,0%,63.9%)]">Tipo de Cuenta</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {ACCOUNT_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => {
                                            setSelectedType(type.value);
                                            setValue("accountType", type.value);
                                        }}
                                        className={`rounded-lg border p-3 text-left transition-all ${selectedType === type.value
                                            ? "border-white bg-white/5 text-white"
                                            : "border-[hsl(0,0%,14.9%)] text-[hsl(0,0%,45.1%)] hover:border-[hsl(0,0%,25%)]"
                                            }`}
                                    >
                                        <div className="text-xs font-medium">{type.label}</div>
                                        <div className="text-[10px] mt-0.5 opacity-70">
                                            {type.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[hsl(0,0%,63.9%)]">
                                Nombre completo
                            </Label>
                            <Input
                                id="name"
                                placeholder="Juan Pérez"
                                className="bg-transparent border-[hsl(0,0%,14.9%)] text-white placeholder:text-[hsl(0,0%,35%)] focus:border-white/30 h-11"
                                {...register("name", { required: true })}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-400">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[hsl(0,0%,63.9%)]">
                                Correo electrónico
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                className="bg-transparent border-[hsl(0,0%,14.9%)] text-white placeholder:text-[hsl(0,0%,35%)] focus:border-white/30 h-11"
                                {...register("email", { required: true })}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-400">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[hsl(0,0%,63.9%)]">
                                Contraseña
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="bg-transparent border-[hsl(0,0%,14.9%)] text-white placeholder:text-[hsl(0,0%,35%)] focus:border-white/30 h-11"
                                {...register("password", { required: true })}
                            />
                            {errors.password && (
                                <p className="text-xs text-red-400">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-[hsl(0,0%,63.9%)]">
                                Confirmar Contraseña
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                className="bg-transparent border-[hsl(0,0%,14.9%)] text-white placeholder:text-[hsl(0,0%,35%)] focus:border-white/30 h-11"
                                {...register("confirmPassword", { required: true })}
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-red-400">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-white text-black hover:bg-white/90 font-medium"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Crear Cuenta
                        </Button>
                    </form>

                    <p className="text-center text-sm text-[hsl(0,0%,45.1%)]">
                        ¿Ya tienes cuenta?{" "}
                        <Link
                            href="/login"
                            className="text-white underline-offset-4 hover:underline"
                        >
                            Inicia Sesión
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
