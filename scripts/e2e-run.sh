#!/usr/bin/env bash
# DB 기동 → 마이그레이션 → Playwright 실행 → 결과 요약. 사용: scripts/e2e-run.sh [playwright 인자...]
# 출력 마지막 줄: E2E passed=<n> failed=<n> flaky=<n> skipped=<n>
# exit: 0 전부 통과 · 1 실패 있음 · 3 전제 없음(pnpm·node_modules·환경변수·DB) — 사유를 stderr 에 그대로
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"  # 이 스크립트가 있는 repo(worktree 안에서도 그 worktree)
cd "$ROOT" || exit 3

command -v pnpm >/dev/null 2>&1 || { echo "e2e-run: pnpm 명령 없음" >&2; exit 3; }
[ -d node_modules ] || { echo "e2e-run: node_modules 없음 — pnpm install 필요" >&2; exit 3; }
[ -f prisma.config.ts ] || { echo "e2e-run: prisma.config.ts 없음 — Prisma 7 은 마이그레이션 연결(DIRECT_URL)을 이 파일에서 읽는다(supabase-pg-only §1)" >&2; exit 3; }

scripts/db-up.sh up || { echo "e2e-run: db-up 실패(exit $?)" >&2; exit 3; }
: "${DATABASE_URL:=postgresql://postgres:postgres@localhost:${PG_PORT:-54329}/${PG_DB:-axlab_demo}}"
: "${DIRECT_URL:=$DATABASE_URL}"
export DATABASE_URL DIRECT_URL
scripts/check-env.sh >/dev/null || { scripts/check-env.sh >&2; exit 3; }

pnpm exec prisma migrate deploy || { echo "e2e-run: prisma migrate deploy 실패" >&2; exit 3; }

OUT="test-results/e2e-result.json"
mkdir -p test-results
PLAYWRIGHT_JSON_OUTPUT_NAME="$OUT" pnpm exec playwright test --reporter=line,json ${@+"$@"}
rc=$?

python3 - "$OUT" <<'PY'
import json, sys
try:
    s = json.load(open(sys.argv[1], encoding="utf-8")).get("stats", {})
except (OSError, ValueError) as e:
    print("E2E 결과 파일 읽기 실패: %s" % e)
    sys.exit(0)
print("E2E passed=%s failed=%s flaky=%s skipped=%s" % (s.get("expected"), s.get("unexpected"), s.get("flaky"), s.get("skipped")))
PY
[ $rc -eq 0 ] && exit 0 || exit 1
