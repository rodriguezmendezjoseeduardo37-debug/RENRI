import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getAllPublicBusinesses, getLinkedBusinesses } from "@/actions/client-portal";
import { ExplorarNegocios } from "./explorar-negocios";

export default async function ExplorarPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [businesses, linkedBusinesses] = await Promise.all([
        getAllPublicBusinesses(),
        getLinkedBusinesses(),
    ]);

    const linkedIds = linkedBusinesses.map((b) => b.businessId);

    return (
        <div className="space-y-8">
            <div className="border-b border-border pb-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                    EXPLORAR NEGOCIOS
                </h1>
                <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                    DESCUBRE NEGOCIOS CERCANOS Y ENLAZALOS A TU CUENTA
                </p>
            </div>

            <ExplorarNegocios
                initialBusinesses={businesses}
                linkedIds={linkedIds}
            />
        </div>
    );
}
