# Migración de base de datos — Mercav Pwn

Este archivo explica cómo aplicar el esquema de Pwn sin borrar los datos que Mercav ya tiene.

## Qué cambia

Hay tres migraciones nuevas, en este orden:

| Carpeta | Qué hace |
|---|---|
| `prisma/migrations/20260923043000_pwn_mvp` | Crea las tablas de Pwn: fuentes, filtraciones, exposiciones, vulnerabilidades, organizaciones, objetivos, alertas, informes, auditoría e ingesta. |
| `prisma/migrations/20260923050000_pwn_target_verification` | Añade el estado de verificación del objetivo (`PENDING` / `VERIFIED`), el hash del token DNS y `verifiedAt`. |
| `prisma/migrations/20260923060000_pwn_ops` | Guarda el dominio que el dueño monitorea (`targetLookup`), el contador compartido de límite de uso (`PwnRateBucket`) y las claves únicas de filtración y exposición. |
| `prisma/migrations/20260923210000_pwn_forum_signals` | Tabla `PwnForumSignal`: titulares y enlaces de foros allowlisted (sin cuerpo del hilo ni credenciales). |
| `prisma/migrations/20260923213000_pwn_forum_signal_kind` | Columna `signalKind` (`DATABASE`, `MIXED`, `CREDENTIALS`, `OTHER`). |
| `prisma/migrations/20260923220000_pwn_forum_signal_enrichment` | `priorityRank` (gobierno primero), `titleKey` (dedupe), `breachId` (correlación HIBP). |

Los correos no se guardan en claro. `targetLookup` solo se llena para dominios. El hash de identificadores es HMAC-SHA256 con `PWN_IDENTIFIER_PEPPER`. Si esa clave cambia, los objetivos ya guardados dejan de coincidir y hay que crearlos de nuevo.

## Antes de tocar producción

El historial de Prisma de Mercav no cubre todo el esquema actual. Modelos como POS, tickets, insignias y sanciones se añadieron al `schema.prisma` sin una migración en `prisma/migrations`. Por eso **no uses `prisma migrate dev` contra la base de producción**: puede detectar esa diferencia y ofrecer un reset, que borra los datos.

Usa `prisma migrate deploy`, que solo aplica las carpetas que faltan en `_prisma_migrations`.

Comprueba antes:

```bash
npx prisma migrate status
```

Si la base de producción ya tiene las tablas viejas de Mercav pero `_prisma_migrations` está vacío o incompleto, no dejes que Prisma “arregle” el historial borrando nada. Marca como aplicadas las migraciones que ya están reflejadas en esa base y despliega solo las de Pwn. Si no estás seguro, saca un backup y para.

## Backup

```bash
pg_dump "$DATABASE_URL" --format=custom --file=mercav-before-pwn.dump
```

Guarda ese archivo fuera del servidor antes de seguir.

## Aplicar en un entorno que ya tiene las tablas de Mercav

1. Backup.
2. Variables: `DATABASE_URL`, y para arrancar Pwn después, `PWN_ENABLED=true`, `PWN_IDENTIFIER_PEPPER` (un secreto largo y aleatorio) y `HIBP_API_KEY` si vas a consultar Have I Been Pwned. `CRON_SECRET` solo si vas a llamar a `POST /api/pwn/internal/cycle`.
3. Genera el cliente y aplica las migraciones pendientes:

```bash
npx prisma generate
npx prisma migrate deploy
```

4. Confirma que existen `PwnSource`, `PwnMonitoringTarget` y `PwnRateBucket`.

`migrate deploy` no ejecuta seeds y no borra filas. La migración de verificación pone los objetivos que ya existieran en `PENDING`. En una base nueva no hay objetivos previos.

## Base local vacía

Si la base local está vacía y el historial de migraciones no alcanza para crear el resto de Mercav, `migrate deploy` va a fallar porque las migraciones antiguas no crean todas las tablas que el esquema espera (por ejemplo `User` tiene columnas que ninguna migración añade).

En local, con una base desechable, la vía que ya usaba el proyecto es:

```bash
docker run -d --name mercav-postgres \
  -e POSTGRES_USER=mercav \
  -e POSTGRES_PASSWORD=mercav \
  -e POSTGRES_DB=mercav_db \
  -p 5432:5432 postgres:16
npx prisma db push
```

El contenedor es solo para desarrollo. La contraseña de ese ejemplo no sirve en producción.

Eso alinea el esquema completo, incluido Pwn, sin pasar por el historial incompleto. No lo uses en producción.

## Después de migrar

- Pwn responde 404 hasta que `PWN_ENABLED=true`.
- Sin `PWN_IDENTIFIER_PEPPER`, crear un objetivo o buscar con sesión devuelve error. No hay un hash sin clave de respaldo.
- El límite de uso lee `PwnRateBucket`. Si esa tabla todavía no existe, las rutas vuelven a un contador en memoria de esa instancia.
- El ciclo de dominios verificados es `POST /api/pwn/internal/cycle` con `Authorization: Bearer $CRON_SECRET`. No guarda correos y no reconsulta correos: la alerta de un correo sale cuando su dueño lo busca.
- Ese mismo ciclo sincroniza señales (`PwnForumSignal`) desde foros allowlisted y RSS (catálogo en `feed-catalog.ts`: DarkNetArmy, Hackread, BleepingComputer, THN, SecurityWeek, Dark Reading, Krebs, Security Affairs, The Record, Cybersecurity Dive, Help Net Security, Infosecurity Magazine, CSO, ZDNet, The Register, WeLiveSecurity, Talos, Malwarebytes, Unit 42, CyberScoop, InformationWeek, IT Security Guru, TechRadar, SentinelOne, CrowdStrike). Solo metadatos; reclasifica en lote, correlaciona titulares con brechas HIBP y puede crear alertas si el titular menciona un dominio verificado. Prioridad: sector gubernamental (`priorityRank ≥ 200`). API: `GET /api/pwn/forum-signals?kind=DATA`, `?gov=true`. Admins: `/pwn/sources` (activar/desactivar feeds). Cron horario en `vercel.json`. `PWN_FORUM_SCRAPE=false` apaga el scrape.
- `pwn.mercav.lat` es el mismo despliegue. El middleware reescribe `/` a `/pwn`. No hace falta una base distinta.
<!-- creado por Patodev y Invertilo -->
