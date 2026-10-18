# Cambios de base de datos para producción

Fecha: 17 de octubre de 2026  
Código objetivo: `619a92c` o posterior en `main`  
Alcance: onboarding de Business, guía de Mervi, páginas públicas por negocio y costos de productos/ventas.

## Resumen ejecutivo

Esta entrega requiere aplicar tres migraciones de Prisma, en este orden:

1. `20261017130000_business_public_pages`
2. `20261017131500_business_guide_preferences`
3. `20261017133000_pos_cost_tracking`

Las tres son aditivas. No eliminan tablas, columnas, productos, ventas, negocios ni usuarios existentes. Los cambios de landing, diseño de caja, copy, Mervi Privacy y la propuesta comercial no requieren una migración adicional.

## Qué cambia cada migración

### 1. Páginas públicas de negocios

Archivo: `prisma/migrations/20261017130000_business_public_pages/migration.sql`

Se crean:

- Enum `BusinessPublicPageStatus`: `DRAFT`, `PUBLISHED`, `PAUSED`.
- Tabla `BusinessPublicPage`, relacionada 1:1 con `BusinessWorkspace`.
- Tabla `BusinessPublicPageAlias`, para redireccionar slugs públicos anteriores.
- Índices únicos para negocio y slug público, e índices de estado/alias.

Efecto operativo:

- Ningún negocio existente queda público por aplicar la migración.
- Las páginas nacen en borrador y solo se indexan después de que el dueño las publique.
- La eliminación de un negocio elimina su página y alias asociados por cascada.

### 2. Progreso de la guía de Mervi

Archivo: `prisma/migrations/20261017131500_business_guide_preferences/migration.sql`

Se agrega:

- `User.lastBusinessWorkspaceId`, nullable.
- Tabla `BusinessGuideProgress`, única por usuario y negocio, con estado de omisión o finalización.

Efecto operativo:

- No modifica sesiones ni perfiles existentes.
- La guía aparece solo cuando una persona entra a un negocio y puede cerrarse o retomarse.
- Al eliminar un usuario o negocio, su progreso se elimina por cascada.

### 3. Costos de productos y ventas

Archivo: `prisma/migrations/20261017133000_pos_cost_tracking/migration.sql`

Se agrega:

- `POSProduct.costKnown BOOLEAN NOT NULL DEFAULT true`.
- `POSSaleItem.unitCostPrice DECIMAL`, nullable.

Efecto operativo:

- Los productos existentes quedan con `costKnown = true`, conservando el comportamiento anterior.
- Las ventas históricas mantienen `unitCostPrice = NULL`; los reportes las distinguen de un costo real igual a cero.
- Las ventas nuevas guardan el costo vigente del producto al completar la venta, para que la ganancia histórica no cambie si el costo se edita después.

## Procedimiento de despliegue

### Antes de aplicar

1. Desplegar desde el commit objetivo o una revisión posterior que contenga las tres carpetas de migración.
2. Confirmar el destino de `DATABASE_URL` y que apunta a producción antes de ejecutar cualquier comando.
3. Crear un respaldo probado de PostgreSQL y registrar la hora, versión de PostgreSQL y SHA de la aplicación.
4. Ejecutar el estado de Prisma en un entorno con las mismas variables de producción:

```bash
npx prisma migrate status
```

5. Verificar que las tres migraciones aparezcan como pendientes y que las anteriores estén registradas en `_prisma_migrations`.

Respaldo sugerido, guardado fuera del servidor de aplicación:

```bash
pg_dump --format=custom --file="mercav-before-20261017.dump" "$DATABASE_URL"
```

No usar `prisma db push` ni `prisma migrate dev` en producción. Tampoco ejecutar `npm run build` como sustituto de la migración: ese script del proyecto ejecuta importadores además de compilar.

### Aplicación

Aplicar las migraciones antes de desplegar el código que las consume:

```bash
npx prisma migrate deploy
```

Luego desplegar la aplicación y reiniciar los procesos web. El orden es seguro porque las migraciones solo agregan estructura; el código anterior tolera columnas y tablas adicionales.

### Verificación posterior

1. Ejecutar de nuevo:

```bash
npx prisma migrate status
```

Debe informar que la base está al día.

2. Confirmar estructura en PostgreSQL:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('BusinessPublicPage', 'BusinessPublicPageAlias', 'BusinessGuideProgress')
ORDER BY tablename;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('POSProduct', 'POSSaleItem', 'User')
  AND column_name IN ('costKnown', 'unitCostPrice', 'lastBusinessWorkspaceId')
ORDER BY table_name, column_name;
```

3. Hacer pruebas de aplicación con una cuenta de prueba:

- Crear o abrir un negocio y comprobar que la guía de Mervi se puede omitir y retomar.
- Crear una página pública, guardarla como borrador y confirmar que no responde públicamente hasta publicar.
- Publicar una página, comprobar la URL `/b/<slug>` y luego pausarla.
- Crear un producto con costo desconocido, hacer una venta de prueba y verificar que el reporte separa ese costo de un valor cero.
- Editar el costo de un producto después de venderlo y comprobar que el ítem de venta conserva el costo original.

No publicar una página de prueba con datos reales de un negocio sin autorización. En producción, pausar o borrar la página de prueba al terminar.

## Caso especial: producción sin historial de Prisma

Si `prisma migrate deploy` devuelve el error `P3005` porque la base ya contiene tablas pero no tiene historial en `_prisma_migrations`, detener el despliegue. No marcar migraciones como aplicadas a ciegas y no ejecutar las tres migraciones varias veces.

Antes de baselinar se debe:

1. Comparar el esquema real con todas las migraciones históricas del repositorio.
2. Verificar que ninguna migración anterior falte parcialmente.
3. Crear respaldo verificable.
4. Registrar en `_prisma_migrations` solo las migraciones cuya estructura ya existe y fue revisada.
5. Aplicar estas tres migraciones nuevas una única vez con el mecanismo acordado.

El entorno local tuvo este caso y se aplicaron únicamente estas tres migraciones nuevas de forma manual después de comprobar que las tablas base existían. Esa solución no debe repetirse automáticamente en producción: el historial de producción debe quedar consistente antes de futuros despliegues.

## Vuelta atrás

La vuelta atrás preferida es revertir el código de aplicación: las tablas y columnas nuevas no dañan la versión anterior.

No borrar tablas o columnas en producción como primera respuesta a un incidente. Solo considerar una reversión física si no hay datos creados con las funciones nuevas y existe un respaldo probado.

Para decidirlo, comprobar primero:

```sql
SELECT COUNT(*) AS public_pages FROM "BusinessPublicPage";
SELECT COUNT(*) AS aliases FROM "BusinessPublicPageAlias";
SELECT COUNT(*) AS guide_progress FROM "BusinessGuideProgress";
SELECT COUNT(*) AS sales_with_cost_snapshot
FROM "POSSaleItem"
WHERE "unitCostPrice" IS NOT NULL;
```

Si cualquiera de estos conteos es mayor que cero, conservar la estructura y revertir solo la aplicación hasta preparar una migración de datos específica.

## Fuera de alcance de esta migración

No se crean todavía tablas ni cobros para:

- Business Visibilidad, presencia SEO, sucursales, dominios propios o analítica avanzada.
- Pwn por cobertura, dominios verificados adicionales, equipos o facturación por uso.
- Kosher Partner.
- Suscripciones recurrentes de Stripe, cuentas de facturación o derechos por negocio.

Estas ideas requieren su propio diseño, migración aditiva, pruebas de permisos y una revisión separada antes de llegar a producción.
