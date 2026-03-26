"use client";

import { useState } from "react";

export function DemoRequestForm() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setMessage("Escribe tu correo para solicitar acceso.");
            return;
        }

        const subject = encodeURIComponent("Demo Request");
        const body = encodeURIComponent(`Email: ${trimmedEmail}`);

        setMessage("Estamos abriendo tu cliente de correo para solicitar acceso.");
        window.location.href = `mailto:hola@renri.app?subject=${subject}&body=${body}`;
    };

    return (
        <form onSubmit={handleSubmit} className="mb-10 flex w-full max-w-sm flex-col gap-4">
            <input
                type="email"
                value={email}
                onChange={(event) => {
                    setEmail(event.target.value);
                    if (message) setMessage("");
                }}
                placeholder="CORREO ELECTRÓNICO"
                className="border border-[#222222] bg-black px-4 py-3 text-sm text-white transition-colors focus:border-white focus:outline-none"
            />
            <button
                type="submit"
                className="bg-white px-4 py-3 text-[11px] font-bold tracking-[0.2em] text-black uppercase transition-colors hover:bg-[#cccccc]"
            >
                SOLICITAR ACCESO
            </button>
            {message ? <p className="text-sm text-[#888888]">{message}</p> : null}
        </form>
    );
}
