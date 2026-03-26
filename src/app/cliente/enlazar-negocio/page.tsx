import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getClientWorkspace, getLinkedBusinesses } from "@/actions/client-portal";
import { EnlazarForm } from "./enlazar-form";

export default async function EnlazarNegocioPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const { user: dbUser } = await getClientWorkspace();
    const linkedBusinesses = await getLinkedBusinesses();

    return (
        <div className="space-y-8">
            <div className="border-b border-[#222222] pb-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                    MIS NEGOCIOS
                </h1>
                <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                    CONECTA TU CUENTA CON TUS NEGOCIOS PARA VER TUS CITAS Y PAGOS
                </p>
            </div>

            <EnlazarForm 
                linkedBusinesses={linkedBusinesses} 
                activeBusinessId={dbUser.linkedBusinessId} 
            />
        </div>
    );
}
