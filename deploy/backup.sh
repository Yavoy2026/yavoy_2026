#!/usr/bin/env bash
# Логический бэкап базы прод-ноды. Ставится в cron: 03:00 UTC ежедневно.
#
# Снапшот диска у провайдера это не заменяет: он не спасает от «миграция
# снесла данные» и живёт в той же инфраструктуре, что и сама нода.
#
# BACKUP_REMOTE (опционально) — назначение вне ноды в формате scp:
#   BACKUP_REMOTE="user@host:/path" — без него дамп остаётся только здесь,
#   и потеря хоста означает потерю бэкапов вместе с базой.
set -euo pipefail

COMPOSE=/opt/yavoy/docker-compose.prod.yml
DIR=/var/backups/yavoy
KEEP_DAYS=14
STAMP=$(date -u +%Y%m%d-%H%M)
FILE="$DIR/yavoy-$STAMP.sql.gz"

mkdir -p "$DIR"

# --clean --if-exists: дамп можно залить в непустую базу, не вычищая её руками
docker compose -f "$COMPOSE" exec -T postgres \
  pg_dump -U yavoy --clean --if-exists yavoy | gzip -9 > "$FILE"

# Пустой дамп — это провал, который иначе заметят только при восстановлении
SIZE=$(stat -c %s "$FILE")
if [ "$SIZE" -lt 1024 ]; then
  echo "ОШИБКА: дамп $FILE подозрительно мал ($SIZE байт)" >&2
  exit 1
fi

if [ -n "${BACKUP_REMOTE:-}" ]; then
  scp -q -o BatchMode=yes "$FILE" "$BACKUP_REMOTE/" || {
    echo "ОШИБКА: дамп не уехал на $BACKUP_REMOTE — на ноде он есть, вне ноды нет" >&2
    exit 1
  }
fi

find "$DIR" -name 'yavoy-*.sql.gz' -mtime +$KEEP_DAYS -delete

echo "$(date -u +%FT%TZ) бэкап готов: $FILE ($((SIZE / 1024)) КБ)${BACKUP_REMOTE:+, отправлен на $BACKUP_REMOTE}"
