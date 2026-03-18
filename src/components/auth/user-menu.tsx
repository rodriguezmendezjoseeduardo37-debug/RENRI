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

export function UserMenu() {
    const { data: session } = useSession();
    const user = session?.user;

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
                        <AvatarFallback className="bg-[hsl(0,0%,14.9%)] text-white text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-56 bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)] text-white"
                align="end"
                forceMount
            >
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-[hsl(0,0%,45.1%)]">{user.email}</p>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-[hsl(0,0%,14.9%)]" />

                <DropdownMenuItem asChild className="cursor-pointer hover:bg-[hsl(0,0%,14.9%)]">
                    <Link href="/dashboard/configuracion/perfil">
                        <User className="mr-2 h-4 w-4" />
                        Perfil
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="cursor-pointer hover:bg-[hsl(0,0%,14.9%)]">
                    <Link href="/dashboard/configuracion">
                        <Settings className="mr-2 h-4 w-4" />
                        Configuración
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="cursor-pointer hover:bg-[hsl(0,0%,14.9%)]">
                    <Link href="/dashboard/configuracion/planes">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Facturación
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[hsl(0,0%,14.9%)]" />

                <DropdownMenuItem
                    className="cursor-pointer text-red-400 hover:bg-[hsl(0,0%,14.9%)] hover:text-red-400 focus:text-red-400"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
