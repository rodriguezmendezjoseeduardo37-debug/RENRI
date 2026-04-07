"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <button className="h-9 w-9 flex items-center justify-center rounded-full border border-border text-muted-foreground">
                <Sun className="h-4 w-4" /> {/* Doesn't matter before hydration */}
            </button>
        );
    }

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    const icon =
        resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" /> 
        ) : (
            <Moon className="h-4 w-4" />
        );

    const label =
        theme === "dark"
            ? "Modo oscuro"
            : theme === "light"
            ? "Modo claro"
            : "Sistema";

    return (
        <button
            onClick={toggleTheme}
            aria-label={`Tema actual: ${label}. Click para cambiar.`}
            title={label}
            className="h-9 w-9 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-all duration-200"
        >
            {icon}
        </button>
    );
}
