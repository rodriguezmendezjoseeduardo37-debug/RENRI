"use client";

import { signOut, useSession } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    User,
    Settings,
    CreditCard,
    LogOut,
} from "lucide-react";
import Link from "next/link";

export function UserMenu({ accountType }: { accountType?: string }) {
    const { data: session } = useSession();
    const user = session?.user;
    const isClientRole = (user as any)?.role === "CLIENT";
    // We strictly use the accountType prop passed from Topbar (derived from URL/layout context) 
    // to know if we are in the client portal, since sessionAccountType can be stale if the user switches module manually.
    const isClientContext = isClientRole || accountType === "cliente";
    const isOwner = (user as any)?.role === "OWNER" || (user as any)?.role === "SUPER_ADMIN";

    if (!user) return null;

    const initials = user.name
        ? user.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "U";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                >
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-56 bg-popover border-border text-popover-foreground"
                align="end"
                forceMount
            >
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-border" />

                <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent text-foreground/80 hover:text-foreground">
                    <Link href={isClientContext ? "/cliente/perfil" : "/dashboard/configuracion/perfil"}>
                        <User className="mr-3 h-4 w-4 opacity-70" />
                        <span className="text-[11px] font-bold tracking-[0.1em] uppercase">Mi Perfil</span>
                    </Link>
                </DropdownMenuItem>

                {!isClientContext && isOwner && (
                    <>
                        <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent text-foreground/80 hover:text-foreground">
                            <Link href="/dashboard/configuracion">
                                <Settings className="mr-3 h-4 w-4 opacity-70" />
                                <span className="text-[11px] font-bold tracking-[0.1em] uppercase">Configuración</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent text-foreground/80 hover:text-foreground">
                            <Link href="/dashboard/configuracion/planes">
                                <CreditCard className="mr-3 h-4 w-4 opacity-70" />
                                <span className="text-[11px] font-bold tracking-[0.1em] uppercase">Suscripción</span>
                            </Link>
                        </DropdownMenuItem>
                    </>
                )}

                <DropdownMenuSeparator className="bg-border" />

                <DropdownMenuItem
                    className="cursor-pointer text-red-500 dark:text-red-400 hover:bg-accent focus:text-red-500 dark:focus:text-red-400"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
