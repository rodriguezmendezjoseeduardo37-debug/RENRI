import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RenriMark } from "@/components/renri-mark";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] selection:bg-white/20 selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 group text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Volver al inicio</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <RenriMark size={24} />
            <span className="text-sm font-bold tracking-widest text-white">RENRI</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto prose prose-invert prose-headings:font-[family-name:var(--font-heading)] prose-a:text-white prose-a:underline-offset-4 hover:prose-a:text-white/80">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
            Aviso de Privacidad
          </h1>
          <p className="text-white/50 text-sm mb-12">
            Última actualización: {new Date().toLocaleDateString('es-MX')}
          </p>

          <section className="space-y-8 text-white/70">
            <div>
              <p>
                En cumplimiento con la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> y su Reglamento, <strong>BF Enterprises</strong> (en adelante "RENRI"), le informa que somos los responsables del uso y protección de sus datos personales.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. Datos Personales que Recabamos</h2>
              <p>Para llevar a cabo las finalidades descritas en el presente aviso, recabaremos los siguientes datos:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Datos de Identificación:</strong> Nombre completo, RFC, identificación oficial.</li>
                <li><strong>Datos de Contacto:</strong> Correo electrónico, número de teléfono, dirección de negocio.</li>
                <li><strong>Datos Patrimoniales o Financieros:</strong> Datos bancarios exclusivamente para la dispersión de fondos o cobro de la suscripción mensual (manejados de forma encriptada a través de proveedores certificados PCI-DSS).</li>
                <li><strong>Datos de Terceros (Clientes):</strong> Información de los clientes finales que el Usuario (Negocio) ingrese en la plataforma. <em>RENRI actúa como Encargado del tratamiento de estos datos, siendo el Usuario el Responsable directo ante el INAI.</em></li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. Finalidades del Tratamiento</h2>
              <p>Los datos personales que recabamos los utilizaremos para las siguientes finalidades primarias y necesarias para el servicio:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Creación y administración de su cuenta en la plataforma RENRI.</li>
                <li>Gestión de citas, inventarios y procesamiento de pagos solicitados por usted.</li>
                <li>Emisión de facturación electrónica y comprobantes de suscripción.</li>
                <li>Proveer soporte técnico y resolver incidencias.</li>
                <li>Dar cumplimiento a obligaciones regulatorias aplicable en materia fiscal y comercial en México.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Transferencia de Datos</h2>
              <p>
                RENRI no venderá ni transferirá sus datos a terceros no relacionados con la prestación del servicio. Sus datos podrán ser transferidos exclusivamente a:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Proveedores de procesamiento de pagos autorizados (para efectuar los cobros).</li>
                <li>Autoridades competentes en los casos previstos por la legislación mexicana vigente (ej. requerimientos judiciales o del SAT).</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Derechos ARCO</h2>
              <p>
                Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o bases de datos (Cancelación); así como oponerse al uso de sus datos personales para fines específicos (Oposición).
              </p>
              <p className="mt-2">
                Para el ejercicio de cualquiera de los derechos ARCO, usted deberá presentar la solicitud respectiva enviando un correo electrónico a nuestro Departamento de Privacidad en: <strong>privacidad@renri.mx</strong>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Uso de Cookies</h2>
              <p>
                Le informamos que en nuestra plataforma web utilizamos cookies, web beacons y otras tecnologías a través de las cuales es posible monitorear su comportamiento como usuario de internet, brindarle un mejor servicio y experiencia al navegar, así como asegurar las sesiones de autenticación. Estas tecnologías pueden deshabilitarse en la configuración de su navegador.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. Modificaciones al Aviso de Privacidad</h2>
              <p>
                El presente aviso de privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos requerimientos legales, de nuestras propias necesidades por los servicios que ofrecemos, de nuestras prácticas de privacidad o por cambios en nuestro modelo de negocio.
              </p>
              <p className="mt-2">
                Nos comprometemos a mantenerlo informado sobre los cambios que pueda sufrir el presente aviso a través de notificaciones en la misma plataforma o al correo electrónico registrado.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
