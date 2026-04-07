"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateUserProfile } from "@/actions/users";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";

const profileSchema = z.object({
    name: z.string().min(2, "El nombre es muy corto"),
    specialty: z.string().optional(),

    phone: z.string().optional(),
    bio: z.string().max(1000, "La biografía es muy larga").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface PerfilFormProps {
    user: {
        name: string;
        email: string;
    };
    profile: {
        specialty?: string | null;
        phone?: string | null;
        bio?: string | null;
    } | null;
}

export function PerfilForm({ user, profile }: PerfilFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name,
            specialty: profile?.specialty || "",

            phone: profile?.phone || "",
            bio: profile?.bio || "",
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            setIsLoading(true);
            await updateUserProfile(data);
            toast.success("Perfil actualizado correctamente");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al actualizar perfil");
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full bg-card border border-border text-foreground text-sm px-4 py-3 focus:outline-none focus:border-white transition-colors";
    const labelClass = "text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase block mb-2";

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex items-center gap-6 pb-8 border-b border-border">
                <div className="relative group cursor-pointer">
                    <div className="w-20 h-20 rounded-full border border-border bg-card flex items-center justify-center overflow-hidden">
                        <Camera className="w-6 h-6 text-foreground group-hover:text-foreground transition-colors" />
                    </div>
                </div>
                <div>
                    <h2 className="text-foreground font-bold tracking-tight">{user.name}</h2>
                    <p className="text-[11px] text-muted-foreground font-mono">{user.email}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className={labelClass}>Nombre Completo</label>
                    <input {...form.register("name")} className={inputClass} />
                    {form.formState.errors.name && <p className="text-red-500 text-[10px] uppercase font-bold tracking-widest">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <label className={labelClass}>Teléfono de Contacto</label>
                    <input {...form.register("phone")} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label className={labelClass}>Especialidad / Título</label>
                    <input {...form.register("specialty")} placeholder="Ej. Odontólogo, Abogado" className={inputClass} />
                </div>

            </div>

            <div className="space-y-2">
                <label className={labelClass}>Biografía / Descripción Profesional</label>
                <textarea 
                    {...form.register("bio")} 
                    rows={4} 
                    className={`${inputClass} resize-none`}
                    placeholder="Describe tu trayectoria y servicios..."
                />
            </div>

            <div className="pt-6 border-t border-border flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading ? "GUARDANDO..." : "GUARDAR PERFIL"}
                </button>
            </div>
        </form>
    );
}
