#!/usr/bin/env bash
# 필요한 환경변수 이름이 있는지 확인한다. 값은 출력하지 않는다.
# 사용: scripts/check-env.sh  — 프로세스 환경 + 루트 .env·.env.local 의 이름을 본다.
# 출력: OK|MISSING|FORBIDDEN <이름>. exit: 0 전부 OK · 1 MISSING 또는 FORBIDDEN · 2 사용법
# 금지 이름 = `SUPABASE_*` · `NEXT_PUBLIC_SUPABASE_*` 전체(이름 앞부분으로 가린다). 정본 = .claude/skills/supabase-pg-only §2·§3
# 금지 이름은 프로세스 환경·.env·.env.local 에서는 값이 있을 때, .env.example 에서는 값이 비어 있어도 낸다.
# 루트 = 이 스크립트가 있는 repo(worktree 안에서도 그 worktree).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ $# -eq 0 ] || { echo "사용: $0 (인자 없음)" >&2; exit 2; }
REQUIRED=(DATABASE_URL DIRECT_URL)

# 줄마다 "<종류> <이름>": SET = 값이 있는 이름(프로세스 환경·.env·.env.local) · EXAMPLE = .env.example 에 정의된 이름(값 무관)
names() {
  python3 - "$ROOT" <<'PY'
import os, re, sys
root = sys.argv[1]
rx = re.compile(r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$")
for k, v in os.environ.items():
    if v:
        print("SET", k)
for f in (".env", ".env.local", ".env.example"):
    p = os.path.join(root, f)
    if not os.path.isfile(p):
        continue
    for ln in open(p, encoding="utf-8", errors="replace"):
        m = rx.match(ln)
        if not m:
            continue
        if f == ".env.example":
            print("EXAMPLE", m.group(1))
        elif m.group(2).strip().strip("\"'"):
            print("SET", m.group(1))
PY
}
NAMES="$(names)" || { echo "check-env: 이름 목록을 만들지 못함(python3 확인)" >&2; exit 2; }

has() { [[ $'\n'"$NAMES"$'\n' == *$'\n'"SET $1"$'\n'* ]]; }

rc=0
for n in "${REQUIRED[@]}"; do
  if has "$n"; then echo "OK $n"; else echo "MISSING $n"; rc=1; fi
done
FORBIDDEN_FOUND="$(printf '%s\n' "$NAMES" | awk '$2 ~ /^(NEXT_PUBLIC_)?SUPABASE_/ {print $2}' | sort -u)"
if [ -n "$FORBIDDEN_FOUND" ]; then
  while IFS= read -r n; do echo "FORBIDDEN $n"; done <<< "$FORBIDDEN_FOUND"
  rc=1
fi
exit $rc
