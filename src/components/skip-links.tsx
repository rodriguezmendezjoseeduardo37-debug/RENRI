/**
 * Skip Links - Accesibilidad: Links para saltar contenido
 */

export function SkipLinks() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only fixed top-4 left-4 z-50 bg-black text-white px-4 py-2 rounded"
      >
        Saltar al contenido principal
      </a>
      <a
        href="#navigation"
        className="sr-only focus:not-sr-only fixed top-12 left-4 z-50 bg-black text-white px-4 py-2 rounded"
      >
        Saltar a navegación
      </a>
      <a
        href="#footer"
        className="sr-only focus:not-sr-only fixed top-20 left-4 z-50 bg-black text-white px-4 py-2 rounded"
      >
        Saltar al pie de página
      </a>
    </>
  );
}
