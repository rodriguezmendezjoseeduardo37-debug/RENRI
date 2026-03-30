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
                <div className="border-b border-[#222222] pb-6">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                        MI CUENTA
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                        AJUSTES PERSONALES Y DATOS DE CONTACTO
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {clientSections.map((section) => (
                        <Link
                            href={section.href}
                            key={section.href}
                            className="border border-[#222222] bg-[#111111] p-6 flex flex-col justify-between h-48 group hover:border-white transition-all cursor-pointer"
                        >
                            <section.icon className="w-6 h-6 text-white mb-4 group-hover:scale-110 transition-transform origin-left" />
                            <div>
                                <h3 className="text-sm font-bold tracking-[0.2em] text-white uppercase mb-2">
                                    {section.title}
                                </h3>
                                <p className="text-[11px] font-mono tracking-wide text-[#888888] leading-relaxed">
                                    {section.desc}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    const SETTINGS_SECTIONS = [
        {
            title: "PERFIL PERSONAL",
            desc: "Gestiona tu avatar, firma digital, biografia profesional y credenciales de acceso.",
            icon: UserCircle,
            href: "/dashboard/configuracion/perfil",
        },
        {
            title: "DATOS CLINICOS",
            desc: "Configura permisos de visualizacion de plantillas, diagnosticos predefinidos y recetas.",
            icon: MonitorSmartphone,
            href: "/dashboard/configuracion/clinica",
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
            title: "APIS Y WEBHOOKS",
            desc: "Configura integracion con Stripe y webhooks externos para tu plataforma.",
            icon: Key,
            href: "/dashboard/configuracion/apis",
            restricted: !["SUPER_ADMIN", "OWNER"].includes(user.role),
        },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="border-b border-[#222222] pb-6">
                <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                    CONFIGURACION DEL SISTEMA
                </h1>
                <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                    PARAMETROS DEL ENTORNO DE TRABAJO
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SETTINGS_SECTIONS.filter((section) => {
                    if (currentModule === "pyme" && (section.title === "DATOS CLINICOS" || section.title === "APIS Y WEBHOOKS")) {
                        return false;
                    }
                    return true;
                }).map((section, idx) => {
                    if (section.restricted) {
                        return (
                            <div
                                key={idx}
                                className="border border-[#111111] bg-[#050505] p-6 opacity-40 cursor-not-allowed flex flex-col justify-between h-48 relative overflow-hidden group"
                            >
                                <div className="absolute top-4 right-4 text-[9px] font-bold tracking-[0.2em] text-[#444444] border border-[#222222] px-2 py-1">
                                    ACCESO RESTRINGIDO
                                </div>
                                <section.icon className="w-6 h-6 text-[#222222] mb-4" />
                                <div>
                                    <h3 className="text-sm font-bold tracking-[0.2em] text-[#666666] uppercase mb-2">
                                        {section.title}
                                    </h3>
                                    <p className="text-[11px] font-mono tracking-wide text-[#333333] leading-relaxed">
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
                            className="border border-[#222222] bg-[#111111] p-6 flex flex-col justify-between h-48 group hover:border-white transition-all cursor-pointer"
                        >
                            <section.icon className="w-6 h-6 text-white mb-4 group-hover:scale-110 transition-transform origin-left" />
                            <div>
                                <h3 className="text-sm font-bold tracking-[0.2em] text-white uppercase mb-2">
                                    {section.title}
                                </h3>
                                <p className="text-[11px] font-mono tracking-wide text-[#888888] leading-relaxed">
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
