#!/usr/bin/env python3
"""PreToolUse(Write|Edit|NotebookEdit) — Supabase SDK·auth·storage·realtime 사용을 코드·설정·lockfile 에서 차단한다(exit 2).
규칙 정본 = .claude/skills/supabase-pg-only §3. develop-review R-3 은 이 스크립트를 파일마다 그대로 돌려 같은 규칙으로 다시 센다.

대상: 확장자 .ts .tsx .js .jsx .mjs .cjs .mts .cts .json .yml .yaml .toml .ipynb (대소문자 무시) · `.env*`(예: .env.example) · lockfile(pnpm-lock.yaml·package-lock.json·yarn.lock).
면제: 이 프로젝트 루트의 `.claude/` 아래(=자산 문서가 금지 패턴을 설명한다 — 경로를 realpath 로(`..`·심볼릭 링크 포함) 접은 뒤 루트 기준으로 판정하므로
  `…/.claude/../src/a.ts` 는 면제되지 않는다) 와 `node_modules/`.
🔴 못 잡는 것(이 hook 은 막는다고 말하지 않는다): Bash 로 만든 파일·설치한 패키지, `supabase` 가 이름에 없는 변수로 부르는 `.auth`·`.storage`
  (SDK 자체를 못 들이게 하는 쪽 — `@supabase/` import·package.json·lockfile·`*.supabase.co` 주소·`/auth/v1/` 같은 API 경로 — 으로 막는다),
  문자열을 이어 붙여 만든 패키지 이름(따옴표·`+` 를 걷어낸 사본으로 한 번 더 보지만 변수를 거치면 못 본다), 위 확장자 밖의 파일."""
import json
import os
import re
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _hooklib  # noqa: E402

EXT = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts", ".json", ".yml", ".yaml", ".toml", ".ipynb")
LOCKFILES = {"pnpm-lock.yaml", "package-lock.json", "yarn.lock", "npm-shrinkwrap.json"}
RULES = [
    ("@supabase 패키지", re.compile(r"@supabase/")),
    ("supabase auth·storage·realtime·channel·functions", re.compile(r"\b\w*supabase\w*\s*\.\s*(auth|storage|realtime|channel|removeChannel|functions)\b", re.I)),
    ("SUPABASE_* 환경변수", re.compile(r"\b(NEXT_PUBLIC_)?SUPABASE_[A-Z_]+")),
    ("Supabase 호스트(*.supabase.co)", re.compile(r"\.supabase\.(?:co|in)\b", re.I)),
    ("Supabase API 경로(/auth/v1 등)", re.compile(r"/(?:auth|rest|storage|realtime|functions)/v1/")),
]
SPLIT_NOISE = re.compile(r"[\s\"'`+]")


def main():
    try:
        d = json.load(sys.stdin)
    except ValueError:
        print("block-supabase-extras: stdin JSON 파싱 실패 — 판정 불가라 차단", file=sys.stderr)
        sys.exit(2)
    ti = d.get("tool_input") or {}
    raw = str(ti.get("file_path") or ti.get("notebook_path") or "").replace("\\", "/")
    if not raw:
        sys.exit(0)
    root = _hooklib.project_root(d)
    absolute = os.path.realpath(raw if os.path.isabs(raw) else os.path.join(d.get("cwd") or root, raw))
    rel = os.path.relpath(absolute, root).replace("\\", "/")
    if rel == ".claude" or rel.startswith(".claude/") or "/node_modules/" in absolute + "/":
        sys.exit(0)
    base = os.path.basename(absolute).lower()
    if not (base.endswith(EXT) or base.startswith(".env") or base in LOCKFILES):
        sys.exit(0)
    text = "\n".join(str(ti.get(k) or "") for k in ("content", "new_string", "new_source"))
    for variant in (text, SPLIT_NOISE.sub("", text)):
        for name, rx in RULES:
            m = rx.search(variant)
            if m:
                print("block-supabase-extras: %s — %s(%s). Supabase 는 Prisma PostgreSQL 연결만 쓴다."
                      % (raw, name, m.group(0)), file=sys.stderr)
                sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    main()
