# Mercav Mail: infraestructura privada

Este directorio prepara un servidor de correo exclusivo para el equipo autorizado
de Mercav. No crea buzones para clientes de Business, Pwn o Kosher. No cambia DNS,
MX ni producción automáticamente. La interfaz propia usa el backend de la app;
Stalwart conserva los mensajes y las credenciales de correo en un host dedicado.

## Topología

| Componente | Dirección | Exposición |
| --- | --- | --- |
| Webmail Mercav | `https://mail.mercav.lat` | HTTPS público, login privado |
| SMTP entre servidores | `mx1.mercav.lat:25` | Público, STARTTLS oportunista |
| SMTP autenticado | `mx1.mercav.lat:465` | Público, TLS implícito |
| IMAP | `mx1.mercav.lat:993` | Público solo si se necesitan clientes externos |
| JMAP y administración Stalwart | `https://mx1.mercav.lat:8443` | Loopback/VPN, jamás público |
| Asistente inicial | `127.0.0.1:8080/admin` | Túnel SSH temporal |
| Política MTA-STS | `https://mta-sts.mercav.lat/.well-known/mta-sts.txt` | HTTPS público |

Caddy termina HTTPS para webmail y MTA-STS. Stalwart necesita su propio certificado
válido para `mx1.mercav.lat` y los protocolos de correo: obtenerlo por ACME DNS-01
con un token DNS de alcance mínimo. No usar TLS-ALPN-01 en Stalwart porque Caddy
ocupa el 443 público. El token de DNS debe quedarse en el almacén privado del
servidor y nunca en este repositorio.

La API de Mercav debe conectarse por red privada. Si vive en el mismo host, resolver
`mx1.mercav.lat` a `127.0.0.1` en ese host y usar `https://mx1.mercav.lat:8443`; así
el nombre y el certificado coinciden. Si vive en otro host, usar VPN con nombre DNS
correcto, limitar el listener a la IP de VPN y permitir solo al BFF. No desactivar
la validación TLS ni usar `NODE_TLS_REJECT_UNAUTHORIZED=0`. Las URLs JMAP devueltas
por Stalwart deben apuntar al mismo origen privado permitido por el BFF.

## Estado de la implementación

Se incluyen Compose, proxy, política MTA-STS inicial, plantilla de DNS, backup
cifrado y controles previos. La configuración de dominios, cuentas, certificados,
permisos y filtros de Stalwart se debe aplicar tras el bootstrap y verificar contra
el esquema de la versión instalada. No se simula un despliegue completo mediante
un archivo TOML incompatible.

La documentación oficial consultada el 18 de octubre de 2026 usa Stalwart `v0.16`,
`/etc/stalwart/config.json`, `/var/lib/stalwart` y configuración en objetos JMAP.
Las recetas de Stalwart 0.15 no son intercambiables. La edición Community se ofrece
bajo AGPL; revisar las condiciones de la versión fijada y las funciones Enterprise
antes de asumir que una función administrativa, de cifrado o auditoría está incluida.
No se promete cifrado extremo a extremo universal: TLS y cifrado de disco/backup
son capas distintas; OpenPGP/S/MIME requieren claves y clientes compatibles.

## Inicio controlado

1. Completar [el runbook](RUNBOOK.md), inventario del correo actual y presupuesto.
2. Copiar `.env.example` a `.env` (modo `0600`) en el host dedicado y cambiar las imágenes por
   referencias `@sha256` probadas. No usar `latest` ni actualizaciones automáticas.
3. Crear `/srv/mercav-mail/stalwart/{config,data}` con propietario `2000:2000` y
   permisos `0700`; crear también directorios de Caddy. Cifrar el disco antes.
4. Ejecutar `docker compose --env-file .env -f compose.yaml config --quiet`.
5. Levantar únicamente `docker compose --env-file .env -f compose.yaml up -d stalwart`.
   Este paso no publica SMTP, IMAP ni administración a Internet.
6. Entrar por túnel SSH `ssh -L 8080:127.0.0.1:8080 OPERADOR@HOST` y abrir
   `http://127.0.0.1:8080/admin` en el equipo del operador. Consultar la contraseña
   temporal directamente en logs privados del servidor; no copiarlos al chat.
7. Asistente: hostname `mx1.mercav.lat`, dominio `mercav.lat`, directorio interno,
   RocksDB local, logs Console, DNS manual inicialmente. Configurar DNS-01 antes
   de intentar obtener certificados. Guardar la cuenta permanente en un gestor.
8. Aplicar todos los controles del runbook. Conservar HTTP solo durante bootstrap;
   después deshabilitar su listener y eliminar el mapeo 8080 de Compose en el host.
9. Validar `bash scripts/preflight.sh`. Crear y probar backup/restauración.
10. Solo entonces usar `docker compose --env-file .env -f compose.yaml -f
    compose.production.yaml up -d`. Confirmar que Mercav Mail está configurado en
    el upstream y responde al hostname antes de publicar enlaces a usuarios.

El proxy presupone que el servidor de Next.js está levantado por su despliegue
habitual. `MERCAV_MAIL_UPSTREAM` es un destino de confianza configurado por el
operador, nunca un valor suministrado por el usuario. No ejecutar el contenedor de
correo dentro de la infraestructura de base de datos de Mercav.

## Archivos

- `compose.yaml`: bootstrap privado y almacenamiento persistente.
- `compose.production.yaml`: exposición explícita de correo y Caddy.
- `Caddyfile`: HTTPS webmail y MTA-STS sin API administrativa pública.
- `dns.example.zone`: ejemplo para fusionar con DNS existente.
- `scripts/backup.sh`: copia consistente de todo Stalwart usando restic cifrado.
- `scripts/preflight.sh`: comprobación offline de Compose e imágenes fijadas.
- `RUNBOOK.md`: políticas, despliegue, operación, incidentes y recuperación.

## Referencias verificadas

- [Docker, rutas y bootstrap de Stalwart](https://stalw.art/docs/install/platform/docker/)
- [Configuración actual basada en objetos](https://stalw.art/docs/configuration/)
- [Hardening](https://stalw.art/docs/install/security/)
- [Snapshot de configuración](https://stalw.art/docs/management/cli/snapshot/)
- [Comparación de ediciones](https://stalw.art/compare/)

Una exportación de configuración no reemplaza una copia de mensajes y adjuntos.
Las pruebas de este directorio validan archivos; el go-live requiere las pruebas
reales de TLS, reputación, envío, recepción y restauración del runbook.
