import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Space_Grotesk, Inter } from "next/font/google";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-heading",
    weight: ["500", "700"],
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-body",
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

    if (activeModule && ["servicios", "pyme", "cliente"].includes(activeModule)) {
        if (user.role !== "CLIENT") {
            accountType = activeModule as "servicios" | "pyme" | "cliente";
        }
    }

    return (
        <div
            className={`${spaceGrotesk.variable} ${inter.variable} font-[family-name:var(--font-body)] min-h-screen bg-black text-white`}
        >
            <Sidebar
                accountType={accountType}
                businessId={user.businessId ?? tenant?.id}
                enabledModules={user.enabledModules}
                userRole={user.role}
            />

            {/* Main content area — offset by sidebar width on desktop */}
            <div className="md:ml-16 min-h-screen flex flex-col">
                <Topbar
                    tenantName={tenant?.name ?? "RENRI"}
                    userName={user.name ?? "User"}
                    accountType={accountType}
                    businessId={user.businessId ?? tenant?.id}
                    enabledModules={user.enabledModules}
                    userRole={user.role}
                />
                <main className="flex-1 p-4 md:p-8">{children}</main>
            </div>
        </div>
    );
}
