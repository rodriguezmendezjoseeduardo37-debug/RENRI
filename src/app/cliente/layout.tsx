import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { ClienteSidebar } from "@/components/dashboard/cliente-sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Space_Grotesk, Inter } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-heading",
    weight: ["500", "700"],
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-body",
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
            className={`${spaceGrotesk.variable} ${inter.variable} font-[family-name:var(--font-body)] min-h-screen bg-black text-white`}
        >
            <ClienteSidebar />

            {/* Main content area — offset by sidebar width */}
            <div className="ml-16 min-h-screen flex flex-col">
                <Topbar
                    tenantName="PORTAL DE USUARIO"
                    userName={user.name ?? "Usuario"}
                />
                <main className="flex-1 p-8">{children}</main>
            </div>
        </div>
    );
}
