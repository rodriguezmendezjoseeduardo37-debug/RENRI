/**
 * Session Timeout Component - Logout automático por inactividad
 */

"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const WARNING_TIME = 5 * 60 * 1000; // 5 minutos antes

interface SessionTimeoutProps {
  onWarning?: () => void;
  enabled?: boolean;
}

export function SessionTimeout({
  onWarning,
  enabled = true,
}: SessionTimeoutProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const resetTimeout = () => {
    // Limpiar timeouts anteriores
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    if (!enabled) return;

    // Mostrar advertencia 5 minutos antes
    warningTimeoutRef.current = setTimeout(() => {
      onWarning?.();
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Logout después de inactividad
    timeoutRef.current = setTimeout(() => {
      signOut({ redirect: false }).then(() => {
        router.push(
          "/login?reason=session_expired"
        );
      });
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    if (!enabled) return;

    // Eventos que resetean el timer
    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetTimeout);
    });

    // Iniciar timer
    resetTimeout();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimeout);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [enabled, onWarning]);

  return null;
}
