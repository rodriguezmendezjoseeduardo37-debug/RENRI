import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getUserProfile } from "@/actions/users";
import { PerfilForm } from "./perfil-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function PerfilConfigPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const profile = await getUserProfile();

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        PERFIL PERSONAL
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        ADMINISTRACIÓN DE CUENTA DE USUARIO
                    </p>
                </div>
                <Link
                    href="/dashboard/configuracion"
                    className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase border border-border rounded-xl hover:text-foreground hover:border-foreground transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER
                </Link>
            </div>

            <PerfilForm user={user} profile={profile} />
        </div>
    );
}
