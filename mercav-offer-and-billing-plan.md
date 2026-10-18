# Oferta y facturación de Mercav

Fecha: 17 de octubre de 2026.  
Estado: propuesta para aprobación; no cambia precios ni cobros todavía.

## Principio no negociable

**Mercav no quita ni bloquea una función que hoy ofrece gratis.** Ninguna persona pierde caja, catálogo, inventario, costos, planillas, fidelización, página pública, diseños, Pwn, Kosher, calendario, comunidad o herramientas que ya puede usar sin pagar.

Una mejora paga solo puede ser una capacidad nueva, un volumen adicional claramente elegido o un servicio futuro que no exista en la versión gratuita. El plan gratis nunca se achica para empujar una conversión.

## Decisión recomendada

Mercav conserva una sola cuenta, pero deja de presentar una sola suscripción para productos con públicos y costos distintos. Cada persona elige un punto de partida y solo ve la oferta que corresponde a su necesidad.

| Línea | Persona a la que sirve | Modelo recomendado | No debe mezclarse con |
| --- | --- | --- | --- |
| **Mercav Business** | Dueño o equipo de un negocio | Gratuito completo en lo existente; complementos futuros por negocio | Pwn, Kosher, tienda Privacy y marketplace |
| **Mercav Pwn** | Persona o equipo que monitorea su exposición | Gratuito en todas las funciones actuales; oferta futura solo para capacidades nuevas de equipo | Planillas, fidelización o catálogo |
| **Mercav Kosher** | Visitante, comunidad y administradores de lugares | Gratuito para consultar y colaborar; sin vender funciones actuales | Certificación o estado de kashrut |
| **Mercav Privacy** | Comprador de productos de privacidad | Compra única por pedido | Suscripciones SaaS |
| **Mercav Mercado** | Quien publica o contrata espacios, servicios y empleos | Comisión o promoción por transacción/publicación | Plan del negocio y postulaciones de candidatos |

La regla visible debe ser: **una cuenta, productos independientes, cobros explicados en el momento correcto**.

## Qué existe hoy

### Business

Incluye creación de negocio, catálogo/POS, inventario, ventas, trabajadores y planillas, fidelización, página pública con tres diseños, menú, contacto, QR y herramientas. El código limita en Gratis a una empresa, cinco trabajadores y un programa de fidelización; Pro habilita hasta cinco empresas, trabajadores sin límite y hasta veinte programas.

### Pwn

Incluye consulta y monitoreo de exposición autorizada, alertas, fuentes, vulnerabilidades, informes y objetivos verificados. Actualmente no tiene límites de plan ni precio.

### Kosher

Incluye atlas de lugares, estados y fuentes de kashrut, Shabat/calendario, viajes, comunidad, chat, minianim y aportes comunitarios. Actualmente es gratuito.

### Privacy

Es una tienda de productos. Su flujo debe hablar de producto, envío, pago y soporte; nunca de plan, renovación o cuota mensual.

### Mercado

El esquema existente permite publicar espacios, servicios y vacantes; hay reservas, pedidos y comisiones. También hay límites de Gratis para publicaciones y para postulaciones. Esta línea no figura con claridad en la navegación ni en el mensaje de precios actual.

## Problemas que hay que corregir

1. **“Mercav Pro” promete demasiado.** La página de precios mezcla Business, Mercado y Herramientas aunque Pwn y Kosher son gratuitos. Una persona que solo busca monitorear su dominio o consultar un lugar Kosher no entiende por qué existe Pro.
2. **El plan pertenece a la persona, no al negocio.** Si una persona administra varios negocios, el límite y el pago viven en `User.plan`; no en el negocio que recibe el valor. Esto complica sucursales, dueños, agencias y cambios de responsable.
3. **El cobro no es recurrente.** El checkout crea un `PaymentIntent` de pago único por uno o doce meses. No hay renovación automática, cancelación, actualización de medio de pago ni portal de facturación. No debe llamarse suscripción recurrente hasta implementarlo.
4. **El registro histórico de suscripciones no refleja estado real.** Cada pago crea una fila `ACTIVE`; al vencer el acceso efectivo vuelve a Gratis, pero esas filas no se vencen. El MRR administrativo puede contar períodos pasados como activos.
5. **Los límites no tienen una historia de valor uniforme.** Caja, menú público y varias funciones importantes no se comunican en la tabla, mientras Mercado sí aparece aunque no es el primer motivo de uso de Business. La comunicación debe aclarar qué sigue gratis y qué capacidad adicional es opcional.
6. **Cobrar por postularse a un empleo es una mala barrera.** El límite de diez postulaciones mensuales afecta al candidato, que no es quien recibe valor SaaS. Conviene monetizar al empleador por publicación destacada o por servicio de selección, no al postulante.
7. **Kosher no puede monetizar confianza.** Un estado, certificación, fuente o posición en el atlas no puede depender de pago. Dañaría la confianza del producto.

## Oferta que debe ver cada público

### 1. Mercav Business

En `/precios`, el producto principal debe llamarse **Planes para tu negocio**. Mantener dos decisiones claras:

| | Business Gratis | Business Pro futuro |
| --- | --- | --- |
| Precio | USD 0 | Se define solo al crear capacidades nuevas y opcionales |
| Alcance | Todo lo que está disponible hoy: negocio, caja, catálogo, inventario, costos, trabajadores dentro de los límites actuales, planillas, fidelización, página pública, los tres diseños y herramientas gratuitas | Capacidades futuras que no existen hoy, por ejemplo sucursales conectadas, automatizaciones opcionales o soporte operativo dedicado |
| Motivo para cambiar | Empezar, operar y vender sin tarjeta | Resolver una necesidad nueva sin afectar el funcionamiento Gratis |

La página pública y sus tres diseños se mantienen disponibles en Gratis: son la mejor puerta de entrada para que el negocio comparta Mercav. No se debe cobrar por cambiar plantilla. Caja, catálogo, inventario, costos, planillas y fidelización existentes tampoco se mueven a una capa paga.

Cada negocio adicional debe ser un complemento explícito, no una cifra escondida en el plan de una persona. La oferta de varias sucursales se deja para una etapa posterior, cuando haya permisos compartidos, reportes agrupados e inventario entre sucursales.

### 2. Mercav Pwn

Mantener **Pwn gratis** con toda la funcionalidad actual: consulta propia, monitoreo autorizado, alertas, informes, fuentes, vulnerabilidades y aprendizaje. No introducir una barrera de pago sobre estas funciones.

Cuando exista uso sostenido de equipos, lanzar **Pwn Equipos** por dominio verificado o por franja de buzones monitoreados: varios administradores, alertas a equipo, historial/exportación, informes y configuración de retención. Nunca cobrar por revelar una exposición crítica ya detectada ni por el primer aviso de seguridad.

El precio debe definirse después de modelar los costos de proveedores y la autorización de dominio; la documentación de HIBP distingue las API autenticadas para búsquedas y monitoreo de dominios de la API gratuita de contraseñas. [HIBP API](https://haveibeenpwned.com/scalar/)

### 3. Mercav Kosher

El atlas, calendario, viajes y comunidad permanecen gratuitos. Las herramientas actuales de administración también permanecen gratis. Más adelante puede existir **Kosher Partner** únicamente si agrega una capacidad totalmente nueva para un lugar, sin cambiar el acceso actual. No se vende un estado de kashrut, una certificación, prioridad en resultados orgánicos ni moderación.

No lanzar esta capa hasta definir una política editorial y de conflicto de intereses visible.

### 4. Mercav Privacy

Usar etiquetas de comercio: producto, precio, disponibilidad, envío, garantía y soporte. Cada compra es un pago único. La ayuda de Mervi debe recomendar productos, pero no insinuar afiliación, certificación de seguridad ni suscripción.

### 5. Mercav Mercado

Separar esta línea del plan Business. Un publicador tiene una cuota inicial gratuita razonable; después paga por publicación destacada o Mercav cobra comisión solo cuando se confirma una reserva o pedido. El candidato puede postular sin una cuota mensual artificial.

En la navegación pública, Mercado debe aparecer solo donde aporte valor: para contratar un servicio, reservar un espacio o publicar una vacante. No debe competir con Business, Pwn y Kosher en el primer selector de la portada.

## Arquitectura de facturación recomendada

1. Conservar `User.plan` únicamente como compatibilidad temporal para cuentas existentes.
2. Crear una entidad de cuenta de facturación y una suscripción con: producto, alcance (`workspace`, `pwn_organization` o usuario), Stripe customer/subscription/price IDs, estado, período actual, cancelación al fin de período y datos de auditoría.
3. Asociar Business Pro a `BusinessWorkspace`, no al dueño. Un empleado no compra el plan; el negocio recibe los derechos.
4. Resolver permisos desde derechos del alcance. Los límites de empleados, campañas y reportes se comprueban siempre en servidor contra el negocio correcto.
5. Configurar productos y precios de Stripe por identificadores de entorno; no fijar montos en URLs ni en componentes. Usar Checkout en modo suscripción, webhooks idempotentes y el portal de facturación de Stripe para cancelar, cambiar tarjeta y ver comprobantes. Stripe describe este portal como el lugar donde el cliente gestiona métodos de pago, facturas y suscripciones. [Stripe Billing portal](https://support.stripe.com/questions/billing-customer-portal?locale=es-419)
6. Calcular MRR solo desde suscripciones vigentes y normalizar los períodos anuales; no desde filas históricas con `ACTIVE`.
7. Mantener los pagos únicos de Privacy, reservas y servicios como transacciones y pedidos, sin convertirlos en suscripciones.

Como referencia de empaquetado, un POS competitivo mantiene venta, inventario básico y fidelización gratuitos y cobra complementos por tienda cuando el negocio necesita gestionar equipo, inventario avanzado o historial extendido. [Loyverse pricing](https://loyverse.com/en-us/pricing)

## Cómo debe presentarse en la interfaz

- En el inicio: **Tengo un negocio**, **Quiero protegerme**, **Busco Kosher**. Mercado aparece en contexto, no como una cuarta promesa principal.
- En Business: “Plan de este negocio”, uso actual y el siguiente beneficio concreto. Nunca “tu plan” ambiguo si la persona pertenece a varias empresas.
- En Pwn: “Gratis para uso personal”; cuando exista Pwn Equipos, explicar exactamente qué se mide y qué dominio está verificado.
- En Kosher: sin insignias de pago junto a información de kashrut.
- En Privacy: “Compra segura”, no “mejorar plan”.
- En `/precios`: pestañas o rutas por línea de producto. La primera vista debe ser Business; Pwn y Kosher llevan a su explicación gratuita, Privacy a la tienda y Mercado a sus tarifas transaccionales.

## Orden de implementación

### Fase 1 — claridad sin cambiar cobros

1. Reescribir `/precios` como una explicación honesta de lo que es gratis hoy, sin reducirlo ni ocultarlo; mover Mercado a una sección propia y enlazar Pwn/Kosher como gratuitos.
2. Mostrar qué negocio consume cada límite actual y qué capacidad nueva sería opcional en el futuro.
3. Retirar la promesa ambigua de "Mercav Pro" hasta que su valor adicional sea una función nueva y concreta.
4. Quitar el límite de postulaciones de candidatos y diseñar la tarifa de empleador aparte.
5. Corregir reportes administrativos para no presentar MRR histórico como recurrente.

### Fase 2 — modelo de derechos y cobro recurrente

1. Migración aditiva para cuenta de facturación y suscripción por alcance.
2. Compatibilidad de las cuentas que hoy usan `User.plan` y migración gradual de nuevos negocios.
3. Stripe Products/Prices, Checkout de suscripción, webhooks de renovación/fallo/cancelación y portal.
4. Página “Facturación” por negocio, historial, renovación, cancelación y período de gracia.
5. Pruebas de doble webhook, renovación, pago fallido, cambio de dueño, miembro sin permiso y vencimiento.

### Fase 3 — ofertas posteriores basadas en evidencia

1. Pwn Equipos por dominio/buzones verificados, solo si hay uso y margen suficientes.
2. Kosher Partner con reglas editoriales públicas y separación técnica de la moderación.
3. Complemento de sucursales Business cuando el producto soporte verdaderamente varias sedes.

## Métricas que deciden el siguiente paso

- Negocios creados → primer producto → primera venta → página compartida.
- Negocios que alcanzan cinco trabajadores, un club o una empresa adicional.
- Conversión de Gratis a Pro por función, no solo por visita a `/precios`.
- Renovación, cancelación y motivo de cancelación.
- Costo y actividad por objetivo Pwn verificado.
- Uso de Kosher Partner sin modificar la confianza en estados ni resultados.

## Criterios de aceptación

- Una persona entiende en una pantalla si necesita Business, Pwn, Kosher, Privacy o Mercado.
- Ninguna compra única se presenta como suscripción.
- Un negocio con Pro sigue teniendo acceso aunque cambie el miembro que lo opera; una persona con dos negocios ve planes separados.
- Al expirar o fallar un pago, el negocio conserva todos sus datos y todas las funciones que ya eran gratuitas; solo se desactiva la capacidad nueva contratada.
- Los límites, precio, periodo, renovación y cancelación aparecen antes de cobrar.
- Los datos y la moderación de Kosher permanecen independientes de cualquier pago.
