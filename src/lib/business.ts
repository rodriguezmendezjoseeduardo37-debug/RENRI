export type BusinessModule = "servicios" | "pyme";

const VALID_MODULES: BusinessModule[] = ["servicios", "pyme"];

export function normalizeEnabledModules(
    rawModules: unknown,
    accountType?: "servicios" | "pyme" | "cliente",
    role?: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT"
): BusinessModule[] {
    if (role === "CLIENT" && accountType === "cliente") {
        if (Array.isArray(rawModules)) {
            return rawModules.filter(
                (value): value is BusinessModule =>
                    typeof value === "string" &&
                    VALID_MODULES.includes(value as BusinessModule)
            );
        }

        return [];
    }

    if (Array.isArray(rawModules)) {
        const normalized = rawModules.filter(
            (value): value is BusinessModule =>
                typeof value === "string" &&
                VALID_MODULES.includes(value as BusinessModule)
        );

        if (normalized.length > 0) {
            return Array.from(new Set(normalized));
        }
    }

    if (accountType === "cliente") {
        return [];
    }

    // Business accounts share the same businessId and can use both modules.
    return ["servicios", "pyme"];
}
