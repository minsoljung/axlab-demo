#!/usr/bin/env python3
"""PreToolUse(Write|Edit|NotebookEdit) — 비밀값·.env 파일 쓰기를 차단한다(exit 2).

잡는 것: `.env`·`.env.*`·`.envrc`(대소문자 무시 — macOS 기본 파일시스템은 대소문자를 가리지 않는다. `/.claude/../` 같은 경로 우회는 normpath 로 접는다),
  `.env.example` 에 `NAME=` 꼴이 아닌 줄(값만 넣는 편집)·값이 든 줄, 키·토큰 패턴(문자열을 `'a'+'b'` 로 쪼갠 것도 따옴표·공백·`+` 를 걷어낸 사본으로 한 번 더 본다),
  비밀번호가 든 원격 DB 연결 문자열(호스트가 db·postgres 여도 개발용 값이 아니면).
🔴 못 잡는 것(이 hook 은 막는다고 말하지 않는다): Bash 로 쓰는 파일(`cat > .env`·`sed -i`·`python -c`), 심볼릭 링크로 가려진 경로,
  이스케이프(`\\x65yJ`)·인코딩(base64)으로 감춘 값, 패턴에 없는 형식의 비밀값, `.env.example` 에 대문자-밑줄만으로 된 값(`HUNTER`).
  Edit 의 `new_string` 은 파일 일부라서 대문자-밑줄 단어 한 줄(`DATABASE_URL`)은 이름 편집으로 보고 통과시킨다."""
import json
import os
import re
import sys

PATTERNS = [
    ("개인 키", re.compile(r"-{5}BEGIN [A-Z ]*PRIVATE KEY-{5}")),
    ("JWT(Supabase 키 등)", re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")),
    ("Supabase secret 키", re.compile(r"sb_secret_[A-Za-z0-9_-]{10,}")),
    ("API 키(sk-)", re.compile(r"\bsk-[A-Za-z0-9_-]{20,}")),
    ("AWS 키", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("GitHub 토큰", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}")),
    ("GitLab 토큰", re.compile(r"\bglpat-[A-Za-z0-9_-]{20,}")),
]
DB_URL = re.compile(r"postgres(?:ql)?://[^:/\s@]+:([^@\s]+)@(\[[^\]]+\]|[^/:\s?]+)")
DB_URL_QUERY_PW = re.compile(r"postgres(?:ql)?://(?:[^@/\s]*@)?(\[[^\]]+\]|[^/:\s?]+)[^\s]*[?&]password=([^&\s]+)", re.I)
LOCAL_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"}
SERVICE_HOSTS = {"db", "postgres"}  # docker-compose 서비스 이름 — 개발용 비밀번호일 때만 통과
DEV_PASSWORDS = {"postgres", "password", "pass", "example", "dev", "test", "changeme", "root", "admin"}
PLACEHOLDER = re.compile(r"^(\$\{?\w+\}?|<[^>]+>|\*+|x+)$", re.I)
ENV_NAME = re.compile(r"(^|/)\.env(\.[^/]+|rc)?$", re.I)
ENV_LINE = re.compile(r"^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$")
SPLIT_NOISE = re.compile(r"[\s\"'`+]")


def block(path, why):
    print("block-secrets: %s — %s. 비밀값은 환경변수로 두고 .env.example 에는 이름만 적는다." % (path, why), file=sys.stderr)
    sys.exit(2)


def check_example(path, text, full):
    for ln in text.splitlines():
        s = ln.strip()
        if not s or s.startswith("#"):
            continue
        m = ENV_LINE.match(s)
        if m:
            val = m.group(2).strip().strip("\"'").strip()
            if val and not val.startswith("#"):
                block(path, ".env.example 의 %s 에 값이 있음" % m.group(1))
            continue
        if not full and re.match(r"^[A-Z_][A-Z0-9_]*$", s):
            continue
        block(path, ".env.example 에 `NAME=` 꼴이 아닌 줄이 있음(값만 넣는 편집 차단)")


def check_db(path, text):
    for m in DB_URL.finditer(text):
        pw, host = m.group(1), m.group(2).lower()
        if PLACEHOLDER.match(pw) or host in LOCAL_HOSTS:
            continue
        if host in SERVICE_HOSTS and pw.lower() in DEV_PASSWORDS:
            continue
        block(path, "비밀번호가 든 원격 DB 연결 문자열(호스트 %s)" % host)
    for m in DB_URL_QUERY_PW.finditer(text):
        host, pw = m.group(1).lower(), m.group(2)
        if not (PLACEHOLDER.match(pw) or host in LOCAL_HOSTS or (host in SERVICE_HOSTS and pw.lower() in DEV_PASSWORDS)):
            block(path, "쿼리 문자열에 비밀번호가 든 원격 DB 연결 문자열(호스트 %s)" % host)


def main():
    try:
        d = json.load(sys.stdin)
    except ValueError:
        print("block-secrets: stdin JSON 파싱 실패 — 판정 불가라 차단", file=sys.stderr)
        sys.exit(2)
    ti = d.get("tool_input") or {}
    raw = str(ti.get("file_path") or ti.get("notebook_path") or "").replace("\\", "/")
    path = os.path.normpath(raw) if raw else ""
    text = "\n".join(str(ti.get(k) or "") for k in ("content", "new_string", "new_source"))
    if ENV_NAME.search(path):
        if os.path.basename(path).lower() == ".env.example":
            check_example(path, text, full="content" in ti)
        else:
            block(path, ".env 파일 쓰기")
    for variant in (text, SPLIT_NOISE.sub("", text)):
        for name, rx in PATTERNS:
            if rx.search(variant):
                block(path, name + " 패턴")
        check_db(path, variant)
    sys.exit(0)


if __name__ == "__main__":
    main()
