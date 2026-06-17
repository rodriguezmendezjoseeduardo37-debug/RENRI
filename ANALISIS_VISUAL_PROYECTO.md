# 📊 Análisis Visual Completo del Proyecto RENRI

## 🎯 Resumen Ejecutivo

RENRI es una **plataforma de gestión para profesionales y PYMEs** que conecta:
- **Empresarios/Profesionales** que ofrecen servicios (citas, agenda, etc.)
- **Clientes** que reservan esos servicios
- **Sistema de pagos** integrado con Stripe
- **Portal público** para reservas sin autenticación

---

## 🗺️ Mapa de Navegación Completo

### 1️⃣ ACCESO PÚBLICO (Sin Login)

#### Página de Inicio
- **URL:** `/`
- **Contenido:** Landing page, hero, features, CTA
- **Navegación hacia:**
  - `/login` (Ingresar)
  - `/register` (Crear cuenta)
  - `/pricing` (Ver precios)
  - `/privacidad` (Política privacidad)
  - `/terminos` (Términos de servicio)
  - `/portal` (Sistema de reservas público)

#### Precios
- **URL:** `/pricing`
- **Contenido:** Planes y precios
- **CTA:** "Empezar" → `/register`

#### Legal
- **URL:** `/privacidad`
- **URL:** `/terminos`
- **Contenido:** Documentos legales

#### Portal Público de Reservas
- **URL:** `/portal`
- **Subrutas:**
  - `/portal/[tenantSlug]` - Vista pública del negocio específico
  - `/portal/reserva` - Detalle de reserva
  - `/portal/cancel` - Cancelar reserva

**Flujo:** 
1. Cliente accede a `/portal/[nombreNegocio]`
2. Ve servicios y horarios disponibles
3. Selecciona horario → Formulario de datos
4. Paga con Stripe (opcional)
5. Confirmación de cita

---

### 2️⃣ AUTENTICACIÓN

#### Login
- **URL:** `/login`
- **Funcionalidad:**
  - Email + Contraseña
  - OAuth (GitHub, Google)
  - Redirige según rol después del login
  
#### Registro
- **URL:** `/register`
- **Funcionalidad:**
  - Crear cuenta nueva
  - Seleccionar rol (Empresario/Cliente)

#### Error Authentication
- **URL:** `/auth/error`
- **Uso:** Mostrar errores de autenticación

---

### 3️⃣ DASHBOARD EMPRESARIO/PROFESIONAL

**URL Base:** `/dashboard`
**Acceso:** Solo usuarios con rol "EMPRESARIO"
**Usuarios logueados en `/login` sin rol CLIENT → redirigen aquí**

#### Menú Principal
```
Dashboard (/)
├── 📅 CITAS
├── 👤 CLIENTES
├── 💳 PAGOS
├── 📦 PEDIDOS
├── 🛠️ SERVICIOS
├── ⏰ HORARIOS
├── 📊 INVENTARIO
├── ⚙️ ADMIN
└── ⚙️ CONFIGURACIÓN
```

#### Subrutas Detalladas

**1. Citas** (`/dashboard/citas`)
- Listar todas las citas
- Crear cita manual
- Editar cita
- Ver detalles cita
- Cambiar estado (confirmada, cancelada, completada)
- Enviar recordatorios

**2. Clientes** (`/dashboard/clientes`)
- Listar todos los clientes
- Ver perfil cliente
- Historial de citas por cliente
- Información de contacto
- Crear cliente manual
- Editar datos cliente

**3. Pagos** (`/dashboard/pagos`)
- Ver todos los pagos recibidos
- Estado de pagos
- **Stripe Connect Integration**
  - Conectar cuenta Stripe
  - Ver ingresos
- **Payouts**
  - Historial de retiros
  - Solicitar nuevo payout
  - Ver estado de transferencias

**4. Pedidos** (`/dashboard/pedidos`)
- Crear pedido
- Listar pedidos
- Estado de órdenes
- Detalles de compra

**5. Servicios** (`/dashboard/servicios`)
- Crear servicio/prestación
- Listar servicios ofrecidos
- Editar descripción, precio, duración
- Eliminar servicio
- Categorizar servicios

**6. Horarios** (`/dashboard/horarios`)
- Definir horarios de atención
- Días y horas de trabajo
- Descansos y días libres
- Horarios especiales
- Sincronizar con Google Calendar


**8. Inventario** (`/dashboard/inventario`)
- Stock de productos/materiales
- Alertas de bajo inventario
- Crear producto
- Editar cantidades
- Historial de movimientos

**9. Admin** (`/dashboard/admin`)
- Panel administrativo
- Gestión de permisos
- Logs del sistema
- Configuración avanzada

**10. Configuración** (`/dashboard/configuracion`)
- Datos del negocio
- Información empresa
- Preferencias de notificaciones
- Integraciones
- Tema (claro/oscuro)
- Idioma

---

### 4️⃣ PORTAL DEL CLIENTE

**URL Base:** `/cliente`
**Acceso:** Solo usuarios con rol "CLIENT"
**Usuarios logueados con rol CLIENT → redirigen aquí automáticamente**

#### Subrutas

**1. Mis Citas** (`/cliente/mis-citas`)
- Listar todas mis citas
- Próximas citas
- Citas pasadas
- Cancelar cita
- Agendar nueva cita
- Ver detalles de cita

**2. Mis Pagos** (`/cliente/mis-pagos`)
- Historial de pagos realizados
- Estado de transacciones
- Recibos/Comprobantes
- Método de pago utilizado

**3. Mi Perfil** (`/cliente/perfil`)
- Ver datos personales
- Editar nombre, email, teléfono
- Cambiar contraseña
- Subir foto de perfil
- Preferencias de notificación

**4. Disponibilidad** (`/cliente/disponibilidad`)
- Ver horarios disponibles
- Preferencias de hora
- Bloques de tiempo preferidos

**5. Enlazar Negocio** (`/cliente/enlazar-negocio`)
- Conectarse con un negocio
- Código de invitación
- Aceptar invitación de empresario
- Ver mis negocio(s)

---

### 5️⃣ CHECKOUT Y PAGOS

**URL:** `/checkout`
**Funcionalidad:**
- Carrito de compra
- Resumen de orden
- Método de pago (Stripe)
- Confirmar y procesar pago
- Webhook para actualizar estado

---

### 6️⃣ NEGOCIO (Página Pública)

**URL:** `/negocio/[id]`
**Uso:** Página pública del perfil del negocio
- Vista de servicios
- Horarios
- Información de contacto
- Sistema de reservas integrado

---

## 🔄 Flujos de Usuario Clave

### Flujo 1: Empresario Crea Su Negocio

```
1. /register → Crear cuenta con rol "EMPRESARIO"
2. /dashboard → Bienvenida
3. /dashboard/servicios → Agregar servicios
4. /dashboard/horarios → Definir horarios
5. /dashboard/pagos → Conectar Stripe
6. ✅ Negocio listo para recibir citas
```

### Flujo 2: Cliente Reserva una Cita

```
Opción A: SIN LOGIN
1. /portal → Buscar negocio
2. /portal/[tenantSlug] → Ver disponibilidad
3. Seleccionar horario → Formulario
4. /checkout → Pagar
5. Confirmación de cita
6. Email con confirmación

Opción B: CON LOGIN
1. /cliente/mis-citas
2. Botón "Agendar Nueva"
3. Buscar negocio
4. Seleccionar horario
5. /checkout → Pagar
6. ✅ Cita confirmada
```

### Flujo 3: Cliente Cancela Cita

```
1. /cliente/mis-citas
2. Clic en cita
3. Botón "Cancelar"
4. Confirmar cancelación
5. ✅ Cita cancelada (reembolso automático si aplica)
```

### Flujo 4: Empresario Recibe Pago

```
1. Cliente paga en /checkout
2. Stripe procesa pago
3. Webhook actualiza estado en BD
4. /dashboard/pagos → Ver transacción
5. /dashboard/pagos → Solicitar payout
6. Stripe transfiere dinero a cuenta bancaria
```

---

## 🔐 Sistema de Autenticación y Roles

### NextAuth Configuration
- **Proveedores:** GitHub, Google, Email/Contraseña
- **Roles:** 
  - `EMPRESARIO` - Acceso a `/dashboard`
  - `CLIENT` - Acceso a `/cliente`
  - `ADMIN` - Acceso especial

### Middleware (src/middleware.ts)
```
POST /login → nextUrl?
├─ isLoggedIn? → /login → ¿role? 
│  ├─ CLIENT → /cliente/mis-citas
│  └─ EMPRESARIO → /dashboard
├─ NOT loggedIn → / (home)
└─ [PUBLIC] → /login, /register, /auth/error, /, /portal
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15** - Framework React
- **TypeScript** - Tipado
- **Tailwind CSS** - Estilos
- **Radix UI** - Componentes accesibles
- **React Hook Form** - Formularios
- **Sonner** - Notificaciones

### Backend/Database
- **Supabase** - PostgreSQL + RLS
- **Drizzle ORM** - Migrations y queries
- **NextAuth** - Autenticación

### Pagos
- **Stripe** - Procesamiento pagos
- **Stripe Connect** - Cuentas de terceros
- **Webhooks** - Sincronización

### Testing
- **Vitest** - Unit tests
- **Playwright** - E2E tests

### Deployment
- **Vercel** - Hosting

---

## 📐 Estructura de Carpetas

```
src/
├── app/                    # Rutas Next.js
│   ├── (auth)/            # Grupo autenticación
│   ├── dashboard/         # Panel empresario
│   ├── cliente/           # Portal cliente
│   ├── portal/            # Sistema público reservas
│   ├── api/               # Endpoints API
│   ├── checkout/          # Checkout page
│   ├── pricing/           # Precios
│   └── page.tsx          # Home
├── components/            # Componentes React
│   ├── dashboard/         # Componentes dashboard
│   ├── auth/             # Componentes auth
│   ├── ui/               # Componentes UI
│   └── public/           # Componentes públicos
├── actions/              # Server actions
├── db/                   # Base de datos
├── hooks/                # React hooks
├── lib/                  # Utilidades
├── types/                # Tipos TypeScript
└── auth.ts              # NextAuth config
```

---

## 💳 Integración Stripe

### Flujo de Pagos

```
Cliente → Checkout (/checkout)
         ↓
    Stripe Form
    (Card details)
         ↓
    Procesar Pago
         ↓
    Webhook Stripe
    (payment_intent.succeeded)
         ↓
    Actualizar BD
    (order status → paid)
         ↓
    Dashboard Empresario
    (Ver pago en /dashboard/pagos)
         ↓
    Solicitar Payout
         ↓
    Stripe Transfiere
    a Cuenta Bancaria
```

---

## 🔐 Row Level Security (RLS)

**Archivo:** `supabase/rls-policies.sql`

Las políticas RLS aseguran:
- Cliente solo ve SUS citas
- Empresario solo ve citas de SU negocio
- Nadie puede acceder datos de otros usuarios
- Datos sensibles protegidos a nivel BD

---

## 📊 Métricas del Proyecto

| Aspecto | Detalle |
|---------|---------|
| **Rutas Públicas** | 5+ (/, /pricing, /portal, etc.) |
| **Rutas Autenticadas** | 30+ (dashboard + cliente) |
| **Módulos Dashboard** | 10 secciones principales |
| **Integraciones** | Stripe, Supabase, NextAuth |
| **Roles de Usuario** | 2 (Empresario, Cliente) |
| **Tipos de Citas** | Ilimitadas (configurable) |

---

## 🎨 Paleta de Colores UI

| Color | Uso |
|-------|-----|
| 🟣 Purpura (`#4f46e5`) | Marca, hero, CTAs principales |
| 🟢 Verde (`#10b981`) | Dashboard, acciones positivas |
| 🔵 Azul (`#3b82f6`) | Cliente, información |
| 🟠 Naranja (`#f59e0b`) | Público, exploración |
| 🔴 Rojo (`#ef4444`) | Errores, cancelación |
| 🟡 Amarillo (`#eab308`) | Alertas, advertencias |

---

## 🚀 Próximos Pasos para Mejorar

1. **Analytics Dashboard** - Ver estadísticas de negocio
2. **Notificaciones Reales** - WebSockets para updates en vivo
3. **Integraciones Calendar** - Sync con Google/Outlook
4. **Mobile App** - Aplicación nativa
5. **Multilenguaje** - I18n (ES, EN, etc.)
6. **SMS/Email** - Recordatorios automáticos
7. **Reportes** - Exportar datos a Excel/PDF

---

## 📞 Información de Contacto Proyecto

- **Nombre:** RENRI
- **Lema:** "Gestión para Profesionistas"
- **URL:** renri.vercel.app
- **Stack:** Next.js 15 + TypeScript + Supabase + Stripe

---

**Último actualizado:** Abril 2026
