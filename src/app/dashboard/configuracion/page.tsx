import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
    Building2,
    CreditCard,
    Key,
    MonitorSmartphone,
    UserCircle,
} from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function ConfiguracionPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const cookieStore = await cookies();
    const activeModuleStr = cookieStore.get("renri_active_module")?.value;
    let currentModule = user.accountType;
    if (activeModuleStr && ["servicios", "pyme", "cliente"].includes(activeModuleStr)) {
        if (user.role !== "CLIENT") {
            currentModule = activeModuleStr as "servicios" | "pyme" | "cliente";
        }
    }

    if (user.role === "CLIENT") {
        const clientSections = [
            {
                title: "PERFIL PERSONAL",
                desc: "Actualiza tu nombre, avatar y los datos basicos con los que reservas y recibes notificaciones.",
                icon: UserCircle,
                href: "/dashboard/configuracion/perfil",
            },
        ];

        return (
            <div className="max-w-4xl mx-auto space-y-10">
                <div className="border-b border-border pb-6">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        MI CUENTA
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        AJUSTES PERSONALES Y DATOS DE CONTACTO
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {clientSections.map((section) => (
                        <Link
                            href={section.href}
                            key={section.href}
                            className="border border-border bg-card rounded-2xl shadow-sm p-6 flex flex-col justify-between h-48 group hover:border-foreground hover:shadow-md transition-all cursor-pointer"
                        >
                            <section.icon className="w-6 h-6 text-foreground mb-4 group-hover:scale-110 transition-transform origin-left" />
                            <div>
                                <h3 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase mb-2">
                                    {section.title}
                                </h3>
                                <p className="text-[11px] font-mono tracking-wide text-muted-foreground leading-relaxed">
                                    {section.desc}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId),
    });
    const currentPlan = tenant?.plan ?? user.plan;

    const SETTINGS_SECTIONS = [
        {
            title: "PERFIL PERSONAL",
            desc: "Gestiona tu avatar, firma digital, biografia profesional y credenciales de acceso.",
            icon: UserCircle,
            href: "/dashboard/configuracion/perfil",
        },
        {
            title: "ORGANIZACION",
            desc: "Ajustes de infraestructura, logotipo global, politicas de horarios y alta de sucursales.",
            icon: Building2,
            href: "/dashboard/configuracion/organizacion",
            restricted: !["SUPER_ADMIN", "OWNER"].includes(user.role),
        },
        {
            title: "PLANES DE PAGO",
            desc: "Planes transparentes disenados para escalar junto con tu crecimiento profesional.",
            icon: CreditCard,
            href: "/dashboard/configuracion/planes",
            restricted: !["SUPER_ADMIN", "OWNER"].includes(user.role),
        },
        {
            title: "COBROS CON TARJETA",
            desc: "Habilita la recepción de pagos con tarjeta de forma automática. Sin configuraciones técnicas.",
            icon: CreditCard,
            href: "/dashboard/configuracion/metodo-cobro",
            restricted: !["pro", "business", "enterprise"].includes(currentPlan),
        },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="border-b border-border pb-6">
                <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                    CONFIGURACIÓN
                </h1>
                <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                    PARAMETROS DEL ENTORNO DE TRABAJO
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SETTINGS_SECTIONS.map((section, idx) => {
                    if (section.restricted) {
                        return (
                            <div
                                key={idx}
                                className="border border-border bg-card rounded-2xl p-6 opacity-40 cursor-not-allowed flex flex-col justify-between h-48 relative overflow-hidden group"
                            >
                                <div className="absolute top-4 right-4 text-[9px] font-bold tracking-[0.2em] text-foreground border border-border px-2 py-1">
                                    ACCESO RESTRINGIDO
                                </div>
                                <section.icon className="w-6 h-6 text-foreground mb-4" />
                                <div>
                                    <h3 className="text-sm font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">
                                        {section.title}
                                    </h3>
                                    <p className="text-[11px] font-mono tracking-wide text-foreground leading-relaxed">
                                        {section.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <Link
                            href={section.href}
                            key={idx}
                            className="border border-border bg-card rounded-2xl shadow-sm p-6 flex flex-col justify-between h-48 group hover:border-foreground hover:shadow-md transition-all cursor-pointer"
                        >
                            <section.icon className="w-6 h-6 text-foreground mb-4 group-hover:scale-110 transition-transform origin-left" />
                            <div>
                                <h3 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase mb-2">
                                    {section.title}
                                </h3>
                                <p className="text-[11px] font-mono tracking-wide text-muted-foreground leading-relaxed">
                                    {section.desc}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
