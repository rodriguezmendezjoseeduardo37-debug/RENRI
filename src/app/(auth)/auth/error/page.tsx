"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
    Configuration: "Hay un problema con la configuración del servidor.",
    AccessDenied: "No tienes permiso para acceder.",
    Verification: "El enlace de verificación ha expirado o es inválido.",
    Default: "Ocurrió un error durante la autenticación.",
};

function ErrorContent() {
    const searchParams = useSearchParams();
    const errorType = searchParams.get("error") ?? "Default";
    const message = ERROR_MESSAGES[errorType] ?? ERROR_MESSAGES.Default;

    return (
        <Card className="w-full max-w-md bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
            <CardHeader className="text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                    <AlertTriangle className="h-7 w-7 text-red-400" />
                </div>
                <CardTitle className="text-xl text-white">
                    Error de Autenticación
                </CardTitle>
                <CardDescription className="text-[hsl(0,0%,63.9%)]">
                    {message}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
                <Button asChild className="w-full h-11 bg-white text-black hover:bg-white/90">
                    <Link href="/login">Volver al Inicio de Sesión</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(0,0%,3.9%)] px-4">
            <Suspense fallback={<div className="text-white">Cargando...</div>}>
                <ErrorContent />
            </Suspense>
        </div>
    );
}
