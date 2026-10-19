# Despliegue y operación de Mercav Mail

## 1. Requisitos y decisiones del operador

- VPS Linux dedicada, 2–4 vCPU, RAM inicial 4–8 GiB y disco dimensionado por cuota
  total, cola, índice y al menos 30 % libre. Ajustar límites Compose con mediciones.
- IPv4 estática con buena reputación y PTR configurable; proveedor que permita
  tráfico entrante y saliente en puerto 25. Comprobar esto antes de contratar.
- Dominio/DNS bajo control, cuenta de emergencia externa a `mercav.lat`, gestor de
  secretos y repositorio de backups fuera del proveedor del servidor.
- Inventario de MX, SPF, DKIM, alias, usuarios, campañas y correos transaccionales
  actuales. Tener copia exacta de DNS anterior y plan de reversión del MX.
- Responsable de guardia, responsable de datos y política de retención aprobada.
- Sin autoalta de usuarios ni catch-all. Buzones solo de integrantes autorizados.
- Fijar imágenes por digest y registrar versión/licencia. Actualización primero en
  staging con copia de prueba, nunca sobre la única copia de datos.

Objetivos iniciales: RPO 24 horas y RTO 4 horas después de una restauración probada.
El backup frío diario detiene brevemente Stalwart: acordar ventana y monitorizar
duración; los MTAs externos reintentan, pero clientes ven una pausa. Si se exige
continuidad, migrar a backups consistentes soportados por el datastore o a réplica
probada, sin copiar un RocksDB vivo con `tar`.

## 2. Host y firewall

Aplicar actualizaciones de seguridad del sistema, SSH con llave, login root remoto
deshabilitado, acceso de administración por VPN y sincronización de hora. Discos
cifrados, acceso físico/control de consola restringidos. Configurar procedimiento
de desbloqueo tras reinicio y mantener la llave fuera del host. El cifrado en reposo
no evita que un atacante con acceso root al servidor en ejecución lea datos.

| Entrada | Origen | Política |
| --- | --- | --- |
| SSH/VPN | Red administrativa | Permitir solo lo necesario |
| 25/tcp | Internet | Permitir tras controles, SMTP MTA |
| 80/tcp | Internet | ACME/redirección a HTTPS |
| 443/tcp | Internet | Caddy webmail/MTA-STS |
| 465/tcp | Clientes autorizados | TLS + autenticación |
| 993/tcp | Clientes autorizados | TLS; omitir si solo hay webmail |
| 8080 y 8443 | Loopback/VPN | Nunca Internet |
| 110, 143, 587, 995, 4190 | Ninguno por defecto | Cerrados |

Docker puede saltarse reglas simples de UFW mediante sus reglas NAT. Aplicar las
restricciones en firewall del proveedor y `DOCKER-USER`/nftables compatible, comprobar
desde otra máquina todos los puertos IPv4 y IPv6. No dar por hecho que UFW basta.
Salida: DNS hacia resolvers aprobados; SMTP 25 a MTAs; HTTPS para certificados,
actualizaciones y backup. No poner límites que impidan DNS/TCP o respuestas DNSSEC.
No exponer Docker socket ni API Docker.

## 3. Políticas dentro de Stalwart

Tras bootstrap revisar y exportar el estado configurado; la sintaxis exacta depende
del esquema `v0.16` fijado. Usar la UI/CLI oficial y recargar ajustes cuando proceda.

- Borrar contraseña bootstrap, cerrar HTTP inicial y mantener administración VPN.
- Deshabilitar POP3 y listeners innecesarios; SMTP 25 nunca debe ofrecer relay a
  dominios externos sin autorización. Submission 465 exige autenticación y TLS.
- TLS 1.2/1.3 para clientes; certificados válidos para `mx1.mercav.lat` por DNS-01,
  token DNS restringido y alerta de renovación. No exigir TLS a todo SMTP entrante
  25: bloquearía remitentes legítimos; anunciar STARTTLS y usar políticas de dominio.
- Directorio interno separado de clientes Mercav; nada de crear buzón por iniciar
  sesión en Business. Administrador con cuenta independiente de uso cotidiano.
- Roles mínimos; credenciales administrativas nunca en sesiones de webmail. APIs
  de aprovisionamiento solo del backend y permisos explícitos de creación de cuentas.
- Contraseñas individuales largas, hash soportado por el servidor; recuperación
  manual verificada, revocación de sesiones y desactivación inmediata en bajas.
- Rate limits por IP/identidad y autobloqueo: comenzar con límites conservadores,
  medir NAT del equipo para evitar bloqueos globales. Alertar ráfagas de fallos.
- Cuota inicial sugerida 5 GiB por usuario; tamaño máximo de mensaje 25 MiB total,
  coherente en Stalwart/BFF/proxy y teniendo en cuenta expansión MIME base64.
- Límite de destinatarios y envío por hora por identidad; las campañas pertenecen
  a proveedor/subdominio transaccional separado. Nunca permitir suplantar `From`.
- Antispam nativo, SPF/DKIM/DMARC y cuarentena. Para antivirus añadir un motor
  compatible soportado por la edición/versión: activar y probar EICAR antes del
  piloto. El stack base no afirma tener un antivirus ya conectado.
- No reenviar automáticamente a destinos externos por defecto. Cambios de alias,
  reglas, permisos y claves deben quedar auditados sin registrar cuerpos/secretos.
- Buzones compartidos por permisos/ACL, nunca contraseña compartida. Comprobar
  capacidades de la edición Community elegida antes de habilitar delegación.
- Retención sugerida pendiente de aprobación: spam 30 días, papelera 30 días,
  auditoría de seguridad 90 días; contenido corporativo según política real.

## 4. DNS y certificados

Fusionar `dns.example.zone` con el DNS real. No aplicar las IP de ejemplo. `mail`
y `mta-sts` apuntan al proxy; `mx1` a la VPS SMTP (pueden compartir IP). Si el DNS
usa Cloudflare, `mx1` debe estar en DNS only, nunca proxy HTTP naranja.

1. Verificar A/PTR recíprocos y hostname EHLO `mx1.mercav.lat`.
2. Generar DKIM privado en Stalwart y publicar solo la clave pública/selector real.
   Usar RSA 2048 para compatibilidad; rotar con dos selectores y convivencia que
   cubra TTL y colas antes de retirar el antiguo. Nunca copiar la llave al frontend.
3. Fusionar SPF con todos los emisores legítimos. Solo un registro SPF por nombre;
   mantener el límite de consultas DNS del estándar.
4. Crear buzones/alias operativos para `postmaster`, `abuse`, `dmarc`, `tls-reports`.
5. Iniciar DMARC `p=none`; revisar alineación real de todos los envíos y reportes,
   luego `quarantine`, finalmente `reject` cuando todas las fuentes estén validadas.
   No endurecer mientras falta un proveedor transaccional inventariado.
6. MTA-STS inicialmente `testing` (archivo incluido). Comprobar certificado de MX,
   STARTTLS y todos los MX. Pasar a `enforce`, ampliar `max_age` y cambiar `id` TXT.
   Una política enforce cacheada no se deshace al instante al revertir DNS.
7. TLS-RPT a la cuenta funcional creada; leer reportes, no solo publicarlos.
8. CAA debe permitir todos los emisores usados en Mercav. No reemplazar los actuales.
9. Publicar AAAA solo al comprobar PTR, TLS y SMTP IPv6; IPv6 mal configurado afecta
   entregabilidad aunque IPv4 funcione.

Antes del cambio de MX bajar TTL, respaldar configuración anterior, comprobar
destinatarios existentes y probar importación si hay correo previo. No cambiar MX
sin un plan explícito de migración y ventana; los caches pueden usar ambos sistemas.

## 5. Backups y restauración

Instalar restic en host, inicializar repositorio cifrado off-host, cuenta de acceso
de privilegios mínimos y password en `/etc/mercav-mail/restic-password.secret`
propiedad root, modo 0600. Exportar `RESTIC_*`, `MAIL_STATE_DIR` y credenciales del
proveedor desde un archivo protegido del servicio; `backup.sh` no ejecuta `.env`
como código ni obtiene automáticamente credenciales de él. El archivo `.env` solo
lo interpreta Compose.

Ejecutar `bash scripts/backup.sh` diariamente mediante systemd y alertar cualquier
salida no cero. Su bloqueo evita copias simultáneas y el trap reinicia Stalwart ante
fallo. Después confirmar estado running y realizar una conexión de cliente real.
Programar `restic check --read-data-subset=10%` semanal y revisión completa mensual.
Retención sugerida: 7 diarias, 4 semanales, 12 mensuales. Podar con una tarea
separada después de comprobar restauración; habilitar versionado/object-lock del
destino cuando sea compatible y conservar credenciales de borrado fuera del host.

Respaldar también, por separado, la base de datos/estado de autenticación del BFF
de Mercav Mail y su clave de cifrado de sesiones. La copia de Stalwart no incluye
ese estado ni los secretos del entorno de la app. Guardar llaves de disco y restic
en un gestor distinto del servidor. No incluir correos o llaves en Git.

Restauración mensual y ante incidentes:

1. Provisionar host de recuperación aislado, misma imagen por digest, sin SMTP de
   salida y sin DNS público. No restaurar encima del único buzón activo.
2. Verificar repositorio; elegir snapshot y ejecutar `restic restore SNAPSHOT --target
   /srv/mercav-mail-restore` (el árbol incluye rutas absolutas del backup).
3. Identificar el subdirectorio restaurado, copiar config/datos a la ruta privada
   de recuperación; aplicar propietario 2000:2000. No hacer `compose down -v`.
4. Restaurar backend de Mercav y claves del BFF siguiendo su procedimiento. Desactivar
   tareas y SMTP de salida para que colas restauradas no reenvíen mensajes antiguos.
5. Levantar solo Compose base. Verificar login autorizado, cuentas suspendidas,
   mensajes, adjuntos, carpetas, permisos compartidos, DKIM y búsqueda.
6. Medir RPO/RTO; registrar evidencia sin contenido de mensajes. Solo después de
   reconciliar cola, cuentas y mensajes posteriores al snapshot permitir tráfico.

## 6. Monitoreo y guardia

Usar un monitor externo al host y un canal de alertas que sobreviva a una caída del
propio correo. No asumir endpoints ni métricas Enterprise disponibles: confirmar
exportador/telemetría de la versión; si no, checks TCP/TLS, logs y API autorizada.

| Señal | Umbral inicial / acción |
| --- | --- |
| HTTPS y login | Fallo 2 minutos, investigar webmail/BFF/Stalwart |
| SMTP STARTTLS, 465 y 993 | Sonda externa cada 5 minutos |
| Certificado web y MX | Avisar a 21 días, crítico a 7 |
| Espacio libre | Avisar <25 %, crítico <15 %; nunca borrar datastore manualmente |
| Cola SMTP | Edad >30 minutos o crecimiento sostenido, revisar destino/reputación |
| Rebotes / envío por cuenta | Alertar desviación del comportamiento habitual |
| Autenticación | Ráfagas, cambios de país/IP, recuperación y reenvíos nuevos |
| Backup | Último correcto >26 horas, crítico; restauración vencida >35 días |
| Docker/host | Reinicios, OOM, CPU sostenida y reloj desviado |

Centralizar logs con acceso mínimo y retención aprobada, eliminar credenciales de
bootstrap y no registrar autorización, cuerpos, query sensible ni adjuntos. En el
arranque no hay integración externa de alertas: conectarla antes del go-live.

## 7. Procedimientos comunes

Alta: aprobación interna → crear cuenta Stalwart/permisos → dar acceso al webmail
por mecanismo autorizado → activar de forma individual → comprobar cuota/envío.
No generar cuentas corporativas desde registro público de Mercav.

Baja: suspender identidad y buzón → revocar sesiones del BFF, tokens y contraseñas
de aplicación → retirar ACL/alias → asignar conservación a responsable → registrar
evento → eliminar solo tras vencer retención. Restablecer acceso exige verificación
por un canal previamente autorizado.

Incidente: suspender cuenta comprometida y salida SMTP afectada; revocar credenciales
y sesiones; conservar logs; inspeccionar reglas de reenvío y cola; rotar las claves
expuestas; avisar al responsable por canal externo; recuperar y medir impacto.
Nunca eliminar cola completa sin revisión porque contiene correo legítimo.

Actualización: revisar changelog y migraciones, backup y restauración previa, staging
con copia, verificar funciones de edición/licencia y luego fijar digest nuevo.
Rollback de binario puede no entender un datastore migrado: volver a snapshot en
host aislado y reconciliar correo nuevo, no degradar ciegamente la imagen.

## 8. Checklist obligatorio de salida

- [ ] Infraestructura, IP, PTR y puerto 25 verificados con proveedor.
- [ ] Imágenes fijadas por digest, sin autoupdate, licencia revisada.
- [ ] Sin registro público, usuarios de la plataforma sin acceso corporativo.
- [ ] Login, recuperación, revocación y baja probados con usuario real.
- [ ] Buzones compartidos y From restringidos según permisos.
- [ ] Administración solo VPN/loopback; bootstrap y HTTP cerrados.
- [ ] TLS web/SMTP/IMAP válidos; prueba externa sin omitir validación.
- [ ] SPF/DKIM/DMARC alineados en mensajes reales y emisores actuales preservados.
- [ ] DNS/MX/MTA-STS/TLS-RPT revisados, rollback documentado.
- [ ] Relay abierto rechazado desde una máquina externa.
- [ ] Autenticación inválida, fuerza bruta y rate limits probados con límites seguros.
- [ ] Antispam y antivirus conectados/probados; cuarentena revisable.
- [ ] Mensajes HTML, enlaces e imágenes remotas aislados por el webmail.
- [ ] Límites de adjuntos, cuotas, destinatarios y envío comprobados.
- [ ] Entrega/recepción con Gmail, Outlook, iCloud y dominio de prueba verificadas.
- [ ] Backup cifrado off-host más restauración completa y claves de recuperación.
- [ ] Alertas externas y responsable de guardia funcionan.
- [ ] Piloto con 3–5 cuentas, después alta progresiva del equipo.

Las casillas vacías son dependencias de despliegue reales, no controles ya ejecutados
por guardar los archivos de este directorio.
