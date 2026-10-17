# Mercav: registro simple, guía Mervi y páginas de negocios

Fecha: 17 de octubre de 2026 (America/La_Paz).
Estado: implementado localmente y validado por compilación y suites; pendiente de aplicar las migraciones y publicar desde el entorno de despliegue.
Base revisada: rama local `main`, commit `7b8ef96`. La documentación de contexto menciona otra rama y fechas anteriores; para este diagnóstico prevalece el código actual.

## 1. Resultado y alcance de la revisión

Este repositorio contiene la app principal y Mercav Privacy. `middleware.ts:301` y `lib/seo/site.ts:151` resuelven `privacy.mercav.lat` hacia `app/privacy`. Privacy tiene navegación y pie propios; el componente Mervi aún no está integrado allí.

Hay una diferencia de despliegue pendiente de resolver: al abrir `https://privacy.mercav.lat/` en el navegador durante esta revisión, apareció la portada general de Mercav, con el título «Tu negocio entero, en una sola cuenta» y banner de cookies. En `http://127.0.0.1:1337/privacy` apareció correctamente la tienda. Esto confirma una discrepancia entre lo observado en producción y este checkout, pero no demuestra su causa. Se debe comprobar versión desplegada, proyecto asociado al dominio y configuración de hosts antes de publicar cambios.

Se revisaron registro/login, inicio, creación y administración de negocios, configuración y venta POS, roles, catálogo, publicación pública, aislamiento de Privacy y documentación de Mervi. El análisis del flujo autenticado se hizo sobre código; se navegaron localmente registro, inicio anónimo y Privacy. No se crearon cuentas, empresas ni ventas, ni se modificó la base de datos.

Participaron dos subagentes GPT-6 Astra para UX y arquitectura, y un GPT-6 Luna para inventario/documentación. El agente principal contrastó resultados, revisó Privacy en navegador y ejecutó verificaciones locales.

## 2. Problemas concretos

| Prioridad | Hallazgo | Evidencia | Cambio propuesto |
| --- | --- | --- | --- |
| Alta | El dominio público de Privacy muestra la portada general en la revisión actual. | Navegación del 17/10/2026; `middleware.ts:301`. | Verificar despliegue y host antes del lanzamiento. |
| Alta | Registro exige elegir usuario y después vuelve a pedir login. | `app/register/page.tsx:109`; `app/api/auth/register/route.ts:13`. | Usuario generado y editable después; iniciar sesión tras alta; conservar destino. |
| Alta | Inicio y negocio nuevo priorizan equipo/planillas. | `app/inicio/page.tsx:149`; `app/business/[slug]/page.tsx:99`. | «Prepará tu negocio para vender» con una siguiente acción visible. |
| Alta | Crear negocio mezcla datos mínimos con razón social, NIT y reglas laborales. | `components/business/CreateWorkspaceForm.tsx:40`. | Nombre y país al principio; datos legales/laborales cuando hagan falta. |
| Alta | Activar caja obliga a abrir turno antes de cargar el primer producto. | `components/pos/screens/ConfigScreen.tsx:143`; `SaleScreen.tsx:503`. | Catálogo antes del turno; abrir turno al empezar a vender. |
| Alta | Formulario inicial de producto exige costo y mezcla muchas opciones. | `components/pos/screens/InventoryScreen.tsx:234`. | Nombre, precio y tipo; costo, foto, códigos y otras opciones progresivas. |
| Alta | API de productos entrega filas completas, incluido costo, a quienes pueden vender. | `app/api/pos/products/route.ts:7`; `lib/business/permissions.ts:46`. | Selección de campos según permiso; lector público independiente. |
| Alta | Fallos de contexto se presentan como catálogo vacío; CTA puede mandar a empleado a inventario prohibido. | `app/api/pos/products/route.ts:9`; `components/pos/POSProductGrid.tsx:289`. | Estados de error reales y acciones por rol. |
| Media | Se abre la primera membresía, no necesariamente el último negocio usado. | `app/inicio/page.tsx:132`. | Selector de negocio y preferencia validada contra membresías. |
| Media | Algunas cargas fallidas quedan en spinner o aparentan falta de datos. | `components/pos/screens/ConfigScreen.tsx:117`; `InventoryScreen.tsx:87`. | Reintento, formulario conservado y estados cargando/error/vacío/listo. |
| Funcionalidad nueva | Mervi es un sprite; no existe seguimiento de pasos. | `components/mervi/Mervi.tsx:33`; `app/inicio/page.tsx:178`. | Guía contextual con progreso verificado. |
| Funcionalidad nueva | No hay página comercial pública ni menú web por empresa. | `prisma/schema.prisma:2077`; rutas `app/business`; ausencia de `app/b`. | Publicación independiente sobre negocio y catálogo existentes. |

## 3. Experiencia propuesta

El objetivo es que el dueño entienda qué hacer a continuación, sin conocer los nombres internos de los módulos.

Recorrido principal:

1. **Creá tu cuenta.** Nombre, correo y contraseña; Google también si está configurado. Acceso inmediato tras registro correcto. El nombre de usuario se genera con control de colisiones y se puede editar después.
2. **Contanos de tu negocio.** Nombre y país, mostrando la moneda derivada. Rubro cuando se prepare el catálogo. Razón social, NIT, personal y planillas quedan para su tarea correspondiente.
3. **Agregá lo que vendés.** Primer producto o servicio con nombre y precio. Stock solo si se controla. Foto, costo, categoría y códigos se pueden completar después.
4. **Elegí cómo empezar.** «Vender en caja» o «Compartir mi menú/página». Ambos reutilizan el mismo catálogo. Publicar una página nunca depende de abrir un turno.
5. **Seguí desde tu negocio.** Inicio con siguiente paso pendiente y accesos a Vender, Productos y Mi página. Equipo, fidelización, calendario y otros módulos siguen disponibles.

El registro conserva invitaciones y otros destinos: un trabajador invitado debe regresar a su invitación, no ser forzado a crear una empresa.

Para vender, se confirman configuración mínima de cobro/impuestos y monto inicial del turno. No se convierten valores predeterminados en declaraciones fiscales confirmadas. Registrar tarjeta o QR en caja no se presenta como procesamiento de pago integrado.

El costo omitido se representa como «sin informar»: no se muestra una ganancia ficticia del 100 %. Antes de cambiar el formulario se ajustarán modelo, cálculo y reportes necesarios para distinguirlo de un costo real de cero.

## 4. Mervi: documentación y comportamiento

### Origen comprobado

- `PRODUCT.md:67`: mascota oficial, confirmada el 8/10/2026; identidad visual y 12 poses.
- `scripts/mervi/mervi.py`: generador procedural y registro de procedencia; usa geometría del isotipo existente.
- `scripts/mervi/engine.py`: dibujo sobre grilla lógica de 96 × 96, cel shading y píxeles sin antialiasing.
- `components/mervi/Mervi.tsx`: componente reutilizable con poses tipadas, escalas enteras, etiqueta accesible y estado quieto.
- `app/mervi.css`: animación por cuadros y respeto de movimiento reducido.
- `public/mervi/`: sprites transparentes, tiras de animación en `web/` y hoja `mervi-character-sheet.png`.

Se mantiene el gato blanco/negro, ojos ámbar, hoodie, logo dorado y kippah originales. No hace falta generar otra mascota.

### Guía dentro de la app

Mervi acompaña una tarea por vez, con una explicación breve y un botón que lleva a la acción real. Ejemplos: «Vamos a crear tu negocio», «Agregá tu primer producto», «Tu menú está listo para compartir».

- Progreso operativo derivado de hechos del servidor: empresa creada, configuración válida, producto vendible, página publicada, venta confirmada.
- Preferencias de ayuda por usuario y contexto de negocio: minimizar, omitir, retomar y volver a abrir.
- La guía se adapta al rol; no ofrece modificar inventario a empleados sin permiso ni configurar caja a encargados sin ese permiso.
- No avanza por pulsar «Siguiente» si la operación falló. Distingue venta offline pendiente de venta sincronizada.
- No tapa Cobrar, formularios, teclado, navegación inferior ni áreas seguras móviles.
- Mensajes accesibles, foco correcto, navegación por teclado y movimiento reducido. Sin ventanas obligatorias repetidas.
- Primera versión con reglas y contenidos mantenibles; no necesita un servicio de chat con IA ni enviar información del negocio a terceros.
- Conservar historial suficiente para que borrar un producto no convierta al dueño en «usuario nuevo».

### Mervi en Privacy

Integrar el componente oficial en bienvenida, ayuda contextual y explicación de compra, conservando el diseño blanco/negro de Privacy y los colores oficiales de Mervi.

Flujo breve: «Qué buscás» → categoría/producto → cómo coordinar pedido → pagos/envío/ayuda. Reutilizar catálogo y textos existentes; no prometer pedido confirmado por abrir WhatsApp o correo. Puede cerrarse y seguir usando toda la tienda normalmente.

Recursos y lógica locales al mismo origen; conservar CSP, ausencia de rastreadores y acceso sin cuenta. No heredar el seguimiento autenticado de Business. La primera versión no necesita guardar respuestas o progreso de Privacy de forma persistente. La ayuda nunca solicita claves, PIN ni frase de recuperación.

## 5. Página pública de cada negocio

URL propuesta: `mercav.lat/b/nombre-del-negocio`. Administración privada: `app.mercav.lat/business/[slug]/pagina`.

Cada negocio puede activar su página. Se crea en borrador; no se publican automáticamente los negocios existentes. El dueño confirma qué datos serán públicos.

Contenido: logo, portada opcional, descripción breve, enlaces, horarios, ubicación pública elegida, contacto, menú/catálogo y enlace al club de fidelización si existe. El visitante no necesita cuenta para verlo.

### Tres diseños incluidos en la propuesta

| Diseño | Composición | Uso típico |
| --- | --- | --- |
| **Perfil** | Logo central, presentación corta y botones de enlaces grandes; catálogo debajo. | Negocios de servicios o una página simple tipo Linktree. |
| **Carta** | Menú editorial por categorías, precios muy legibles, fotos opcionales y navegación por secciones. | Restaurantes y cafeterías; debe funcionar bien sin fotos. |
| **Vitrina** | Portada visual, productos destacados, tarjetas y breve historia del negocio. | Panaderías, tiendas y marcas con fotografías. |

Los tres soportan enlaces y catálogo; cambian composición, jerarquía y navegación, no solo colores. El negocio puede cambiar diseño sin perder contenido. Personalización acotada de logo, color, portada y textos, con vista previa inmediata. No se incluye un constructor libre de bloques que haga más difícil empezar.

No se propone un cobro adicional ni separar diseños por plan en esta entrega. Se respetan los límites existentes de cantidad de negocios.

### Datos y publicación

- Reutilizar `BusinessWorkspace → POSConfig → POSProduct`; no crear un segundo negocio o catálogo duplicado.
- Añadir una entidad 1:1 de página pública con slug público único, estado, plantilla, presentación y contactos explícitamente públicos.
- Slug público separado del administrativo; sugerido automáticamente. Validar reservados, colisiones concurrentes y mantener redirecciones al cambiarlo sin permitir apropiarse de enlaces viejos.
- Selección editorial de productos con referencia al producto real: visible, orden, sección y destacado. Todos ocultos públicamente al comenzar.
- Perfil sin catálogo funciona sin configurar POS. Para menú se prepara el catálogo mínimo, sin turno abierto.
- Separar borrador de presentación publicada. Guardar, Vista previa, Publicar, Pausar, Ver página, Copiar enlace y Descargar QR.
- Nombre, precio y disponibilidad operativos del producto se comparten con POS; advertir claramente que modificarlos afecta el menú publicado. No inventar un segundo precio web.
- Resolver público con campos permitidos explícitos. Nunca reutilizar la respuesta completa de la API privada ni exponer costo, empleados, identificadores privados, ventas, saldos o stock numérico por defecto.
- Validar que cada producto pertenece a la empresa. Permisos comerciales específicos: propuesta dueño/encargado editan, dueño publica; RR.HH. no obtiene publicación por su permiso de editar empresa.
- Moneda, impuestos y redondeos consistentes con caja. Stock cero solo implica agotado si se controla stock; producto sin seguimiento no se agota por tener cero almacenado.
- Publicación/pausa y cambios de productos invalidan la caché correspondiente. Previews privados; páginas publicadas con canónica, metadatos, datos estructurados y sitemap.
- Enlaces y medios validados, sin HTML/CSS arbitrario. Datos alimentarios no se presentan como certificaciones verificadas.

### Contacto y pedidos: alcance recomendado

Primera entrega: menú público y consulta al negocio por WhatsApp o contacto disponible, con texto prearmado si se seleccionan productos. La interfaz dice «Consultar por WhatsApp»: no implica mensaje enviado, pedido aceptado, pago, reserva ni descuento de stock.

Los pedidos online con estados, delivery y cobro integrado serían otra fase. Actualmente `ServiceOrder` pertenece al marketplace y `POSSale` exige caja/pago: ninguno debe reutilizarse como pedido gastronómico pendiente. Esa fase necesitaría pedido propio, estados de pago separados, idempotencia, reglas de reserva/liberación de stock y conversión a venta sin descontar dos veces.

## 6. Secuencia de implementación tras aprobación

1. **Base y contratos.** Resolver discrepancia de Privacy en despliegue; registrar baseline; definir permisos, campos públicos, estados de guía y errores. Corregir exposición de costos y falsos vacíos antes de usarlos en la nueva experiencia.
2. **Registro y preparación.** Sesión tras registro, destino conservado, creación mínima, selector de negocio y entrada centrada en vender. Reutilizar datos ya conocidos.
3. **Catálogo y caja.** Alta simple de producto, costo desconocido bien representado, errores recuperables, catálogo accesible antes del turno y primera venta con ticket.
4. **Mervi.** Guía integrada desde registro hasta venta/publicación, preferencias reanudables y adaptación a roles; integración propia de Privacy.
5. **Publicación.** Migración aditiva, editor y preview, tres diseños, selección de menú, URL/QR, contacto y SEO. Compartir los mismos datos en todas las plantillas.
6. **Verificación integral.** Pruebas unitarias e integración, recorridos reales en entorno de prueba, revisión cruzada de agentes y comprobación independiente del agente principal.
7. **Entrega.** Informe con pruebas realizadas, fallos corregidos, límites pendientes y versión revisable. Preparación de despliegue con migración y vuelta atrás documentadas. No hacer commit, push o despliegue en esta fase de análisis.

En implementación, los agentes potentes se ocupan de autenticación, permisos/datos, estado de guía y publicación; agentes ligeros de copy, inventario, documentación y verificaciones acotadas. Asignar archivos por área para evitar ediciones concurrentes sobre los mismos módulos. Integrar y revisar cada bloque antes del siguiente.

Migraciones aditivas; ninguna empresa/producto queda publicado por migrar. Usar entorno de prueba aislado, respaldo antes de producción y activación gradual. La función puede apagarse sin borrar datos. No alterar la caja personal heredada ni adoptar sus datos sin la acción explícita existente.

## 7. Verificación y definición de terminado

Baseline ejecutado el 17/10/2026:

| Verificación | Resultado |
| --- | --- |
| `npm run test:business` | 37 aprobadas |
| `npm run test:privacy` | 17 aprobadas |
| `npm run test:calendar` | 29 aprobadas |
| `npm run test:pwn` | 85 aprobadas |
| `tsc --noEmit --incremental false` | Aprobado |
| `npm run lint` | Falla por errores preexistentes en varios módulos; no se modificó producto |
| Navegación local | Registro, inicio anónimo y tienda Privacy visibles |
| Dominio público Privacy | Muestra portada general; requiere investigación de despliegue |

Las 168 pruebas actuales no prueban los flujos nuevos ni sustituyen una prueba autenticada de punta a punta. No se ejecutó `npm run build`: ese script ejecuta migraciones e importadores antes de compilar. La compilación de producción posterior debe separarse de esas operaciones y usar un entorno controlado.

Criterios de aceptación de la implementación:

- Dueño nuevo llega a producto y venta sin un segundo login, NIT, planilla, logo o invitación obligatorios.
- Recarga, cambio de dispositivo y de negocio retoman correctamente; no hay altas duplicadas al reintentar.
- Invitado conserva invitación; empleado solo recibe pasos que puede completar.
- No se abre turno para editar menú; una venta real sí respeta pagos, stock y reglas de caja.
- Catálogo distingue vacío, permiso insuficiente, sesión vencida y error de red.
- Costos no se entregan a roles sin autorización; página pública no filtra datos privados ni productos de otra empresa.
- Borrador inaccesible públicamente; publicar y pausar funcionan aun con caché; QR llega a la URL correcta.
- Las tres plantillas funcionan con nombres largos, sin foto, menú vacío y catálogo amplio; cambiar diseño conserva datos.
- Precio, impuestos, moneda y disponibilidad coinciden entre menú y POS.
- Mervi se puede omitir/reabrir, no obstruye controles y respeta teclado, lector de pantalla y movimiento reducido.
- Privacy conserva su aislamiento y navega correctamente entre hosts, con Mervi servido localmente.
- Revisión visual y funcional en escritorio y móvil de aproximadamente 390 px, temas claro/oscuro y roles relevantes.
- Casos de conexión interrumpida, doble clic, expiración de sesión y venta pendiente de sincronización.
- Mantener suites actuales, añadir pruebas significativas de nuevos contratos, ejecutar TypeScript y compilación controlada. Lint de áreas modificadas sin errores; cualquier deuda global remanente se informa expresamente.

La implementación quedó integrada en este checkout. La validación autenticada de punta a punta sigue requiriendo una base de datos de prueba disponible: el entorno local actual no tiene PostgreSQL escuchando en `localhost:5432`.

## 8. Alcance aprobado e implementado

Registro simplificado + inicio orientado a vender + preparación del catálogo/caja + Mervi contextual en app y Privacy + página pública por negocio con tres diseños, menú, enlace/QR y contacto por WhatsApp + correcciones de permisos/errores vinculadas + validación integral.

Supuestos: URL pública `mercav.lat/b/...`; tres diseños disponibles sin un cobro nuevo; publicación voluntaria; guía sin chat generativo; consulta por WhatsApp en primera entrega. Pedidos online con aceptación, pagos y delivery quedan fuera de esta primera entrega y se diseñan como fase adicional si se solicitan.
