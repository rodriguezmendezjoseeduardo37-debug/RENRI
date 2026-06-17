import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { RenriMark } from "@/components/renri-mark";

export default function VerifyPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(0,0%,3.9%)] px-4">
            <Card className="w-full max-w-md bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)] text-center">
                <CardHeader className="space-y-4">
                    <div className="mx-auto flex flex-col items-center gap-3">
                        <RenriMark size={48} theme="dark" />
                    </div>
                    <div className="flex justify-center mb-2">
                        <CheckCircle2 className="h-16 w-16 text-[#08b6ff]" />
                    </div>
                    <CardTitle className="text-2xl text-white">¡Cuenta Verificada!</CardTitle>
                    <CardDescription className="text-white/70">
                        Tu dirección de correo electrónico ha sido verificada correctamente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <Button asChild className="w-full h-11 bg-[#08b6ff] text-[#0a0a0a] rounded-xl font-bold hover:opacity-90 transition-opacity">
                        <Link href="/login">
                            Continuar al Inicio de Sesión
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
