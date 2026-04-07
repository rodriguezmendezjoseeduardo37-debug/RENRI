import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { getPortalServices, getTenantBySlug } from "@/actions/portal";

async function main() {
    const slug = "eduardo8rodriguezyou-1773119990164";
    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
        console.log("Tenant not found for slug:", slug);
        return;
    }

    console.log("Found tenant:", tenant.name, "ID:", tenant.id);
    console.log("Tenant clinicalSettings:", tenant.clinicalSettings);

    const services = await getPortalServices(tenant.id);
    console.log("Portal Services:", services);
}

main().catch((error) => {
    console.error(error);
});
