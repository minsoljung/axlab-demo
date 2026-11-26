#!/usr/bin/env bash
# 운영(Supabase) DB 마이그레이션만 적용한다: 1) 연결 확인 2) prisma migrate deploy.
# deploy-setup.sh 와 달리 통신사 데이터·Vercel 환경변수(ADMIN_ACCESS_CODE 포함)는 건드리지 않는다.
# 사용: scripts/db-migrate-prod.sh  (먼저 `supabase link` 완료). 비밀번호는 보이지 않게 입력받고 파일·로그·인자에 남기지 않는다.
# 마이그레이션은 미적용분만 적용된다(여러 번 실행해도 결과 같음).
# exit: 0 성공 · 1 단계 실패 · 2 사전 조건 부족
set -euo pipefail
cd "$(dirname "$0")/.."

need() { command -v "$1" >/dev/null 2>&1 || { echo "db-migrate-prod: $1 없음" >&2; exit 2; }; }
need node; need npm; need python3
[ -f supabase/.temp/pooler-url ] || { echo "db-migrate-prod: 먼저 supabase link (supabase/.temp/pooler-url 없음)" >&2; exit 2; }

POOLER="$(cat supabase/.temp/pooler-url)"   # 비밀번호 없는 주소
USERREF="$(python3 -c 'import sys,urllib.parse as u;print(u.urlparse(sys.argv[1]).username)' "$POOLER")"
HOST="$(python3 -c 'import sys,urllib.parse as u;print(u.urlparse(sys.argv[1]).hostname)' "$POOLER")"
[ -n "$USERREF" ] && [ -n "$HOST" ] || { echo "db-migrate-prod: pooler-url 을 읽지 못함" >&2; exit 2; }

printf 'Supabase DB 비밀번호 (입력이 보이지 않음): '; read -rs DB_PW; echo
[ -n "$DB_PW" ] || { echo "db-migrate-prod: 비밀번호가 비어 있음" >&2; exit 2; }
ENC="$(DB_PW="$DB_PW" python3 -c 'import os,urllib.parse as u;print(u.quote(os.environ["DB_PW"],safe=""))')"
unset DB_PW
SESSION_URL="postgresql://${USERREF}:${ENC}@${HOST}:5432/postgres"   # 마이그레이션·직접 연결(세션 풀러)
unset ENC

echo "1/2 DB 연결 확인(세션 풀러 5432)"
DIRECT_URL="$SESSION_URL" node -e '
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DIRECT_URL });
c.connect().then(() => c.query("select version()")).then((r) => { console.log("  " + r.rows[0].version.split(",")[0]); return c.end(); })
  .catch((e) => { console.error("  연결 실패:", e.message); process.exit(1); });
' || { echo "db-migrate-prod: 연결 실패 — 비밀번호를 확인하세요" >&2; exit 1; }

echo "2/2 마이그레이션(prisma migrate deploy)"
# 파이프 없이 출력을 변수에 받는다 — head·grep 이 먼저 닫혀 조용히 종료되는 결함을 피한다.
if OUT="$(DIRECT_URL="$SESSION_URL" npm run db:migrate --silent 2>&1)"; then
  printf '%s\n' "$OUT" | sed 's/^/  /'
else
  printf '%s\n' "$OUT" | sed 's/^/  /' >&2
  unset SESSION_URL
  echo "db-migrate-prod: 마이그레이션 실패" >&2
  exit 1
fi
unset SESSION_URL OUT
echo "db-migrate-prod: 완료"
