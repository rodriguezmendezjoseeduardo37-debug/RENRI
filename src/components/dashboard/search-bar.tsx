"use client";

import { useRef, useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Package, ShoppingCart, Users, Calendar, Loader2 } from "lucide-react";
import { globalSearch, type SearchResultItem } from "@/actions/search";

interface SearchBarProps {
    accountType?: "servicios" | "pyme" | "cliente";
}

const TYPE_CONFIG: Record<
    SearchResultItem["type"],
    { icon: React.ElementType; color: string; label: string }
> = {
    cliente: { icon: Users, color: "text-foreground", label: "Cliente" },
    producto: { icon: Package, color: "text-emerald-400", label: "Producto" },
    pedido: { icon: ShoppingCart, color: "text-foreground", label: "Pedido" },
    cita: { icon: Calendar, color: "text-violet-400", label: "Cita" },
    pago: { icon: ShoppingCart, color: "text-muted-foreground", label: "Pago" },
};

export function SearchBar({ accountType = "servicios" }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isPending, startTransition] = useTransition();

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();

    const placeholder =
        accountType === "pyme"
            ? "Buscar pedidos, productos, clientes..."
            : accountType === "cliente"
            ? "Buscar citas, pagos..."
            : "Buscar citas, clientes...";

    /* ── Keyboard shortcut ⌘K / Ctrl+K ─────────────── */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === "Escape") {
                setOpen(false);
                setQuery("");
                inputRef.current?.blur();
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    /* ── Click outside ───────────────────────────────── */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ── Debounced search ────────────────────────────── */
    const runSearch = useCallback((value: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value.trim() || value.trim().length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }
        debounceRef.current = setTimeout(() => {
            startTransition(async () => {
                const res = await globalSearch(value);
                setResults(res.items);
                setOpen(res.items.length > 0 || value.trim().length >= 2);
                setActiveIndex(-1);
            });
        }, 300);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        runSearch(e.target.value);
    };

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setOpen(false);
        inputRef.current?.focus();
    };

    /* ── Keyboard navigation ─────────────────────────── */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open || results.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            const item = results[activeIndex];
            if (item) navigate(item);
        }
    };

    const navigate = (item: SearchResultItem) => {
        router.push(item.href);
        setOpen(false);
        setQuery("");
        setResults([]);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-md">
            {/* ── Search pill input ─────────────────── */}
            <div className="search-input-pill flex items-center gap-2.5 h-10 px-3.5 rounded-full">
                {isPending ? (
                    <Loader2 className="h-4 w-4 text-muted-foreground flex-shrink-0 animate-spin" />
                ) : (
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (results.length > 0) setOpen(true);
                    }}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-[11px] font-medium tracking-[0.08em] text-foreground placeholder:text-muted-foreground outline-none min-w-0"
                    autoComplete="off"
                    spellCheck={false}
                    id="global-search-input"
                    aria-label="Búsqueda global"
                    aria-autocomplete="list"
                />
                {query ? (
                    <button
                        onClick={handleClear}
                        aria-label="Limpiar búsqueda"
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                ) : (
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-muted-foreground border border-current/20 opacity-60 flex-shrink-0">
                        ⌘K
                    </kbd>
                )}
            </div>

            {/* ── Dropdown results ─────────────────── */}
            {open && (
                <div
                    className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-2xl overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2 duration-150 bg-card border border-border shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
                    role="listbox"
                    aria-label="Resultados de búsqueda"
                >
                    {results.length === 0 && query.trim().length >= 2 && !isPending ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                            <Search className="h-5 w-5 opacity-40" />
                            <span className="text-[11px] tracking-[0.1em]">
                                Sin resultados para &ldquo;{query}&rdquo;
                            </span>
                        </div>
                    ) : (
                        <div className="py-1.5 max-h-[400px] overflow-y-auto">
                            {results.map((item, i) => {
                                const cfg = TYPE_CONFIG[item.type];
                                const Icon = cfg.icon;
                                const isActive = i === activeIndex;
                                return (
                                    <button
                                        key={item.id}
                                        role="option"
                                        aria-selected={isActive}
                                        onClick={() => navigate(item)}
                                        onMouseEnter={() => setActiveIndex(i)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 ${
                                            isActive
                                                ? "bg-primary/15"
                                                : "hover:bg-accent"
                                        }`}
                                    >
                                        <span
                                            className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-accent ${cfg.color}`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-semibold text-foreground truncate">
                                                {item.title}
                                            </p>
                                            {item.subtitle && (
                                                <p className="text-[10px] text-muted-foreground tracking-[0.05em] truncate">
                                                    {item.subtitle}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {item.meta && (
                                                <span className="text-[9px] font-bold tracking-[0.15em] text-muted-foreground bg-accent px-1.5 py-0.5 rounded-md">
                                                    {item.meta}
                                                </span>
                                            )}
                                            <span className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground/60 uppercase">
                                                {cfg.label}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer hint */}
                    <div className="border-t border-border px-4 py-2 flex items-center gap-3 text-[9px] text-muted-foreground/50 tracking-[0.1em] bg-card">
                        <span>↑↓ navegar</span>
                        <span>↵ abrir</span>
                        <span>Esc cerrar</span>
                    </div>
                </div>
            )}
        </div>
    );
}
