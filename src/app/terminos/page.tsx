import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RenriMark } from "@/components/renri-mark";

export default function TerminosPage() {
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
            Términos y Condiciones
          </h1>
          <p className="text-white/50 text-sm mb-12">
            Última actualización: {new Date().toLocaleDateString('es-MX')}
          </p>

          <section className="space-y-8 text-white/70">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. Aceptación de los Términos</h2>
              <p>
                Al acceder y utilizar <strong>RENRI</strong> ("la Plataforma", "Nosotros"), usted ("el Usuario", "el Profesional", "la PyME") acepta estar legalmente sujeto a estos Términos y Condiciones, los cuales cumplen con las disposiciones de la legislación aplicable en los Estados Unidos Mexicanos, incluyendo la Ley Federal de Protección al Consumidor (PROFECO).
              </p>
              <p className="mt-2">
                Si no está de acuerdo con estos términos, le solicitamos que no utilice nuestros servicios.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. Descripción del Servicio</h2>
              <p>
                RENRI proporciona herramientas digitales (Software as a Service) para la gestión de citas, inventario, reportes y cobros dirigidas a profesionistas independientes y Pequeñas y Medianas Empresas (PyMEs) en México. RENRI actúa exclusivamente como proveedor de infraestructura tecnológica y no como un prestador directo de los servicios profesionales que los usuarios ofrezcan a sus respectivos clientes finales.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Cuentas y Responsabilidad</h2>
              <p>
                Para utilizar nuestros servicios, el Usuario debe registrarse y crear una cuenta, proporcionando información veraz, actual y completa.
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>El Usuario es enteramente responsable de mantener la confidencialidad de su contraseña.</li>
                <li>Toda actividad realizada bajo la cuenta del Usuario será responsabilidad exclusiva de este.</li>
                <li>RENRI se reserva el derecho de suspender o cancelar cuentas que realicen actividades fraudulentas, ilegales o que violen estos términos.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Procesamiento de Pagos</h2>
              <p>
                La Plataforma permite la gestión e integración de métodos de pago mediante proveedores de pago de terceros (ej. Stripe, Mercado Pago). 
              </p>
              <p className="mt-2">
                RENRI no es una institución financiera ni retiene directamente los fondos. Al procesar transacciones a través de la plataforma, el Usuario acepta simultáneamente los Términos de Servicio del procesador de pagos correspondiente. RENRI no se hace responsable por retenciones, contracargos o disputas entre el Usuario y sus clientes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Propiedad Intelectual</h2>
              <p>
                Todo el contenido, diseño gráfico, código fuente, logotipos ("RenriMark") y elementos visuales de la plataforma son propiedad exclusiva de <strong>BF Enterprises</strong> y están protegidos por la Ley Federal del Derecho de Autor y la Ley Federal de Protección a la Propiedad Industrial en México.
              </p>
              <p className="mt-2">
                Queda estrictamente prohibida la reproducción, distribución, o modificación del software sin consentimiento previo por escrito.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. Limitación de Responsabilidad</h2>
              <p>
                RENRI provee el servicio "tal cual" y "según disponibilidad". En la máxima medida permitida por la ley mexicana:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>No garantizamos que el servicio estará libre de interrupciones o errores en todo momento.</li>
                <li>No somos responsables de lucro cesante, pérdida de datos o daños indirectos derivados del uso o incapacidad de usar la plataforma.</li>
                <li>El Usuario es el único responsable legal ante sus clientes por la calidad, entrega y facturación de los servicios o productos que gestione a través de RENRI.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">7. Modificaciones a los Términos</h2>
              <p>
                RENRI se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios sustanciales serán notificados a los usuarios registrados vía correo electrónico con al menos 15 días de anticipación a su entrada en vigor, garantizando su derecho a cancelar el servicio si no están de acuerdo.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">8. Jurisdicción y Ley Aplicable</h2>
              <p>
                Estos Términos se rigen e interpretan de acuerdo con las leyes de los Estados Unidos Mexicanos. Para la resolución de cualquier controversia, las partes se someten expresamente a la jurisdicción de los tribunales competentes en la Ciudad de México o, en su caso, a los procedimientos conciliatorios ante la Procuraduría Federal del Consumidor (PROFECO).
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
