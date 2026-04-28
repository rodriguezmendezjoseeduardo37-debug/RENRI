# 🎨 Guía de Marca - RENRI

**Versión:** 1.0  
**Última Actualización:** 25 de Abril de 2026

---

## 🎯 Identidad de Marca

**RENRI** es una plataforma moderna, confiable y accesible para gestionar negocios de servicios.

**Valores:**
- 🚀 Innovación
- 🛡️ Seguridad
- ♿ Accesibilidad
- 💼 Profesionalismo
- 🌍 Inclusión

---

## 🎨 Paleta de Colores

### Colores Primarios

| Nombre | Código | RGB | Uso |
|--------|--------|-----|-----|
| **Verde Principal** | `#E2DB93` | 226, 219, 147 | CTA, Botones primarios |
| **Gris Oscuro** | `#1A1A1A` | 26, 26, 26 | Hover, Enlaces visitados |
| **Blanco** | `#FFFFFF` | 255, 255, 255 | Fondos, Texto sobre oscuro |
| **Negro** | `#000000` | 0, 0, 0 | Texto principal |

### Colores Semánticos

| Estado | Claro | Oscuro | Uso |
|--------|-------|--------|-----|
| **Éxito** | `#10B981` | `#059669` | Confirmación, Aprobado |
| **Advertencia** | `#F59E0B` | `#D97706` | Alerta, Precaución |
| **Error** | `#EF4444` | `#DC2626` | Rechazo, Cancelado |
| **Información** | `#3B82F6` | `#1D4ED8` | Información, Ayuda |

### Escala de Grises

```
Oscuro:  #111827 (Texto principal)
Medio:   #6B7280 (Texto secundario)
Claro:   #E5E7EB (Bordes, Fondos secundarios)
Muy Claro: #F9FAFB (Fondos)
```

### Modo Oscuro

Utilizar `next-themes` para alternancia automática:

```tsx
// Ejemplo: Componente sensible a tema
<div className="dark:bg-slate-900 dark:text-white">
  Contenido que cambia con tema
</div>
```

---

## 📝 Tipografía

### Fuentes

**Primaria (Código, Números):**
- `Geist Mono` (Sistema Vercel)
- Fallback: `Courier New`, monospace

**Secundaria (Texto, UI):**
- `Geist` (Sistema Vercel)
- Fallback: `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif

```css
/* En next.config.mjs */
import { Geist, Geist_Mono } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
```

### Escalas de Tamaño

| Nivel | Tamaño | Peso | Caso de Uso |
|-------|--------|------|------------|
| **H1** | 32px (2rem) | 700 Bold | Títulos página |
| **H2** | 24px (1.5rem) | 700 Bold | Secciones principales |
| **H3** | 20px (1.25rem) | 600 SemiBold | Subsecciones |
| **Body** | 16px (1rem) | 400 Regular | Párrafos, textos |
| **Small** | 14px (0.875rem) | 400 Regular | Textos secundarios |
| **Xs** | 12px (0.75rem) | 400 Regular | Labels, hints |

---

## 📏 Sistema de Espaciado

Basado en escala múltiplo de 4px:

```
0    = 0px
1    = 4px (xs)
2    = 8px (sm)
3    = 12px
4    = 16px (md) ← Estándar
6    = 24px (lg)
8    = 32px (xl)
12   = 48px (2xl)
16   = 64px (3xl)
```

**Aplicación:**
- Padding interno de componentes: `md` (16px)
- Gap entre elementos: `sm`-`md` (8-16px)
- Margin entre secciones: `xl`-`2xl` (32-48px)

---

## 🎛️ Componentes Base

### Button

**Variantes:**
```tsx
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="destructive">Delete</Button>
```

**Tamaños:**
```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
```

**Estados:**
- Default: Color base
- Hover: 10% más oscuro
- Focus: Ring azul (#0066FF)
- Disabled: 50% opacidad, cursor disabled
- Loading: Spinner animado

### Input

**Estructura:**
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="tu@email.com"
    aria-label="Email"
    aria-describedby="email-error"
  />
  <p id="email-error" className="text-sm text-destructive">
    {error}
  </p>
</div>
```

**Estados:**
- Default: Borde gris (#E5E7EB)
- Focus: Borde azul, shadow
- Error: Borde rojo (#EF4444)
- Disabled: Fondo gris, cursor disabled

### Modal/Dialog

**Estructura:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Abrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título Modal</DialogTitle>
      <DialogDescription>
        Descripción opcional
      </DialogDescription>
    </DialogHeader>
    {/* Contenido */}
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>Cancelar</Button>
      <Button variant="primary" onClick={handleConfirm}>
        Confirmar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Características:**
- Overlay: Negro con 85% opacidad
- Width: 90% en mobile, 600px máximo
- Cierre: ESC key, click overlay, botón X
- Focus trap: Foco dentro del modal

### Card

**Estructura:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenido principal */}
  </CardContent>
  <CardFooter>
    {/* Acciones */}
  </CardFooter>
</Card>
```

**Estilos:**
- Fondo: Blanco (#FFFFFF) / Dark (#1F2937)
- Border: 1px gris claro
- Border-radius: 8px
- Padding: 24px
- Shadow: Sutil (0 1px 3px rgba)

---

## 📱 Responsive Design

### Breakpoints Tailwind

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Mobile First

**Ejemplo:**
```tsx
// Defecto: Mobile (320px)
<div className="
  grid grid-cols-1 gap-4 p-4
  sm:grid-cols-2 sm:gap-6
  lg:grid-cols-3 lg:p-8
">
  {/* Items */}
</div>
```

### Touch & Interaction

- **Touch targets:** 44x44px mínimo
- **Padding:** 16px mínimo en bordes
- **Font size:** 16px mínimo en inputs (evita zoom iOS)
- **Double-tap:** Evitar delays innecesarios

---

## ♿ Accesibilidad (WCAG 2.1 AA)

### Contraste de Color

**Mínimos requeridos:**
- Texto normal: 4.5:1
- Texto grande (18px+): 3:1
- Componentes UI: 3:1

**Verificación:** Usar [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Navegación por Teclado

- `Tab` / `Shift+Tab`: Navegar
- `Enter`: Activar botones, links, enviar
- `Space`: Checkboxes, radio buttons, toggle
- `Esc`: Cerrar modales/menús
- `Arrow keys`: Navegar en listas/tabs

### Atributos ARIA Comunes

```tsx
/* Forms */
<input aria-label="Nombre completo" />
<input aria-required="true" />
<input aria-invalid={hasError} aria-describedby="error-id" />

/* Buttons */
<button aria-label="Cerrar menú">×</button>
<button aria-expanded={isOpen} aria-controls="menu">Menu</button>

/* Links */
<a href="/page" aria-label="Ir a página detalle">Ver más →</a>

/* Live regions */
<div aria-live="polite" aria-atomic="true">
  {notification}
</div>

/* Landmarks */
<header role="banner">...</header>
<nav aria-label="Principal">...</nav>
<main role="main">...</main>
<footer role="contentinfo">...</footer>
```

### Testing

- [ ] Axe DevTools: 0 errores críticos
- [ ] Keyboard navigation: Todo funciona sin mouse
- [ ] Screen reader: NVDA / JAWS / VoiceOver
- [ ] Color blindness: Evitar usar solo color
- [ ] Zoom: 200% sin cortes o overflow

---

## 🌙 Modo Oscuro

### CSS Variables

```css
/* Light mode (default) */
:root {
  --background: #F4F4F5;
  --foreground: #000000;
  --primary: #E2DB93;
  --border: #E5E7EB;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0A0A0A;
    --foreground: #F9FAFB;
    --primary: #E2DB93;
    --border: #2D3748;
  }
}
```

### Uso en Componentes

```tsx
// Automático con Tailwind dark mode
<div className="bg-white dark:bg-slate-900">
  Contenido
</div>
```

---

## 🎬 Animaciones

### Principios

- Duración: 150-300ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Movimiento intencional, no excesivo

### Transiciones Comunes

```css
/* Hover */
.button:hover {
  transition: background-color 150ms ease-out;
}

/* Dialog entrada */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.dialog-content {
  animation: slideIn 300ms ease-out;
}
```

---

## 📊 Colores para Gráficos

```css
--chart-1: #0066FF;  /* Azul */
--chart-2: #10B981;  /* Verde */
--chart-3: #F59E0B;  /* Ámbar */
--chart-4: #EF4444;  /* Rojo */
--chart-5: #8B5CF6;  /* Púrpura */
```

---

## 🚀 Checklist de Implementación

- [ ] Todos los componentes base creados
- [ ] Contraste verificado (axe DevTools)
- [ ] Navegación por teclado 100% funcional
- [ ] ARIA labels completos
- [ ] Responsive 320px - 2560px
- [ ] Modo oscuro funcional
- [ ] Animaciones suave
- [ ] Lighthouse score >90
- [ ] Documentación actualizada

---

**Estado:** ✅ En Producción  
**Próxima Revisión:** 1 de Mayo de 2026

**Línea (Line-height):**
- Títulos: 1.2
- Body: 1.5
- Small: 1.4

---

## 📦 Espaciado

**Sistema base: 4px**

```
xs: 4px (0.25rem)
sm: 8px (0.5rem)
md: 16px (1rem)
lg: 24px (1.5rem)
xl: 32px (2rem)
2xl: 48px (3rem)
3xl: 64px (4rem)
```

**Ejemplos:**
```tsx
{/* Padding */}
<div className="p-4">16px padding</div>
<div className="px-6 py-4">24px horizontal, 16px vertical</div>

{/* Margin */}
<div className="mb-8">32px margin-bottom</div>
```

---

## 🔲 Componentes Base

### Button

**Variantes:**

```tsx
// Primaria
<button className="bg-blue-600 text-white px-6 py-3 rounded-lg">
  Acción Principal
</button>

// Secundaria
<button className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg">
  Acción Secundaria
</button>

// Peligro
<button className="bg-red-600 text-white px-6 py-3 rounded-lg">
  Eliminar
</button>

// Deshabilitado
<button disabled className="opacity-50 cursor-not-allowed">
  Deshabilitado
</button>
```

**Estados:**
- `:hover` - Más oscuro
- `:active` - Presionado
- `:disabled` - Opacity 50%
- `:focus-visible` - Ring outline

### Input

```tsx
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">
    Email
  </label>
  <input
    type="email"
    className="
      w-full
      px-4 py-2
      border border-gray-300
      rounded-lg
      focus:outline-none focus:ring-2 focus:ring-blue-500
    "
    placeholder="tu@email.com"
  />
</div>
```

### Card

```tsx
<div className="bg-white rounded-lg shadow p-6 dark:bg-slate-800">
  <h3 className="text-lg font-semibold mb-2">Título</h3>
  <p className="text-gray-600">Contenido</p>
</div>
```

---

## 🖼️ Logos y Branding

### Logo RENRI

**Variantes:**
- Horizontal: Logo + Texto (para headers)
- Vertical: Logo sobre texto (para sidebars)
- Icon: Solo ícono (para favicon)

```tsx
// src/components/renri-mark.tsx
import { RenriMark } from "@/components/renri-mark";

<RenriMark variant="horizontal" size="lg" />
<RenriMark variant="vertical" size="md" />
<RenriMark variant="icon" size="sm" />
```

**Espaciado mínimo alrededor del logo:** 16px

**Tamaños:**
- Grande: 48px de alto
- Mediano: 32px de alto
- Pequeño: 24px de alto

---

## 🎬 Animaciones

### Velocidades Recomendadas

```css
--transition-fast: 150ms;   /* Hover, Click */
--transition-normal: 300ms; /* Modales, Overlays */
--transition-slow: 500ms;   /* Transiciones importantes */
```

### Ejemplos

```tsx
// Fade in
<div className="animate-in fade-in duration-300">
  Contenido
</div>

// Slide up
<div className="animate-in slide-in-from-bottom-4 duration-300">
  Modal
</div>

// Spin (loader)
<div className="animate-spin">
  <LoaderIcon />
</div>
```

---

## ♿ Accesibilidad en Marca

- ✅ Contraste mínimo 4.5:1
- ✅ Colores significativos (no solo color para info)
- ✅ Navegación lógica
- ✅ Tamaños de texto legibles (mín 16px)
- ✅ Espaciado suficiente para usuarios con motricidad limitada

---

## 📋 Checklist de Consistencia

- [ ] Colores: Solo usar paleta definida
- [ ] Tipografía: Solo Geist y Geist Mono
- [ ] Espaciado: Múltiplos de 4px
- [ ] Componentes: Usar botones, inputs y cards estándar
- [ ] Animaciones: <500ms, smooth
- [ ] Logos: Respetar espaciado mínimo
- [ ] Tema: Modo claro y oscuro disponible
- [ ] Iconografía: Lucide React (coherencia)

---

## 🎨 Ejemplos de Layouts

### Header
```tsx
<header className="bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <RenriMark variant="horizontal" size="md" />
    <nav className="flex gap-6">
      <a href="/">Inicio</a>
      <a href="/pricing">Precios</a>
    </nav>
  </div>
</header>
```

### Hero
```tsx
<section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-24">
  <div className="max-w-7xl mx-auto px-6 text-center">
    <h1 className="text-4xl font-bold mb-4">
      Gestiona tu negocio fácilmente
    </h1>
    <p className="text-lg opacity-90 mb-8">
      Sistema completo para citas, pagos e inventario
    </p>
    <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold">
      Empezar Gratis
    </button>
  </div>
</section>
```

### Dashboard Card
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-gray-600">Citas Hoy</h3>
      <CalendarIcon className="text-blue-600" />
    </div>
    <p className="text-3xl font-bold">24</p>
    <p className="text-sm text-gray-500 mt-2">+4 desde ayer</p>
  </div>
</div>
```

---

## 📞 Contacto para Marca

Para consultas sobre uso de marca:
- Email: brand@renri.dev
- Sitio: https://brand.renri.dev

---

**Última revisión:** 25 de Abril de 2026  
**Próxima revisión:** 1 de Julio de 2026
