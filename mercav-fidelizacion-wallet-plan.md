# Mercav Business · Fidelización con Apple Wallet y Google Wallet

> Tarjetas de cliente frecuente para cualquier negocio de Latinoamérica: el cliente la guarda en Apple Wallet o Google Wallet sin bajar ninguna app, ve cuánto le falta para su premio y el negocio sella desde el celular.
> Fecha: 8 de octubre de 2026 · Estado: propuesta para arrancar.

---

## 0. Resumen

- **Qué es:** un apartado nuevo de Mercav Business, **Fidelización**. Cada empresa arma su programa (sellos, puntos o niveles), imprime un QR para el mostrador y sus clientes se suman en 10 segundos: escanean, escriben su nombre y tocan "Agregar a Apple Wallet" o "Agregar a Google Wallet".
- **Qué ve el cliente:** la tarjeta con la marca del negocio, los sellos que lleva (por ejemplo 7 de 10), "Te faltan 3 para tu café gratis" y, cuando llega, un aviso en la pantalla de bloqueo: "¡Tu café gratis te espera!".
- **Qué hace el negocio:** en la app de Mercav, el cajero abre "Sellar", escanea el código de la tarjeta con la cámara y suma el sello o canjea el premio. El panel muestra cuántos clientes vuelven, quién dejó de venir y qué premio funciona.
- **Mejor que una tarjeta de sellos común:**
  1. **Cualquier negocio:** sellos por visita o por producto, puntos por monto gastado, niveles (plata, oro), varios premios a la vez, y vencimiento opcional.
  2. **Sin app para el cliente:** Wallet o, si no tiene, una tarjeta web que funciona igual.
  3. **Mensajes que llegan:** cada cambio actualiza la tarjeta y puede mostrar un aviso en el celular. Sirve para "te extrañamos", promociones y cumpleaños.
  4. **Recordatorio cerca del local** (Apple Wallet admite hasta 10 ubicaciones por tarjeta).
  5. **Antifraude:** cada sello queda registrado con quién lo dio y en qué sucursal, con topes por día y alertas.
  6. **Datos para decidir:** recompra, frecuencia, clientes en riesgo y premios canjeados.
- **Contra Cocoa:** el cashback de Cocoa obliga a bajar su app y a guardar plata en su billetera, y el comercio paga comisión por venta. Acá no hay app, no hay plata de por medio (ni regulación financiera) y el premio lo define cada negocio. Funciona en cualquier país y con cualquier caja.

---

## 1. Cómo funciona (de punta a punta)

```
Negocio (panel Business)            Cliente (su celular)                   Cajero (app Mercav)
────────────────────────            ────────────────────                   ───────────────────
Crea el programa: "10 cafés,  ──►   Escanea el QR del mostrador
el 11 gratis", logo y colores       → app.mercav.lat/c/<programa>
Imprime el QR para el mostrador     → nombre (y celular opcional)
                                    → "Agregar a Apple Wallet" / Google
                                       La tarjeta queda guardada  ◄────── Escanea la tarjeta con la cámara
                                                                          → "+1 sello" (o +2, según compra)
                                    La tarjeta se actualiza sola  ◄────── Mercav actualiza el pase (push)
                                    "Te faltan 3 para tu café gratis"
                                    Al completar: aviso en pantalla  ◄─── Cajero toca "Canjear premio"
```

### Tipos de programa

| Tipo | Ejemplo | Lo que muestra la tarjeta |
|---|---|---|
| **Sellos** | 10 cafés, el 11 gratis | ●●●●●●●○○○ · "Te faltan 3" |
| **Puntos por monto** | 1 punto por cada Bs 10; 100 puntos = postre | "Tenés 72 puntos · te faltan 28 para el postre" |
| **Niveles** | Plata → Oro a las 20 visitas en el año | "Nivel Oro · 10 % de descuento" |
| **Visitas con plazo** | 5 visitas en 30 días = lavado gratis | "3 de 5 · vence el 12/11" |

Extras en todos: regalo de cumpleaños, premio por traer un amigo, bienvenida al sumarse y mensajes del negocio.

---

## 2. Arquitectura

### 2.1 Modelos (Prisma, dentro de Business)

```prisma
model LoyaltyProgram {        // por empresa (BusinessWorkspace)
  id, workspaceId, slug (único), name, type (STAMPS|POINTS|TIERS|VISITS),
  rules Json,                 // { stampsToReward: 10, pointsPerUnit, currency, expiresDays, maxStampsPerDay … }
  design Json,                // colores, logo, imagen de franja, textos
  locations Json?,            // hasta 10 coordenadas para el recordatorio de Apple
  status (DRAFT|ACTIVE|PAUSED), createdAt, updatedAt
}
model LoyaltyReward  { id, programId, name, cost Int, description, active }
model LoyaltyCard {           // una por cliente y programa
  id, programId, serial (único, no adivinable), authTokenHash,
  customerName, phone?, email?, birthday?, marketingConsent Boolean,
  balance Int,                // sellos o puntos actuales
  lifetime Int, visits Int, tier?, lastVisitAt?, status (ACTIVE|BLOCKED|DELETED)
}
model LoyaltyEvent {          // todo movimiento queda registrado
  id, cardId, type (JOIN|STAMP|POINTS|REDEEM|ADJUST|MESSAGE), amount Int,
  memberId?, branch?, note?, clientRef @unique, createdAt
}
model WalletDevice       { id, deviceLibraryId (único), pushToken, updatedAt }       // Apple
model WalletRegistration { deviceId, cardId, passTypeId, createdAt; @@id([deviceId, cardId]) }
model GoogleWalletObject { cardId @id, objectId, classId, syncedAt, version Int }
```

### 2.2 Apple Wallet

- **Generar el pase (.pkpass):** librería `passkit-generator` (Node, MIT). Tipo `storeCard`, con `organizationName`, logo, franja, `barcodes` (QR con el serial), campos `primary` (sellos o puntos), `secondary` ("Te faltan 3") y `back` (condiciones, link a la tarjeta web, darse de baja). Se firma con el certificado del Pass Type ID y el intermedio WWDR de Apple.
- **Mantenerlo actualizado:** `webServiceURL` + `authenticationToken` en el pase. Mercav implementa el servicio web de Apple:
  - `POST/DELETE /api/wallet/apple/v1/devices/{device}/registrations/{passTypeId}/{serial}`: alta y baja de dispositivos.
  - `GET /api/wallet/apple/v1/devices/{device}/registrations/{passTypeId}`: qué pases cambiaron.
  - `GET /api/wallet/apple/v1/passes/{passTypeId}/{serial}`: el pase nuevo.
  - `POST /api/wallet/apple/v1/log`: errores que reporta el iPhone.
- **Push:** con cada cambio se manda un push **vacío** por APNs, con el Pass Type ID como tópico y firmado con su certificado. El iPhone pide el pase nuevo. Si el campo tiene `changeMessage` ("Te faltan %@"), aparece el aviso. Ojo: con un tópico o un certificado equivocados APNs igual responde OK y el iPhone ignora el push, así que hay que probarlo con equipos reales.
- **Imagen de sellos:** la franja con los sellos dibujados se genera en el servidor con `next/og` (ya viene con Next), una por estado.

### 2.3 Google Wallet

- **Clase y objeto:** un `LoyaltyClass` por programa (marca, colores, logo) y un `LoyaltyObject` por tarjeta (puntos, mensajes, QR con el serial), vía la API REST con una cuenta de servicio (`google-auth-library`).
- **Agregar:** link "Agregar a Google Wallet" `https://pay.google.com/gp/v/save/<jwt>`, con un JWT firmado por la cuenta de servicio (`aud: google`, `typ: savetowallet`, `origins: [app.mercav.lat]`).
- **Actualizar:** con cada sello se hace `PATCH` del objeto. Google lo refleja en el teléfono, y los mensajes se agregan al objeto.
- **Publicación:** al principio la cuenta está en modo demo (solo cuentas de prueba). Para que cualquiera la agregue hay que pedir **acceso de publicación**, que Google revisa a mano. Requisitos: perfil de empresa completo, una clase y un objeto creados.

### 2.4 Tarjeta web (sin Wallet)

`app.mercav.lat/c/<programa>/<serial>`: la misma tarjeta en una página instalable, para quien no tenga Wallet o en computadoras. Muestra el QR para que lo escaneen y el progreso.

### 2.5 La app del cajero

- Pantalla **Sellar** en Business (rol Encargado o superior, o un rol nuevo "Cajero"). Usa el escáner por cámara que ya existe en `components/pos/BarcodeScanner.tsx`, lo que reaprovecha código del POS retirado.
- Escanea, muestra el nombre y el saldo, y ofrece "+1", "+N" (según compra) o "Canjear premio". Confirmación grande, apta para usar con una mano.
- Idempotencia con `clientRef`, el mismo patrón de la cola offline del POS, para no sellar dos veces si se corta la red.
- **Antifraude:** máximo de sellos por tarjeta por día (configurable), nada de sellar la propia tarjeta, alertas si un cajero sella demasiado y registro de todo en `LoyaltyEvent`.
- **Opcional (fase 2), autoservicio:** una tablet en el mostrador muestra un QR que cambia cada 30 s. El cliente lo escanea con su cámara y suma su sello. Sirve para negocios sin cajero dedicado y tiene tope por día.

### 2.6 Panel y campañas

- Clientes totales, activos en 30 días, recompra, días promedio entre visitas, premios canjeados y costo estimado.
- **En riesgo:** clientes que no vuelven hace X días, con un botón para mandarles "te extrañamos". El mensaje viaja como actualización del pase.
- Exportar a Excel, con el mismo patrón de las planillas.

### 2.7 Privacidad

- Datos mínimos: nombre. Celular y correo son opcionales, igual que el consentimiento para mensajes.
- El cliente se da de baja borrando el pase o desde el reverso de la tarjeta.
- El negocio es responsable de los datos de sus clientes (igual que con los legajos); va en los términos de Business.

---

## 3. Qué hace falta antes de programar (lo tiene que hacer Mercav)

| Paso | Dónde | Cuánto tarda | Notas |
|---|---|---|---|
| Inscribirse en el Apple Developer Program **como organización** | developer.apple.com | De días a semanas | USD 99 al año. Como organización pide número D-U-N-S; así el pase sale a nombre de Mercav |
| Crear el **Pass Type ID** (por ejemplo `pass.lat.mercav.loyalty`) y su certificado | Certificates, Identifiers & Profiles | 1 hora | El certificado vence cada año: hay que renovarlo antes |
| Crear la cuenta de **emisor de Google Wallet** y el perfil de empresa | Google Pay & Wallet Console | 1 día | Arranca en modo demo |
| Proyecto de Google Cloud con la Google Wallet API y una **cuenta de servicio** | console.cloud.google.com | 1 hora | La clave va en variables de entorno, nunca en el repo |
| Pedir **acceso de publicación** a Google | Pay & Wallet Console | Revisión manual | Después de tener una clase y un objeto de prueba |
| `app.mercav.lat` en producción con HTTPS | Vercel | — | Apple exige HTTPS para el servicio web |

Variables de entorno nuevas: `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_PASS_CERT` y `APPLE_PASS_KEY` (base64), `APPLE_PASS_KEY_PASSPHRASE`, `APPLE_WWDR_CERT`, `GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_WALLET_SERVICE_ACCOUNT` (JSON en base64).

---

## 4. Fases

### Fase 1 — Núcleo sin Wallet (1-2 semanas, arranca ya)
Se puede hacer mientras Apple y Google aprueban las cuentas.
- [x] Modelos y migración (`LoyaltyProgram`, `LoyaltyReward`, `LoyaltyCard`, `LoyaltyEvent`, `LoyaltyCampaign`): `prisma/migrations/20261009120000_business_loyalty`.
- [x] Motor de reglas puro con tests (`lib/business/loyalty/`): sumar sellos y puntos, canjear, topes, vencimientos y niveles.
- [x] Panel: crear programa (tipo, regla, premio, diseño con vista previa de la tarjeta) y QR para imprimir en PDF.
- [x] Página pública para sumarse y tarjeta web.
- [x] Pantalla **Sellar** con cámara, canje e historial.
- [x] Estadísticas básicas.

**Estado al 8 de octubre de 2026.** La Fase 1 está terminada y probada de punta a punta en local. También se adelantó buena parte de la Fase 4: puntos por monto, varios premios, niveles, cumpleaños, referidos, campañas y autoservicio con código rotativo.
- Rubros: 19 tipos de negocio, cada uno con ícono, paleta, beneficios y regla por defecto. La tarjeta sigue el diseño negro con brillo dorado (frente con logo y nombre, dorso con sellos y beneficios).
- El celular se guarda en formato internacional con el código de país de la empresa: `+591 70000001` y `70000001` son la misma persona.
- Al sumarse desde el QR del mostrador hay 10 minutos de gracia para el código rotativo. La persona se suma sin cuenta de Mercav (`userId` vacío).
- Campañas: hasta 3 por día por programa, solo a quienes aceptaron recibir novedades.
- Quien tiene el permiso de sellar (también el rol Empleado) abre la pantalla de autoservicio desde **Sellar**, sin entrar al panel.
- Falta para producción: correr `npx prisma migrate deploy` con las dos migraciones nuevas. Para Wallet, las cuentas de la sección 3.

### Fase 2 — Apple Wallet (1 semana, con la cuenta lista)
- [ ] Generar el `.pkpass` con imagen de sellos dinámica.
- [ ] Servicio web de Apple, registro de dispositivos y push por APNs.
- [ ] `changeMessage` para los avisos y ubicaciones del negocio.
- [ ] Prueba en iPhones reales: agregar, sellar, ver el aviso, canjear y borrar.

### Fase 3 — Google Wallet (1 semana)
- [ ] Clase por programa, objeto por tarjeta y link "Agregar a Google Wallet".
- [ ] `PATCH` en cada cambio y mensajes.
- [ ] Prueba en modo demo con cuentas de prueba, y después el pedido de publicación.

### Fase 4 — Mejoras
- Puntos por monto, varios premios, niveles, cumpleaños y referidos.
- Campañas a clientes en riesgo; autoservicio con QR rotativo.
- API y webhooks para que cualquier caja sume puntos.
- Cupones de un solo uso.

---

## 5. Precio (hipótesis)

- Incluido en Business: un programa y hasta 300 tarjetas activas.
- Plan Fidelización: tarjetas ilimitadas, varios programas, campañas y API, con precio mensual por negocio en la moneda de cada país.
- Sin comisión por venta: es el argumento contra el cashback con comisión.

---

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| Push de Apple que "anda" pero no llega | Probar con iPhones reales; registrar respuestas de APNs; alertar si caen los pedidos de actualización |
| Certificado de Apple vencido: no se pueden emitir ni actualizar pases | Alerta 30 días antes; procedimiento de renovación documentado |
| Google demora la aprobación | Arrancar con Apple y la tarjeta web; Google en modo demo para pilotos |
| Sellos falsos | Topes, registro por cajero y sucursal, alertas y bloqueo de tarjeta |
| El cliente no tiene Wallet | Tarjeta web con el mismo QR |

---

## Fuentes

- Apple: [Adding a web service to update passes](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes), [Create wallet identifiers and certificates](https://developer.apple.com/help/account/capabilities/create-wallet-identifiers-and-certificates/).
- Push de pases (tópico, push vacío, fallas silenciosas): [Passcreator](https://www.passcreator.com/en/blog/apple-wallet-pass-updates-and-push-notifications-how-they-work-and-how-to-use-them), [foro de Apple](https://developer.apple.com/forums/thread/98938).
- `passkit-generator`: [GitHub releases](https://github.com/alexandercerutti/passkit-generator/releases).
- Google: [JWT para tarjetas de lealtad](https://developers.google.com/wallet/retail/loyalty-cards/use-cases/jwt), [LoyaltyClass](https://developers.google.com/wallet/reference/rest/v1/loyaltyclass), [checklist de lanzamiento](https://developers.google.com/wallet/retail/loyalty-cards/test-and-go-live/launch-checklist).
