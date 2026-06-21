# 🌌 Mercav | Ecosistema Digital Latinoamericano

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-123a50?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-gold?style=for-the-badge)](#)

> **Mercav** es una plataforma integral de última generación diseñada para digitalizar, conectar y potenciar profesionales, empresas y anunciantes en toda Latinoamérica. Unifica un marketplace de publicidad exterior, un directorio de servicios freelance con sistema de escrow, una bolsa de empleo avanzada y una red social corporativa bajo una experiencia de usuario cinematográfica premium.

---

## 🎨 Filosofía de Diseño: "Seamless Cinematic Experience"

Mercav no es solo una herramienta, es una experiencia visual. Diseñado con una estética **Black & Gold**, combina:
- **Modo Oscuro Profundo (Deep Dark Mode)**: Interfaces de alto contraste y baja fatiga visual.
- **Glassmorphism**: Componentes translúcidos con desenfoque de fondo dinámico.
- **Micro-animaciones fluidas**: Desarrolladas con **Framer Motion** para transiciones suaves y naturales.
- **Tipografía moderna**: Jerarquías visuales limpias para una lectura óptima y un sentimiento exclusivo.

---

## 🚀 Módulos Principales de la Plataforma

| Módulo | Descripción | Características Clave |
| :--- | :--- | :--- |
| **📢 Mercav Ads (Spaces)** | Marketplace digital para publicidad exterior (Vallas, Pantallas LED, Totems). | • Búsqueda geográfica y filtros.<br>• Reserva en tiempo real.<br>• Visualización de impacto y alcance métrico. |
| **🛠️ Mercav Services** | Directorio de talentos freelance y agencias verificadas en Latinoamérica. | • Portafolios interactivos.<br>• Contratación directa segura.<br>• Calificaciones y reseñas auditadas. |
| **💼 Mercav Jobs** | Bolsa de trabajo moderna optimizada para reclutadores y aplicantes. | • Postulación ágil en un clic.<br>• Perfiles de empresas interactivos.<br>• Seguimiento de candidaturas en tiempo real. |
| **🤝 Mercav Comunidad** | Red social corporativa para networking y el movimiento *Build in Public*. | • Feed interactivo con soporte multimedia.<br>• Reacciones personalizadas.<br>• Mensajería directa fluida. |
| **🧰 Mercav Tools** | Suite de herramientas empresariales y utilidades premium para profesionales y negocios. | • Herramientas de productividad integradas.<br>• Plantillas y utilidades para empresas.<br>• Automatizaciones y soporte para flujos de trabajo. |


---

## 🗂️ Estructura y Arquitectura del Proyecto

El proyecto sigue las directrices del **App Router de Next.js**, separando de forma clara la lógica de servidor de la interactividad del cliente:

```bash
Mercav/
├── app/                    # Directorio raíz del App Router
│   ├── (auth)/             # Flujos de login, registro y recuperación de contraseña
│   ├── admin/              # Panel de administración, moderación y soporte
│   ├── anuncios/           # Vistas y flujos para el marketplace de publicidad exterior
│   ├── api/                # Endpoints de API REST (Backend en Next.js)
│   ├── buscar/             # Motor de búsqueda global unificado
│   ├── checkout/           # Integración y flujo de pasarela de pagos
│   ├── comunidad/          # Red social (Feeds, posts, interacciones)
│   ├── dashboard/          # Dashboards del cliente, pedidos y ventas
│   ├── empleos/            # Módulo de bolsa de empleo y postulaciones
│   ├── herramientas/       # Herramientas internas y utilidades premium
│   ├── mensajes/           # Módulo de chat en tiempo real y mensajería
│   ├── perfil/             # Configuración y visualización de perfiles
│   └── servicios/          # Directorio de profesionales freelance
├── components/             # Componentes de React reutilizables
│   ├── checkout/           # Componentes específicos de Stripe/pagos
│   ├── ui/                 # Componentes base y primitivas de UI (Shadcn modificados)
│   └── ...                 # Componentes organizados por dominio
├── lib/                    # Lógica común, clientes y utilidades
│   ├── prisma.ts           # Inicialización y cliente de Prisma ORM
│   ├── stripe.ts           # Integración con Stripe API
│   └── utils.ts            # Helper functions globales
├── prisma/                 # Modelos de base de datos
│   └── schema.prisma       # Esquema principal de la base de datos
├── public/                 # Recursos estáticos (Logotipos, imágenes, HTMLs estáticos)
└── package.json            # Dependencias del proyecto y scripts de ejecución
```

---

## 🛠️ Stack Tecnológico Completo

*   **Frontend**: React 18, Next.js 14, Framer Motion, Tailwind CSS, Lucide React (Iconos).
*   **Backend & APIs**: Next.js Server Actions, Route Handlers, Node.js.
*   **Base de Datos**: PostgreSQL / MySQL, persistencia gestionada mediante **Prisma ORM**.
*   **Autenticación**: NextAuth.js con soporte para correo/contraseña y OAuth.
*   **Pagos**: Stripe API (Soporte para tarjetas globales y flujos de cobro).

---

## 🚀 Guía de Configuración e Instalación Local

Sigue estos pasos para desplegar el entorno de desarrollo en tu máquina local:

### 1. Requisitos Previos
*   Node.js (versión 18 o superior recomendada)
*   NPM, Yarn o PNPM
*   Una instancia activa de base de datos (PostgreSQL o compatible)

### 2. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/invertilo/mercav.git
cd mercav
npm install
```

### 3. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en la siguiente plantilla:
```env
# Configuración de Base de Datos (Prisma)
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/mercav_db?schema=public"

# Configuración de Autenticación (NextAuth)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu_secreto_super_seguro_aqui"

# Pasarela de Pagos (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 4. Configurar la Base de Datos
Genera el cliente de Prisma y aplica el esquema actual a tu base de datos local:
```bash
npx prisma db push
```

### 5. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Accede a [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación en ejecución.

---

## 🗺️ Plan de Desarrollo y Roadmap de Funcionalidades

### 💳 Fase 1: Transacciones y Flujo Monetario
*   [x] Integración base de la pasarela Stripe.
*   [ ] Desarrollo del sistema de **Escrow** (Garantía de fondos para proyectos freelance).
*   [ ] Panel de facturación automatizada con exportación a PDF premium.

### 🔔 Fase 2: Interactividad & Experiencia Pro
*   [ ] Notificaciones push web en tiempo real para mensajes y compras.
*   [ ] Panel de control administrativo avanzado (KPIs, moderación rápida, suspensión de cuentas).
*   [ ] Optimización de SEO dinámico y velocidad con Server Side Rendering avanzado.

### 🤖 Fase 3: Ecosistema Inteligente e Integración
*   [ ] Algoritmo de recomendación IA para empleos y freelancing.
*   [ ] Integración del módulo de reservas y delivery gastronómico *Kerem by Mercav*.
*   [ ] Optimización como Progressive Web App (PWA) e inicio de app nativa.

---

Desarrollado con pasión para transformar el ecosistema profesional de Latinoamérica. 🚀
