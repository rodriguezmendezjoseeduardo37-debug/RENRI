import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { MobileNavigation } from "@/components/mobile-navigation";
import localFont from "next/font/local";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
    Home,
    Calendar,
    Users,
    Clock,
    CreditCard,
    Settings,
    ListOrdered,
    Package,
    ShoppingCart,
    Briefcase,
} from "lucide-react";
import { RenriMark } from "@/components/renri-mark";

const spaceGrotesk = localFont({
    src: "../fonts/GeistMonoVF.woff",
    variable: "--font-heading",
    weight: "100 900",
});

const inter = localFont({
    src: "../fonts/GeistVF.woff",
    variable: "--font-body",
    weight: "100 900",
});

const MOBILE_NAV_SERVICIOS = [
    { href: "/dashboard", label: "INICIO", icon: <Home className="w-5 h-5" strokeWidth={1.5} /> },
    { href: "/dashboard/servicios", label: "SERVICIOS", icon: <Briefcase className="w-5 h-5" strokeWidth={1.5} /> },
    { href: "/dashboard/citas", label: "CITAS", icon: <Calendar className="w-5 h-5" strokeWidth={1.5} /> },
    { href: "/dashboard/turnos", label: "TURNOS", icon: <ListOrdered className="w-5 h-5" strokeWidth={1.5} /> },
    { href: "/dashboard/horarios", label: "HORARIOS", icon: <Clock className="w-5 h-5" strokeWidth={1.5} /> },
    { href: "/dashboard/pagos", label: "PAGOS", icon: <CreditCard className="w-5 h-5" strokeWidth={1.5} /> },
    { href: "/dashboard/clientes", label: "CLIENTES", icon: <Users className="w-5 h-5" strokeWidth={1.5} /> },
    { href: "/dashboard/configuracion", label: "CONFIGURACION", icon: <Settings className="w-5 h-5" strokeWidth={1.5} /> },
];

const MOBILE_NAV_PYME = [
    { href: "/dashboard", label: "INICIO", icon: <Home className="w-5 h-5" strokeWidth={1.5} /> },
    { href: "/dashboard/inventario", label: "INVENTARIO", icon: <Package className="w-5 h-5" strokeWidth={1.5} /> },
    { href: "/dashboard/pedidos", label: "PEDIDOS", icon: <ShoppingCart className="w-5 h-5" strokeWidth={1.5} /> },
    { href: "/dashboard/pagos", label: "PAGOS", icon: <CreditCard className="w-5 h-5" strokeWidth={1.5} /> },
    { href: "/dashboard/clientes", label: "CLIENTES", icon: <Users className="w-5 h-5" strokeWidth={1.5} /> },
    { href: "/dashboard/configuracion", label: "CONFIGURACION", icon: <Settings className="w-5 h-5" strokeWidth={1.5} /> },
];

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    // Get tenant to determine account type
    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    let accountType = (
        user.role === "CLIENT"
            ? "cliente"
            : tenant?.accountType ?? "servicios"
    ) as "servicios" | "pyme" | "cliente";

    const cookieStore = await cookies();
    const activeModule = cookieStore.get("renri_active_module")?.value;

    if (activeModule && ["servicios", "pyme"].includes(activeModule)) {
        if (user.role !== "CLIENT") {
            accountType = activeModule as "servicios" | "pyme";
        }
    } else if (user.role !== "CLIENT" && accountType === "cliente") {
        accountType = tenant?.accountType ?? "servicios";
    }

    return (
        <div
            className={`${spaceGrotesk.variable} ${inter.variable} font-[family-name:var(--font-body)] min-h-screen bg-background text-foreground transition-colors duration-300`}
        >
            <Sidebar
                accountType={accountType}
                businessId={user.businessId ?? tenant?.id}
                enabledModules={user.enabledModules}
                userRole={user.role}
            />

            {/* Main content area — offset by sidebar width on desktop */}
            <div className="md:ml-60 min-h-screen flex flex-col">
                <div className="hidden md:block">
                    <Topbar
                        tenantName={tenant?.name ?? "RENRI"}
                        userName={user.name ?? "User"}
                        accountType={accountType}
                        businessId={user.businessId ?? tenant?.id}
                        enabledModules={user.enabledModules}
                        userRole={user.role}
                    />
                </div>
                <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8">{children}</main>
            </div>
            
            <div className="md:hidden">
                <MobileNavigation 
                    items={accountType === "pyme" ? MOBILE_NAV_PYME : MOBILE_NAV_SERVICIOS} 
                    accountType={accountType}
                    brand={
                        <div className="flex items-center gap-2">
                            <RenriMark size={20} activeModule={accountType} />
                            <span className="font-bold tracking-[0.3em] text-foreground text-sm">RENRI</span>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
