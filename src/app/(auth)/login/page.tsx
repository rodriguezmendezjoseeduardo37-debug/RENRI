"use client";

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

const loginSchema = z.object({
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginForm() {
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
    });

    async function onSubmit(data: LoginValues) {
        setError(null);
        const result = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
            callbackUrl,
        });

        if (result?.error) {
            setError("Credenciales inválidas. Intenta de nuevo.");
        } else if (result?.url) {
            window.location.href = result.url;
        }
    }

    function handleGoogleSignIn() {
        setIsGoogleLoading(true);
        signIn("google", { callbackUrl });
    }

    return (
        <Card className="w-full max-w-md bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
            <CardHeader className="text-center space-y-2">
                <div className="mx-auto mb-2">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        RENRI
                    </h1>
                </div>
                <CardTitle className="text-xl text-white">Iniciar Sesión</CardTitle>
                <CardDescription className="text-[hsl(0,0%,63.9%)]">
                    Ingresa a tu cuenta para continuar
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
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
                    Continuar con Google
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

                    <Button
                        type="submit"
                        className="w-full h-11 bg-white text-black hover:bg-white/90 font-medium"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Iniciar Sesión
                    </Button>
                </form>

                <p className="text-center text-sm text-[hsl(0,0%,45.1%)]">
                    ¿No tienes cuenta?{" "}
                    <Link
                        href="/register"
                        className="text-white underline-offset-4 hover:underline"
                    >
                        Regístrate
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(0,0%,3.9%)] px-4">
            <Suspense fallback={
                <Card className="w-full max-w-md bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto mb-2">
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                RENRI
                            </h1>
                        </div>
                    </CardHeader>
                    <CardContent className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </CardContent>
                </Card>
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}
