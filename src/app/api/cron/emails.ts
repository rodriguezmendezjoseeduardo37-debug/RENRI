/**
 * API Route: Cron - Procesar Cola de Emails
 * 
 * Llamar desde un servicio cron (Vercel Crons, AWS EventBridge, etc.)
 * GET /api/cron/emails
 * 
 * Header requerido: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { processPendingEmails, getEmailQueueStats } from "@/lib/email-queue";

const CRON_SECRET = process.env.CRON_SECRET || "dev-secret-change-in-production";

/**
 * Valida que la solicitud venga de un servicio cron autorizado
 */
function validateCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");
  return token === CRON_SECRET;
}

export async function GET(req: NextRequest) {
  // Validar autenticación
  if (!validateCronSecret(req)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    console.log("[Cron] Processing pending emails...");
    
    const stats = await processPendingEmails();
    const queueStats = await getEmailQueueStats();

    return NextResponse.json(
      {
        success: true,
        message: "Email queue processed successfully",
        processedStats: stats,
        queueStats,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Cron] Error processing emails:", err);
    
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST también es permitido (algunos servicios cron usan POST)
 */
export async function POST(req: NextRequest) {
  return GET(req);
}
