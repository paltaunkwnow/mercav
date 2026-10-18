# Mercav — Plan SDD (Software Design Document & Plan de Verificación del Sistema)

> **Regla de Operación Obligatoria**:
> Siempre que un desarrollador, agente o subagente finalice una tarea o modifique código en el repositorio, **DEBE ejecutar el Plan de Verificación SDD** de forma íntegra. No se considerará ningún cambio terminado sin haber corrido la suite y comprobado que no se introdujeron errores ni regresiones en otros módulos.

---

## 1. Arquitectura del Sistema y Topología de Dominios

Mercav es una plataforma modular construida sobre **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, y **Prisma ORM** con PostgreSQL (Supabase).

```
mercav/
├── app/                        # Rutas públicas, autenticadas y APIs (App Router)
│   ├── (auth)/                 # Login, registro, recuperación de cuenta
│   ├── api/                    # Endpoints REST (rutas protegidas, webhooks, exportaciones)
│   ├── business/               # Módulo Mercav Business (SaaS RR.HH. y gestión empresarial)
│   ├── calendario/             # Calendario cívico, departamental y hebreo
│   ├── dashboard/              # Panel de usuario / módulos personales
│   ├── kosher/                 # Directorio Kosher verificado y mapas OSM
│   └── pwn/                    # Módulo de inteligencia de brechas y amenazas
├── components/                 # Componentes React de UI (App Shell, formularios, tablas)
├── lib/                        # Núcleo de lógica de negocio, validaciones y utilidades
│   ├── auth/                   # NextAuth, sesiones y middleware de autenticación
│   ├── business/               # RR.HH., cifrado de legajos, nómina, permisos y POS
│   ├── calendar/               # Motor de feriados (Bolivia DS 5521, LatAm, Jalajá)
│   ├── kosher/                 # Lógica de validación de locales, horarios y certificados
│   ├── privacy/                # Mervi Privacy, auditoría y políticas de datos
│   └── pwn/                    # Monitoreo de filtraciones, DNS TXT, rate-limits y CSRF
├── prisma/                     # Esquema de base de datos, migraciones y seeds
└── scripts/                    # Scripts de soporte, pruebas e importación de datos
```

---

## 2. Dominios Funcionales e Invariantes Críticos

### 2.1. Mercav Business (`lib/business/`, `app/business/`, `app/api/business/`)
- **Espacios de Trabajo (`BusinessWorkspace`)**: Aislamiento estricto multitenant por `slug`. Todo dato pertenece a un `workspaceId`.
- **Control de Acceso (`lib/business/permissions.ts`)**: Matriz RBAC con roles `OWNER`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`, `ACCOUNTANT`. Cada ruta de API debe validar los permisos específicos (e.g. `employees.create`, `payroll.calculate`, `pos.sell`).
- **Cifrado Criptográfico de Legajos (`lib/business/crypto.ts`)**:
  - Los campos de alta sensibilidad del trabajador (`ci`, `ciExt`, `bankAccount`, `nua`, `cnsNumber`) se cifran en reposo con **AES-256-GCM**.
  - **Invariante de Resiliencia**: El servicio de cifrado requiere una clave de 32 bytes (`BUSINESS_DATA_KEY`). Si la variable de entorno no está configurada explícitamente en producción, el sistema deriva determinísticamente una clave segura a partir de `NEXTAUTH_SECRET` en lugar de lanzar una excepción que tire el servidor (500), garantizando que las altas de trabajadores funcionen sin caídas críticas.
  - El salario base (`baseSalary`) se mantiene en tipo `Decimal` numérico para posibilitar el cálculo de nómina y reportes, protegido a nivel de campo por el permiso `employees.viewSensitive`.
- **Nómina y Planillas (`lib/business/payroll.ts`, `lib/business/bolivia/`)**:
  - Parámetros actualizados al año en curso (salario mínimo nacional boliviano, escalas de antigüedad del DS 21060, aportes laborales a la Gestora Pública, retenciones impositivas RC-IVA, aguinaldos y aportes patronales a la CNS).
- **Caja y Punto de Venta Integrado (`lib/business/pos/`)**:
  - Trazabilidad de costos (`costKnown`, `unitCostPrice` congelado al momento de cada venta en `POSSaleItem` para salvaguardar el cálculo histórico de margen de utilidad).

### 2.2. Seguridad, Red y Protección contra Brechas (`lib/pwn/`)
- **CSRF & Origin Verification**: Mutaciones en endpoints críticos (`app/api/pwn/`) exigen orígenes de confianza (`mercav.lat`, dominios corporativos autorizados) y tipo de contenido JSON.
- **Protección contra Fuerza Bruta**: Rate limiting por buckets en memoria con ventana de tiempo y expulsión LRU.
- **Tokens de Correo y Verificación de Dominio**: Hashing de un solo uso con expiración temporal y verificación estricta de registros DNS TXT.

### 2.3. Calendarios y Feriados (`lib/calendar/`)
- Soporte para feriados nacionales y departamentales en Bolivia según Decretos Supremos vigentes (incluyendo traslados de domingo a lunes, conmemoraciones y fechas inamovibles).
- Compatibilidad con días de descanso y festividades del calendario hebreo vía `@hebcal/core`.

### 2.4. Manejo Robusto de Errores en APIs (`app/api/`)
- Ninguna ruta de API (`route.ts`) debe dejar escapar excepciones no controladas que generen páginas HTML 500 por defecto de Next.js.
- Todas las rutas deben responder siempre con un payload JSON estándar:
  ```json
  { "success": false, "error": "Mensaje legible y seguro para el usuario" }
  ```

### 2.5. Resiliencia de Formularios de Usuario
- Formularios de entrada de datos (como `EmployeeForm.tsx`) deben tolerar variaciones de formato regional en navegadores (e.g. `DD/MM/YYYY` vs `YYYY-MM-DD` para fechas de nacimiento o ingreso laboral), normalizando las cadenas a formato ISO estándar antes del envío.

---

## 3. Protocolo de Verificación SDD (Checklist de Ejecución)

Cada vez que se complete un cambio de código, el desarrollador o agente debe ejecutar y validar los siguientes pasos en orden:

### Paso 1: Sincronización del Esquema y Tipos de Datos
```bash
npx prisma generate
```
*Garantiza que el cliente Prisma y los tipos generados concuerden con `prisma/schema.prisma`.*

### Paso 2: Suite de Pruebas Unitarias y de Regresión de Dominio
Ejecutar el conjunto completo de suites de pruebas con Node test runner:

```bash
# 1. Pruebas de Dominio Mercav Business (permisos, slugs, cifrado de legajos, nómina)
npm run test:business

# 2. Pruebas de Privacidad y Auditoría (Mervi Privacy, borrado seguro, redacción)
npm run test:privacy

# 3. Pruebas de Seguridad Pwn (CSRF, tokens, dominios, rate-limits, risk scoring)
npm run test:pwn

# 4. Pruebas de Calendario y Feriados (decretos bolivianos, Pésaj, Janucá, ICS)
npm run test:calendar

# 5. Pruebas de Verificación y Parseo Kosher
npm run kosher:test-osm
npm run kosher:test-verified
```
*Criterio de éxito: Todos los tests deben pasar con 0 fallos (`fail 0`).*

### Paso 3: Verificación Estática de Tipos TypeScript
```bash
npx tsc --noEmit
```
*Criterio de éxito: Cero errores de compilación de tipos en todo el proyecto.*

### Paso 4: Verificación de Build de Producción
```bash
npm run build
```
*Valida la compilación de Next.js, generación de páginas estáticas y enlaces entre Server Components y Client Components.*

---

## 4. Historial de Incidentes y Regresiones Prevenidas

### Caso 2026-10-17: Fallo al registrar trabajador en Mercav Business
- **Síntoma**: Al presionar «Guardar trabajador» en `/business/[slug]/trabajadores/nuevo`, la interfaz mostraba el toast rojo `Algo salió mal. Probá de nuevo.`.
- **Causa Raíz**:
  1. `lib/business/crypto.ts` lanzaba una excepción fatal si `BUSINESS_DATA_KEY` no estaba definida en producción.
  2. `app/api/business/[slug]/employees/route.ts` carecía de `try...catch`, devolviendo un error 500 HTML no parseable en lugar de JSON.
  3. Los campos de fecha podían enviar formatos locales `DD/MM/YYYY` desde ciertos navegadores en español.
- **Solución Aplicada**:
  - `lib/business/crypto.ts`: Derivación determinística fallback a partir de `NEXTAUTH_SECRET`.
  - `app/api/business/[slug]/employees/route.ts` y `[id]/route.ts`: Bloques `try...catch` con respuesta JSON `{ success: false, error: ... }`.
  - `components/business/EmployeeForm.tsx`: Normalización automática de fechas (`normalizeDateStr`).
  - Verificación SDD: 37/37 pruebas de Business y 17/17 pruebas de Privacy aprobadas satisfactoriamente.
