import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { ClienteSidebar } from "@/components/dashboard/cliente-sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import localFont from "next/font/local";

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

export default async function ClienteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div
            className={`${spaceGrotesk.variable} ${inter.variable} font-[family-name:var(--font-body)] min-h-screen bg-background text-foreground`}
        >
            <ClienteSidebar />

            {/* Main content area — offset by sidebar width on desktop */}
            <div className="md:ml-16 min-h-screen flex flex-col">
                <Topbar
                    tenantName="PORTAL DE USUARIO"
                    userName={user.name ?? "Usuario"}
                    accountType="cliente"
                />
                <main className="flex-1 p-4 md:p-8">{children}</main>
            </div>
        </div>
    );
}
