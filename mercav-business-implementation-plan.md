# Mercav Business — Plan de implementación

> Reemplaza al módulo POS. Compite con Cocoa Business como **SaaS de RR.HH.**, no como billetera.
> Fecha: 8 de octubre de 2026 · Rama base: `pwn` · Estado: primera tanda construida (ver abajo); el resto sigue como propuesta para los tres cofundadores.

---

## Estado al 8 de octubre de 2026

**Qué se construyó en esta tanda** (en el árbol de trabajo de `pwn`, sin commit todavía):

- **Dónde vive:** Business está dentro de la app, en `app.mercav.lat/business/<slug>`, y no en `business.mercav.lat/<slug>`. Usa el shell de la app (`components/app-shell/AppPage.tsx`), con el mismo header y la misma barra inferior. El subdominio por empresa y la marca blanca quedan para más adelante.
- **Alcance:** empresas + legajos + planilla de Bolivia. No hay fichaje, turnos ni vacaciones todavía: la planilla (Fase 3 del plan original) salió antes que el Tiempo (Fase 1).
  - Empresas (`BusinessWorkspace`) con slug, país, moneda y región. Se crean desde `/business`.
  - Miembros con roles `OWNER`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`, `ACCOUNTANT` (matriz en `lib/business/permissions.ts`).
  - Legajos (`BusinessEmployee`) con CI y cuenta bancaria cifrados AES-256-GCM (`lib/business/crypto.ts`, clave `BUSINESS_DATA_KEY`). El salario queda sin cifrar (`baseSalary`, Decimal) para poder calcular la planilla; lo protege el permiso `employees.viewSensitive`.
  - Invitaciones por link de un solo uso, 7 días, solo se guarda el hash. Todavía sin email.
  - Planilla mensual con el motor boliviano (`lib/business/bolivia/params.ts` con parámetros 2026, fuentes y lista `verify`; `payroll.ts`). Excel con las columnas de la planilla del Ministerio de Trabajo y boleta de pago en PDF. La interfaz la rotula como pre-planilla.
  - Auditoría en `BusinessAuditLog`.
  - Migración `prisma/migrations/20261008120000_business_calendar` (solo agrega; ver `migrate.md`). Tests: `npm run test:business`.
- **Latinoamérica:** cada empresa tiene país y moneda. Los legajos sirven en los 20 países de `lib/geo/latam.ts`, con los nombres locales de cada documento. El motor de planilla va por país (`lib/business/countries.ts`, `PAYROLL_COUNTRIES`); hoy solo está Bolivia.
- **Calendario** (`/calendario`): feriados de 20 países (Bolivia con reglas y decretos propios; el resto con `date-holidays`) y calendario hebreo con `@hebcal/core`. Alimenta los feriados de Business: el resumen de cada empresa muestra los próximos días no laborables de su país y región. Reemplaza a la tabla `BusinessHoliday` del borrador.
- **Caja (POS) dentro de Business:** decidido el 10 de octubre de 2026. Cada empresa tiene su caja en `/business/[slug]/caja` (vender, inventario, reportes y configuración) con todo lo que tenía el POS. La usan sus miembros con su cuenta y según su rol (`pos.sell`, `pos.void`, `pos.inventory`, `pos.reports`, `pos.configure` en `lib/business/permissions.ts`): quien entra con un link de invitación como trabajador ya puede vender. La caja personal de antes sigue en `/dashboard/pos` y el dueño la trae a su empresa con un botón. Migración `20261010120000_business_pos`.

**Qué sigue pendiente del plan:**

- Fichaje (geocerca, selfie, QR, kiosco con PIN), turnos, vacaciones y comunicados.
- Web push y service worker, almacenamiento durable (bucket privado), email transaccional.
- Manifest PWA y tema por empresa (marca blanca), y el subdominio por empresa si se decide.
- Puente Jobs → legajo.
- Motores de planilla de otros países.
- Facturación electrónica del SIN y cobro (`BusinessSubscription`).
- 2FA obligatorio para `OWNER` y `HR_ADMIN`, y tests de aislamiento entre empresas ruta por ruta (hoy hay tests de la matriz de permisos, slugs y cifrado).
- Quedan menciones al POS en FAQ, soporte, mensajes de bienvenida, keywords de `app/layout.tsx`, `lib/legal/documents.ts` y el panel (`app/dashboard`). Falta la sección de Business en los textos legales.

---

## 0. Resumen

- **Qué cambia:** el séptimo módulo deja de ser "POS" y pasa a ser **Mercav Business**, una plataforma de RR.HH. para empresas de Latinoamérica, con Bolivia primero: asistencia, turnos, vacaciones, legajos, comunicados, onboarding, copiloto de IA y planillas de sueldo (la de Bolivia ya está; ver «Estado»).
- **Cómo le ganamos a Cocoa:** no peleamos su billetera ni su red de comercios. Peleamos donde Cocoa Business es flojo:
  1. **Del aviso de empleo a la planilla.** Mercav ya tiene Jobs. Cocoa empieza en el onboarding; nosotros empezamos en la vacante.
  2. **Normativa boliviana de verdad.** Planilla mensual para el Ministerio de Trabajo, planilla tributaria RC-IVA, Gestora y CNS. Cocoa solo muestra cálculos sueltos (RC-IVA, aguinaldo, horas extra).
  3. **La plata se queda en el banco.** No convertimos sueldos ni bonos en puntos y no custodiamos dinero. Sin zona gris regulatoria.
  4. **Gratis para empresas chicas.** Hasta 10 trabajadores sin costo, y precio en la moneda de cada país (en Bolivia, bolivianos).
  5. **Seguridad incluida.** Pwn monitorea el dominio de la empresa (diferencial que nadie más tiene en Bolivia).
- **Qué pasa con POS:** sale de toda la marca y la navegación ya. El código y los datos se conservan; las piezas útiles (PIN de personal, cola offline, export XLSX, escáner de cámara) se reusan para el kiosco de fichaje. Ver §3.
- **Orden de trabajo:** Fase 0 fundaciones (2 semanas) → Fase 1 MVP vendible (6 semanas, piloto con 3 empresas) → Fase 2 contratación, cultura e IA → Fase 3 planillas → Fase 4 extras. Las semanas son estimaciones para un equipo de 1 a 2 personas programando.

---

## 1. Contra quién competimos

Cocoa Business (cocoalatam.com/empresas), de COCOA S.R.L., Santa Cruz:

- US$ 1,5 por trabajador activo al mes, todo incluido, sin setup ni permanencia; 10/20/30% de descuento por prepagar 1, 2 o 3 años. Factura en Bs.
- "22 módulos en 8 grupos" (la home muestra 16 en 4): Beneficios (Cocoa Wallet, bonos, aguinaldo, adelantos), Personas (legajos, onboarding, cumpleaños, reconocimientos), Tiempo (asistencia, vacaciones, turnos, horas extra), Cultura (comunicados, encuestas, capacitación, IA copiloto).
- App nativa iOS/Android con la marca de la empresa. Panel web con KPIs, geocerca + reconocimiento facial, RC-IVA, permisos granulares.
- IA: "expertos" por área con RAG sobre documentos, quizzes de onboarding y voz.
- El SaaS es barato a propósito: es el canal para meter usuarios en su billetera de puntos, que solo se gastan en comercios afiliados (el comercio paga 2% más el cashback).

### Comparativa

| Capacidad | Cocoa Business | Mercav Business | Fase |
|---|---|---|---|
| App con la marca de la empresa | Nativa iOS/Android | PWA instalable con nombre, ícono y colores de la empresa; wrapper nativo si un cliente lo exige | 1 / 4 |
| Fichaje | Geocerca + facial | Geocerca + selfie, QR rotativo, kiosco con PIN y modo offline | 1 |
| Turnos y horas extra | Sí | Sí, con recargos de la LGT calculados | 1 |
| Vacaciones | Sí | Sí, con saldo automático por antigüedad (15/20/30 días hábiles) | 1 |
| Comunicados | Sí | Sí, segmentados, con push y confirmación de lectura | 1 |
| Legajos y onboarding | Sí | Sí, y el legajo se crea solo desde una postulación CONTRATADO en Jobs | 1 / 2 |
| Reclutamiento (ATS) | No | Jobs integrado: vacante → postulación → entrevista → contratado → legajo | 2 |
| Encuestas, eNPS, reconocimientos | Sí | Sí | 2 |
| Copiloto de IA | RAG + quizzes + voz | RAG con citas + quizzes + **datos propios del empleado** (su saldo de vacaciones, sus turnos) + guía de la LGT | 2 |
| Planillas de sueldo | Parcial | Pre-planilla completa + exportes para Ministerio de Trabajo (OVT) y SIN | 3 |
| Beneficios | Billetera cerrada a su red | Convenios con comercios + adelantos que paga el banco de la empresa; Mercav no toca la plata | 3 |
| Seguridad de cuentas | — | Pwn: monitoreo de filtraciones del dominio de la empresa | 4 |
| Panel multiempresa para contadores | No visible | Sí, como canal de venta | 4 |
| Precio | US$ 1,5 / trabajador | Gratis hasta 10; luego precio por trabajador en moneda local (§8) | 0 |

### Dónde **no** competimos

- Billetera, cashback, red de comercios, carga de saldo. Además de ser otro negocio, guardar plata de terceros en Bolivia es terreno regulado (ASFI). Cocoa se apoya en una autorización de promociones de la AJ, y la Ley 1733 (mayo 2026) habría quitado esa autorización previa. No queremos ese riesgo.
- Paridad de "22 módulos" desde el día uno. Salimos con menos módulos y mejor hechos; el número crece por fase.

---

## 2. Qué ya existe en el repo y se reusa

| Pieza | Dónde | Uso en Business |
|---|---|---|
| Login, Google, 2FA TOTP, reCAPTCHA | `lib/auth.ts`, `app/api/user/2fa/*` | Mismo login. Exigir 2FA a OWNER y HR_ADMIN |
| Sesión compartida entre subdominios | `AUTH_COOKIE_DOMAIN` en `lib/auth.ts` L55-71 | Business vive en `app.mercav.lat/business`: usa la sesión de la app sin nada extra |
| Reglas por host | `middleware.ts` (`productHostRedirect`, `isKosherHostPath`) | Si algún día hay subdominio por empresa, se suma ahí |
| `Company` / `CompanyMember` | `prisma/schema.prisma` L101-126 | Identidad pública de la empresa (ya la usa `JobPost.officialCompanyId`). El tenant va aparte (§4.1) |
| Jobs (`JobPost`, `Application`, estados hasta `CONTRATADO`) | schema L436-510, `app/dashboard/postulantes` | Puente ATS → legajo |
| Invitación por token, un solo uso | `KosherInvite` L1910, `app/api/kosher/invites/[token]/route.ts` L28-53 | Plantilla para invitar empleados |
| Personal con PIN bcrypt + bloqueo | `POSStaff` L1114, `lib/pos/staff.ts`, `app/api/pos/staff/verify` (sin uso hoy) | Kiosco de fichaje con PIN |
| Cola offline con idempotencia | `lib/pos/offline.ts` (`clientRef`) | Fichaje sin señal |
| Distancia haversine | `lib/kosher/geo.ts` | Geocerca |
| Cámara | `components/pos/BarcodeScanner.tsx` | Escanear el QR del kiosco; base para selfie |
| TOTP (`otplib`) | ya instalado | QR rotativo del kiosco |
| Rate limit en base de datos | `app/api/pwn/_lib/rate-limit.ts` | Bloqueo de PIN compartido entre instancias |
| Auditoría con Json e índices | `PwnAuditLog` L1398 | Modelo para `BusinessAuditLog` |
| Notificaciones in-app | `Notification` L571, `lib/notifications.ts` | Avisos de aprobaciones |
| Polling por pestaña visible | `components/kosher/ThreadView.tsx` | Comunicados e inbox |
| PDF con marca | `app/herramientas/pdf.ts` | Boletas de pago, certificados |
| Export XLSX | `app/dashboard/pos/reports/page.tsx` L66-131 | Reportes de asistencia y planillas |
| Shell propio con header glass | `components/pos/POSHeader.tsx` | Patrón para el shell de Business |

### Lo que falta y bloquea (Fase 0)

1. **Multi-tenant real:** no hay workspace con miembros, roles por empresa ni aislamiento de datos.
2. **Almacenamiento durable:** hoy los archivos van a `public/uploads` en disco local y se pierden en Vercel; las imágenes del feed van en base64 dentro de la base. Selfies, logos y documentos necesitan bucket privado.
3. **Email transaccional:** solo hay `nodemailer` en el formulario de inversores. Las invitaciones lo necesitan.
4. **Web push y service worker:** no existen. Sin push, los comunicados y los recordatorios de fichaje pierden la mitad del valor.
5. **Cobro por trabajador:** Stripe solo hace PaymentIntents únicos en USD, por usuario. No hay suscripciones, cantidades ni facturas.
6. **Lógica laboral boliviana:** no existe nada (aguinaldo, RC-IVA, Gestora, CNS, horas extra).

---

## 3. Qué hacemos con POS

**Recomendación:** retirar la marca POS ya, congelar el código y no borrar datos.

1. **Medir antes de decidir:** contar `POSConfig` con ventas en los últimos 30 días. Si son pocos o cero, el costo de migrar es mínimo.
2. **Marca:** cambiar todas las menciones de POS por Business (lista en §7). El ítem del menú apunta a `/business` (landing + pedir demo).
3. **Usuarios actuales:** `/dashboard/pos` sigue funcionando sin aparecer en la navegación, con un aviso: "El POS deja de recibir mejoras. Tus ventas y reportes siguen disponibles; exportalos cuando quieras." Plazo sugerido: 90 días.
4. **Decisión (10 de octubre de 2026): "Caja" como complemento de Business.** Ver «Estado». Lo que sigue de esta sección queda como historia.
5. **Antes:** decisión de los fundadores entre dos caminos:
   - **Archivar:** quitar las rutas y dejar los datos en la base (o un export final).
   - **"Caja" como complemento de Business** para clientes de retail y gastronomía: los cajeros pasan a ser empleados del workspace y las sesiones de caja quedan ligadas al turno. Solo vale la pena si un cliente piloto lo pide.
6. **Piezas que se reusan sí o sí:** PIN y bloqueo, cola offline, `staff/verify`, export XLSX, escáner de cámara.
7. **Documentación interna:** hecho el 8 de octubre (y actualizado el 10: la caja vuelve, dentro de Business). `CONTEXTO.md` ya dice que el POS está retirado y que Business lo reemplaza.

---

## 4. Arquitectura

### 4.1 Tenancy

- **`Company`** queda como identidad pública (perfil, vacantes en Jobs). Hoy cualquiera puede crear una por nombre y el nombre es único global, así que se puede ocupar un nombre ajeno. Por eso no la usamos como tenant directamente.
- **`BusinessWorkspace`** es el tenant privado de RR.HH. Tiene `slug` propio, marca, plan y facturación. Se vincula opcionalmente 1:1 con una `Company` verificada (`companyId @unique`), lo que habilita el puente con Jobs.
- **`BusinessMember`** = acceso (usuario Mercav + rol en ese workspace).
- **`BusinessEmployee`** = legajo. `userId` es opcional: un trabajador sin cuenta Mercav puede fichar en el kiosco con PIN, igual que `POSStaff` hoy.
- **Regla de oro:** toda consulta lleva `workspaceId`. Un solo helper resuelve contexto y permisos, y ninguna ruta de `/api/business` consulta Prisma sin pasar por él:

```ts
// lib/business/context.ts
getBusinessContext(slug): Promise<{
  user; workspace; member; employee | null;
  can(permission: BusinessPermission, scope?: { branchId?: string; employeeId?: string }): boolean;
}>
```

- Implementado como `resolveBusiness`, `requireBusiness` y `apiBusiness` en `lib/business/context.ts`, con la matriz de `lib/business/permissions.ts`.
- **Tests de aislamiento** (como `npm run test:pwn`): para cada ruta, un usuario del workspace A no puede leer ni escribir nada del workspace B.

#### Roles por workspace

| Permiso | OWNER | HR_ADMIN | MANAGER | EMPLOYEE | ACCOUNTANT (externo) |
|---|---|---|---|---|---|
| Facturación, marca, borrar workspace | ✔ | — | — | — | — |
| Alta/baja de empleados, legajos completos | ✔ | ✔ | — | — | lectura |
| Salarios y datos bancarios | ✔ | ✔ | — | solo los suyos | lectura |
| Aprobar vacaciones, horas extra, correcciones de fichaje | ✔ | ✔ | su equipo o sucursal | — | — |
| Turnos | ✔ | ✔ | su equipo o sucursal | ver los suyos | — |
| Comunicados | ✔ | ✔ | a su equipo | leer | — |
| Planillas y exportes | ✔ | ✔ | — | su boleta | ✔ |
| Fichar, pedir vacaciones, copiloto | ✔ | ✔ | ✔ | ✔ | — |

Los roles globales (`UserRole`) no cambian. El rol de Business vive en `BusinessMember.role`.

### 4.2 Rutas

Business vive en `app.mercav.lat/business/<slug>/...`, dentro de la app, sin subdominio propio. `/api`, `/login` y `/register` son los de la app. El subdominio por empresa (o `business.mercav.lat/<slug>`) y la marca blanca quedan para más adelante.

El árbol de abajo es el objetivo. Hoy existen `page.tsx` (crear empresa o elegir una), `unirse/[token]/` y, dentro de `[slug]/`, el resumen, `trabajadores/`, `planillas/`, `mis-boletas/` y `ajustes/`.

```
app/business/
  page.tsx                       landing pública: propuesta, comparativa, calculadora, pedir demo
  nueva/                         asistente para crear workspace (empresa, NIT, sucursales, marca)
  unirse/[token]/                aceptar invitación
  [slug]/
    layout.tsx                   carga workspace, inyecta tema de la marca, valida membresía
    manifest.webmanifest/route.ts   manifest PWA por empresa (nombre, ícono, colores, start_url)
    panel/                       RR.HH. (escritorio primero)
      page.tsx                   KPIs: asistencia %, tardanzas, ausencias, pendientes de aprobar
      personas/  asistencia/  turnos/  vacaciones/  comunicados/  documentos/
      planillas/ (F3)  ajustes/ (marca, sucursales, políticas, roles)  facturacion/
    app/                         colaborador (celular primero)
      page.tsx                   "Hola, Lucía": fichar, próximo turno, saldo de vacaciones, comunicados
      fichar/  turnos/  vacaciones/  comunicados/  documentos/  perfil/  copiloto/ (F2)
    kiosco/                      tablet en la sucursal: QR rotativo + teclado de PIN
app/api/business/[slug]/...
```

- Header, Footer y BottomNav **no** se ocultan: Business usa el modo app de esos componentes y aparece en `lib/app/sections.ts`.
- `lib/seo/site.ts`: hecho. `/business` está en `PRIVATE_PREFIXES` y su canonical es `app.mercav.lat`.
- `next.config.mjs`: cuando llegue el fichaje, headers para `/business` con `Permissions-Policy: camera=(self), geolocation=(self)` (pwn y kosher los restringen).

### 4.3 Marca blanca sin App Store

Pendiente. Hoy Business se ve con la marca Mercav.

- **Tema por empresa:** `[slug]/layout.tsx` sobreescribe los tokens (`--color-gold`, `--mv-on-gold`, etc.) con el color de la empresa. Calcular el color de texto encima para que el contraste cumpla WCAG AA; si el color elegido no da, se oscurece automáticamente.
- **Manifest por empresa:** `name`, `short_name`, `icons` (generados desde el logo), `theme_color`, `start_url: /business/<slug>/app`, `scope: /business/<slug>/` (o la raíz del subdominio de la empresa, si se hace). El empleado instala "Acme RR.HH." en su pantalla de inicio.
- **Demo en vivo en la landing**, como hace Cocoa: elegís logo y color y ves la app del empleado cambiando.
- **iOS:** el push web solo funciona con la PWA instalada (iOS 16.4+). El onboarding del empleado tiene que guiar la instalación con capturas, en el primer ingreso.
- **Wrapper nativo (Capacitor):** solo si un cliente grande lo exige para la tienda. Fase 4.

### 4.4 Fichaje

| Método | Cómo funciona | Prueba de presencia |
|---|---|---|
| **Geocerca** | `navigator.geolocation` al tocar "Marcar entrada". El servidor compara con el radio de la sucursal (`haversineKm`) | Ubicación + precisión reportada |
| **Selfie** | Foto con la cámara frontal al fichar. Se guarda como evidencia en un bucket privado | Foto con hora del servidor |
| **QR rotativo** | La tablet del kiosco muestra un QR que cambia cada 30 s (TOTP con `otplib`, secreto por kiosco). El empleado lo escanea con su celular | Estar frente al kiosco |
| **PIN en kiosco** | Para quien no tiene celular o cuenta. Teclado en la tablet, PIN bcrypt, bloqueo en base de datos | Kiosco registrado en la sucursal |

- **Configurable por sucursal:** qué métodos se exigen (por ejemplo, oficina = geocerca; planta = kiosco).
- **Fuera de zona no se rechaza:** se registra con la marca `FUERA_DE_ZONA` y queda pendiente de aprobación del manager. Rechazar en seco genera reclamos y tickets de soporte.
- **Offline:** el fichaje se encola con `clientRef` (patrón de `lib/pos/offline.ts`) y la hora del dispositivo. El servidor guarda también `receivedAt` y marca la diferencia si supera 10 minutos.
- **Privacidad como argumento de venta:** la ubicación se pide **solo al fichar**, nunca en segundo plano. Las selfies se borran a los 90 días (configurable). Consentimiento explícito en el primer uso, guardado con fecha y versión del texto.
- **Reconocimiento facial automático:** Fase 3 y opcional. Es un dato biométrico; en el MVP alcanza con la selfie como evidencia y revisión humana.

### 4.5 Motor laboral boliviano (`lib/business/bolivia/`)

Funciones puras con tests, sin acceso a la base. Los parámetros que cambian por año (salario mínimo, topes, porcentajes) viven en `lib/business/bolivia/params.ts`, uno por año, con sus fuentes y una lista `verify` de lo que falta confirmar. Cada planilla guarda una copia en `BusinessPayrollRun.params`, así un cambio futuro no altera planillas viejas. (El borrador proponía una tabla `BusinessLaborParams`; por ahora no hace falta.) Otros países se suman como motores aparte en `lib/business/<país>/` y en `PAYROLL_COUNTRIES`.

| Regla | Valor a implementar (validar con contador antes de lanzar) |
|---|---|
| Salario mínimo 2026 | Bs 3.300 (DS 5516, retroactivo al 1 de enero) |
| Vacaciones | Nacen al cumplir 1 año: 15 días hábiles (1-5 años), 20 (5-10), 30 (10+) — LGT art. 44 |
| Jornada | 8 h/día, 48 h/semana; 40 h para mujeres; varía por sector — configurable por política |
| Horas extra | Recargo del 100% (LGT art. 55); deben estar autorizadas |
| Domingos y feriados trabajados | Pago triple según fuentes secundarias — confirmar |
| Nocturno | Recargo del 25% al 50% según el caso — confirmar |
| Bono de antigüedad | Desde los 2 años; base 1 SMN (no productivas) o 3 SMN (productivas); tabla de porcentajes — confirmar |
| Aguinaldo | Pago hasta el 20 de diciembre, proporcional a lo trabajado. Segundo aguinaldo solo si el gobierno lo habilita (bandera manual) |
| Aporte laboral Gestora | 12,71% del total ganado |
| Aporte Nacional Solidario | Desde Bs 13.000 de total ganado, por tramos — confirmar tramos |
| Aporte patronal CNS | 10% del total ganado |
| Otros aportes patronales | 16,71% o 17,21% según la fuente (cambio de Ley 1582) — confirmar |
| RC-IVA | 13%. Umbral y periodicidad del Formulario 608 con datos en conflicto — confirmar con el SIN |
| Planilla al Ministerio de Trabajo | Mensual, por la OVT, vence el 15 del mes siguiente (DS 3433) |
| Planilla tributaria | Planilla Tributaria V.3, archivo `PLA_NIT_AAAA_MM.csv`, por Oficina Virtual del SIN |
| Feriados | Nacionales + departamentales, calculados por regla y decreto en `lib/calendar/bolivia.ts` (Calendario). Editables por la empresa: pendiente |

- En la Fase 1 solo se usan vacaciones, jornada, horas extra y feriados. El resto entra en la Fase 3.
- **Antes de la Fase 3, contratar un contador o abogado laboral boliviano** que revise el motor y firme los casos de prueba. Mientras tanto, la interfaz dice "pre-planilla" y el cálculo final lo confirma el contador del cliente.

### 4.6 Copiloto de IA

Hoy las herramientas llaman a la API de Anthropic con `fetch` directo y un modelo retirado (`claude-3-5-sonnet-20241022`). Para Business:

- **SDK oficial `@anthropic-ai/sdk`** en vez de `fetch`. Modelo `claude-opus-5-5` con `effort` bajo para chat. Si el costo por empresa no cierra, evaluar un modelo más barato es decisión de los fundadores, con datos de uso reales.
- **Base de conocimiento por empresa:** los documentos de la empresa (reglamento interno, políticas, manuales) van como bloques `document` con `citations: {enabled: true}`. Cada respuesta cita el párrafo de donde sale. Para una PyME, los documentos entran completos en contexto. Se marcan con `cache_control` para que las preguntas siguientes paguen la lectura en caché. Recién si una empresa supera el contexto se suma búsqueda vectorial.
- **Datos propios del empleado:** herramientas con `strict: true` (`mi_saldo_vacaciones`, `mis_proximos_turnos`, `mis_fichajes_del_mes`). Se ejecutan en el servidor con el contexto del usuario, nunca con un id que mande el modelo. El copiloto no puede ver datos de otros empleados.
- **Guía laboral de Mercav:** un documento de la LGT resumido y revisado por el asesor laboral, común a todas las empresas.
- **Quizzes de onboarding:** generados desde los documentos con salidas estructuradas (`output_config.format`). No se pueden combinar con las citas en la misma llamada, así que son dos llamadas separadas.
- **Manejo de rechazos:** revisar `stop_reason` antes de leer el contenido y activar el parámetro `fallbacks` del lado del servidor.
- **Límites:** cuota de mensajes por trabajador por mes según el plan. Uso registrado en `ToolUsage` o en una tabla propia.

### 4.7 Infraestructura transversal

| Necesidad | Propuesta |
|---|---|
| Archivos | Vercel Blob (o S3/R2) con bucket privado y URLs firmadas para selfies y documentos; público para logos. De paso, migrar `app/api/pos/upload` |
| Email | Resend (o el SMTP existente con una plantilla común) para invitaciones, aprobaciones y resumen semanal |
| Push | Service worker propio + Web Push con VAPID. Tabla `PushSubscription` por dispositivo. Sirve también para el resto de Mercav |
| Datos sensibles | Hecho: cifrado a nivel de campo (AES-256-GCM, `BUSINESS_DATA_KEY`, `lib/business/crypto.ts`) para CI y cuenta bancaria. El salario quedó sin cifrar para calcular la planilla, detrás del permiso `employees.viewSensitive`. **No usar `lib/crypto.ts`**, que solo invierte un base64 |
| Rate limit | El de Pwn en base de datos para PIN, invitaciones y copiloto |
| Auditoría | `BusinessAuditLog` al estilo `PwnAuditLog`: actor sin clave foránea, `metadata` Json, índices por workspace y fecha. Registra cada cambio de salario, legajo, fichaje corregido y exportación |
| Tareas programadas | Cron (Vercel, protegido con `CRON_SECRET` como Pwn) para recordatorios de fichaje, acumulación de vacaciones y cierre de mes |

### 4.8 Cobro

Una empresa boliviana grande necesita **factura fiscal** y pagar en **bolivianos** (transferencia o QR). Stripe no cubre eso.

- **Fase 1 (piloto):** cobro manual. `BusinessSubscription` guarda plan, trabajadores contratados, período y estado. Se cobra por transferencia y se emite factura fuera del sistema. El panel muestra cuántos trabajadores activos hubo en el mes.
- **Fase 2:** Stripe Subscriptions con `quantity` = trabajadores, para empresas que pagan con tarjeta en USD. Webhooks `invoice.paid`, `customer.subscription.updated` y `customer.subscription.deleted`.
- **Fase 3:** integración con un proveedor de facturación electrónica del SIN y QR de pago interoperable.
- **Trabajador activo** = legajo en estado ACTIVO al menos un día del mes (el mismo criterio que Cocoa).
- **Ojo con el cobro actual:** el plan anual cobra un mes con 20% de descuento pero da 365 días (`lib/billing/plans.ts` L11 vs `lib/billing/fulfill.ts` L91). Corregirlo antes de copiar el patrón.

---

## 5. Modelos de datos (borrador)

Sigue la convención de prefijo por módulo (`POS*`, `Pwn*`, `Kosher*`). Los enums son nuevos.

> Este es el borrador original. Lo que ya se migró está en `prisma/migrations/20261008120000_business_calendar` y difiere: la empresa tiene `country`, `currency` y `region` (sin `timezone` ni `plan`), el salario es `baseSalary` sin cifrar, no hay sucursales todavía y `BusinessPayrollRun`/`BusinessPayrollLine` ya existen.

```prisma
model BusinessWorkspace {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  nit         String?
  companyId   String?  @unique          // vínculo con Company verificada (puente Jobs)
  ownerId     String
  logoUrl     String?
  brandColor  String?                   // hex; el contraste se calcula al guardar
  plan        BusinessPlan @default(FREE)
  timezone    String   @default("America/La_Paz")
  createdAt   DateTime @default(now())
  // members, employees, branches, departments, shifts, policies, announcements, documents...
}

model BusinessMember {          // acceso
  id          String @id @default(cuid())
  workspaceId String
  userId      String
  role        BusinessRole                     // OWNER | HR_ADMIN | MANAGER | EMPLOYEE | ACCOUNTANT
  branchScope String[]                         // sucursales que gestiona un MANAGER
  status      BusinessMemberStatus @default(ACTIVE)
  @@unique([workspaceId, userId])
}

model BusinessEmployee {        // legajo
  id             String @id @default(cuid())
  workspaceId    String
  userId         String?                       // null = solo kiosco
  branchId       String?
  departmentId   String?
  managerId      String?                       // otro BusinessEmployee
  firstName      String
  lastName       String
  ciEnc          String?                       // cifrado
  position       String?
  hireDate       DateTime
  endDate        DateTime?
  contractType   BusinessContractType
  salaryEnc      String?                       // cifrado
  bankAccountEnc String?                       // cifrado
  nua            String?                       // Gestora
  cnsNumber      String?
  pinHash        String?                       // kiosco
  status         BusinessEmployeeStatus @default(ACTIVE)
  sourceApplicationId String?                  // Application de Jobs que lo originó
  @@unique([workspaceId, userId])
}

model BusinessBranch     { id, workspaceId, name, address, lat Float, lng Float, radiusM Int @default(150), clockMethods BusinessClockMethod[] }
model BusinessKiosk      { id, workspaceId, branchId, name, totpSecretEnc, lastSeenAt }
model BusinessShift      { id, workspaceId, branchId?, name, startMin Int, endMin Int, breakMin Int, color }
model BusinessShiftAssignment { id, workspaceId, employeeId, shiftId?, date DateTime @db.Date, startAt, endAt }

model BusinessAttendance {
  id          String @id @default(cuid())
  workspaceId String
  employeeId  String
  kind        BusinessAttendanceKind           // IN | OUT | BREAK_START | BREAK_END
  method      BusinessClockMethod              // GEO | SELFIE | QR | KIOSK_PIN | MANUAL
  deviceAt    DateTime
  receivedAt  DateTime @default(now())
  lat         Float?
  lng         Float?
  accuracyM   Float?
  selfieKey   String?                          // clave en el bucket privado
  flags       String[]                         // FUERA_DE_ZONA, BAJA_PRECISION, DESFASE_HORA
  status      BusinessReviewStatus @default(OK) // OK | PENDING | APPROVED | REJECTED
  clientRef   String @unique                   // idempotencia offline
  @@index([workspaceId, employeeId, deviceAt])
}

model BusinessLeavePolicy  { id, workspaceId, type (VACACION|PERMISO|BAJA_MEDICA|...), rules Json }
model BusinessLeaveRequest { id, workspaceId, employeeId, type, startDate, endDate, days Decimal, status, approverId?, note }
model BusinessHoliday      { id, workspaceId?, date, name, scope (NACIONAL|DEPARTAMENTAL|EMPRESA), department? }

model BusinessAnnouncement     { id, workspaceId, authorId, title, body, audience Json, pinned, publishAt, requireAck Boolean }
model BusinessAnnouncementRead { announcementId, employeeId, readAt, ackAt? ; @@id([announcementId, employeeId]) }
model BusinessDocument         { id, workspaceId, title, fileKey, category, requireAck, usedByCopilot Boolean, version }
model BusinessDocumentAck      { documentId, employeeId, version, ackAt }

model BusinessInvite       { id, workspaceId, email?, phone?, role, employeeId?, tokenHash, expiresAt, usedAt? }
model BusinessSubscription { id, workspaceId, plan, seats Int, periodStart, periodEnd, status, provider (MANUAL|STRIPE), externalId? }
model BusinessAuditLog     { id, workspaceId, actorId, action, entity, entityId, metadata Json, createdAt ; @@index([workspaceId, createdAt]) }
model BusinessLaborParams  { id, country @default("BO"), validFrom, params Json }   // SMN, porcentajes, topes
model PushSubscription     { id, userId, endpoint @unique, p256dh, auth, userAgent, createdAt }

// Fase 2: BusinessOnboardingTemplate/Task, BusinessSurvey/Response, BusinessRecognition, BusinessLead
// Fase 3: BusinessPayrollRun/Line, BusinessAdvanceRequest, BusinessPerk (convenios)
```

**Migraciones:** escribir el SQL a mano en `prisma/migrations/<timestamp>_business_*`, como `20260923043000_pwn_mvp`, y aplicar con `npx prisma migrate deploy`. Nunca `prisma migrate dev` ni `db push` contra una base con datos; no correr `prisma format` (ver `migrate.md`).

---

## 6. Fases

### Fase 0 — Fundaciones y cambio de marca (semanas 1-2)

**Objetivo:** que Business exista como producto que se puede vender (landing + demo) y que la base técnica aguante empresas.

- [ ] Rebrand POS → Business en toda la copia (§7). El menú apunta a `/business`. Hecho en navegación, home, README y SVG; faltan FAQ, soporte, mensajes, keywords, legales y panel.
- [ ] Landing `/business`: propuesta, comparativa honesta, calculadora de precio, demo de marca en vivo, formulario "Agendá una demo" que guarda en `BusinessLead` y avisa por email. (Hoy `/business` pide sesión y muestra el alta de empresa.)
- [ ] Aviso de retiro en `/dashboard/pos` para usuarios actuales.
- [x] Modelos `BusinessWorkspace`, `BusinessMember`, `BusinessEmployee`, `BusinessInvite`, `BusinessAuditLog` y la migración a mano. Faltan `BusinessBranch` y `BusinessSubscription`.
- [ ] `lib/business/context.ts` con permisos + tests de aislamiento entre workspaces. El contexto y la matriz de permisos están, con tests; faltan los tests de aislamiento ruta por ruta.
- [x] Business dentro de `app.mercav.lat/business` (sin subdominio), con el header y la barra inferior de la app. Headers de permisos: cuando llegue el fichaje.
- [ ] Bucket privado + email transaccional + service worker con Web Push.
- [x] Cifrado a nivel de campo (CI y cuenta bancaria).
- [ ] Asistente `/business/nueva`: empresa, NIT, primera sucursal en el mapa (MapLibre ya está), logo y color. Hoy hay un formulario en `/business` con nombre, razón social, NIT, país, región, ciudad y rubro productivo; faltan sucursal, logo y color.
- [ ] Invitaciones por email y por link de WhatsApp; aceptar crea `BusinessMember` + vincula `BusinessEmployee`. El link de un solo uso ya funciona; falta el envío por email.
- [ ] 2FA obligatorio para OWNER y HR_ADMIN. **Hoy el login con Google se saltea el TOTP** (`lib/auth.ts`); corregirlo antes de guardar salarios.
- [ ] Activar el chequeo de tipos al menos para `app/business/**` y `lib/business/**` (hoy `next.config.mjs` ignora errores de build).

**Listo cuando:** una empresa se crea, invita a 3 personas, las 3 entran por `app.mercav.lat/business/<slug>` (con la marca de la empresa cuando exista la marca blanca), y un usuario de otra empresa recibe 403 en todas las rutas.

### Fase 1 — MVP vendible: Tiempo + Personas + Comunicados (semanas 3-8)

**Objetivo:** lo que una PyME con turnos (retail, gastronomía, logística, salud) paga desde el día uno.

- [ ] **Legajos y directorio:** alta individual y por Excel, ficha del empleado, organigrama simple, documentos adjuntos.
- [ ] **Fichaje:** geocerca + selfie + QR rotativo + kiosco con PIN, cola offline, marcas y aprobación de excepciones.
- [ ] **Turnos:** plantillas, asignación semanal con arrastrar y soltar, publicación con push, cambio de turno entre compañeros con aprobación.
- [ ] **Asistencia:** cálculo diario de horas trabajadas, tardanzas, ausencias y horas extra (recargo LGT); corrección manual auditada.
- [ ] **Vacaciones y permisos:** saldo automático por antigüedad, solicitud desde el celular, aprobación por el manager, calendario del equipo, feriados del país y la región de la empresa (salen de Calendario).
- [ ] **Comunicados:** segmentados por sucursal, área o cargo; push; confirmación de lectura obligatoria opcional; estadística de quién leyó.
- [ ] **Panel RR.HH.:** asistencia %, tardanzas, ausencias, pendientes de aprobar, filtros por sucursal y fecha, export XLSX.
- [ ] **App del colaborador:** "Hola, <nombre>", botón de fichar, próximo turno, saldo de vacaciones, comunicados sin leer.
- [ ] **Recordatorios:** push si no fichó 10 minutos después del inicio del turno; resumen semanal al manager.
- [ ] **Cobro manual** y plan gratis hasta 10 trabajadores con límite aplicado.
- [ ] **Piloto con 3 empresas** de Santa Cruz (20 a 150 trabajadores, con turnos rotativos).

**Listo cuando:** las 3 empresas piloto fichan todos los días durante 2 semanas, al menos el 80% de sus trabajadores instaló la PWA en los primeros 14 días, y RR.HH. exporta el reporte mensual de asistencia sin pedir ayuda.

### Fase 2 — Contratación, cultura e IA (semanas 9-13)

- [ ] **Puente Jobs → Business:** vacantes publicadas desde el workspace (con `officialCompanyId`); al pasar una postulación a `CONTRATADO`, botón "Crear legajo" que precarga datos del perfil y dispara el onboarding.
- [ ] **Mejoras de Jobs que pide el ATS:** tablero kanban de postulantes, notas internas (el campo `notes` ya existe y no se usa), mostrar las respuestas a las preguntas de filtro (hoy se guardan y no se ven), subida de CV.
- [ ] **Onboarding:** plantillas de tareas por cargo, documentos a firmar como leídos, primer día guiado en la app.
- [ ] **Cumpleaños, aniversarios y reconocimientos** con feed interno del workspace.
- [ ] **Encuestas y eNPS:** plantillas, anónimas o no, resultados por sucursal.
- [ ] **Copiloto de IA** (§4.6): base de conocimiento con citas, datos propios del empleado y guía laboral; quizzes de onboarding.
- [ ] **Stripe Subscriptions** por trabajador para quien pague con tarjeta.

### Fase 3 — Planillas bolivianas y beneficios (semanas 14-20)

- [ ] **Asesor laboral contratado** y casos de prueba firmados antes de empezar.
- [ ] **Motor de pre-planilla:** haber básico, bono de antigüedad, horas extra, dominicales, descuentos Gestora y ANS, RC-IVA, aportes patronales.
- [ ] **Exportes:** planilla mensual para la OVT del Ministerio de Trabajo (vence el 15), Planilla Tributaria V.3 para el SIN, formatos Gestora y CNS.
- [ ] **Boletas de pago** en PDF con la marca de la empresa (base `app/herramientas/pdf.ts`), visibles en la app del empleado.
- [ ] **Aguinaldo y finiquito** (indemnización y desahucio), calculados desde los datos reales del legajo.
- [ ] **Adelantos de sueldo como flujo:** el empleado pide, RR.HH. aprueba, el monto se descuenta en la planilla y lo paga la empresa desde su banco. Mercav nunca mueve el dinero.
- [ ] **Convenios:** directorio de descuentos con comercios aliados (se puede alimentar con anunciantes de Mercav Ads). Código o QR de descuento, sin saldo ni puntos.
- [ ] **Facturación electrónica SIN** y QR de pago para la suscripción.
- [ ] **Reconocimiento facial** opcional con consentimiento explícito.

### Fase 4 — Diferenciales (después de la semana 20)

- [ ] **Pwn para empresas:** el workspace verifica su dominio (el flujo DNS de Pwn ya existe) y recibe alertas de filtraciones de cuentas `@empresa`.
- [ ] **Panel multiempresa para contadores:** un estudio contable gestiona las planillas de varios clientes; canal de reventa con comisión.
- [ ] **API y webhooks** para sistemas contables y ERPs.
- [ ] **Wrapper nativo** (Capacitor) si un cliente grande lo exige para la tienda.
- [ ] **"Caja" como complemento** de Business, si algún cliente piloto lo pidió (§3).

---

## 7. Cambio de marca POS → Business (archivos)

Navegación y layout:
- `components/layout/Header.tsx` L37 (ítem de `PRODUCTS`), L342 (regex)
- `components/layout/Footer.tsx` L19, L114 (regex), L130 ("caja")
- `components/layout/BottomNav.tsx` L29 (regex)

Home y autenticación:
- `components/home/HomeClient.tsx` L56, L152, L270-290 (`PosPreview` → vista previa de la app del empleado), L397-407 (pestaña del módulo), L477
- `components/auth/AuthShell.tsx` L6, L11
- `app/register/page.tsx` L160-161
- `app/page.tsx` L154 (el "7 módulos" sigue siendo correcto)

Marketing:
- `app/pitch/page.tsx` L30, L37, L57, L66, L89
- `app/por-que-mercav/page.tsx` L56; `app/por-que-mercav/layout.tsx` L5-6
- `app/inversores/page.tsx` L221
- `app/precios/page.tsx` L12; `lib/toolPlanCatalog.ts` L8

Herramientas:
- `app/herramientas/HerramientasClient.tsx` L106-113, L165-171, L203-204, L225, L273-274, L334
- `app/herramientas/toolRoutes.ts` L3

Panel general:
- `app/dashboard/DashboardClient.tsx` L74-83, L104; `app/dashboard/page.tsx` L40

Ayuda y soporte:
- `app/faq/page.tsx` L24-31, L66, L90, L93
- `app/soporte/page.tsx` L71
- `app/mensajes/page.tsx` L86, L119

SEO, legal y changelog:
- `app/layout.tsx` L38-39 (keywords); `lib/seo/site.ts` L11 (`SITE_DESCRIPTION`, alimenta el manifest)
- `lib/legal/documents.ts` L34, L141, L152, L249-251. **Agregar una sección de Business** (datos de empleados, ubicación al fichar, selfies, rol de la empresa como responsable de los datos) antes de la Fase 1.
- `app/changelog/page.tsx`: entrada nueva

README y SVG (hecho el 8 de octubre):
- `README.md`: módulos, Business, Calendario, hosts, variables, tests y roadmap
- `.github/readme/hero.svg` y `.github/readme/modules.svg`

Interno (fuera de git):
- `CONTEXTO.md`: hecho el 8 de octubre. Faltan las notas de `obsidian/`

El código dentro de `components/pos/`, `lib/pos/`, `app/dashboard/pos/` y `app/api/pos/` no se renombra mientras POS siga en retiro.

---

## 8. Precio y salida al mercado

**Precio (hipótesis a validar con los pilotos):**

| Plan | Precio | Incluye |
|---|---|---|
| Gratis | 0 | Hasta 10 trabajadores. Tiempo, Personas y Comunicados. Marca Mercav visible |
| Business | En Bolivia, Bs 10 por trabajador activo al mes (hipótesis); en cada país, un precio en su moneda | Todo lo publicado, marca propia, soporte. Cada módulo nuevo incluido |
| Anual | 15% de descuento | Prepago |
| Contadores | Panel gratis | 20% recurrente por cliente que traen |

- Precio fijado en la moneda de cada país (la empresa ya guarda país y moneda). En Bolivia, en bolivianos: antes de publicarlo, compararlo con los US$ 1,5 de Cocoa al tipo de cambio que de verdad usan los clientes.
- No bajar precio para competir. El argumento son las planillas, la contratación y el plan gratis, no ser más barato.

**Salida:**
1. **Pilotos (Fase 1):** 3 a 5 PyMEs de Santa Cruz con turnos rotativos. Gratis durante el piloto a cambio de feedback semanal y testimonio.
2. **Mensaje:** "Del aviso de empleo a la planilla. Tu plata, en tu banco." Y "Solo pedimos tu ubicación cuando fichás."
3. **Canal contadores:** los estudios contables ya llevan las planillas de muchas PyMEs; si la herramienta les ahorra el cierre de mes, la recomiendan.
4. **Venta cruzada dentro de Mercav:** quien publica vacantes en Jobs ve "Gestioná a tu equipo después de contratar"; los anunciantes de Ads pasan a ser comercios con convenios.
5. **Comparativa honesta** en la landing, sin atacar a Cocoa por nombre en la publicidad.

---

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Error en cálculos laborales | Asesor laboral, casos de prueba firmados, parámetros versionados por año, rótulo "pre-planilla" hasta validar |
| Fuga de datos entre empresas | Helper único de contexto, tests de aislamiento en CI, auditoría |
| Datos sensibles (CI, salarios, selfies, ubicación) | Cifrado a nivel de campo, bucket privado con URLs firmadas, retención limitada, consentimiento registrado, 2FA para administradores |
| Fraude de fichaje | Combinar métodos por sucursal, marcas en vez de rechazos, revisión del manager, QR rotativo |
| Push poco confiable en iPhone | Guiar la instalación de la PWA desde el primer ingreso; email y notificación in-app como respaldo |
| Cobro sin factura boliviana | Cobro manual con factura en el piloto; proveedor de facturación electrónica en la Fase 3 |
| Querer igualar los 22 módulos | Fases cerradas; cada fase sale con criterios de "listo" |
| Deuda técnica actual | Arreglar en la Fase 0 lo que toca a Business: subidas a disco local, `lib/crypto.ts`, rate limit en memoria, TOTP salteado con Google, build que ignora errores, socket.io sin autenticación |

---

## 10. Métricas

- **Activación:** % de trabajadores invitados que instalaron la PWA y ficharon en los primeros 14 días.
- **Uso:** fichajes por trabajador por semana; % de comunicados leídos en 24 h.
- **Valor para RR.HH.:** tiempo para cerrar la asistencia del mes; solicitudes de vacaciones aprobadas desde el celular.
- **Negocio:** trabajadores pagos, ingreso mensual, cancelación mensual por empresa, empresas que pasan de Gratis a Business.
- **Embudo Jobs → Business:** contrataciones que terminan en legajo.

---

## 11. Decisiones para los cofundadores

1. ¿POS se archiva o queda como complemento "Caja" de Business? (Depende de cuántos POS activos haya.)
2. Precio final y si el plan gratis llega a 10 trabajadores o a menos.
3. ~~¿Subdominio `business.mercav.lat` o solo la ruta `/business`?~~ Resuelto el 8 de octubre: ruta `/business` dentro de `app.mercav.lat`. Queda abierto si más adelante cada empresa tiene su subdominio con marca blanca.
4. Proveedores: almacenamiento (Vercel Blob o R2), email (Resend o SMTP), facturación electrónica.
5. Quién es el asesor laboral y desde cuándo.
6. Las 3 a 5 empresas del piloto.

---

## Fuentes

- Cocoa: cocoalatam.com (home, /empresas, /afiliados, /app, /contacto, /terminos), revisado el 8 de octubre de 2026.
- Salario mínimo 2026 y planilla complementaria: [Ministerio de Trabajo, comunicado DGTHSO 0014/26](https://mintrabajo.gob.bo/wp-content/uploads/2026/04/COMUNICADO-DGTHSO-0014-26.pdf).
- Planillas mensuales por OVT: [DS 3433](https://www.lexivox.org/norms/BO-DS-N3433.html), [Manual de Planillas Mensuales (OVT)](https://ovt.mintrabajo.gob.bo/soporte/recursos/Manual%20de%20Planillas%20Mensuales.pdf), [comunicado DGTHSO 0008/2024](https://www.mintrabajo.gob.bo/wp-content/uploads/2024/03/Comunicado-DGTHSO-0008-2024.pdf).
- RC-IVA y Formulario 608: [boliviaimpuestos.com](https://boliviaimpuestos.com/b/7jw), [Formulario 607 (SIN)](https://www.impuestos.gob.bo/wp-content/uploads/2025/10/TEXTO-FORMULARIO-607.pdf).
- Vacaciones, horas extra y antigüedad (fuentes secundarias, validar): [Jibble: vacaciones](https://www.jibble.io/es/legislacion-laboral/bolivia/vacaciones), [Deel: horas extra](https://deel.com/es/blog/calcular-pago-horas-extra-bolivia/), [Deel: bono de antigüedad](https://www.deel.com/es/blog/bono-por-antiguedad-en-bolivia/), [toptrabajos: descuentos de planilla](https://www.toptrabajos.com/bo/blog/descuentos-planilla-bolivia/).
- Promociones empresariales y AJ: [Focus GN](https://focusgn.com/latinoamerica/bolivia-elimina-impuestos-y-autorizaciones-para-promociones-empresariales), [Ferrere](https://ferrere.com/en/news/desregulacion-de-las-promociones-empresariales/).
