import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/actions/portal";
import { db } from "@/db";
import { turns } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { Clock, Hash } from "lucide-react";

export default async function TurnoPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    // Get today's turns for this tenant (by createdAt date)
    const today = new Date().toISOString().split("T")[0];
    const todayTurns = await db
        .select()
        .from(turns)
        .where(
            and(
                eq(turns.tenantId, tenant.id),
                sql`date(${turns.createdAt}) = ${today}`
            )
        )
        .orderBy(desc(turns.createdAt));

    const currentTurn = todayTurns.find(
        (t) => t.status === "in_progress"
    );
    const waitingTurns = todayTurns.filter(
        (t) => t.status === "waiting"
    );

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
            <h1 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase mb-8">
                {tenant.name}
            </h1>

            {/* Current turn */}
            <div className="text-center mb-12">
                <p className="text-[10px] font-bold tracking-[0.3em] text-[#666666] uppercase mb-4">
                    TURNO ACTUAL
                </p>
                {currentTurn ? (
                    <div className="border border-white p-8">
                        <span className="text-7xl md:text-9xl font-bold font-mono text-white">
                            {currentTurn.number}
                        </span>
                    </div>
                ) : (
                    <div className="border border-[#222222] p-8">
                        <span className="text-4xl font-bold font-mono text-[#444444]">
                            —
                        </span>
                        <p className="text-[10px] text-[#666666] mt-2">
                            SIN TURNO EN ATENCIÓN
                        </p>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-[1px] bg-[#222222] w-full max-w-sm">
                <div className="bg-black p-5 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Hash className="w-3 h-3 text-[#666666]" />
                        <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase">
                            EN ESPERA
                        </span>
                    </div>
                    <span className="text-2xl font-bold font-mono text-white">
                        {waitingTurns.length}
                    </span>
                </div>
                <div className="bg-black p-5 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="w-3 h-3 text-[#666666]" />
                        <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase">
                            APROX.
                        </span>
                    </div>
                    <span className="text-2xl font-bold font-mono text-white">
                        {waitingTurns.length * 15} min
                    </span>
                </div>
            </div>

            {/* Waiting list */}
            {waitingTurns.length > 0 && (
                <div className="mt-8 w-full max-w-sm space-y-[1px]">
                    <p className="text-[10px] font-bold tracking-[0.3em] text-[#666666] uppercase mb-3">
                        PRÓXIMOS TURNOS
                    </p>
                    {waitingTurns.slice(0, 5).map((turn, idx) => (
                        <div
                            key={turn.id}
                            className="bg-[#111111] flex items-center justify-between p-3"
                        >
                            <span className="text-xs font-mono font-bold text-[#888888]">
                                #{turn.number}
                            </span>
                            <span className="text-[9px] text-[#666666]">
                                ~{(idx + 1) * 15} min
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
