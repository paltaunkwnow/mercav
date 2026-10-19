# Mercav Mail: integración del backend

Estado: implementación local del webmail y adaptador JMAP. La habilitación pública requiere desplegar Stalwart, crear buzones y pasar las pruebas reales de correo y seguridad. Esta implementación no instala un servidor SMTP ni promete entrega a Gmail/Outlook sin verificaciones externas.

## Identidad privada

- `MailAccount` es una lista explícita de cuentas internas. El registro normal de Mercav nunca crea un registro ni un buzón de correo.
- La contraseña se valida contra Stalwart mediante JMAP. Un usuario debe existir en Stalwart **y** estar `ACTIVE` en `MailAccount`.
- No hay endpoints públicos de registro, invitación automática ni recuperación de contraseña. Los administradores aprovisionan y recuperan cuentas mediante el panel privado de Stalwart y el procedimiento interno de verificación.
- Administradores de correo: `MailAccount.role=ADMIN`. Para habilitar al primer administrador, se admiten exclusivamente IDs de usuarios de plataforma incluidos en `MAIL_BOOTSTRAP_ADMIN_IDS` que además tengan rol `ADMIN` vigente y no estén sancionados. Quitar esos IDs tras el bootstrap.
- `AUDITOR` puede consultar eventos; no tiene permisos administrativos ni acceso a buzones ajenos. No se usan tokens globales de administrador para leer correo.

## Variables del servidor

```dotenv
MAIL_ENABLED=false
MAIL_PUBLIC_URL=https://mail.mercav.lat
MAIL_JMAP_URL=https://mx1.mercav.lat/.well-known/jmap
MAIL_SESSION_KEY=<32 bytes aleatorios representados como 64 caracteres hexadecimales>
MAIL_BOOTSTRAP_ADMIN_IDS=<IDs explícitos separados por coma, solo para bootstrap>
```

`MAIL_SESSION_KEY` es independiente de `NEXTAUTH_SECRET`, no tiene valor predeterminado, no va en Git y debe guardarse en el gestor de secretos. Rotarla invalida las sesiones; borrar `MailSession` en la rotación. HTTPS obligatorio; HTTP solo se admite fuera de producción y únicamente para localhost/127.0.0.1.

`MAIL_PUBLIC_URL` debe coincidir exactamente con el origen visible del navegador. Para desarrollo usar, por ejemplo, `http://localhost:1337`. No agregar dominios comodín ni `AUTH_COOKIE_DOMAIN` a la cookie de correo.

## Base de datos

Migración aditiva `20261018090000_mercav_mail`: `MailAccount`, `MailSession`, `MailAuditEvent`, `MailRateLimit` y dos enumeraciones. No modifica ni habilita usuarios existentes. Aplicar mediante el procedimiento del repositorio, una vez verificado el historial de producción. No ejecutar `db push` ni hacer baseline automático.

Los correos y adjuntos permanecen en Stalwart; la base de datos de la aplicación almacena la autorización, preferencias y sesiones. Este checkout utiliza la conexión Prisma existente para esos metadatos. Si el despliegue requiere aislamiento físico total, debe desplegarse un almacén dedicado para los modelos Mail; no se ha realizado esa separación aquí.

## Sesiones y protección

- Cookie `__Host-mercav-mail`: Secure, HttpOnly, SameSite=Strict, Path=/, sin Domain. En localhost se usa `mercav-mail-local`.
- Token aleatorio de 256 bits; solo su hash SHA-256 se almacena en la BD. Expiración absoluta de 8 horas e inactividad de 30 minutos. Se revalida `MailAccount.status` en cada petición y se pueden revocar todas las sesiones.
- La credencial individual que permite llamar a Stalwart se almacena **cifrada de manera reversible** con AES-256-GCM y el ID de cuenta como AAD. No es un hash de contraseña. Se requiere para reautenticar JMAP durante la sesión; un compromiso simultáneo del servidor y su clave permitiría descifrarla. Expiración y limpieza limitan su retención. Para una segunda integración de identidad, sustituirla por tokens OAuth/OIDC delegados con scopes y refresh tokens rotables; no afirmar que esa migración ya está hecha.
- Cada mutación verifica `Origin` exacto, `X-Mercav-Mail: 1` y Fetch Metadata; no se habilita CORS. Login tiene estas mismas protecciones.
- Límites compartidos en PostgreSQL: login por correo 10/15 min y global 300/min; API 180/min por cuenta; envíos 20/min y 300/día; adjuntos 20/min. Configurar además límites por IP en el proxy que conoce la IP real; la aplicación no confía en un `X-Forwarded-For` suministrado libremente.
- Auditoría solo de acciones e IDs; nunca contenidos, asuntos, contraseñas ni tokens. La tabla es un registro de aplicación, **no es inmutable frente a administradores de BD**. Exportarla a almacenamiento externo con retención/WORM antes de afirmar auditoría inmutable.

## API de interfaz

Todas las respuestas JSON usan `{success:true,data:...}` o `{success:false,error:"..."}`. Ninguna respuesta de correo es cacheable.

| Ruta | Función |
|---|---|
| `POST /api/mail/login` | `{email,password}`; inicia sesión privada |
| `POST /api/mail/logout` | Revoca la sesión y borra cookie |
| `GET /api/mail/session` | `{user:{email,name,role},expiresAt}` |
| `GET /api/mail/mailboxes` | `{mailboxes:[...]}` |
| `POST /api/mail/mailboxes` | `{name}`; crea carpeta personal |
| `GET /api/mail/messages?mailboxId=&q=&position=` | Lista de 50 y `hasMore` |
| `GET /api/mail/messages/:id` | Mensaje, cuerpo de texto y lista de adjuntos |
| `PATCH /api/mail/messages/:id` | `{action:read/unread/star/unstar/move,mailboxId?}` |
| `POST /api/mail/messages` | `{to:[],cc:[],bcc:[],subject,text,draft,draftId?,attachments:[],confirmExternal?}` |
| `POST /api/mail/attachments` | Multipart `file`, máximo 10 MB |
| `GET /api/mail/attachments?messageId=&blobId=` | Descarga autenticada, siempre attachment |
| `GET/PATCH /api/mail/settings` | Firma de texto plano |
| `GET/POST /api/mail/admin/accounts` | Lista o autoriza cuenta ya aprovisionada en Stalwart |
| `PATCH /api/mail/admin/accounts/:id` | Nombre, rol, estado o `revokeSessions:true` |
| `GET /api/mail/admin/audit` | Últimos 100 eventos, administración/auditoría |

JMAP limita las operaciones al accountId personal obtenido del servidor. Las URLs de descubrimiento, subida y descarga deben compartir el origen configurado; redirecciones HTTP fallan. La API no acepta URLs upstream ni llamadas JMAP arbitrarias desde el navegador. El remitente se obtiene de una identidad autorizada del servidor que coincide con el correo de la sesión.

El cuerpo se presenta como texto plano: no se ejecuta HTML de correo, no se cargan imágenes remotas ni píxeles de seguimiento. Un correo que solo contiene HTML puede verse sin cuerpo en esta versión. Los adjuntos se sirven como `application/octet-stream`, `attachment`, `nosniff` y CSP sandbox. Máximo 10 adjuntos, 10 MB por archivo y 20 MB declarados por mensaje; Stalwart debe aplicar límites reales de tamaño y cuota. Se rechazan nombres de ejecutables comunes; **no equivale a antivirus**. Debe habilitarse y probarse el filtrado antimalware entrante/saliente en Stalwart antes de producción. Los destinatarios externos requieren `confirmExternal:true` luego de confirmación visible del usuario.

## Alta, baja y operación

1. Crear el buzón personal y la contraseña en Stalwart mediante su administración privada. Verificar las carpetas con roles `inbox`, `drafts`, `sent`, `trash`, `junk` y una identidad de envío para la dirección.
2. Autorizar exactamente esa dirección mediante la API/panel administrativo Mercav Mail. El alta local no crea el buzón en Stalwart.
3. Entregar la credencial por un canal interno seguro. No enviar contraseñas en Git, logs o esta documentación.
4. Al dar de baja: suspender `MailAccount` y revocar sesiones, **y también suspender/revocar la identidad en Stalwart** para bloquear otros protocolos y accesos directos. La suspensión local protege el webmail, no revoca por sí sola IMAP/SMTP/OAuth externos.
5. Programar limpieza al menos diaria: eliminar `MailSession` vencidas por expiración o 30 min de inactividad, y `MailRateLimit` con `expiresAt < now()`. Limitar privilegios DB; las credenciales expiradas no deben retenerse en backups indefinidamente.
6. Ajustar retención de eventos, backup cifrado, restauración real y rotación de llaves según política interna.

## Validación pendiente de infraestructura

- Desplegar y verificar el JMAP real, login autorizado/no autorizado, bandejas, envío, borrador, adjuntos y revocación.
- Prueba de aislamiento entre dos buzones y de permisos compartidos. Esta versión solo abre el buzón personal primario; delegaciones, contactos corporativos, reglas y administración de cuotas se hacen en Stalwart, sin interfaz propia aún.
- Antivirus, antispam, DKIM/SPF/DMARC, TLS, colas, reputación, restauración y alertas; no afirmar que se ejecutaron por compilar el frontend.
- El envío usa Email/set y EmailSubmission/set: si el servidor acepta el envío pero se corta la respuesta, el resultado puede ser ambiguo. La interfaz debe indicar revisar Enviados antes de reintentar; no hay garantía de envío exactamente una vez ante pérdidas de red.

Referencias técnicas consultadas: [JMAP Mail RFC 8621](https://www.rfc-editor.org/rfc/rfc8621), [autenticación de Stalwart](https://stalw.art/docs/auth/authentication/).
