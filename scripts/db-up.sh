#!/usr/bin/env bash
# 로컬 Docker PostgreSQL 17 (컨테이너 1개 · DB 3개: 개발 axlab_demo / e2e axlab_demo_test / Vitest axlab_demo_unit).
# 사용: scripts/db-up.sh up|reset|down|status
# 여러 번 돌려도 결과 같음: up 은 없으면 만들고 멈췄으면 켜고 켜져 있으면 그대로. reset 만 데이터를 지운다.
# exit: 0 성공 · 1 기동 실패 · 2 사용법 · 3 docker 없음/데몬 꺼짐
set -euo pipefail

NAME="${PG_CONTAINER:-axlab-demo-pg}"
VOLUME="${PG_VOLUME:-axlab-demo-pgdata}"
IMAGE="${PG_IMAGE:-postgres:17}"
PORT="${PG_PORT:-54329}"
DB="${PG_DB:-axlab_demo}"
EXTRA_DBS="${PG_EXTRA_DBS:-axlab_demo_test axlab_demo_unit}"

case "${1:-}" in up|down|reset|status) ;; *) echo "사용: $0 up|reset|down|status" >&2; exit 2 ;; esac
command -v docker >/dev/null 2>&1 || { echo "db-up: docker 명령 없음" >&2; exit 3; }
docker info >/dev/null 2>&1 || { echo "db-up: docker 데몬 응답 없음" >&2; exit 3; }

state() { docker inspect -f '{{.State.Running}}' "$NAME" 2>/dev/null || echo absent; }

wait_ready() {
  for _ in $(seq 1 30); do
    docker exec "$NAME" pg_isready -U postgres -d "$DB" >/dev/null 2>&1 && return 0
    sleep 1
  done
  echo "db-up: 30초 안에 준비되지 않음" >&2
  return 1
}

ensure_dbs() {
  for d in $EXTRA_DBS; do
    docker exec "$NAME" psql -U postgres -d postgres -Atc "select 1 from pg_database where datname='${d}'" | grep -q 1 \
      || docker exec "$NAME" createdb -U postgres "$d"
  done
}

up() {
  case "$(state)" in
    true) ;;
    false) docker start "$NAME" >/dev/null ;;
    absent)
      docker run -d --name "$NAME" -p "127.0.0.1:${PORT}:5432" \
        -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB="$DB" \
        -v "${VOLUME}:/var/lib/postgresql/data" "$IMAGE" >/dev/null ;;
  esac
  wait_ready || exit 1
  ensure_dbs
  echo "db-up: ready port=${PORT} dbs=${DB} ${EXTRA_DBS}"
}

down() {
  [ "$(state)" = absent ] || docker rm -f "$NAME" >/dev/null
  echo "db-up: down (volume ${VOLUME} 유지)"
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  reset) down; docker volume rm -f "$VOLUME" >/dev/null; up ;;
  status) echo "db-up: running=$(state)" ;;
  *) echo "사용: $0 up|reset|down|status" >&2; exit 2 ;;
esac
