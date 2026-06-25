"use client";

import { useState } from "react";
import { updateTenantCommission } from "@/actions/tenant";
import { toast } from "sonner";
import { 
    Search, 
    Save, 
    Loader2, 
    CheckCircle2, 
    AlertTriangle,
    CreditCard
} from "lucide-react";

interface Tenant {
    id: string;
    name: string;
    slug: string;
    commissionRate: string;
    stripeConnectEnabled: boolean;
    stripeConnectAccountId: string | null;
}

export function CommissionList({ tenants }: { tenants: any[] }) {
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [rates, setRates] = useState<Record<string, string>>(
        Object.fromEntries(tenants.map(t => [t.id, t.commissionRate]))
    );

    const filteredTenants = tenants.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) || 
        t.slug.toLowerCase().includes(search.toLowerCase())
    );

    const handleUpdate = async (tenantId: string) => {
        try {
            setUpdatingId(tenantId);
            await updateTenantCommission(tenantId, rates[tenantId]);
            toast.success("Comisión actualizada correctamente.");
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar.");
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="BUSCAR NEGOCIO..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-background border border-border pl-12 pr-4 py-4 text-xs font-bold tracking-[0.2em] focus:outline-none focus:border-foreground transition-colors uppercase"
                />
            </div>

            <div className="border border-border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Negocio</th>
                            <th className="px-6 py-4 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Stripe Connect</th>
                            <th className="px-6 py-4 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Comisión RENRI</th>
                            <th className="px-6 py-4 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredTenants.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-accent/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold tracking-tight text-foreground">{tenant.name}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{tenant.slug}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {tenant.stripeConnectEnabled ? (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-foreground/10 border border-border/20 text-foreground rounded-sm">
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span className="text-[9px] font-bold uppercase tracking-wider">Activo</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-sm">
                                                <AlertTriangle className="w-3 h-3" />
                                                <span className="text-[9px] font-bold uppercase tracking-wider">Pendiente</span>
                                            </div>
                                        )}
                                        {tenant.stripeConnectAccountId && (
                                            <span className="text-[9px] font-mono text-muted-foreground hidden sm:inline">
                                                {tenant.stripeConnectAccountId}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="1"
                                                value={rates[tenant.id]}
                                                onChange={(e) => setRates({ ...rates, [tenant.id]: e.target.value })}
                                                className="w-24 bg-background border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:border-foreground"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none group-focus-within:hidden">
                                                %
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                            = {(parseFloat(rates[tenant.id] || "0") * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleUpdate(tenant.id)}
                                        disabled={updatingId === tenant.id || rates[tenant.id] === tenant.commissionRate}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase liquid-control hover:bg-foreground/5 transition-all disabled:opacity-30"
                                    >
                                        {updatingId === tenant.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Save className="w-3.5 h-3.5" />
                                        )}
                                        {updatingId === tenant.id ? "GUARDANDO..." : "GUARDAR"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {filteredTenants.length === 0 && (
                <div className="text-center py-12 border border-border bg-card">
                    <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">No se encontraron negocios</p>
                </div>
            )}
        </div>
    );
}
