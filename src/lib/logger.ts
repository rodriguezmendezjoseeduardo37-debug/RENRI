/**
 * Sistema de logging centralizado para el proyecto
 * Proporciona métodos consistentes para logging, warnings y errors
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    error?: Error;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === "development";

    private formatLog(entry: LogEntry): string {
        const { timestamp, level, message, context, error } = entry;
        const levelStr = level.toUpperCase().padEnd(6);
        const contextStr = context ? ` ${JSON.stringify(context)}` : "";
        const errorStr = error ? `\n${error.stack}` : "";

        return `[${timestamp}] ${levelStr} ${message}${contextStr}${errorStr}`;
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            error,
        };

        // Siempre log en development
        if (this.isDevelopment) {
            const formattedLog = this.formatLog(entry);

            if (level === "error") {
                console.error(formattedLog);
            } else if (level === "warn") {
                console.warn(formattedLog);
            } else if (level === "debug") {
                console.debug(formattedLog);
            } else {
                console.log(formattedLog);
            }
        }

        // TODO: En producción, enviar a servicio de logging (Sentry, LogRocket, etc.)
        // if (!this.isDevelopment) {
        //   this.sendToLoggingService(entry);
        // }
    }

    info(message: string, context?: Record<string, unknown>) {
        this.log("info", message, context);
    }

    warn(message: string, context?: Record<string, unknown>) {
        this.log("warn", message, context);
    }

    error(message: string, error?: Error, context?: Record<string, unknown>) {
        this.log("error", message, context, error);
    }

    debug(message: string, context?: Record<string, unknown>) {
        this.log("debug", message, context);
    }

    /**
     * Log de Server Action con contexto completo
     */
    logAction(
        actionName: string,
        status: "start" | "success" | "error",
        context?: Record<string, unknown>,
        error?: Error
    ) {
        const message = `[ACTION] ${actionName} - ${status.toUpperCase()}`;

        if (status === "error") {
            this.error(message, error, context);
        } else {
            this.info(message, context);
        }
    }
}

export const logger = new Logger();
