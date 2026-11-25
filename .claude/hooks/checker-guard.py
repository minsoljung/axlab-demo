#!/usr/bin/env python3
"""PreToolUse(Write|Edit|NotebookEdit|Bash) — checker 에이전트 5종의 "읽기 전용"을 기계로 일부 강제한다(exit 2).
대상 = 입력 JSON 의 `agent_type` 이 아래 CHECKERS 인 서브에이전트의 도구 호출만. 메인 세션·maker·그 밖의 에이전트는 건드리지 않는다.
근거(hooks.md §Hooks in skills and agents): 설정 파일의 PreToolUse 훅은 서브에이전트 안에서도 뜨고 입력에 `agent_type` 이 실린다.
checker 의 `tools` 는 `Read, Grep, Glob, Bash, Write` 이고 `Edit` 은 이미 없다. `Bash`(세기·실행에 필요)와 `Write`(리뷰 파일에 필요)는 역할상
tools 에서 못 뺀다 — 그래서 이 훅이 그 둘의 사용처를 줄인다. 공식 문서에 tools 로 `Write` 를 경로 한정하는 방법은 없다
(sub-agents.md: `disallowedTools` 의 `Bash(git push *)` 같은 항목도 "도구 전체를 뺀다").

막는 것
  Write                : 경로가 `<프로젝트>/docs/reviews/<yyyy-mm-dd>-<대상 slug>-<에이전트 이름>[-rN].md` 가 아니면
  Edit·NotebookEdit    : 전부
  Bash                 : git 전부 · rm·mv·cp·ln·touch·tee·truncate·dd·chmod·chown·patch·install · `sed -i`·`perl -i` ·
                         패키지 설치(npm·pnpm·yarn·pip·brew 의 install·add·remove·update 류) · 파일로 가는 리다이렉트(`>`·`>>`·`&>`)
🔴 못 막는 것(거짓 방어 금지 — "읽기 전용"은 여전히 일부가 지시일 뿐이다): `python -c`·`node -e`·heredoc 스크립트가 여는 파일 쓰기,
  스크립트(`bash x.sh`·`scripts/e2e-run.sh`)가 안에서 하는 쓰기, alias·변수로 가린 명령, `xargs`·`find -exec`·`ssh` 로 넘긴 명령, `docker` 를 통한 쓰기.
  e2e-reviewer 가 `scripts/e2e-run.sh` 로 만드는 DB 컨테이너·test-results 는 허용 대상이라 막지 않는다."""
import json
import os
import re
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _hooklib  # noqa: E402

CHECKERS = {"prd-reviewer", "story-reviewer", "design-reviewer", "develop-reviewer", "e2e-reviewer"}
DENY_PROGS = {"git", "git-commit", "rm", "mv", "cp", "ln", "touch", "tee", "truncate", "dd", "chmod", "chown", "patch", "install", "unlink", "rmdir"}
PKG_PROGS = {"npm", "pnpm", "yarn", "pip", "pip3", "brew", "npx"}
PKG_VERBS = {"install", "i", "add", "remove", "rm", "uninstall", "update", "upgrade", "ci", "link", "dlx", "create"}
WRITE_REDIRS = {">", ">>", ">|", "&>", "&>>"}
OK_TARGETS = {"/dev/null", "/dev/stderr", "/dev/stdout", "-"}


def deny(msg):
    print("checker-guard: %s — checker 는 리뷰 파일(docs/reviews/…-<에이전트>.md) 하나만 쓴다. 대상은 고치지 않고 FAIL 근거로만 적는다." % msg, file=sys.stderr)
    sys.exit(2)


def check_write(d, who, path):
    root = _hooklib.project_root(d)
    absolute = os.path.realpath(path if os.path.isabs(path) else os.path.join(d.get("cwd") or root, path))
    rel = os.path.relpath(absolute, root).replace("\\", "/")
    pat = r"^docs/reviews/\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]*-%s(-r\d+)?\.md$" % re.escape(who)
    if not re.match(pat, rel):
        deny("%s 의 Write 대상 %s 는 리뷰 파일 경로가 아님" % (who, path))


def check_bash(who, cmd):
    try:
        invs = _hooklib.invocations(cmd)
    except Exception:
        # 따옴표가 안 맞는 등 풀 수 없다 — 위험 단어가 보이면 닫고, 아니면 연다
        if re.search(r"\bgit\b|\brm\s|\bmv\s|\bsed\s+-i|>\s*[^&\s/]", cmd):
            deny("%s 의 Bash 명령을 해석하지 못했고 변경 명령으로 보이는 단어가 있음" % who)
        return
    for inv in invs:
        if inv.prog in DENY_PROGS:
            deny("%s 의 Bash 에서 `%s` 호출" % (who, inv.prog))
        if inv.prog in ("sed", "perl", "ruby") and any(a == "--in-place" or a.startswith("--in-place=") or re.match(r"^-[A-Za-z]*i", a) for a in inv.args if a.startswith("-")):
            deny("%s 의 Bash 에서 `%s -i`(제자리 수정)" % (who, inv.prog))
        if inv.prog in PKG_PROGS:
            verb = next((a for a in inv.args if not a.startswith("-")), "")
            if verb in PKG_VERBS:
                deny("%s 의 Bash 에서 패키지 변경(`%s %s`)" % (who, inv.prog, verb))
        for op, target in inv.redirs:
            if op in WRITE_REDIRS or (op == ">&" and not re.match(r"^\d+$|^-$", target)):
                if target not in OK_TARGETS and not re.match(r"^\d+$", target):
                    deny("%s 의 Bash 에서 파일로 리다이렉트(`%s %s`)" % (who, op, target))


def main():
    try:
        d = json.load(sys.stdin)
    except ValueError:
        sys.exit(0)  # 이 훅은 checker 한정 보조 장치 — 입력을 못 읽으면 다른 훅들의 판정에 맡긴다
    who = d.get("agent_type")
    if who not in CHECKERS:
        sys.exit(0)
    tool = d.get("tool_name")
    ti = d.get("tool_input") or {}
    if tool in ("Edit", "NotebookEdit"):
        deny("%s 에게 %s 는 허용되지 않음" % (who, tool))
    if tool == "Write":
        check_write(d, who, str(ti.get("file_path") or ""))
    elif tool == "Bash":
        check_bash(who, str(ti.get("command") or ""))
    sys.exit(0)


if __name__ == "__main__":
    main()
