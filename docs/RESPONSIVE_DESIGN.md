# 📱 Guía de Responsive Design - RENRI

**Versión:** 1.0  
**Fecha:** 26 de Abril de 2026  
**Standard:** Mobile-First, WCAG 2.1 AA

---

## 🎯 Objetivo

Garantizar que RENRI funcione perfectamente en:
- 📱 Mobile: 320px - 639px
- 📱 Tablet: 640px - 1023px
- 💻 Desktop: 1024px+

---

## 📐 Breakpoints Tailwind

```javascript
// tailwind.config.ts
{
  theme: {
    screens: {
      'sm': '640px',   // Tablet pequeño
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop pequeño
      'xl': '1280px',  // Desktop
      '2xl': '1536px', // Desktop grande
    }
  }
}
```

### Uso en Componentes

```tsx
// Mobile-first (default)
<div className="
  text-base              // Mobile: 16px
  sm:text-lg             // Tablet: 18px
  lg:text-xl             // Desktop: 20px
  
  w-full                 // Mobile: 100%
  sm:w-1/2               // Tablet: 50%
  lg:w-1/3               // Desktop: 33%
  
  p-4                    // Mobile: 16px padding
  sm:p-6                 // Tablet: 24px padding
  lg:p-8                 // Desktop: 32px padding
">
  Contenido responsivo
</div>
```

---

## 📱 Mobile-First Principles

### 1. Empezar Simple

```tsx
// ❌ INCORRECTO: Desktop primero
<div className="grid grid-cols-3 md:grid-cols-1">
  {/* Items */}
</div>

// ✅ CORRECTO: Mobile primero
<div className="grid grid-cols-1 md:grid-cols-3">
  {/* Items */}
</div>
```

### 2. Progresiva Enhancement

```tsx
// Mobile: interfaz simple, sin complejidad
<div className="space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Tablet: más columnas
// Desktop: layout complejo con sidebar
```

### 3. Touch-Friendly (Mobile)

```tsx
// Touch targets: mínimo 44x44px
<button className="h-11 w-11 px-4 py-3">
  {/* 44x44px mínimo */}
</button>

// Padding adecuado
<div className="p-4 sm:p-6 lg:p-8">
  {/* Más padding en mobile para evitar accidentes */}
</div>

// Fuente legible
<input className="text-base sm:text-sm" />
{/* 16px en mobile (evita zoom en iOS) */}
```

---

## 🖼️ Imágenes Responsivas

### Usando next/image

```tsx
// Automáticamente optimizado
<Image
  src="/product.jpg"
  alt="Producto"
  width={800}
  height={600}
  // sizes: especifica el ancho esperado en cada breakpoint
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  // Esto significa:
  // - Mobile: 100% del viewport width
  // - Tablet: 50% del viewport width
  // - Desktop: 33% del viewport width
/>
```

### Imagen Responsiva con Picture

```tsx
<picture>
  <source media="(max-width: 640px)" srcSet="/image-mobile.jpg" />
  <source media="(max-width: 1024px)" srcSet="/image-tablet.jpg" />
  <img
    src="/image-desktop.jpg"
    alt="Descripción"
    className="w-full"
  />
</picture>
```

---

## 📏 Layouts Responsivos Comunes

### Grid Responsivo

```tsx
// De 1 columna (mobile) a 3 columnas (desktop)
<ResponsiveGrid
  cols={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap="md"
>
  {items.map(item => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</ResponsiveGrid>
```

### Sidebar Layout

```tsx
// Mobile: stack vertical
// Desktop: sidebar + main content
<div className="
  flex flex-col
  lg:flex-row
  gap-6
">
  {/* Sidebar: full-width en mobile, fixed en desktop */}
  <aside className="w-full lg:w-64 flex-shrink-0">
    <nav>{/* Navigation */}</nav>
  </aside>

  {/* Main content: full-width en mobile, flex en desktop */}
  <main className="flex-1 min-w-0">
    {/* Content */}
  </main>
</div>
```

### Stack Responsivo

```tsx
// Mobile: vertical (items apilados)
// Tablet: horizontal
// Desktop: horizontal con más gap
<ResponsiveStack
  direction={{
    mobile: 'vertical',
    tablet: 'horizontal',
    desktop: 'horizontal',
  }}
  gap="md"
>
  <Button>Acción 1</Button>
  <Button>Acción 2</Button>
</ResponsiveStack>
```

---

## 📱 Patrones Mobile Específicos

### Hamburger Menu

```tsx
// Solo visible en mobile
<MobileNavigation
  items={navItems}
  brand={<Logo />}
/>

// Se oculta automáticamente en md y arriba
// className="md:hidden"
```

### Bottom Sheet (Mobile)

```tsx
// Filtros/Acciones en mobile como drawer inferior
<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Filtrar"
>
  {/* Filtros */}
</BottomSheet>

// En desktop: modal o sidebar
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  {/* Filtros */}
</Dialog>
```

### Touch Actions

```tsx
// Evitar hover solo en desktop
<button className="
  active:scale-95              // Feedback táctil inmediato
  hover:bg-gray-100            // Hover solo en desktop (mouse)
  active:bg-gray-100           // Active en mobile (touch)
  transition-transform
">
  Tap Me
</button>

// Grupo de botones
<div className="
  flex gap-2
  flex-wrap lg:flex-nowrap     // Wrapping en mobile
">
  {buttons}
</div>
```

---

## 🎨 Tipografía Responsiva

```tsx
// Escala de tipo responsiva
<h1 className="
  text-2xl sm:text-3xl lg:text-4xl
  font-bold
  leading-tight
  mb-4
">
  Título
</h1>

<p className="
  text-base sm:text-base lg:text-lg
  leading-relaxed
  text-gray-600
">
  Párrafo
</p>

// Input: mínimo 16px en mobile (evita zoom iOS)
<input className="text-base sm:text-sm" />
```

---

## 🎬 Testing Responsive

### Tamaños a Verificar

```
320px  → iPhone SE
375px  → iPhone 12
425px  → iPhone XL / Samsung
768px  → iPad
1024px → iPad Pro / Desktop
1440px → Desktop grande
```

### Chrome DevTools

1. F12 → Toggle device toolbar
2. Cambiar dispositivos predefinidos
3. Ir a diferentes breakpoints
4. Verificar que no hay overflow
5. Verificar que el touch es fácil (44x44px)

### Manual Testing

```bash
# Verificar en navegadores reales
- iPhone / Android físico
- iPad / Tablet
- Diferentes navegadores (Chrome, Safari, Firefox)
- Orientación portrait y landscape
- Zoom 200%
```

### Automated Testing

```typescript
// Cypress E2E test
describe('Responsive Layout', () => {
  it('should display mobile menu on small screens', () => {
    cy.viewport(375, 667);
    cy.get('[aria-label="Abrir menú"]').should('be.visible');
    cy.get('nav').should('have.class', 'md:hidden');
  });

  it('should display desktop nav on large screens', () => {
    cy.viewport(1280, 720);
    cy.get('[aria-label="Abrir menú"]').should('not.be.visible');
    cy.get('nav').should('not.have.class', 'md:hidden');
  });
});
```

---

## 🖥️ Orientación y Viewport

### Bloquear Orientación (si es necesario)

```tsx
// Para apps específicas (rara vez)
// manifest.json
{
  "orientation": "portrait-primary"
}
```

### Evitar Zoom Accidental

```html
<!-- En head -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=yes"
/>
```

---

## 🚀 Performance en Mobile

### Reducir Transferencia de Datos

```tsx
// Imágenes optimizadas
<Image
  src="/large-image.jpg"
  alt="Description"
  quality={75}           // Reducir calidad en mobile
  priority={false}       // Lazy load por defecto
/>

// JavaScript: Code splitting
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Skeleton />,
});
```

### Evitar Jank (Layout Shift)

```tsx
// Reservar espacio para imágenes
<div className="relative w-full pt-[66.67%]">
  {/* 16:9 aspect ratio container */}
  <Image
    src="/video-thumbnail.jpg"
    alt="Thumbnail"
    fill
    className="absolute inset-0"
  />
</div>
```

---

## ✅ Checklist de Responsive Design

- [ ] Mobile: 320px - funciona sin scroll horizontal
- [ ] Tablet: 768px - todo legible
- [ ] Desktop: 1024px+ - layout óptimo
- [ ] Touch targets: 44x44px mínimo
- [ ] Imagen con next/image
- [ ] Fuente: 16px mínimo en inputs
- [ ] Padding responsive (4, 6, 8)
- [ ] Contraste suficiente (mobile + tablet)
- [ ] Lighthouse Mobile: >90
- [ ] Lighthouse Desktop: >90
- [ ] Tested en dispositivos reales
- [ ] Tested con zoom 200%
- [ ] Performance: <3s en 4G

---

## 🔗 Recursos

- [MDN: Responsive Web Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Mobile-First Strategy](https://www.nngroup.com/articles/mobile-first-web-design/)
- [Touch Target Guidelines](https://www.smashingmagazine.com/2022/09/inline-display-elements-click-touch-targets/)

---

**Estado:** ✅ En Producción  
**Próxima Revisión:** 1 de Mayo de 2026
