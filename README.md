# 🌌 Mercav | Ecosistema Digital Latinoamericano

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-123a50?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-gold?style=for-the-badge)](#)

> **Mercav** es una plataforma integral de última generación diseñada para digitalizar, conectar y potenciar profesionales, empresas y anunciantes en toda Latinoamérica. Unifica un marketplace de publicidad exterior, un directorio de servicios freelance con sistema de escrow, una bolsa de empleo avanzada y una red social corporativa bajo una experiencia de usuario cinematográfica premium.

---

## 🎨 Filosofía de Diseño: "Seamless Cinematic Experience"

Mercav no es solo una herramienta, es una experiencia visual. La paleta es **crema y oro en modo claro** y **negro y oro en modo oscuro**. El tema se guarda en el navegador.
- **Liquid Glass**: el header, la barra inferior, la búsqueda, los menús y las hojas flotantes usan desenfoque, saturación y un borde luminoso. En Chrome el borde también refracta el fondo; Safari y Firefox quedan en el vidrio esmerilado. Si el sistema pide menos transparencia, esas piezas pasan a un fondo sólido.
- **Transiciones de sección**: el cambio de color entre bloques del inicio es un degradado, sin línea de corte.
- **Confirmar deslizando**: borrar y «Crear cuenta gratis» se confirman arrastrando el control hasta el final.
- **Interacciones**: búsqueda que se abre en una cápsula, tarjetas que se hunden bajo el puntero, gráfica que se recorre con el dedo y listas de comunidad que se reordenan.
- **Legal**: aviso legal, términos, privacidad, cookies, uso aceptable, reembolsos y derechos. El aviso de cookies bloquea reCAPTCHA y Google hasta que la persona acepta terceros.

---

## 🚀 Módulos Principales de la Plataforma

| Módulo | Descripción | Características Clave |
| :--- | :--- | :--- |
| **📢 Mercav Ads (Spaces)** | Marketplace digital para publicidad exterior (Vallas, Pantallas LED, Totems). | • Búsqueda geográfica y filtros.<br>• Reserva en tiempo real.<br>• Visualización de impacto y alcance métrico. |
| **🛠️ Mercav Services** | Directorio de talentos freelance y agencias verificadas en Latinoamérica. | • Portafolios interactivos.<br>• Contratación directa segura.<br>• Calificaciones y reseñas auditadas. |
| **💼 Mercav Jobs** | Bolsa de trabajo moderna optimizada para reclutadores y aplicantes. | • Postulación ágil en un clic.<br>• Perfiles de empresas interactivos.<br>• Seguimiento de candidaturas en tiempo real. |
| **🤝 Mercav Comunidad** | Red social corporativa para networking y el movimiento *Build in Public*. | • Feed interactivo con soporte multimedia.<br>• Reacciones personalizadas.<br>• Mensajería directa fluida. |
| **🧰 Mercav Tools** | Suite de herramientas empresariales y utilidades premium para profesionales y negocios. | • Herramientas de productividad integradas.<br>• Plantillas y utilidades para empresas.<br>• Automatizaciones y soporte para flujos de trabajo. |
| **🛡️ Mercav Pwn** | Inteligencia defensiva y monitoreo de exposición en [pwn.mercav.lat](https://pwn.mercav.lat). | • Búsqueda de exposición con HIBP, sin guardar contraseñas ni correos ajenos.<br>• Contraseñas solo por k-anonimato (el hash se calcula en el navegador).<br>• Vulnerabilidades de NVD y CISA KEV, alertas in-app y verificación DNS de dominios. |


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
│   ├── pwn/                # Mercav Pwn (pwn.mercav.lat): exposición, monitoreo y alertas
│   ├── mensajes/           # Módulo de chat en tiempo real y mensajería
│   ├── perfil/             # Configuración y visualización de perfiles
│   └── servicios/          # Directorio de profesionales freelance
├── components/             # Componentes de React reutilizables
│   ├── checkout/           # Componentes específicos de Stripe/pagos
│   ├── ui/                 # Componentes base y primitivas de UI (Shadcn modificados)
│   ├── pwn/                # Pantallas y cliente de Mercav Pwn
│   └── ...                 # Componentes organizados por dominio
├── lib/                    # Lógica común, clientes y utilidades
│   ├── pwn/                # Motores de riesgo, confianza y redacción
│   ├── integrations/pwn/   # Conectores HIBP, NVD y CISA KEV
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
*   **Base de Datos**: PostgreSQL, persistencia gestionada mediante **Prisma ORM**. El procedimiento de Pwn está en [migrate.md](migrate.md).
*   **Autenticación**: NextAuth.js con soporte para correo/contraseña y OAuth.
*   **Pagos**: Stripe API (Soporte para tarjetas globales y flujos de cobro).
*   **Mercav Pwn**: Have I Been Pwned, NVD API 2.0 y el catálogo CISA KEV. El host `pwn.mercav.lat` sirve el mismo despliegue y reescribe la raíz a `/pwn`.

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
NEXTAUTH_URL="http://localhost:1337"
NEXTAUTH_SECRET="tu_secreto_super_seguro_aqui"

# Pasarela de Pagos (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Mercav Pwn (apagado hasta que PWN_ENABLED sea "true")
PWN_ENABLED="false"
PWN_IDENTIFIER_PEPPER="un_secreto_largo_y_aleatorio"
HIBP_API_KEY=""
NVD_API_KEY=""
CRON_SECRET=""
PWN_FORUM_SCRAPE="true"
```

`PWN_IDENTIFIER_PEPPER` es obligatorio para buscar con sesión o crear objetivos. `HIBP_API_KEY` habilita las filtraciones. `CRON_SECRET` autoriza `POST /api/pwn/internal/cycle`, que revisa dominios verificados, abre alertas y guarda el catálogo público de CISA KEV. NVD y CISA KEV no exigen clave; `NVD_API_KEY` solo sube el cupo del proveedor.

### 4. Configurar la Base de Datos
Si no tienes PostgreSQL instalado, un contenedor desechable basta:

```bash
docker run -d --name mercav-postgres \
  -e POSTGRES_USER=mercav \
  -e POSTGRES_PASSWORD=mercav \
  -e POSTGRES_DB=mercav_db \
  -p 5432:5432 postgres:16
```

Esa contraseña es solo para la máquina local. En local, con esa base vacía:

```bash
npx prisma generate
npx prisma db push
```

En un entorno que ya tiene datos, no uses `db push` ni `migrate dev`. Sigue [migrate.md](migrate.md): backup y `npx prisma migrate deploy`.

### 5. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Accede a [http://localhost:1337](http://localhost:1337) en tu navegador. Mercav Pwn está en [http://localhost:1337/pwn](http://localhost:1337/pwn). En producción el mismo módulo responde en [https://pwn.mercav.lat](https://pwn.mercav.lat).

Los tests de los motores de Pwn (redacción, confianza y riesgo) no necesitan la base:

```bash
npm run test:pwn
```

### Errores al arrancar esta rama

El push de Pwn dejó el chequeo de GitHub Actions en `startup_failure` (run `35821748515`): cero jobs y el aviso de que el archivo de workflow no es válido. El bloque `on` declaraba `push` y `pull_request` sin valor, y YAML lo lee como `null`. El workflow ahora usa `on: [push, pull_request]` y `permissions: contents: read`. Ese arreglo entra en GitHub cuando se vuelva a pushear la rama `pwn`.

En el editor, TypeScript marcaba el código nuevo de Pwn con `TS2802` (no se puede iterar un `Map`, un `Set` ni `URLSearchParams`). `tsconfig.json` no tenía `target`, así que el compilador usa ES5. Quedó en `ES2017`, que es el valor que usa Next.js. La ruta `POST /api/pwn/ingest` además infería `verificationStatus` como `string` y Prisma no lo acepta en el enum `PwnVerificationStatus`; ahora el valor está anotado con ese enum.

`prisma.config.ts` importa `prisma/config`, módulo que Prisma 5.14 no publica (aparece en Prisma 6.13). El archivo se excluyó del `tsconfig` para que el editor no lo marque. `npx prisma generate` de esta versión no lo necesita.

El middleware mandaba `/logo.png` a `/login` porque el `matcher` no excluía ese archivo público. El navegador guardaba esa respuesta y el header mostraba el icono roto junto al texto alternativo «MERCAV». El logo del header, el footer y el icono de la pestaña salen de `/images/logo.png`, una ruta que el middleware no intercepta. El matcher también deja pasar `uploads`, `404.html` e `index.html`.

### Qué se tomó de LeakGuard

Se revisó [LeakGuard](https://github.com/paltaunkwnow/LEAKGUARD) en una carpeta temporal, fuera del repositorio. Pasaron tres piezas que encajan con Pwn y se reescribieron al estilo negro y oro:

- Guía «Qué hacer para protegerte» en el resumen.
- Pasos siguientes cuando un correo, un dominio o una contraseña aparecen expuestos.
- Historial de la sesión con botón para borrarlo. El correo se guarda solo como `j***@g***` y no sale del navegador.

No se copiaron el chat, el mapa de incidentes ni la búsqueda por teléfono. Sí se adaptó el **scrape defensivo de foros/RSS**: DarkNetArmy, Hackread y **23 feeds RSS** de medios y labs (ver `lib/integrations/pwn/feed-catalog.ts`) → `PwnForumSignal` con `signalKind`, `priorityRank` (filtraciones **gubernamentales** arriba del resto), deduplicación por titular, correlación opcional con brechas **HIBP** (`breachId`) y alertas in-app si el titular menciona un **dominio verificado** en monitoreo. Filtros: `GET /api/pwn/forum-signals?kind=DATA`, `?gov=true`. Admins pueden apagar feeds en `/pwn/sources`. Ciclo horario: `POST /api/pwn/internal/cycle` (`vercel.json`, `CRON_SECRET`). Sin cuerpos de hilo ni volcados. `PWN_FORUM_SCRAPE=false` desactiva el scrape.

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
<! -->
<!-- creado por pato dev y askforvini -->
