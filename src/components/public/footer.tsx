import Link from "next/link";
import { LogoRenri } from "./logo-renri";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50 backdrop-blur-md relative z-20">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 text-white mb-4">
              <LogoRenri className="w-6 h-6 text-white" />
              <span className="font-bold text-lg tracking-tight">RENRI</span>
            </Link>
            <p className="text-sm text-gray-400 max-w-xs">
              La plataforma todo-en-uno para administrar y escalar tu negocio de servicios. Citas, pagos e inventario desde un solo lugar.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Producto</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="/pricing" className="hover:text-[#12b4ff] transition-colors">Precios</Link></li>
              <li><Link href="#" className="hover:text-[#12b4ff] transition-colors">Funcionalidades</Link></li>
              <li><Link href="#" className="hover:text-[#12b4ff] transition-colors">Integraciones</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="#" className="hover:text-[#12b4ff] transition-colors">Sobre nosotros</Link></li>
              <li><Link href="#" className="hover:text-[#12b4ff] transition-colors">Contacto</Link></li>
              <li><Link href="#" className="hover:text-[#12b4ff] transition-colors">Blog</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="/terminos" className="hover:text-[#12b4ff] transition-colors">Términos de servicio</Link></li>
              <li><Link href="/privacidad" className="hover:text-[#12b4ff] transition-colors">Aviso de privacidad</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} RENRI. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
