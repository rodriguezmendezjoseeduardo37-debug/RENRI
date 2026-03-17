import Link from "next/link";

export default function TerminosPage() {
    return (
        <div className="min-h-screen bg-black text-white px-6 py-20">
            <div className="max-w-3xl mx-auto space-y-12">
                <div className="border-b border-[#222222] pb-8 mb-12">
                    <Link href="/" className="text-[#666666] hover:text-white transition-colors text-[10px] font-bold tracking-[0.2em] uppercase mb-8 block">
                        ← VOLVER AL INICIO
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] font-[family-name:var(--font-heading)] uppercase mb-4">
                        Términos y Condiciones
                    </h1>
                    <p className="text-[#888888] font-mono text-xs uppercase tracking-widest">
                        FECHA DE VIGENCIA: MARZO 2026
                    </p>
                </div>

                <div className="prose prose-invert prose-p:text-[#cccccc] prose-p:font-mono prose-p:text-sm prose-p:leading-relaxed prose-headings:font-[family-name:var(--font-heading)] prose-headings:uppercase prose-headings:tracking-[0.05em] prose-h2:text-xl prose-h2:mb-4 prose-h2:mt-10">
                    <h2>1. ACEPTACIÓN DE LOS TÉRMINOS</h2>
                    <p>
                        Al acceder y utilizar la plataforma RENRI, usted acepta estar sujeto a los presentes Términos y Condiciones de uso. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder a la plataforma ni utilizar sus servicios.
                    </p>

                    <h2>2. DESCRIPCIÓN DEL SERVICIO</h2>
                    <p>
                        RENRI es un Software as a Service (SaaS) multi-tenant diseñado para profesionistas de la salud y prestadores de servicios en México. Ofrece herramientas de gestión de citas, portales públicos, control de pagos e inventarios. RENRI se proporciona "tal cual" y "según disponibilidad".
                    </p>

                    <h2>3. CUENTAS DE USUARIO Y TENANTS</h2>
                    <p>
                        Para utilizar el sistema, debe registrarse proporcionando información precisa y actualizada. Usted es responsable de salvaguardar su contraseña y de todas las actividades que ocurran bajo su cuenta u organización (Tenant). Notifique inmediatamente cualquier violación de seguridad.
                    </p>

                    <h2>4. PAGOS Y SUSCRIPCIONES</h2>
                    <p>
                        Ciertas características de RENRI requieren una suscripción de pago. Los pagos son procesados a través de Stripe y están sujetos a sus propios términos de servicio. Las suscripciones se renuevan automáticamente a menos que sean canceladas previamente en el panel de configuración. No existen reembolsos por periodos parciales utilizados.
                    </p>

                    <h2>5. RESPONSABILIDAD DE DATOS (HIPAA/NOM)</h2>
                    <p>
                        RENRI actúa únicamente como el procesador tecnológico. Cada Tenant (Clínica o Profesional) es el único responsable legal de mantener el cumplimiento normativo aplicable al manejo del expediente clínico e información confidencial de sus pacientes según la legislación mexicana vigente (e.g. NOM-004-SSA3-2012).
                    </p>

                    <h2>6. LIMITACIÓN DE RESPONSABILIDAD</h2>
                    <p>
                        En ningún caso RENRI será responsable por daños indirectos, incidentales, especiales o consecuentes que surjan del uso o incapacidad de uso de la plataforma, incluyendo pero no limitado a la pérdida de información o lucro cesante.
                    </p>
                </div>
            </div>
        </div>
    );
}
