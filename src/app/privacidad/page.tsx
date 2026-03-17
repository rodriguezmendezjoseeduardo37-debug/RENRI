import Link from "next/link";

export default function PrivacidadPage() {
    return (
        <div className="min-h-screen bg-black text-white px-6 py-20">
            <div className="max-w-3xl mx-auto space-y-12">
                <div className="border-b border-[#222222] pb-8 mb-12">
                    <Link href="/" className="text-[#666666] hover:text-white transition-colors text-[10px] font-bold tracking-[0.2em] uppercase mb-8 block">
                        ← VOLVER AL INICIO
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] font-[family-name:var(--font-heading)] uppercase mb-4">
                        Aviso de Privacidad
                    </h1>
                    <p className="text-[#888888] font-mono text-xs uppercase tracking-widest">
                        ÚLTIMA ACTUALIZACIÓN: MARZO 2026
                    </p>
                </div>

                <div className="prose prose-invert prose-p:text-[#cccccc] prose-p:font-mono prose-p:text-sm prose-p:leading-relaxed prose-headings:font-[family-name:var(--font-heading)] prose-headings:uppercase prose-headings:tracking-[0.05em] prose-h2:text-xl prose-h2:mb-4 prose-h2:mt-10">
                    <h2>1. RESPONSABLE DE LOS DATOS</h2>
                    <p>
                        RENRI (en adelante "El Responsable"), con domicilio en la Ciudad de México, es responsable del tratamiento de sus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
                    </p>

                    <h2>2. FINALIDAD DEL TRATAMIENTO</h2>
                    <p>
                        Los datos personales que recabamos de usted se utilizarán para las siguientes finalidades necesarias para el servicio que solicita:
                        <br/><br/>
                        - Proveer los servicios y productos relacionados con la plataforma SaaS de gestión. <br/>
                        - Creación y administración de su cuenta de usuario y/o tenant. <br/>
                        - Procesamiento de pagos y facturación a través de nuestros proveedores (e.g. Stripe). <br/>
                        - Notificaciones de confirmación, soporte técnico y actualizaciones del sistema.
                    </p>

                    <h2>3. DATOS PERSONALES RECABADOS</h2>
                    <p>
                        Para llevar a cabo las finalidades descritas, utilizaremos los siguientes datos: Nombre completo, correo electrónico, teléfono, datos fiscales (en caso de requerir facturación), e información de uso relacionada con el sistema. RENRI no recaba directamente datos patrimoniales de tarjetas, los cuales son procesados íntegramente por Stripe.
                    </p>

                    <h2>4. DERECHOS ARCO</h2>
                    <p>
                        Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada adecuadamente (Cancelación); así como oponerse al uso de sus datos personales para fines específicos (Oposición). Estos derechos se conocen como derechos ARCO.
                        <br/><br/>
                        Para el ejercicio de cualquiera de los derechos ARCO, usted deberá presentar la solicitud respectiva a través del correo electrónico: privacidad@renri.com.
                    </p>

                    <h2>5. CAMBIOS AL AVISO DE PRIVACIDAD</h2>
                    <p>
                        El presente aviso de privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos requerimientos legales; de nuestras propias necesidades por los productos o servicios que ofrecemos; de nuestras prácticas de privacidad; de cambios en nuestro modelo de negocio, o por otras causas.
                    </p>
                </div>
            </div>
        </div>
    );
}
