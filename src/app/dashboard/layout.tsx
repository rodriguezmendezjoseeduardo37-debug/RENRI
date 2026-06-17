import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import localFont from "next/font/local";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

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
            className={`${spaceGrotesk.variable} ${inter.variable} font-[family-name:var(--font-body)] min-h-screen bg-transparent text-foreground transition-colors duration-300 relative`}
        >
            
            <Sidebar
                accountType={accountType}
                businessId={user.businessId ?? tenant?.id}
                enabledModules={user.enabledModules}
                userRole={user.role}
                tenantName={tenant?.name ?? "RENRI"}
            />

            {/* Main content area — offset by floating sidebar (240px + 12px margin + 12px gap) */}
            <div className="md:ml-[264px] min-h-screen flex flex-col">
                <div>
                    <Topbar
                        tenantName={tenant?.name ?? "RENRI"}
                        userName={user.name ?? "User"}
                        accountType={accountType}
                        businessId={user.businessId ?? tenant?.id}
                        enabledModules={user.enabledModules}
                        userRole={user.role}
                    />
                </div>
                <main className="flex-1 p-4 md:px-6 pt-4 md:pt-4 md:pb-8">{children}</main>
            </div>
        </div>
    );
}
