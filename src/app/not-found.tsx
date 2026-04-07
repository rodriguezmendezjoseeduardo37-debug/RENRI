import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 text-center selection:bg-white selection:text-primary-foreground">
            <div className="space-y-6 max-w-lg">
                <h1 className="text-8xl md:text-9xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase select-none">
                    404
                </h1>

                <h2 className="text-[12px] md:text-[14px] font-bold tracking-[0.4em] text-muted-foreground uppercase">
                    DESTINO DESCONOCIDO
                </h2>

                <p className="text-muted-foreground text-[11px] font-mono uppercase tracking-[0.1em] leading-relaxed max-w-sm mx-auto">
                    El identificador de ruta ingresado no tiene correspondencia en el sistema o los registros han sido expurgados.
                </p>

                <div className="pt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 px-8 py-4 border border-border hover:border-foreground text-foreground transition-all text-[11px] font-bold tracking-[0.2em] uppercase group"
                    >
                        <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        VOLVER A SUPERFICIE
                    </Link>
                </div>
            </div>

            {/* Minimalist decorative line */}
            <div className="absolute bottom-12 w-full max-w-xs h-[1px] bg-gradient-to-r from-transparent via-[#222222] to-transparent" />
        </div>
    );
}
