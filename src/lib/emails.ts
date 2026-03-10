import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAppointmentConfirmation(data: {
    to: string;
    clientName: string;
    serviceName: string;
    staffName: string;
    date: string;
    time: string;
    businessName: string;
    appointmentId: string;
}) {
    const cancelUrl = `${process.env.NEXTAUTH_URL}/portal/cancel/${data.appointmentId}`;

    await resend.emails.send({
        from: `${data.businessName} <noreply@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
        to: data.to,
        subject: `Cita Confirmada — ${data.serviceName}`,
        html: `
            <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 480px; margin: 0 auto; background: #000; color: #fff; padding: 40px;">
                <h1 style="font-size: 24px; font-weight: 700; letter-spacing: 2px; margin: 0 0 24px;">${data.businessName.toUpperCase()}</h1>
                <div style="border-top: 1px solid #333; padding-top: 24px;">
                    <p style="font-size: 11px; letter-spacing: 3px; color: #888; margin: 0 0 16px;">CONFIRMACIÓN DE CITA</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px 0; color: #888; font-size: 12px; letter-spacing: 2px;">SERVICIO</td><td style="padding: 8px 0; color: #fff; font-size: 14px; font-weight: 700; text-align: right;">${data.serviceName}</td></tr>
                        <tr><td style="padding: 8px 0; color: #888; font-size: 12px; letter-spacing: 2px;">PROFESIONAL</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${data.staffName}</td></tr>
                        <tr><td style="padding: 8px 0; color: #888; font-size: 12px; letter-spacing: 2px;">FECHA</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${data.date}</td></tr>
                        <tr><td style="padding: 8px 0; color: #888; font-size: 12px; letter-spacing: 2px;">HORA</td><td style="padding: 8px 0; color: #fff; font-size: 14px; font-weight: 700; text-align: right;">${data.time}</td></tr>
                    </table>
                </div>
                <div style="margin-top: 32px; text-align: center;">
                    <a href="${cancelUrl}" style="color: #888; font-size: 10px; letter-spacing: 2px; text-decoration: underline;">CANCELAR CITA</a>
                </div>
            </div>
        `,
    });
}

export async function sendAppointmentReminder(data: {
    to: string;
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
    businessName: string;
}) {
    await resend.emails.send({
        from: `${data.businessName} <noreply@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
        to: data.to,
        subject: `Recordatorio: Tu cita es mañana — ${data.serviceName}`,
        html: `
            <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 480px; margin: 0 auto; background: #000; color: #fff; padding: 40px;">
                <h1 style="font-size: 24px; font-weight: 700; letter-spacing: 2px; margin: 0 0 24px;">${data.businessName.toUpperCase()}</h1>
                <div style="border-top: 1px solid #333; padding-top: 24px;">
                    <p style="font-size: 11px; letter-spacing: 3px; color: #888; margin: 0 0 16px;">RECORDATORIO DE CITA</p>
                    <p style="font-size: 14px; color: #ccc; line-height: 1.6;">
                        Hola <strong>${data.clientName}</strong>, te recordamos que tu cita de <strong>${data.serviceName}</strong> es mañana <strong>${data.date}</strong> a las <strong>${data.time}</strong>.
                    </p>
                </div>
                <div style="margin-top: 24px; padding: 16px; border: 1px solid #333; text-align: center;">
                    <p style="font-size: 10px; letter-spacing: 3px; color: #888; margin: 0;">TE ESPERAMOS</p>
                </div>
            </div>
        `,
    });
}

export async function sendAppointmentCancelled(data: {
    to: string;
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
    businessName: string;
}) {
    await resend.emails.send({
        from: `${data.businessName} <noreply@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
        to: data.to,
        subject: `Cita Cancelada — ${data.serviceName}`,
        html: `
            <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 480px; margin: 0 auto; background: #000; color: #fff; padding: 40px;">
                <h1 style="font-size: 24px; font-weight: 700; letter-spacing: 2px; margin: 0 0 24px;">${data.businessName.toUpperCase()}</h1>
                <div style="border-top: 1px solid #333; padding-top: 24px;">
                    <p style="font-size: 11px; letter-spacing: 3px; color: #888; margin: 0 0 16px;">CITA CANCELADA</p>
                    <p style="font-size: 14px; color: #ccc; line-height: 1.6;">
                        Hola <strong>${data.clientName}</strong>, tu cita de <strong>${data.serviceName}</strong> para el <strong>${data.date}</strong> a las <strong>${data.time}</strong> ha sido cancelada.
                    </p>
                    <p style="font-size: 12px; color: #888; margin-top: 16px;">
                        Si deseas reagendar, visita nuestra página para agendar una nueva cita.
                    </p>
                </div>
            </div>
        `,
    });
}
