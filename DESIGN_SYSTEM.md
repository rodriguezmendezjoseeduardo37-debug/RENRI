# RENRI — Sistema de Diseño Global v1.0

> Referencia definitiva del lenguaje visual de RENRI.
> Usar este documento como fuente de verdad para aplicar el diseño a cualquier elemento nuevo del sistema.

---

## 1. PALETA DE COLORES

### Color Primario (Brand)
| Token               | Valor       | Uso                                              |
|----------------------|-------------|--------------------------------------------------|
| **Neon Cyan**        | `#12b4ff`   | Botones primarios, íconos activos, acentos, glow |
| **Neon Cyan Hover**  | `#00a0e6`   | Estado hover de botones primarios                 |
| **Neon Cyan Glow**   | `rgba(18,180,255,0.2)` | Sombra luminosa en botones e íconos      |
| **Neon Cyan Subtle** | `rgba(18,180,255,0.1)` | Glow más tenue para fondos y bordes      |

### Colores de Íconos (Sidebar y Tarjetas)
| Módulo         | Clase Tailwind         | Descripción             |
|----------------|------------------------|-------------------------|
| Inicio         | `text-[#12b4ff]`       | Cian Neón (brand)       |
| Citas          | `text-[#12b4ff]`       | Cian Neón (brand)       |
| Servicios      | `text-purple-500`      | Morado                  |
| Horarios       | `text-rose-500`        | Rosa/Rojo               |
| Pagos          | `text-[#10b981]`       | Verde Esmeralda         |
| Clientes       | `text-amber-500`       | Ámbar/Naranja           |
| Reportes       | `text-indigo-500`      | Índigo/Azul oscuro      |
| Configuración  | `text-zinc-400`        | Gris neutro             |
| Inventario     | `text-purple-500`      | Morado                  |
| Pedidos        | `text-rose-500`        | Rosa/Rojo               |
| Enlazar        | `text-indigo-500`      | Índigo                  |
| Disponibilidad | `text-rose-500`        | Rosa/Rojo               |

### Colores Semánticos (vía CSS Variables)
| Variable           | Tema Oscuro    | Tema Claro     | Uso                        |
|--------------------|----------------|----------------|----------------------------|
| `--background`     | `#0a0a0f`      | `#ffffff`      | Fondo global               |
| `--foreground`     | `#fafafa`      | `#0a0a0a`      | Texto principal             |
| `--card`           | `#131318`      | `#ffffff`      | Fondo de tarjetas           |
| `--border`         | `hsla(...)/10`  | `hsla(...)/15`  | Bordes sutiles              |
| `--muted-foreground` | Gris medio   | Gris medio     | Texto secundario            |
| `--accent`         | Gris oscuro    | Gris claro     | Fondos de hover/active      |

---

## 2. TIPOGRAFÍA

| Elemento            | Font Family                           | Peso       | Tracking           | Tamaño          |
|---------------------|---------------------------------------|------------|---------------------|-----------------|
| Títulos Hero        | `var(--font-heading)` (Space Grotesk) | `bold`     | `tracking-[0.05em]` | `text-5xl md:text-7xl` |
| Subtítulos          | `var(--font-heading)`                 | `bold`     | `tracking-[0.05em]` | `text-2xl`      |
| Labels/Etiquetas    | `var(--font-body)` (Inter/Geist)      | `bold`     | `tracking-[0.3em]`  | `text-[10px]-text-[11px]` |
| Cuerpo              | `var(--font-body)`                    | `medium`   | `normal`            | `text-sm`       |
| Stats (números)     | `var(--font-body)`                    | `bold`     | `tracking-tight`    | `text-3xl md:text-4xl` |
| Nav Sidebar         | `var(--font-body)`                    | `medium`   | `tracking-[0.15em]` | `text-[11px]-text-[12px]` |
| Monoespaciado (IDs) | `font-mono`                           | `normal`   | —                   | `text-xs`       |

### Reglas de Texto
- Labels siempre en **UPPERCASE** (`uppercase`)
- Tracking ancho en labels: `tracking-[0.2em]` a `tracking-[0.3em]`
- Color de labels: `text-muted-foreground`
- Color de títulos: `text-foreground`

---

## 3. COMPONENTES

### 3.1 Tarjetas (Cards)
```
Fondo:      bg-card
Bordes:     ring-1 ring-border     (NO usar "border border-border")
Radio:      rounded-2xl
Sombra:     shadow-sm
Padding:    p-6 o p-8
```

**Clase completa:**
```html
<div className="bg-card rounded-2xl ring-1 ring-border shadow-sm p-6">
```

**Hover interactivo (si es clickeable):**
```html
<div className="bg-card rounded-2xl ring-1 ring-border shadow-sm p-6 hover:ring-border/80 transition-all">
```

**Hover con destello neón (links/acciones):**
```html
<div className="bg-card ring-1 ring-border hover:ring-[#12b4ff] hover:shadow-[0_0_20px_rgba(18,180,255,0.1)] transition-all rounded-2xl shadow-sm p-6">
```

---

### 3.2 Wide Stats Card (Tarjeta de Estadísticas Horizontal)
```html
<div className="bg-card rounded-2xl ring-1 ring-border p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between shadow-sm gap-6 xl:gap-0">
  
  <!-- Stat Item -->
  <div className="flex-1 w-full">
    <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">{valor}</span>
    <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">Etiqueta / Sub</span>
  </div>
  
  <!-- Separador Vertical -->
  <div className="hidden xl:block w-px h-12 bg-border mx-6"></div>
  
  <!-- Siguiente stat con separador móvil -->
  <div className="flex-1 w-full border-t border-border pt-4 xl:border-0 xl:pt-0">
    <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">{valor}</span>
    <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">Etiqueta / Sub</span>
  </div>
</div>
```

---

### 3.3 Cajas de Íconos (Icon Boxes)

**Estado normal (en tarjetas de contenido):**
```html
<div className="w-10 h-10 rounded-xl bg-foreground/5 ring-1 ring-foreground/10 flex items-center justify-center">
  <Icon className="w-5 h-5 text-[#12b4ff]" />
</div>
```

**Con hover interactivo (en links/acciones):**
```html
<div className="w-12 h-12 flex items-center justify-center bg-foreground/5 ring-1 ring-foreground/10 text-[#12b4ff] group-hover:bg-[#12b4ff] group-hover:text-black group-hover:shadow-[0_0_20px_rgba(18,180,255,0.2)] transition-all rounded-xl">
  <Icon className="w-5 h-5" />
</div>
```

---

### 3.4 Botones

**Botón Primario (Neon Cyan sólido):**
```html
<button className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-[#12b4ff] text-black rounded-xl hover:bg-[#00a0e6] shadow-[0_0_20px_rgba(18,180,255,0.2)] transition-all">
  ACCIÓN
</button>
```

**Botón Secundario (Outline con glow hover):**
```html
<button className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-border text-muted-foreground rounded-xl hover:text-foreground hover:border-[#12b4ff] transition-all">
  ACCIÓN
</button>
```

**Botón con estilo "Volver" (backdrop blur):**
```html
<button className="flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-md border border-border text-[10px] font-bold tracking-[0.2em] text-foreground hover:bg-[#12b4ff] hover:text-black shadow-[0_0_20px_rgba(18,180,255,0)] hover:shadow-[0_0_20px_rgba(18,180,255,0.2)] hover:border-[#12b4ff] uppercase transition-all rounded-xl">
  VOLVER
</button>
```

---

### 3.5 Sidebar de Navegación

**Contenedor:**
```
Ancho:    w-[240px] (dashboard) / w-[220px] (cliente)
Posición: fixed left-0 top-0 bottom-0
Fondo:    bg-card (dashboard) / glass-panel (cliente)
Borde:    border-r border-border
```

**Item de Nav (dashboard — activo):**
```html
<a className="flex items-center h-[42px] px-4 mx-4 mb-1 gap-4 rounded-xl bg-accent/60 ring-1 ring-border text-foreground shadow-sm">
  <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.8} />
  <span className="text-[12px] font-medium tracking-wide">LABEL</span>
</a>
```

**Item de Nav (dashboard — inactivo con color de ícono):**
```html
<a className="flex items-center h-[42px] px-4 mx-4 mb-1 gap-4 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/30">
  <Icon className="h-[18px] w-[18px] text-[COLOR_DEL_ICONO]" strokeWidth={1.8} />
  <span className="text-[12px] font-medium tracking-wide">LABEL</span>
</a>
```

**Item de Nav (cliente — activo):**
```html
<a className="flex items-center h-11 px-4 gap-3 rounded-xl text-black bg-[#12b4ff] shadow-[0_0_20px_rgba(18,180,255,0.2)] font-bold">
  <Icon className="h-4 w-4 text-black" strokeWidth={1.5} />
  <span className="text-[11px] font-medium tracking-[0.15em]">LABEL</span>
</a>
```

---

### 3.6 Tablas

**Contenedor:**
```html
<div className="bg-card rounded-2xl ring-1 ring-border shadow-sm overflow-hidden">
```

**Encabezado:**
```html
<div className="grid grid-cols-4 gap-4 px-8 py-5 border-b border-border text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
```

**Fila:**
```html
<div className="grid grid-cols-4 gap-4 px-8 py-5 border-b border-border items-center hover:bg-accent/30 transition-colors">
  <div className="text-foreground text-[13px] font-medium">Nombre</div>
  <div className="text-muted-foreground text-[13px]">Descripción</div>
  <div className="text-muted-foreground text-[13px]">10:00 AM</div>
  <div className="text-[#10b981] text-[13px] font-medium">Completado</div>
</div>
```

**Estados de color en tablas:**
- Completado/Éxito: `text-[#10b981]` o `text-primary`
- En espera/Pendiente: `text-amber-500`
- Error/Cancelado: `text-destructive`

---

### 3.7 Separador con Texto (para formularios auth)

```html
<div className="relative py-2">
  <Separator className="bg-white/5" />
  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[13px] text-white/40">
    o con email
  </span>
</div>
```

---

### 3.8 Redes Sociales (Botones cuadrados)

```html
<a className="w-10 h-10 flex items-center justify-center bg-background border border-border hover:border-[#12b4ff] hover:bg-[#12b4ff] hover:shadow-[0_0_20px_rgba(18,180,255,0.2)] hover:text-black transition-all rounded-xl">
  <Icon className="w-4 h-4" />
</a>
```

---

## 4. FONDO GLOBAL (Grid Pattern)

El fondo de malla geométrica está inyectado en `src/app/layout.tsx` (root) y se muestra en **todas** las páginas.

```html
<!-- Dentro del <body> en layout.tsx -->
<div
  aria-hidden="true"
  className="pointer-events-none fixed inset-0 z-0"
  style={{
    backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.03) 1px, transparent 1px)`,
    backgroundSize: '60px 60px',
  }}
/>
```

### Reglas del Grid
- Todos los layouts de página deben tener `bg-transparent` (no `bg-background`) para que se vea el grid
- El grid ya se adapta automáticamente al tema (claro/oscuro) gracias a `hsl(var(--foreground) / 0.03)`
- **NO duplicar** el grid en páginas individuales; ya está en el root

---

## 5. TEMAS (Claro / Oscuro)

El sistema soporta **modo claro** y **modo oscuro** automáticamente (detecta `prefers-color-scheme` del navegador).

### Reglas para compatibilidad dual
- Nunca usar colores hardcodeados para fondos o texto principal (usar variables CSS: `bg-card`, `text-foreground`, etc.)
- Los colores fijos permitidos: `#12b4ff`, `#10b981`, y colores de Tailwind como `amber-500`, `purple-500`, etc.
- El glow shadow `rgba(18,180,255,0.2)` funciona bien en ambos temas

---

## 6. LAYOUT GENERAL

### Página con Sidebar (Dashboard / Cliente)
```
┌─────────┬────────────────────────────────────────┐
│ Sidebar │  Topbar                                │
│ 240px   ├────────────────────────────────────────┤
│         │                                        │
│ fixed   │  main content                         │
│ left    │  padding: p-4 md:px-6                 │
│         │                                        │
│         │  ┌──────────────────────────────────┐  │
│         │  │  Wide Stats Card                 │  │
│         │  └──────────────────────────────────┘  │
│         │                                        │
│         │  ┌────────┐ ┌────────┐ ┌────────┐     │
│         │  │ Card 1 │ │ Card 2 │ │ Card 3 │     │
│         │  └────────┘ └────────┘ └────────┘     │
│         │                                        │
│         │  ┌──────────────────────────────────┐  │
│         │  │  Table                           │  │
│         │  └──────────────────────────────────┘  │
└─────────┴────────────────────────────────────────┘
```

### Greeting Header (en todos los dashboards)
```html
<div>
  <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)]">
    BUENAS TARDES, JOSE
  </h1>
  <p className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
    RESUMEN DEL DIA · MARTES, 16 DE JUNIO DE 2026
  </p>
</div>
```

---

## 7. EFECTOS Y TRANSICIONES

| Efecto                  | Clase                                                      |
|-------------------------|------------------------------------------------------------|
| Glow Neón               | `shadow-[0_0_20px_rgba(18,180,255,0.2)]`                  |
| Glow Sutil              | `shadow-[0_0_20px_rgba(18,180,255,0.1)]`                  |
| Transición general      | `transition-all` (preferir sobre `transition-colors`)      |
| Hover en tarjetas       | `hover:ring-border/80` o `hover:ring-[#12b4ff]`           |
| Hover en botones        | `hover:bg-[#00a0e6]` (primarios) / `hover:border-[#12b4ff]` (outline) |
| Backdrop blur            | `bg-background/50 backdrop-blur-md`                        |
| Duración sidebar items  | `duration-200`                                             |

---

## 8. ESPACIADO ESTÁNDAR

| Contexto               | Clase                        |
|------------------------|------------------------------|
| Entre secciones        | `space-y-8` o `space-y-10`   |
| Entre tarjetas (grid)  | `gap-4` o `gap-6`            |
| Padding de tarjetas    | `p-6` (compacto) o `p-8` (amplio) |
| Margen del contenido   | `md:px-6 md:pt-4 md:pb-8`   |
| Radio de esquinas      | `rounded-xl` (botones/íconos) o `rounded-2xl` (tarjetas) |

---

## 9. RESUMEN RÁPIDO — CHECKLIST PARA NUEVOS COMPONENTES

Al crear cualquier elemento nuevo, verificar:

- [ ] ¿Usa `bg-card` + `ring-1 ring-border` + `rounded-2xl` + `shadow-sm`?
- [ ] ¿Los botones primarios son `bg-[#12b4ff] text-black` con glow shadow?
- [ ] ¿Los íconos tienen su color asignado (ver tabla de colores)?
- [ ] ¿Las cajas de íconos usan `bg-foreground/5 ring-1 ring-foreground/10`?
- [ ] ¿El texto usa variables CSS (`text-foreground`, `text-muted-foreground`)?
- [ ] ¿No se hardcodeó un fondo opaco que tape el grid global?
- [ ] ¿Los labels están en `UPPERCASE` con tracking amplio?
- [ ] ¿Las transiciones usan `transition-all`?
- [ ] ¿Funciona en modo claro Y oscuro?

---

*Última actualización: 16 de Junio de 2026*
