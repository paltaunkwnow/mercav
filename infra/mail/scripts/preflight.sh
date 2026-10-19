#!/usr/bin/env bash
# Offline checks only: does not start containers, touch DNS or contact the VPS.
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -f .env ]] || { printf '%s\n' 'Copy .env.example to .env first' >&2; exit 1; }
docker compose --env-file .env -f compose.yaml -f compose.production.yaml config --quiet
python3 - <<'PY'
from pathlib import Path
import re
values = dict(line.split('=', 1) for line in Path('.env').read_text().splitlines()
              if line and not line.startswith('#') and '=' in line)
for name in ('STALWART_IMAGE', 'CADDY_IMAGE'):
    value = values.get(name, '')
    if not re.fullmatch(r'[^\s]+@sha256:[0-9a-f]{64}', value):
        raise SystemExit(f'{name}: pin a tested immutable sha256 digest before production')
if 'REPLACE_' in values.get('RESTIC_REPOSITORY', ''):
    raise SystemExit('Configure an off-host backup repository')
print('Compose and production image pins validated. Complete the runbook gates before launch.')
PY
