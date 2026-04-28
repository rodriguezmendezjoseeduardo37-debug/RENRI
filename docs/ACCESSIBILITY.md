# ♿ Guía de Accesibilidad (A11y) - RENRI

**Versión:** 1.0  
**Estándar:** WCAG 2.1 Level AA  
**Última Actualización:** 26 de Abril de 2026  
**Estado:** ✅ En Implementación

---

## 🎯 Objetivo

Garantizar que RENRI sea usable por **todos**, incluyendo personas con:
- Discapacidad visual (baja visión, ceguera, daltonismo)
- Discapacidad auditiva (sordera, hipoacusia)
- Discapacidad motora (movilidad limitada, uso de teclado)
- Discapacidades cognitivas (dislexia, TDAH, dispraxia)
- Usuarios de edad avanzada
- Conexiones de internet lentas

---

## 📋 Estándares de Cumplimiento

### WCAG 2.1 Level AA (Objetivo Mínimo)

| Principio | Ejemplos | Nivel |
|-----------|----------|-------|
| **Perceptible** | Texto legible, imágenes con alt text | AA |
| **Operable** | Navegable por teclado, sin trampas | AA |
| **Comprensible** | Lenguaje claro, predecible | AA |
| **Robusto** | Compatible con AT (screen readers) | AA |

---

## 1️⃣ Contraste de Colores

**Requisito WCAG AA:**
- Texto normal: **4.5:1 mínimo**
- Texto grande (18px+): **3:1 mínimo**
- Componentes UI: **3:1 mínimo**

### Verificación

```bash
# Herramienta online
https://webaim.org/resources/contrastchecker/

# Chrome DevTools
Lighthouse → Accessibility → Contrast issues

# Offline: axe DevTools
npm install --save-dev axe-core
```

### Ejemplos

| Combinación | Ratio | Estado |
|-------------|-------|--------|
| Negro (#000) en blanco (#FFF) | 21:1 | ✅ Excelente |
| Gris (#555) en blanco | 7:1 | ✅ AA |
| Gris (#999) en blanco | 3.5:1 | ❌ AA (apenas) |
| Gris (#CCC) en blanco | 1.4:1 | ❌ Falla |

### Evitar Dependencia de Color Solamente

```tsx
// ❌ INCORRECTO: Solo usa color
<span className="text-red-600">Error</span>

// ✅ CORRECTO: Color + ícono/texto
<span className="flex items-center gap-2 text-red-600">
  <AlertCircle size={16} />
  Error
</span>

// En gráficos
<div>
  <span className="w-3 h-3 bg-blue-600 rounded-full" /> Dataset A
  <span className="w-3 h-3 bg-red-600 rounded-full" /> Dataset B
</div>
```

---

## 2️⃣ ARIA Labels y Atributos

### Inputs y Formularios

```tsx
// ✅ Con Label
<label htmlFor="email">Email</label>
<input id="email" type="email" placeholder="tu@email.com" />

// ✅ ARIA label (cuando visual no es posible)
<input
  aria-label="Buscar citas"
  type="search"
  placeholder="Buscar..."
/>

// ✅ Con descripción de error
<input
  aria-describedby="email-error"
  aria-invalid={hasError}
  type="email"
/>
{hasError && <span id="email-error">Email inválido</span>}

// ✅ Campos requeridos
<input aria-required="true" required />
```

### Botones e Iconos

```tsx
// ❌ INCORRECTO: Botón con solo icono
<button>
  <TrashIcon />
</button>

// ✅ CORRECTO
<button aria-label="Eliminar cita">
  <TrashIcon aria-hidden="true" />
</button>

// ✅ Alternativa: usar title
<button
  title="Eliminar cita"
  aria-label="Eliminar cita"
>
  <TrashIcon />
</button>
```

### Estados Dinámicos

```tsx
// Menú expandible
<button
  aria-expanded={isOpen}
  aria-controls="menu-items"
  onClick={() => setIsOpen(!isOpen)}
>
  Menú
</button>
<ul id="menu-items" hidden={!isOpen}>
  <li><a href="/page1">Página 1</a></li>
</ul>

// Botón toggle
<button aria-pressed={isFavorite} onClick={toggleFavorite}>
  ★ Favorito
</button>

// Loading state
<button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? 'Guardando...' : 'Guardar'}
</button>
```

### Notificaciones (Live Regions)

```tsx
// Polite: Anunciar cuando termina transacción
<div aria-live="polite" aria-atomic="true">
  {notificationMessage}
</div>

// Assertive: Anunciar inmediatamente (errores críticos)
<div aria-live="assertive" aria-atomic="true">
  {errorMessage}
</div>

// Regiones con roles
<div role="status" aria-live="polite">
  Guardado: ✓
</div>
```

---

## 3️⃣ Navegación por Teclado

### Skip Links

```tsx
// src/components/skip-links.tsx (ya existe)
<a href="#main-content" className="sr-only focus:not-sr-only">
  Saltar al contenido principal
</a>

<main id="main-content" tabIndex={-1}>
  {/* Contenido principal */}
</main>
```

### Tab Order Lógico

```tsx
// ✅ CORRECTO: Orden visual = orden de lectura
<form>
  <input placeholder="Nombre" />
  <input placeholder="Email" />
  <button>Enviar</button>
</form>

// ❌ INCORRECTO: Usar tabIndex positivo
<input tabIndex="3" />
<input tabIndex="1" />
<input tabIndex="2" />

// ✅ OK: tabIndex={0} para hacer focusable
<div tabIndex={0} onClick={handleClick}>
  Contenido clickeable
</div>

// ✅ OK: tabIndex={-1} para focus programático
<main ref={mainRef} tabIndex={-1}>
  Focus aquí después de navegación
</main>
```

### Focus Visible

```tsx
// Asegurar focus ring visible
.button:focus {
  outline: 2px solid #0066FF;
  outline-offset: 2px;
}

// Tailwind
<button className="focus:outline-2 focus:outline-offset-2 focus:outline-blue-600">
  Botón
</button>
```

### Manejo de Modales (Focus Trap)

```tsx
// El foco debe quedar atrapado dentro del modal
export function Modal({ isOpen, onClose, children }) {
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const lastButtonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstButtonRef.current) {
        lastButtonRef.current?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastButtonRef.current) {
        firstButtonRef.current?.focus();
        e.preventDefault();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onKeyDown={handleKeyDown}>
        <button ref={firstButtonRef}>Acción 1</button>
        <button ref={lastButtonRef}>Acción 2</button>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 4️⃣ Textos Alternativos

### Imágenes

```tsx
// Imagen informativa: describe el contenido
<Image
  src="/product.jpg"
  alt="Laptop plateada con pantalla de 14 pulgadas"
/>

// Imagen decorativa: alt vacío
<Image
  src="/decoration.jpg"
  alt=""
  aria-hidden="true"
/>

// Imagen como control: describe la acción
<button>
  <Image
    src="/download.svg"
    alt="Descargar reporte"
  />
</button>
```

### Iconos

```tsx
// Ícono decorativo
<AlertCircle aria-hidden="true" />

// Ícono descriptivo
<AlertCircle aria-label="Advertencia" />

// Con texto visible
<AlertCircle />
<span>Advertencia</span>
```

---

## 5️⃣ Lenguaje y Comprensibilidad

### Pautas

- Usar lenguaje claro y simple
- Frases cortas (15-20 palabras máximo)
- Evitar jerga técnica sin explicación
- Usar listas para múltiples puntos
- Definir acrónimos en primera mención

### Ejemplos

```tsx
// ❌ Confuso
<p>La configuración de multifactor puede requerir sincronización NTP.</p>

// ✅ Claro
<p>
  Protege tu cuenta con autenticación de dos factores.
  Necesitarás tu teléfono además de tu contraseña.
</p>

// ✅ Con términos técnicos aclarados
<p>
  RENRI (Reporte Ejecutivo Negocios Realizados Inteligente)
  es tu plataforma de gestión.
</p>
```

---

## 6️⃣ Estructura y Landmarks

### HTML Semántico

```tsx
<header role="banner">
  <nav aria-label="Principal">
    <a href="/inicio">Inicio</a>
    <a href="/servicios">Servicios</a>
  </nav>
</header>

<main role="main" id="main-content">
  <section aria-labelledby="section-title">
    <h2 id="section-title">Servicios Disponibles</h2>
    {/* Contenido */}
  </section>
</main>

<aside role="complementary" aria-label="Información adicional">
  {/* Sidebar */}
</aside>

<footer role="contentinfo">
  © 2026 RENRI
</footer>
```

---

## 🧪 Testing de Accesibilidad

### Herramientas

| Herramienta | Uso | Link |
|------------|-----|------|
| **axe DevTools** | Auditoría automatizada | https://www.deque.com/axe/devtools/ |
| **WAVE** | Evaluador visual | https://wave.webaim.org/ |
| **NVDA** | Screen reader gratuito (Windows) | https://www.nvaccess.org/ |
| **VoiceOver** | Screen reader (macOS/iOS) | Built-in |
| **Lighthouse** | Auditoría incluida en Chrome | DevTools |

### Testing Manual Checklist

- [ ] Tab: navega a través de todos controles
- [ ] Shift+Tab: navega hacia atrás
- [ ] Enter: activa botones y links
- [ ] Space: activa checkboxes y toggles
- [ ] Esc: cierra modales y menús
- [ ] Contraste: verificado con WebAIM
- [ ] Screen reader: todo texto accesible
- [ ] Zoom 200%: sin cortes o overflow
- [ ] Sin mouse: todo funciona
- [ ] Color ciego: información sin depender solo de color

### E2E Testing (Cypress)

```typescript
describe('Accesibilidad', () => {
  it('debe tener focus visible en inputs', () => {
    cy.get('input[type="email"]').focus();
    cy.get('input[type="email"]').should(
      'have.css',
      'outline-color',
      'rgb(0, 102, 255)'
    );
  });

  it('debe navegar por teclado', () => {
    cy.visit('/form');
    cy.get('input:first').focus().should('have.focus');
    cy.tab(); // Custom command
    cy.focused().should('be', 'input:nth(1)');
  });
});
```

---

## 📱 Accesibilidad en Dispositivos Móviles

- Touch targets mínimo 44x44px
- Sin gestos solo-táctiles críticos
- Permitir zoom sin desactivar
- Texto suficientemente grande (mínimo 16px)
- Contraste suficiente incluso en luz solar

---

## ✅ Checklist de Implementación

- [ ] Todos inputs con labels asociados
- [ ] Contraste verificado (axe DevTools)
- [ ] Skip links presentes
- [ ] Tab order lógico
- [ ] Focus ring visible
- [ ] Modales con focus trap
- [ ] Notificaciones con aria-live
- [ ] Imágenes con alt text
- [ ] Formularios con validación clara
- [ ] Landmarks semánticos correctos
- [ ] Lighthouse A11y score 100
- [ ] Tested con screen reader
- [ ] Tested sin mouse
- [ ] Documentación actualizada

---

## 🔗 Recursos

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Blog](https://webaim.org/)
- [A11y.css](https://github.com/ffoodd/a11y.css)

---

**Estado:** ✅ En Producción  
**Próxima Revisión:** 1 de Mayo de 2026

// Iconos informativos
<Icon aria-label="Cita confirmada" />
```

### 5. Formularios Accesibles

```tsx
// ✅ CORRECTO
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-describedby="email-error"
  />
  {error && (
    <span id="email-error" role="alert">
      {error}
    </span>
  )}
</div>

// Validación visual + accesible
<input
  aria-invalid={!!error}
  aria-describedby={error ? "error-msg" : undefined}
/>
```

### 6. Estructura Semántica ✅

```tsx
// ✅ Usar elementos semánticos
<header>
  <nav role="navigation">
    <a href="/">Inicio</a>
  </nav>
</header>

<main id="main-content">
  <article>
    <h1>Título Principal</h1>
    <p>Contenido...</p>
  </article>
</main>

<aside role="complementary">
  Sidebar
</aside>

<footer>
  Pie de página
</footer>

// ❌ Evitar divitis
<div role="header">
  <div role="navigation">
    <div>Menú</div>
  </div>
</div>
```

### 7. Headings Hierarchy

```tsx
// ✅ CORRECTO: Estructura jerárquica
<h1>Título Principal</h1>        {/* Solo 1 por página */}
  <h2>Sección</h2>
    <h3>Subsección</h3>

// ❌ INCORRECTO: Saltos de nivel
<h1>Principal</h1>
<h3>Subsección</h3>  {/* Falta h2! */}
```

### 8. Colores Seguros (Daltonismo)

No usar SOLO color para comunicar información:

```tsx
// ❌ INCORRECTO
<div className="text-red-600">Error</div>

// ✅ CORRECTO
<div className="text-red-600">
  ❌ Error: Campo requerido
</div>

// O mejor aún
<div className="text-red-600" role="alert">
  <AlertCircle className="inline" />
  Error: Campo requerido
</div>
```

### 9. Responsive + Zoom ✅

Permitir zoom hasta 200%:

```css
/* ❌ MAL: Deshabilitar zoom */
<meta name="viewport" content="user-scalable=no" />

/* ✅ CORRECTO */
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes" />
```

---

## 🧪 Testing de Accesibilidad

### 1. Automated Testing
```bash
# Instalar axe DevTools
npm install --save-dev @axe-core/react

# En tests
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should have no a11y violations', async () => {
  const { container } = render(<YourComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 2. Manual Testing

**Herramientas:**
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

**Pasos:**
1. Abrir página en navegador
2. Usar solo teclado (Tab, Enter, Escape)
3. Usar lector de pantalla (NVDA, JAWS, VoiceOver)
4. Aumentar zoom a 200%
5. Activar modo alto contraste

### 3. Pruebas de Pantalla Lectora

**Windows:** NVDA (gratis)  
**Mac:** VoiceOver (incluido)  
**iOS:** VoiceOver  
**Android:** TalkBack  

```bash
# Instalar NVDA (Windows)
# Descargar: https://www.nvaccess.org/

# Atajos básicos:
# Insert + F7 = Navegación por elementos
# Insert + H = Ir a siguiente encabezado
# Insert + L = Ir a siguiente lista
# Insert + B = Ir a siguiente botón
```

---

## 📊 Audit Checklist

- [ ] Contraste 4.5:1 para texto normal
- [ ] Contraste 3:1 para texto grande
- [ ] Todos los inputs tienen labels
- [ ] Navegación por teclado funciona
- [ ] Skip links presentes
- [ ] ARIA labels donde necesario
- [ ] Headings en orden jerárquico (h1 → h2 → h3)
- [ ] Imágenes tienen alt text
- [ ] Formularios validados visiblemente
- [ ] Errores descriptivos (no solo color)
- [ ] Modales atrapan focus
- [ ] Código semántico (header, nav, main, footer)
- [ ] Zoom hasta 200% funciona
- [ ] Sin contenido que parpadea >3 veces/segundo
- [ ] Videos tienen captions/subtítulos
- [ ] Enlaces con texto claro (no "click aquí")
- [ ] Enfoque visible en todos los elementos interactivos
- [ ] Sin reliance en sólo color para información

---

## 🎨 Componentes Accesibles Modelo

### Button
```tsx
<button
  onClick={handleClick}
  aria-pressed={isActive}
  aria-label={isActive ? "Desactivar" : "Activar"}
>
  {isActive ? "Activo" : "Inactivo"}
</button>
```

### Modal
```tsx
<div
  role="dialog"
  aria-labelledby="dialog-title"
  aria-modal="true"
>
  <h2 id="dialog-title">Confirmar acción</h2>
  <p>¿Estás seguro?</p>
  <button>Aceptar</button>
  <button onClick={onClose}>Cancelar</button>
</div>
```

### Alert
```tsx
<div
  role="alert"
  aria-live="polite"
  aria-atomic="true"
>
  ✅ Cambios guardados exitosamente
</div>
```

---

## 📚 Referencias

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

**Estado:** Activo  
**Próxima Auditoría:** 1 de Junio de 2026
