# Mercav | Ecosistema Digital Latinoamericano

![Mercav Preview](https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop)

Mercav es una plataforma integral diseñada para conectar profesionales, empresas y anunciantes en toda Latinoamérica. Combina un marketplace de publicidad exterior, una plataforma de servicios freelance, una bolsa de empleo y una red social profesional en un solo ecosistema digital premium.

---

## 🚀 Tecnologías Core

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router & Server Components)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom "Black & Gold" Design System)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (High-end cinematic transitions)
- **Database**: [Prisma ORM](https://www.prisma.io/) + PostgreSQL
- **Auth**: [NextAuth.js](https://next-auth.js.org/)
- **Real-time**: [Socket.io](https://socket.io/) (Messaging & Notifications)

---

## 🗂️ Estructura del Proyecto

El proyecto sigue una arquitectura moderna de Next.js centrada en la escalabilidad y el rendimiento.

```bash
mercavgemini/
├── app/                    # Directorio principal (App Router)
│   ├── (auth)/             # Rutas de autenticación (Login, Registro)
│   ├── anuncios/           # Marketplace de Publicidad Exterior
│   ├── api/                # Endpoints de API (Backend logic)
│   ├── checkout/           # Proceso de reserva y pagos
│   ├── comunidad/          # Red Social Profesional (Feed, Posts)
│   ├── empleos/            # Bolsa de Trabajo
│   ├── herramientas/       # Suite de herramientas empresariales
│   ├── inversores/         # Sección de oportunidad de inversión
│   ├── mensajes/           # Sistema de mensajería en tiempo real
│   ├── nosotros/           # Manifiesto y equipo (Founder Story)
│   ├── perfil/             # Gestión de perfiles (Pro vs Empresa)
│   ├── servicios/          # Directorio de Talentos Freelance
│   └── layout.tsx          # Layout global (Header, Footer, Providers)
├── components/             # Biblioteca de componentes UI
│   ├── home/               # Componentes específicos de la Home
│   ├── layout/             # Header, Footer, Navigations
│   ├── profile/            # UI relacionada con perfiles de usuario
│   └── ui/                 # Componentes base (Shadcn + Custom)
├── lib/                    # Lógica de negocio y utilidades
│   ├── prisma.ts           # Cliente de Base de Datos
│   ├── auth.ts             # Configuración de NextAuth
│   ├── socket.ts           # Cliente de WebSockets
│   └── utils.ts            # Helper functions
├── prisma/                 # Esquema y Migraciones de Base de Datos
│   └── schema.prisma       # Definición del modelo de datos
├── public/                 # Assets estáticos (Imágenes, SVGs, Lotties)
└── types/                  # Definiciones de TypeScript globales
```

---

## 📦 Módulos Principales

### 📢 Mercav Ads (Spaces)
Marketplace de publicidad exterior que digitaliza la gestión de vallas y pantallas LED.
- Sistema de reservas con verificación en tiempo real.
- Visualización de impacto y ubicación geográfica.

### 🛠️ Mercav Services
Directorio de talentos enfocado en la calidad y la verificación de habilidades.
- Sistema de categorías inteligente.
- Perfiles de proveedores con portafolio integrado.

### 💼 Mercav Jobs
Plataforma de reclutamiento para el nuevo mercado laboral latinoamericano.
- Gestión de vacantes y postulaciones simplificada.
- Perfiles de empresa optimizados para marca empleadora.

### 🤝 Mercav Comunidad
Red social profesional que fomenta la colaboración y el "Build in Public".
- Sistema de reacciones personalizadas.
- Mensajería directa segura y fluida.

---

## 🛠️ Configuración para Desarrolladores

1. **Instalar dependencias**: `npm install`
2. **Variables de Entorno**: Configurar `.env` con `DATABASE_URL` y `NEXTAUTH_SECRET`.
3. **Database Setup**: `npx prisma db push`
4. **Dev Mode**: `npm run dev`

---

## 🗺️ Roadmap de Desarrollo (Tareas Pendientes)

### 💳 Fase 1: Transacciones y Pagos
- [ ] **Pasarela de Pagos**: Integración de Stripe y métodos locales (Mercado Pago, transferencia bancaria).
- [ ] **Sistema de Escrow**: Retención de fondos segura para servicios freelance hasta la entrega.
- [ ] **Facturación**: Generación automática de recibos y facturas PDF premium.

### 🔔 Fase 2: Experiencia de Usuario Pro
- [ ] **Notificaciones Push**: Alertas en tiempo real para mensajes y actualizaciones de estado.
- [ ] **Dashboard de Administración**: Panel de control avanzado para moderación y métricas.
- [ ] **Modo Offline**: Cache inteligente para la sección de comunidad en dispositivos móviles.

### 🚀 Fase 3: Expansión y Ecosistema
- [ ] **Kerem Gastronomía**: Integración completa del módulo de reservas y delivery para Kerem by Mercav.
- [ ] **App Móvil Nativa**: Desarrollo de la versión Android/iOS utilizando React Native o PWA avanzada.
- [ ] **IA Matchmaking**: Algoritmo para conectar perfiles con las mejores oportunidades de empleo/servicios.

---

## 💎 Filosofía de Diseño
Mercav se construye bajo el estándar de **"Seamless Cinematic Experience"**. Cada interacción debe sentirse fluida, premium y libre de distracciones, utilizando una paleta de colores **Black & Gold** que transmite exclusividad y confianza.

---

Desarrollado con ❤️ para el futuro de Latinoamérica.
