<div align="center">

<img src=".github/readme/hero.svg" alt="Mercav. Una sola cuenta para publicidad, talento, empleo, caja y ciberinteligencia en Latinoamérica." width="100%">

<br>
<br>

[![Next.js](https://img.shields.io/badge/Next.js-14.2-D4AF37?style=for-the-badge&logo=next.js&logoColor=white&labelColor=0C0C0C)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-D4AF37?style=for-the-badge&logo=react&logoColor=white&labelColor=0C0C0C)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-D4AF37?style=for-the-badge&logo=typescript&logoColor=white&labelColor=0C0C0C)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-D4AF37?style=for-the-badge&logo=tailwind-css&logoColor=white&labelColor=0C0C0C)](https://tailwindcss.com/)
<br>
[![Prisma](https://img.shields.io/badge/Prisma-5-D4AF37?style=for-the-badge&logo=prisma&logoColor=white&labelColor=0C0C0C)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-D4AF37?style=for-the-badge&logo=postgresql&logoColor=white&labelColor=0C0C0C)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-pagos-D4AF37?style=for-the-badge&logo=stripe&logoColor=white&labelColor=0C0C0C)](https://stripe.com/)
[![License](https://img.shields.io/badge/Licencia-propietaria-D4AF37?style=for-the-badge&labelColor=0C0C0C)](#)

**[mercav.lat](https://mercav.lat)** &nbsp;·&nbsp; **[pwn.mercav.lat](https://pwn.mercav.lat)** &nbsp;·&nbsp; **[kosher.mercav.lat](https://kosher.mercav.lat)** &nbsp;·&nbsp; **[Pitch](https://mercav.lat/pitch)**

</div>

<br>

**Mercav** es una plataforma con una sola cuenta para Latinoamérica: publicidad física, talento con pago por Stripe, empleo, feed, caja POS, herramientas de negocio, ciberinteligencia defensiva y un atlas de lugares kosher, sinagogas y kehilot.

La construyen sus tres cofundadores desde Santa Cruz de la Sierra, Bolivia.

> [!NOTE]
> En local el servidor de desarrollo escucha en el puerto **1337**. Usá `http://127.0.0.1:1337`, no `localhost`.

<details>
<summary><b>Contenido</b></summary>

<br>

| | | |
| :--- | :--- | :--- |
| [Módulos](#módulos) | [Equipo](#equipo) | [El resto de la app](#el-resto-de-la-app) |
| [Hosts](#hosts) | [Stack](#stack) | [Estructura del repo](#estructura-del-repo) |
| [Arranque local](#arranque-local) | [Admin](#admin) | [Roadmap](#roadmap) |
| [Notas de desarrollo](#notas-de-desarrollo) | | |

</details>

<img src=".github/readme/divider.svg" width="100%" alt="">

## Módulos

<img src=".github/readme/modules.svg" alt="Siete módulos con una sola cuenta: Ads, Services, Jobs, POS, Tools, Pwn y Kosher." width="100%">

Siete módulos de producto, más el feed, los mensajes y el panel. Todo comparte el mismo login (correo/contraseña o Google, 2FA TOTP opcional). Roles: `ADMIN`, `ANUNCIANTE`, `DUENO_ESPACIO`, `FREELANCER`, `CANDIDATO`.

| Módulo | Ruta | Para qué |
| :--- | :--- | :--- |
| **Ads** | `/anuncios` | Vallas, pantallas y vidrieras para alquilar por fechas |
| **Services** | `/servicios` | Talento digital con paquetes y pago por Stripe |
| **Jobs** | `/empleos` | Vacantes, postulaciones y seguimiento |
| **POS** | `/dashboard/pos` | Caja para cualquier rubro, con cola offline |
| **Tools** | `/herramientas` | Calculadoras, contratos, SEO y prompts en el navegador |
| **Pwn** | `/pwn` · [pwn.mercav.lat](https://pwn.mercav.lat) | Ciberinteligencia defensiva |
| **Kosher** | `/kosher` · [kosher.mercav.lat](https://kosher.mercav.lat) | Atlas de lugares, sinagogas y kehilot |

### Mercav Ads — `/anuncios`

Catálogo de vallas, pantallas y vidrieras para alquilar con reserva por fechas. El primer alquiler de cada espacio no paga comisión de plataforma. El pago va por Stripe. Publicar, editar y ver «mis espacios» está en `/anuncios/publicar`, `/anuncios/editar/[id]` y `/anuncios/mis-espacios`.

### Mercav Services — `/servicios`

Mercado de talento digital con paquetes y precio claro. El cliente paga con tarjeta; el pedido pasa de `PENDING` a `IN_PROGRESS` cuando Stripe confirma. Hay disputas, archivos del proyecto y reseñas.

> [!IMPORTANT]
> El modelo `Milestone` existe, pero **la liberación por hito todavía no se crea en código**: la custodia que ve admin es el pedido no completado ni cancelado, no un escrow de Stripe Connect.

Pedidos: `/dashboard/pedidos`. Publicar: `/servicios/publicar`.

### Mercav Jobs — `/empleos`

Vacantes, postulaciones y seguimiento. El empleador ve postulantes en `/dashboard/postulantes`. El salario puede mostrarse u ocultarse. La misma cuenta sirve para postular y para publicar.

### Feed y mensajes — `/feed`, `/mensajes`

El feed es la comunidad de la plataforma: publicaciones, reacciones, comentarios y actividad de espacios, servicios y vacantes. Sin sesión hay un teaser; con sesión, el feed completo. Los mensajes directos viven en `/mensajes` (Socket.io).

### Mercav POS — `/dashboard/pos`

Caja en el navegador para cualquier rubro: carrito, medios de pago, abrir/cerrar turno, anular venta, inventario, reportes y personal con PIN. Hay cola offline si se corta la red. La config puede vincular un local de Mercav Kosher para **avisar disponibilidad**; Mercav no emite hechsher ni certifica productos.

Pantallas: `/dashboard/pos`, `/dashboard/pos/inventory`, `/dashboard/pos/reports`, `/dashboard/pos/config`.

### Mercav Tools — `/herramientas`

Se abren en el navegador, sin instalar nada. Incluidas según el plan (`/precios`). El POS no está en este catálogo: vive en `/dashboard/pos`.

<details>
<summary><b>Rutas de Tools</b> (6)</summary>

<br>

| Ruta | Qué hace |
| :--- | :--- |
| `/herramientas/roi` | Calculadora de ROI de una campaña |
| `/herramientas/contratos` | Modelo de contrato freelancer–cliente por país (opcional: `ANTHROPIC_API_KEY`) |
| `/herramientas/seo` | Analizador SEO y PDF (opcional: `GOOGLE_PAGESPEED_API_KEY`) |
| `/herramientas/precios` | Simulador de tarifa por hora y por proyecto |
| `/herramientas/paletas` | Paleta de cinco colores, contraste y export CSS/Tailwind/SCSS/JSON |
| `/herramientas/prompts` | Prompts para anuncios, producto y atención (opcional: Anthropic) |

</details>

### Mercav Pwn — `/pwn` y [pwn.mercav.lat](https://pwn.mercav.lat)

Ciberinteligencia **defensiva**. Sin `PWN_ENABLED=true` las rutas responden 404. No guarda contraseñas ni correos ajenos en claro. Los identificadores se hashean con `PWN_IDENTIFIER_PEPPER`.

<details>
<summary><b>Rutas de Pwn</b> (12)</summary>

<br>

| Ruta | Qué hace |
| :--- | :--- |
| `/pwn` | Hub: consulta y capacidades |
| `/pwn/exposure` | Correo o dominio contra Have I Been Pwned (consulta abierta) |
| `/pwn/breaches` | Catálogo de filtraciones y estado de verificación |
| `/pwn/vulnerabilities` | CVE en NVD, marcado si está en CISA KEV |
| `/pwn/signals` | Titulares de foros/RSS permitidos (solo metadatos: título, autor, enlace) |
| `/pwn/alerts` | Alertas de objetivos que seguís y verificaste |
| `/pwn/reports` | Informe de exposición para un equipo o un cliente |
| `/pwn/actors` | Agregado de actores de foro |
| `/pwn/organizations` | Organización, objetivos y alertas |
| `/pwn/autorizaciones` | Cola de autorización de monitoreo |
| `/pwn/sources` | Salud de conectores; admin puede apagar un feed |
| `/pwn/terminos` | Términos del módulo |

</details>

Contraseñas: k-anonimato en el navegador (`POST /api/pwn/passwords/range`). Crons en `vercel.json`: `POST /api/pwn/internal/cycle` (horario) y `/api/pwn/internal/forums` (cada 10 min), con `CRON_SECRET`. Detalle de migraciones y operación: [migrate.md](migrate.md). Tests de motores (sin base): `npm run test:pwn`.

### Mercav Kosher — `/kosher` y [kosher.mercav.lat](https://kosher.mercav.lat)

Atlas de lugares kosher, sinagogas, mikvaot y kehilot. Mapa MapLibre (OpenFreeMap / CARTO, sin clave). Zmanim, velas, Havdalá y jaguim con `@hebcal/core` y la zona de cada ciudad. Modo Shabat: solo lectura desde velas hasta Havdalá (también en iom tov).

> [!NOTE]
> Mercav Kosher **no emite hechsher, certificación ni psak**: muestra la fuente y la fecha.

<details>
<summary><b>Rutas de Kosher</b> (12)</summary>

<br>

| Ruta | Qué hace |
| :--- | :--- |
| `/kosher` | Inicio del atlas |
| `/kosher/mapa` | Mapa con clusters y filtros |
| `/kosher/viaje` | Dónde comer, rezar y la sala local al llegar a una ciudad |
| `/kosher/calendario` | Zmanim y jaguim |
| `/kosher/chat` | Conversación por ciudad o por lugar (cuenta Mercav) |
| `/kosher/sugerir` | Alta de un lugar, con fuente, a moderación |
| `/kosher/lugar/[slug]` | Ficha; instituciones pueden administrarla y cargar certificado con vencimiento |
| `/kosher/comunidad` | Hub: agenda, minián, mesa de Shabat, jésed, empleos, agencias, kehilot |
| `/kosher/comunidades` | Ciudades con kehilá en Mercav Kosher |
| `/kosher/perfil` | Ciudad, corriente, modo Shabat (misma cuenta) |
| `/kosher/moderacion` | Cola: `ADMIN` de Mercav, o rol `local_moderator` / `agency` en Kosher |
| `/kosher/terminos` | Términos del módulo |

</details>

Seed del atlas: `npm run seed:kosher`.

### Kerem by Mercav — todavía no está vivo

Proyecto de hospitalidad en Santa Cruz: mesa física, estándar de kashrut, el mismo criterio de verificabilidad que el software. No es un eslogan ni un módulo de esta app. La capa digital de lugares es Mercav Kosher.

<img src=".github/readme/divider.svg" width="100%" alt="">

## Equipo

<table>
  <tr>
    <td align="center" width="33%">
      <br>
      <b>Vinicius Salazar</b>
      <br>
      <sub>Cofundador · CEO</sub>
      <br>
      <br>
      <a href="https://mercav.lat/nosotros">Quién soy</a>
      <br>
      <br>
    </td>
    <td align="center" width="33%">
      <br>
      <b>Sebastian Rojas Cespedes</b>
      <br>
      <sub>Cofundador · CTO</sub>
      <br>
      <br>
    </td>
    <td align="center" width="33%">
      <br>
      <b>Alejandro Ismael Mendoza Diaz</b>
      <br>
      <sub>Cofundador · CTO</sub>
      <br>
      <br>
    </td>
  </tr>
</table>

El resumen para inversores (problema, producto, modelo de negocio y equipo) está en [`/pitch`](https://mercav.lat/pitch).

<img src=".github/readme/divider.svg" width="100%" alt="">

## El resto de la app

| Ruta | Qué es |
| :--- | :--- |
| `/` | Landing: problema, siete módulos, Pwn, Kosher, actividad |
| `/por-que-mercav` | Por qué existe la plataforma |
| `/nosotros` | Quién la construye |
| `/pitch` | Pitch: problema, producto, modelo de negocio y equipo |
| `/inversores` | Contacto de inversores (SMTP si está configurado) |
| `/precios`, `/premium` | Planes (Free, Professional, …) y herramientas por plan |
| `/explorar`, `/buscar` | Descubrimiento y búsqueda unificada |
| `/login`, `/register` | Auth; reCAPTCHA v3 si hay claves y cookies de terceros aceptadas |
| `/perfil`, `/perfil/editar` | Perfil público y edición (incluido 2FA) |
| `/dashboard` | Panel: pedidos, clientes, postulantes, POS |
| `/admin/dashboard` | Solo `ADMIN`. Pestañas: resumen, usuarios, empresas, inversores, servicios, espacios, insignias, finanzas, reportes, tráfico inusual, configuración |
| `/checkout` | Stripe: servicios, reservas de espacios, upgrade de plan |
| `/soporte`, `/contacto` | Tickets y contacto |
| `/changelog` | Cambios |
| `/sancion` | Cuenta suspendida |
| `/offline`, `/maintenance`, `/forbidden` | Utilidad |

**Legal:** `/aviso-legal`, `/terminos`, `/privacidad`, `/cookies`, `/legal/uso-aceptable`, `/legal/reembolsos`, `/legal/derechos`, más `/pwn/terminos` y `/kosher/terminos`. El aviso de cookies bloquea reCAPTCHA y Google hasta que la persona acepta terceros.

**`/1337`:** no es un producto. Si el user-agent parece interceptor (Burp, ZAP, …) el middleware redirige acá. En escritorio, InspectGuard registra inspección (F12) y también lleva a `/1337`. Admin ve esos eventos en la pestaña **Tráfico inusual**. El video está en `public/videos/1337.webm`. No indexar: está en `PRIVATE_PREFIXES`.

<img src=".github/readme/divider.svg" width="100%" alt="">

## Hosts

El mismo despliegue de Next sirve los tres hosts (`lib/seo/site.ts`, `middleware.ts`):

| Host | Qué sirve |
| :--- | :--- |
| `mercav.lat` | App principal |
| `pwn.mercav.lat` | Reescribe a `/pwn` |
| `kosher.mercav.lat` | Reescribe a `/kosher`; `/empleos` y `/mensajes` en ese host redirigen a `mercav.lat` |

En producción, `AUTH_COOKIE_DOMAIN=.mercav.lat` comparte la sesión. En local dejalo vacío.

## Stack

| Capa | Qué usa |
| :--- | :--- |
| **App** | Next.js 14 App Router, React 18, TypeScript, Tailwind, Framer Motion |
| **Datos** | PostgreSQL + Prisma 5 |
| **Auth** | NextAuth JWT (Credentials + Google), 2FA con `otplib` |
| **Pagos** | Stripe (`PaymentIntent` + webhook) |
| **Pwn** | Have I Been Pwned, NVD 2.0, CISA KEV, RSS/foros allowlisted |
| **Kosher** | MapLibre GL, OpenFreeMap/CARTO, OSM (seed), `@hebcal/core`, `sonner` |
| **POS / Tools** | Cámara para códigos, `jspdf` / `xlsx`, Anthropic opcional en contratos y prompts |
| **Tiempo real** | Socket.io en mensajes |

Diseño: crema y oro en claro, negro y oro en oscuro. Liquid glass en header, nav inferior, búsqueda y hojas. En iOS, `viewport-fit=cover` y `env(safe-area-inset-*)`.

## Estructura del repo

```
app/                 App Router
  anuncios/          Ads
  servicios/         Services
  empleos/           Jobs
  feed/              Comunidad de la plataforma
  dashboard/         Pedidos, postulantes, POS
  herramientas/      Tools
  pwn/               Mercav Pwn
  kosher/            Mercav Kosher (mapa, comunidad, viaje, …)
  pitch/             Pitch para inversores
  admin/             Panel admin
  1337/              Página de inspección
  api/               Route handlers
components/          UI por dominio (home, pos, pwn, kosher, admin, layout, feed)
lib/                 Auth, Prisma, Stripe, SEO, Pwn, Kosher, POS, billing
prisma/              schema.prisma + migrations + seeds
public/              Estáticos; /images/logo.png; /videos/1337.webm
.github/readme/      SVG animados de este README
middleware.ts        Auth, subdominios, rate limit, /1337, SEO
vercel.json          Crons de Pwn
migrate.md           Cómo aplicar Pwn/Kosher sin borrar datos
```

No hay grupo `(auth)/` ni carpeta `comunidad/`: login y registro están en `/login` y `/register`; la red social es `/feed`.

> [!WARNING]
> **Qué no es el runtime.** Estas carpetas pueden existir en una máquina local y **no se sirven**:
>
> - `Implementacion Nueva Kosher/makom-main`: copia de referencia de Makom; Kosher ya está portado a `app/kosher`
> - `logo default/`: original de `1337.webm`; la app usa `public/videos/1337.webm`
> - `obsidian/`, `CONTEXTO.md`: notas locales; ya están en `.gitignore`
> - `.env`: secretos; nunca al git
>
> No copies recetas de ataque ni vendorees herramientas ofensivas. Pwn es defensivo: metadatos, fuentes citadas, nada de volcados ni exploits.

<img src=".github/readme/divider.svg" width="100%" alt="">

## Arranque local

**Requisitos:** Node 18+, npm, Docker (o PostgreSQL 16). El contenedor que usa este proyecto se llama `mercav-postgres`.

### 1. Instalar

```bash
git clone https://github.com/invertilo/mercav.git
cd mercav
npm install
```

Hay un segundo remoto (`paltaunkwnow/mercav`) en algunas máquinas. El remoto `origin` es `invertilo/mercav`.

### 2. Base de datos

```bash
docker run -d --name mercav-postgres \
  -e POSTGRES_USER=mercav \
  -e POSTGRES_PASSWORD=mercav \
  -e POSTGRES_DB=mercav_db \
  -p 5432:5432 postgres:16
```

Esa contraseña es solo para la máquina local. Con la base **vacía**:

```bash
npx prisma generate
npx prisma db push
```

> [!CAUTION]
> En un entorno **con datos**, no uses `db push` ni `migrate dev`. Seguí [migrate.md](migrate.md): backup y `npx prisma migrate deploy`. El historial de Prisma no cubre todo el esquema (POS, tickets, etc. se añadieron al `schema.prisma` sin migración vieja); `migrate dev` puede ofrecer un reset.

Admin inicial: `npm run seed` (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`). Atlas Kosher: `npm run seed:kosher`.

### 3. Variables (`.env` en la raíz)

No commitees este archivo. Nombres, no valores de producción.

<details>
<summary><b>Ver el <code>.env</code> de ejemplo</b></summary>

<br>

```env
DATABASE_URL="postgresql://mercav:mercav@localhost:5432/mercav_db?schema=public"

NEXTAUTH_URL="http://127.0.0.1:1337"
NEXTAUTH_SECRET="un_secreto_largo"
# En local vacío. En producción: .mercav.lat
AUTH_COOKIE_DOMAIN=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

RECAPTCHA_SECRET_KEY=""
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=""

STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET=""

PWN_ENABLED="false"
PWN_IDENTIFIER_PEPPER="un_secreto_largo_y_aleatorio"
HIBP_API_KEY=""
NVD_API_KEY=""
CRON_SECRET=""
PWN_FORUM_SCRAPE="true"

ANTHROPIC_API_KEY=""
ANTHROPIC_MODEL=""
GOOGLE_PAGESPEED_API_KEY=""

SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
INVESTOR_CONTACT_EMAIL=""

SEED_ADMIN_EMAIL=""
SEED_ADMIN_PASSWORD=""

NEXT_PUBLIC_LEGAL_ENTITY_NAME=""
NEXT_PUBLIC_LEGAL_TAX_ID=""
NEXT_PUBLIC_LEGAL_ADDRESS=""
```

</details>

- `PWN_IDENTIFIER_PEPPER` hace falta para buscar con sesión o crear objetivos. Si cambia, los objetivos viejos dejan de coincidir.
- `HIBP_API_KEY` habilita filtraciones. NVD/CISA no exigen clave; `NVD_API_KEY` solo sube el cupo.
- `PWN_ENABLED` tiene que ser exactamente `"true"` para encender Pwn.
- Contratos y prompts funcionan sin Anthropic; con clave, el texto lo genera el modelo.

### 4. Servidor

```bash
npm run dev
```

Abre [http://127.0.0.1:1337](http://127.0.0.1:1337). Pwn: `/pwn`. Kosher: `/kosher`.

`next.config.mjs` declara `allowedDevOrigins: ["127.0.0.1"]` y, en desarrollo, ignora el watch de `node_modules`, `.git`, `.next`, `Implementacion Nueva Kosher`, `.cursor`, `.claude` y `obsidian`.

> [!TIP]
> Si Next responde 404 en **todas** las rutas HTML (incluido `/` y `/1337`) pero `/videos/1337.webm` da 200, el watcher se quedó sin archivos (`EMFILE`): cortá el proceso en el puerto 1337, borrá `.next` y volvé a `npm run dev`.

Producción: `npm run build` (corre `prisma generate`) y `npm start`. `postinstall` también genera el cliente Prisma (Vercel).

<img src=".github/readme/divider.svg" width="100%" alt="">

## Admin

`/admin/dashboard?tab=…` exige rol `ADMIN`.

| Grupo | Pestaña | Para qué |
| :--- | :--- | :--- |
| General | Resumen | Actividad, ingresos, altas |
| Personas | Usuarios, empresas, inversores | Cuentas, planes, sanciones, solicitudes de empresa, formulario de inversores |
| Contenido | Servicios, espacios, insignias | Moderación y badges |
| Operación | Finanzas, reportes, tráfico inusual | Comisiones, disputas, custodia, tickets, eventos de `/1337` |
| Sistema | Configuración | Anuncios, acceso, comisiones, auditoría |

## Roadmap

Honesto respecto del código.

- [x] Stripe en anuncios y servicios
- [x] POS, Tools, Pwn y Kosher
- [x] Feed, 2FA, admin y `/1337`
- [ ] Liberación de fondos por hito (el modelo `Milestone` está; no se crean hitos al contratar)
- [ ] Facturación PDF del lado plataforma (el POS sí emite ticket)
- [ ] Push web para mensajes y compras
- [ ] Kerem (hospitalidad física; no es un módulo de esta app todavía)
- [ ] PWA nativa más allá de `/offline`

## Notas de desarrollo

- Tests de Pwn: `npm run test:pwn`. Workflow: `.github/workflows/pwn-tests.yml`.
- `prisma.config.ts` importa un módulo de Prisma 6; esta app usa Prisma 5.14. Está fuera del `tsconfig`. `prisma generate` no lo necesita.
- El matcher del middleware deja pasar estáticos, `uploads`, `robots.txt`, `sitemap.xml`, `videos`, etc. El logo público es `/images/logo.png`.
- De LeakGuard se tomó la guía de protección, el historial de sesión ofuscado y el scrape defensivo de foros/RSS (solo titulares). No se copió el chat ofensivo, el mapa de incidentes ni la búsqueda por teléfono. Catálogo: `lib/integrations/pwn/feed-catalog.ts`. `PWN_FORUM_SCRAPE=false` lo apaga.
- Los SVG animados de este README están en `.github/readme/`. Respetan `prefers-reduced-motion`.

<br>

<div align="center">
<img src=".github/readme/footer.svg" alt="Mercav. Hecho en Latinoamérica." width="60%">
</div>

<! -->
<!-- creado por pato dev y askforvini -->
