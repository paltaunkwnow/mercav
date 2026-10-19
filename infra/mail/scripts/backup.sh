#!/usr/bin/env bash
# Cold, consistent backup for the single-node local-store deployment.
# Run from cron/systemd as a dedicated operator with Docker + restic access.
set -euo pipefail
umask 077

cd "$(dirname "$0")/.."
: "${MAIL_STATE_DIR:?Set MAIL_STATE_DIR explicitly}"
: "${RESTIC_REPOSITORY:?Set RESTIC_REPOSITORY}"
: "${RESTIC_PASSWORD_FILE:?Set RESTIC_PASSWORD_FILE}"
[[ "$MAIL_STATE_DIR" = /* && -d "$MAIL_STATE_DIR/stalwart/data" ]] || {
  printf '%s\n' 'Invalid or missing mail data directory' >&2; exit 1;
}
command -v flock >/dev/null
command -v restic >/dev/null
exec 9>/run/lock/mercav-mail-backup.lock
flock -n 9 || exit 1
compose=(docker compose --env-file .env -f compose.yaml -f compose.production.yaml)
[[ "$("${compose[@]}" ps --status running --services stalwart)" == stalwart ]] || {
  printf '%s\n' 'Stalwart must be running before a scheduled backup' >&2; exit 1;
}
restart_required=0
restart_mail() {
  if [[ "$restart_required" == 1 ]]; then "${compose[@]}" start stalwart; fi
}
trap restart_mail EXIT
restart_required=1
"${compose[@]}" stop stalwart
# Include the startup config AND datastore (accounts, DKIM keys, mail, queue).
# Include proxy ACME state. The off-host repository is encrypted by restic.
restic backup --tag mercav-mail "$MAIL_STATE_DIR"
"${compose[@]}" start stalwart
restart_required=0
restic check
# Retention pruning is a separate supervised task after successful restore drills.
