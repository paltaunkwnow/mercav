# Migraciones Pendientes de Base de Datos

**Fecha:** 2026-11-04  
**Status:** Listo para deploy  
**Ambiente:** Producción

---

## 📋 Resumen

Se han agregado **4 nuevas features a Business** que requieren migraciones de base de datos:
1. ✅ Fichaje (Attendance)
2. ✅ Turnos (Shifts)
3. ✅ Gastos (Expenses)
4. ✅ Liberación de Fondos (Milestone updates)

---

## 🚀 Migraciones Creadas

### 1. **BusinessAttendance** (Fichaje)
- **Archivo:** `/prisma/migrations/20261104_add_business_attendance/migration.sql`
- **Tabla:** `business_attendance`
- **Campos:**
  - `id` (cuid, PK)
  - `workspaceId` (FK → BusinessWorkspace)
  - `employeeId` (FK → BusinessEmployee)
  - `checkInTime` (DateTime)
  - `checkOutTime` (DateTime, nullable)
  - `date` (Date)
  - `notes` (String, nullable)
  - Índices: `(workspaceId, employeeId, date)`, UNIQUE `(employeeId, date)`

**Uso:** Registro de entrada/salida de empleados  
**Endpoints:** `POST /api/business/[slug]/attendance/check-in`, `check-out`, `GET /api/business/[slug]/attendance`

---

### 2. **BusinessShift** (Turnos)
- **Archivo:** `/prisma/migrations/20261104000000_add_business_shifts/migration.sql`
- **Tabla:** `business_shift`
- **Campos:**
  - `id` (cuid, PK)
  - `workspaceId` (FK → BusinessWorkspace)
  - `employeeId` (FK → BusinessEmployee)
  - `date` (Date)
  - `startTime` (String, HH:mm)
  - `endTime` (String, HH:mm)
  - `shiftType` (enum: MORNING, AFTERNOON, NIGHT, CUSTOM)
  - `notes` (String, nullable)
  - Índices: `(workspaceId, employeeId, date)`

**Uso:** Calendario de turnos/shifts para empleados  
**Endpoints:** `GET /api/business/[slug]/shifts`, `POST`, `PUT`, `DELETE`

---

### 3. **BusinessExpense** (Gastos)
- **Archivo:** `/prisma/migrations/20261104000001_add_business_expenses/migration.sql`
- **Tabla:** `business_expense`
- **Campos:**
  - `id` (cuid, PK)
  - `workspaceId` (FK → BusinessWorkspace)
  - `date` (DateTime)
  - `category` (enum: SALARIOS, SERVICIOS, MARKETING, OPERACION, OTROS)
  - `amount` (Decimal 12,2)
  - `description` (String)
  - `receipt` (String, nullable)
  - Índices: `(workspaceId, date)`, `(workspaceId, category)`

**Uso:** Registro y categorización de gastos del negocio  
**Endpoints:** `GET /api/business/[slug]/expenses`, `POST`

---

### 4. **Milestone Updates** (Liberación de Fondos)
- **Archivo:** `/prisma/migrations/20261104_add_milestone_release_fields/migration.sql`
- **Tabla:** `milestone` (alteraciones)
- **Campos Nuevos:**
  - `completedAt` (DateTime, nullable)
  - `approvedAt` (DateTime, nullable)
  - `released` (Boolean, default false)
- **Índices Nuevos:** `Milestone_orderId_status_idx`

**Uso:** Control de liberación de fondos por hito en Services  
**Endpoints:** `POST /api/services/[serviceId]/milestone/[milestoneId]/complete`, `approve`

---

## 🔄 Orden de Ejecución

Las migraciones se ejecutarán en este orden:
1. `20261104_add_business_attendance`
2. `20261104_add_milestone_release_fields`
3. `20261104000000_add_business_shifts`
4. `20261104000001_add_business_expenses`

---

## ✅ Pre-requisitos Verificados

- ✅ Todas las migraciones están creadas
- ✅ Modelos Prisma actualizados en `schema.prisma`
- ✅ Endpoints API implementados
- ✅ Componentes frontend creados
- ✅ Validaciones Zod en lugar
- ✅ Control de permisos integrado
- ✅ Auditoría de cambios habilitada

---

## 🚀 Deploy a Producción

### Comando para ejecutar migraciones:

```bash
# Listar migraciones pendientes
npx prisma migrate status

# Ejecutar migraciones
DATABASE_URL="postgres://..." npx prisma migrate deploy

# O si usas Vercel
vercel env pull
npx prisma migrate deploy
```

### Verificar después del deploy:

```bash
# Conectar a DB y verificar tablas
psql $DATABASE_URL -c "\dt" | grep business_

# Verificar índices
psql $DATABASE_URL -c "\d business_attendance"
psql $DATABASE_URL -c "\d business_shift"
psql $DATABASE_URL -c "\d business_expense"
psql $DATABASE_URL -c "\d milestone"
```

---

## 📊 Impacto en Base de Datos

| Tabla | Registros | Tamaño | Índices |
|-------|-----------|--------|---------|
| business_attendance | ~100-1000 | ~1MB | 3 |
| business_shift | ~1000-5000 | ~2MB | 1 |
| business_expense | ~100-500 | ~500KB | 2 |
| milestone (updates) | Existente | +50KB | 1 |

---

## ⚠️ Rollback Plan

Si algo falla durante el deploy:

```bash
# Rollback a migration anterior
npx prisma migrate resolve --rolled-back 20261104000001_add_business_expenses

# O resolver conflicto
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## 📝 Testing Checklist

- [ ] Migraciones ejecutadas exitosamente
- [ ] Tablas creadas correctamente
- [ ] Índices creados
- [ ] Constrains funcionando (FK, UNIQUE)
- [ ] Endpoints probados (POST/GET/PUT/DELETE)
- [ ] Auditoría registrando cambios
- [ ] Permisos validando correctamente
- [ ] No hay errores de data integrity

---

## 📅 Timeline

- **Hoy (04/11):** Migraciones listas, código testeado localmente
- **Mañana (05/11):** Deploy a staging
- **Staging QA:** 1 día
- **Producción:** Depende de QA approval

---

**Generado por:** Claude Code  
**Última actualización:** 2026-11-04
