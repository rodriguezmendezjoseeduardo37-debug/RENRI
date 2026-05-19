import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";

export default async function OnboardingPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    // Solo OWNER puede hacer el onboarding
    if (user.role !== "OWNER") redirect("/dashboard");

    const [tenant] = await db
        .select({ id: tenants.id, name: tenants.name, isOnboarded: tenants.isOnboarded })
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    if (!tenant) redirect("/login");

    // Si ya hizo onboarding, redirigir al dashboard
    if (tenant.isOnboarded) redirect("/dashboard");

    return (
        <OnboardingWizard
            tenantId={tenant.id}
            tenantName={tenant.name}
            accountType="servicios"
        />
    );
}
