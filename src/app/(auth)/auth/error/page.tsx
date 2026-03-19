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
    Configuration: "Hay un problema con la configuracion del servidor.",
    AccessDenied: "No tienes permiso para acceder.",
    Verification: "El enlace de verificacion ha expirado o es invalido.",
    GoogleClientConflict:
        "Ese Google ya esta vinculado a una cuenta de negocio. Para registrarte como cliente debes validar con otra cuenta de Google.",
    GoogleBusinessConflict:
        "Ese Google ya esta vinculado a una cuenta cliente. Para crear una cuenta de servicios o pyme debes validar con otra cuenta.",
    GoogleAccountTypeConflict:
        "Ese Google ya esta registrado en otro tipo de negocio. Usa una cuenta distinta o inicia sesion con la ya existente.",
    Default: "Ocurrio un error durante la autenticacion.",
};

const ERROR_TITLES: Record<string, string> = {
    GoogleClientConflict: "Google Ya Vinculado A Negocio",
    GoogleBusinessConflict: "Google Ya Vinculado A Cliente",
    GoogleAccountTypeConflict: "Google Vinculado A Otro Tipo De Cuenta",
};

function ErrorContent() {
    const searchParams = useSearchParams();
    const errorType = searchParams.get("error") ?? "Default";
    const message = ERROR_MESSAGES[errorType] ?? ERROR_MESSAGES.Default;
    const title = ERROR_TITLES[errorType] ?? "Error de Autenticacion";
    const showRegisterCta = errorType.startsWith("Google");

    return (
        <Card className="w-full max-w-md bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
            <CardHeader className="text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                    <AlertTriangle className="h-7 w-7 text-red-400" />
                </div>
                <CardTitle className="text-xl text-white">{title}</CardTitle>
                <CardDescription className="text-[hsl(0,0%,63.9%)]">
                    {message}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
                {showRegisterCta && (
                    <Button
                        asChild
                        variant="outline"
                        className="w-full h-11 border-[hsl(0,0%,14.9%)] bg-transparent text-white hover:bg-[hsl(0,0%,14.9%)]"
                    >
                        <Link href="/register">Volver a Registro</Link>
                    </Button>
                )}
                <Button
                    asChild
                    className="w-full h-11 bg-white text-black hover:bg-white/90"
                >
                    <Link href="/login">Volver al Inicio de Sesion</Link>
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
