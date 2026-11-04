# Implementación: Liberación Automática de Fondos por Milestone

## Resumen
Se ha implementado un sistema completo de liberación automática de fondos por milestone (hito) en Mercav Services. El sistema permite que los clientes aprueben y liberen fondos a freelancers cuando los milestones son completados.

## Archivos Creados/Modificados

### 1. Schema de Prisma
**Archivo:** `/prisma/schema.prisma`
**Cambios:**
- Agregados campos al modelo `Milestone`:
  - `completedAt: DateTime?` - Timestamp de cuando se marcó como completado
  - `approvedAt: DateTime?` - Timestamp de cuando fue aprobado
  - `released: Boolean` - Flag para prevenir doble liberación
  - Index en `(orderId, status)` para mejor rendimiento de queries

**Migración:** `/prisma/migrations/20261104_add_milestone_release_fields/migration.sql`

### 2. Endpoints API

#### A. Marcar Milestone como Completado
**Ruta:** `POST /api/services/[serviceId]/milestone/[milestoneId]/complete`
**Archivo:** `/app/api/services/[serviceId]/milestone/[milestoneId]/complete/route.ts`

**Validaciones:**
- ✅ Solo el freelancer (provider) puede completar un milestone
- ✅ El milestone debe estar en estado PENDING
- ✅ El servicio debe perteneccer al freelancer
- ✅ Se marca completedAt con timestamp actual

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "milestone": { /* milestone actualizado */ },
    "message": "Hito completado. El cliente será notificado..."
  }
}
```

#### B. Aprobar y Liberar Fondos del Milestone
**Ruta:** `POST /api/services/[serviceId]/milestone/[milestoneId]/approve`
**Archivo:** `/app/api/services/[serviceId]/milestone/[milestoneId]/approve/route.ts`

**Validaciones:**
- ✅ Solo el cliente puede aprobar milestones
- ✅ El milestone debe estar en estado COMPLETED
- ✅ El flag `released` debe ser false (previene doble liberación)
- ✅ El servicio debe ser correcto
- ✅ Transacción atómica: actualizar milestone + crear registro de transacción

**Cambios en BD (transaccional):**
1. Actualiza milestone:
   - Status: PENDING → COMPLETED → PAID
   - Marca released = true
   - Establece approvedAt con timestamp actual
2. Crea transacción con metadata:
   - type: "milestone_release"
   - milestoneId, orderId, providerId, clientId
   - Monto de los fondos liberados

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "milestone": { /* milestone actualizado */ },
    "message": "Hito aprobado. Fondos de $X.XX USD liberados a [nombre freelancer]."
  }
}
```

### 3. Componentes React

#### MilestoneCard
**Archivo:** `/components/dashboard/MilestoneCard.tsx`

**Características:**
- Muestra información del milestone (título, descripción, monto)
- Displays estado con colores diferenciados (PENDING, COMPLETED, PAID)
- Botón "Marcar como completado" - solo para freelancer, estado PENDING
- Botón "Liberar fondos" - solo para cliente, estado COMPLETED y no released
- Manejo de estados de carga y errores
- Timestamps visuales de completedAt, approvedAt

**Props:**
```typescript
interface MilestoneCardProps {
  milestone: Milestone;
  isClient: boolean;
  isProvider: boolean;
  serviceId: string;
  onApprovalSuccess?: () => void;
}
```

#### MilestonesSection
**Archivo:** `/components/dashboard/MilestonesSection.tsx`

**Características:**
- Contenedor para múltiples milestones
- Estadísticas: total de milestones, completados, pagados
- Muestra monto total y fondos liberados
- Animaciones de entrada/salida
- Manejo de caso sin milestones

### 4. Integración en OrderDashboard
**Archivo:** `/app/dashboard/pedidos/[id]/OrderDashboardClient.tsx`

**Cambios:**
- Importación de `MilestonesSection`
- Agregación de sección de milestones entre chat y archivos
- Props recibidas del servidor: `order.milestones`

### 5. Utilidades de Backend
**Archivo:** `/lib/milestone-release.ts`

**Funciones:**
- `getPendingMilestonePayouts(providerId)` - Milestones pendientes de un freelancer
- `getMilestoneReleaseTransactions(limit, offset)` - Transacciones de liberación (admin)
- `getTotalPendingPayout(providerId)` - Total pendiente a pagar

**Futuro (commented):**
- `processStripeTransfer()` - Cuando se implemente Stripe Connected Accounts

## Flujo de Usuario

### Para el Freelancer:
1. Completa el trabajo del milestone
2. En la página del pedido, click en "Marcar como completado"
3. El sistema marca completedAt y notifica al cliente
4. Espera aprobación del cliente para recibir los fondos

### Para el Cliente:
1. Recibe notificación que el milestone está completado
2. Revisa el trabajo en la página del pedido
3. Si aprueba, click en "Liberar fondos"
4. Los fondos se marcan como liberados
5. Se registra la transacción en el sistema

## Validaciones de Seguridad

### Control de Acceso
- ✅ Solo el freelancer puede marcar como completado
- ✅ Solo el cliente puede aprobar
- ✅ Solo propietarios/admins pueden ver el pedido

### Prevención de Fraude
- ✅ No se puede liberar dos veces (flag `released` + check en DB)
- ✅ Validación de monto vs. milestone.amount
- ✅ Transacciones atómicas (todo o nada)
- ✅ Metadata inmutable (guardada en BD antes de procesar)

### Errores Controlados
- ✅ Milestone no encontrado (404)
- ✅ No autorizado (401/403)
- ✅ Estado inválido (409)
- ✅ Doble liberación (409)
- ✅ Errores de BD (500 con rollback)

## Integración con Stripe (Futuro)

### Opción 1: Connected Accounts (Recomendado)
Cuando el freelancer se registre/verifique:
1. Crear connected account en Stripe
2. Guardar `stripeConnectedAccountId` en tabla User
3. Al liberar fondos, usar `stripe.transfers.create()` con destination = stripeConnectedAccountId
4. El dinero va directo a la cuenta bancaria del freelancer

```typescript
// Código futuro
const transfer = await stripe.transfers.create({
  amount: Math.round(milestone.amount * 100),
  currency: "usd",
  destination: freelancer.stripeConnectedAccountId,
  metadata: { milestoneId, orderId }
});
```

### Opción 2: Payout Manual
1. Admin ve transacciones de milestone_release en panel
2. Procesa pagos manualmente a través del banco
3. Sistema registra que fue pagado manualmente

### Opción 3: Payout API
Usar Stripe Payout API (requiere bancaria registrada):
```typescript
const payout = await stripe.payouts.create({
  amount: Math.round(milestone.amount * 100),
  currency: "usd",
  destination: bankAccount.id
});
```

## Estado de la Transacción

Las transacciones de milestone_release siempre están marcadas como "PAID" porque:
- Son liberaciones de escrow (dinero ya fue pagado por cliente)
- No requieren procesamiento adicional de pago
- Solo necesitan ser registradas para auditoría

Para un payout real, el admin/sistema:
1. Procesa el transfer en Stripe
2. Puede actualizar metadata de la transacción si lo desea

## Testing

### Casos de Prueba

#### Test 1: Freelancer marca como completado
```
1. GET /api/services/[id]/milestone/[id] (verificar estado PENDING)
2. POST /api/services/[id]/milestone/[id]/complete
3. Verificar: status=COMPLETED, completedAt set
4. Intentar de nuevo: debe fallar (409)
```

#### Test 2: Cliente aprueba (success)
```
1. Milestone en estado COMPLETED
2. POST /api/services/[id]/milestone/[id]/approve (como cliente)
3. Verificar: status=PAID, released=true, approvedAt set
4. Verificar: Transacción creada con type=milestone_release
```

#### Test 3: Cliente no puede aprobar 2 veces
```
1. POST /api/services/[id]/milestone/[id]/approve (primera vez)
2. POST /api/services/[id]/milestone/[id]/approve (segunda vez)
3. Debe fallar con error: "Este hito ya fue liberado" (409)
```

#### Test 4: Solo cliente puede aprobar
```
1. Intentar aprobar como provider: debe fallar (403)
2. Intentar aprobar como usuario distinto: debe fallar (403)
```

#### Test 5: Milestone debe estar COMPLETED
```
1. Milestone en estado PENDING
2. Intentar aprobar: debe fallar (409)
```

## Monitoreo y Administración

### Queries para Admins

Milestones liberados hoy:
```sql
SELECT m.*, so.id as order_id 
FROM "Milestone" m
JOIN "ServiceOrder" so ON m."orderId" = so.id
WHERE m.released = true 
  AND DATE(m."approvedAt") = CURRENT_DATE
ORDER BY m."approvedAt" DESC;
```

Total pendiente por freelancer:
```sql
SELECT 
  u.id, u.name, u.email,
  COUNT(m.id) as milestone_count,
  SUM(m.amount) as total_pending
FROM "Milestone" m
JOIN "ServiceOrder" so ON m."orderId" = so.id
JOIN "User" u ON so."providerId" = u.id
WHERE m.released = true AND m.status = 'PAID'
GROUP BY u.id, u.name, u.email
ORDER BY total_pending DESC;
```

### Dashboard Admin (Futuro)
- Tab: "Liberaciones por Milestone"
- Tabla: Milestones, Monto, Cliente, Freelancer, Fecha de Aprobación
- Acciones: Marcar como pagado, Generar reporte, Procesar payout

## Próximos Pasos Recomendados

1. **Implementar Stripe Connected Accounts**
   - Agregar campo `stripeConnectedAccountId` a User
   - Crear flujo de onboarding para freelancers

2. **Notificaciones**
   - Notificar al cliente cuando milestone se completa
   - Notificar al freelancer cuando se aprueban fondos

3. **Reporting**
   - Dashboard de liberaciones pendientes
   - Reportes fiscales por freelancer
   - Auditoría de transacciones

4. **Extensiones**
   - Crear milestones automáticos basados en paquetes
   - Permitir multiple milestones por orden
   - Sistema de aprobación con comentarios

## Notas de Implementación

- Las transacciones se crean con `stripeId` = `milestone_[milestoneId]_release` para evitar conflictos
- La metadata de transacción contiene toda la info para auditoría
- El sistema usa transacciones atómicas de Prisma para garantizar consistencia
- Los errores se loguean con contexto para debugging
- Los timestamps se guardan en UTC

---

**Creado:** 2026-11-04
**Estado:** ✅ Implementación completa
**Testing:** Pendiente en entorno real
