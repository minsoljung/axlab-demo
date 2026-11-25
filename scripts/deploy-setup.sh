#!/usr/bin/env bash
# 운영 배포 준비: Supabase DB 연결 확인 → 마이그레이션 → 통신사 기본 데이터 → Vercel 환경변수.
# 사용: scripts/deploy-setup.sh  (먼저 `supabase link`·`vercel link` 완료)
# 비밀번호·접근 코드는 화면에 보이지 않게 입력받고 파일·로그·명령 인자에 남기지 않는다.
# 여러 번 실행해도 결과 같음: 마이그레이션은 미적용분만, 통신사는 없는 것만, 환경변수는 덮어쓴다(--force).
# 🔴 prisma/seed.ts(db:seed)는 DB 를 비우고 다시 채우므로 운영에서 쓰지 않는다.
# exit: 0 성공 · 1 단계 실패 · 2 사전 조건 부족
set -euo pipefail
cd "$(dirname "$0")/.."

need() { command -v "$1" >/dev/null 2>&1 || { echo "deploy-setup: $1 없음" >&2; exit 2; }; }
need vercel; need node; need npm; need python3
[ -f .vercel/project.json ] || { echo "deploy-setup: 먼저 vercel link (.vercel/project.json 없음)" >&2; exit 2; }
[ -f supabase/.temp/pooler-url ] || { echo "deploy-setup: 먼저 supabase link (supabase/.temp/pooler-url 없음)" >&2; exit 2; }

POOLER="$(cat supabase/.temp/pooler-url)"   # 비밀번호 없는 주소
USERREF="$(python3 -c 'import sys,urllib.parse as u;print(u.urlparse(sys.argv[1]).username)' "$POOLER")"
HOST="$(python3 -c 'import sys,urllib.parse as u;print(u.urlparse(sys.argv[1]).hostname)' "$POOLER")"
[ -n "$USERREF" ] && [ -n "$HOST" ] || { echo "deploy-setup: pooler-url 을 읽지 못함" >&2; exit 2; }

printf 'Supabase DB 비밀번호 (입력이 보이지 않음): '; read -rs DB_PW; echo
[ -n "$DB_PW" ] || { echo "deploy-setup: 비밀번호가 비어 있음" >&2; exit 2; }
ENC="$(DB_PW="$DB_PW" python3 -c 'import os,urllib.parse as u;print(u.quote(os.environ["DB_PW"],safe=""))')"
unset DB_PW
SESSION_URL="postgresql://${USERREF}:${ENC}@${HOST}:5432/postgres"   # 마이그레이션·직접 연결(세션 풀러)
TX_URL="postgresql://${USERREF}:${ENC}@${HOST}:6543/postgres"        # 앱 런타임(트랜잭션 풀러, 서버리스용)

echo "1/5 DB 연결 확인(세션 풀러 5432)"
DIRECT_URL="$SESSION_URL" node -e '
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DIRECT_URL });
c.connect().then(() => c.query("select version()")).then((r) => { console.log("  " + r.rows[0].version.split(",")[0]); return c.end(); })
  .catch((e) => { console.error("  연결 실패:", e.message); process.exit(1); });
' || { echo "deploy-setup: 연결 실패 — 비밀번호를 확인하거나 Supabase 대시보드에서 DB 비밀번호를 재설정하세요" >&2; exit 1; }

echo "2/5 마이그레이션"
DIRECT_URL="$SESSION_URL" npm run db:migrate --silent 2>&1 | /usr/bin/grep -E "Applying|applied|No pending|Error" | sed 's/^/  /' || true

echo "3/5 통신사 기본 데이터(없는 것만)"
DIRECT_URL="$SESSION_URL" node -e '
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DIRECT_URL });
const rows = [["carrier-a","통신사 A"],["carrier-b","통신사 B"],["carrier-c","통신사 C"]];
(async () => {
  await c.connect();
  for (const [id, name] of rows) await c.query(`insert into "Carrier"(id,name) values ($1,$2) on conflict (id) do nothing`, [id, name]);
  const r = await c.query(`select count(*)::int as n from "Carrier"`);
  console.log("  통신사 " + r.rows[0].n + "개");
  await c.end();
})().catch((e) => { console.error("  실패:", e.message); process.exit(1); });
' || exit 1

echo "4/5 앱 런타임 연결 확인(트랜잭션 풀러 6543 + Prisma)"
DATABASE_URL="$TX_URL" npx tsx -e '
(async () => {
  const { prisma } = await import("./src/lib/db");
  console.log("  Prisma 조회 OK — 통신사 " + (await prisma.carrier.count()) + "개");
  await prisma.$disconnect();
})().catch((e) => { console.error("  실패:", e.message); process.exit(1); });
' || { echo "deploy-setup: 트랜잭션 풀러(6543)로 Prisma 가 안 됨 — DATABASE_URL 을 세션 풀러(5432)로 바꾸는 것을 검토" >&2; exit 1; }

echo "5/5 Vercel 환경변수 (production·preview, 값은 비공개로 저장)"
printf '관리자 접근 코드 (8자 이상, 입력이 보이지 않음): '; read -rs ADMIN; echo
[ "${#ADMIN}" -ge 8 ] || { echo "deploy-setup: 접근 코드는 8자 이상" >&2; exit 2; }
set_env() { printf %s "$2" | vercel env add "$1" --environment production,preview --sensitive --force --yes >/dev/null 2>&1 && echo "  $1 설정됨" || { echo "  $1 설정 실패" >&2; exit 1; }; }
set_env DATABASE_URL "$TX_URL"
set_env DIRECT_URL "$SESSION_URL"
set_env ADMIN_ACCESS_CODE "$ADMIN"
unset ADMIN ENC SESSION_URL TX_URL

echo "--- 운영 금지 변수 점검"
if vercel env ls 2>/dev/null | /usr/bin/grep -E "APP_TEST_MODE|SUPABASE_|NEXT_PUBLIC_SUPABASE" ; then
  echo "deploy-setup: ⚠️ 위 변수는 운영에 있으면 안 된다(테스트 모드·Supabase 금지 변수)" >&2; exit 1
else
  echo "  없음(정상)"
fi
echo "deploy-setup: 완료"
