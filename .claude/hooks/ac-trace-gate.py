#!/usr/bin/env python3
"""PreToolUse(Bash) — `git commit` 을 단계에 맞게 막거나 알린다. 판정 = scripts/ac-trace.py 출력(정본 .claude/skills/story-ac-write §5·§6).

settings.json 에 `if` 필터를 달지 않았다 — 모든 Bash 호출에 이 스크립트가 뜨고 여기서 판정한다.
근거(hooks.md §How `if` patterns match Bash commands): `if` 는 "best-effort" 이고,
permissions.md §What a Bash rule doesn't match 표는 `Bash(git push *)` 가 `git -C . push`·`git -c k=v push` 를 못 잡는다고 적는다.
그래서 `Bash(git commit *)` 필터는 `git -C`·`git -c`·`/usr/bin/git` 에서 이 스크립트를 아예 띄우지 못했다.

잡는 것: `git commit`(`-C`·`-c`·`--git-dir` 등 전역 옵션 뒤, `/usr/bin/git`·따옴표 경로, `env`·`sudo` 접두, `&&`·`;`·`|` 뒤,
  `sh -c '…'`·`eval`·`$(…)`·백틱 안, 셸이 받는 heredoc) 와 `git-commit`.
🔴 못 잡는 것(거짓 방어 금지 — 이 hook 은 막는다고 말하지 않는다): git alias(`git ci`), 변수가 명령 이름인 경우, 스크립트 파일 안의 커밋,
  `python -c`·`node -e` 로 띄운 git, `xargs`·`find -exec`·`ssh` 로 넘긴 명령, `git merge`·`cherry-pick`·`rebase`·`am` 이 만드는 커밋.
  진짜 강제는 git 의 pre-commit 훅(`core.hooksPath`)이다 — 이 프로젝트는 아직 설치하지 않았다(사용자 결정 대기).

단계별 동작(story-ac-write §6):
  docs/stories/ 없음·.md 0개          → 알리고 통과(기획 전)
  FORMAT 1건 이상                      → 차단(story 또는 테스트 형식이 깨졌다)
  EXTRA 1건 이상                       → 차단(정의 없는·폐기된 AC 를 테스트가 가리킨다)
  MISSING 인데 그 story 에 테스트가 이미 있음 → 차단(story 단위 e2e 가 착수됐는데 AC 가 빠졌다)
  MISSING 인데 그 story 에 테스트가 아직 없음 → 알리기만(ATDD: 기획 → e2e 선작성 → 구현 순서)
  e2e/ 없음·spec 0건                   → 형식만 검사하고 `대응 미검사` 를 알린다
  ac-trace 가 0·1·2·3 이 아닌 코드로 끝났거나 TOTAL 줄이 없음 → 차단(측정 도구 고장)
최종 전수 대응(MISSING 0)은 이 게이트가 아니라 e2e-reviewer E-1 이 본다."""
import json
import os
import re
import subprocess
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _hooklib  # noqa: E402

MISSING = re.compile(r"^MISSING (AC-(\d{3})-\d+)$")
STORY = re.compile(r"^STORY (\d{3}) .*\bstarted=(yes|no)\b")


def block(msg):
    print("ac-trace-gate: " + msg, file=sys.stderr)
    sys.exit(2)


def notify(lines):
    text = "ac-trace-gate: " + " / ".join(lines)
    print(json.dumps({
        "systemMessage": text,
        "hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": text},
    }, ensure_ascii=False))
    sys.exit(0)


def main():
    try:
        d = json.load(sys.stdin)
    except ValueError:
        print("ac-trace-gate: stdin JSON 파싱 실패 — 판정 불가라 차단", file=sys.stderr)
        sys.exit(2)
    cmd = str((d.get("tool_input") or {}).get("command", ""))
    hits = _hooklib.git_commits(cmd)
    if not hits:
        sys.exit(0)
    root = None
    for cdirs in hits:
        start = None
        for c in cdirs:
            start = c if start is None or os.path.isabs(c) else os.path.join(start, c)
        root = _hooklib.root_from(d, start) if start else _hooklib.project_root(d)
        if root:
            break
    if not root:  # -C 가 이 프로젝트 밖 저장소를 가리킨다 — 이 게이트의 대상이 아니다
        sys.exit(0)
    sdir = os.path.join(root, "docs", "stories")
    has_story = os.path.isdir(sdir) and any(f.endswith(".md") for _, _, fs in os.walk(sdir) for f in fs)
    if not has_story:
        notify(["docs/stories/ 에 story 문서가 없다 — AC 대응 미검사로 커밋 통과(기획 전)"])
    script = os.path.join(root, "scripts", "ac-trace.py")
    if not os.path.isfile(script):
        block("scripts/ac-trace.py 없음 — 판정 불가라 차단")
    try:
        p = subprocess.run([sys.executable, script, "--root", root], capture_output=True, text=True, timeout=50)
    except subprocess.TimeoutExpired:
        block("ac-trace 50초 초과 — 판정 불가라 차단")
    lines = p.stdout.splitlines()
    if p.returncode not in (0, 1, 2, 3) or not any(l.startswith("TOTAL ") for l in lines):
        block("ac-trace exit=%d, TOTAL 줄 %s — 측정 도구 고장으로 보고 차단.\n%s%s"
              % (p.returncode, "있음" if any(l.startswith("TOTAL ") for l in lines) else "없음", p.stdout, p.stderr))
    started = {m.group(1) for l in lines for m in [STORY.match(l)] if m and m.group(2) == "yes"}
    fmt = [l for l in lines if l.startswith("FORMAT ")]
    extra = [l for l in lines if l.startswith("EXTRA ")]
    miss_hard, miss_soft = [], []
    for l in lines:
        m = MISSING.match(l)
        if m:
            (miss_hard if m.group(2) in started else miss_soft).append(l)
    unchecked = [l for l in lines if l.startswith("UNCHECKED ")]
    if fmt or extra or miss_hard:
        why = []
        if fmt:
            why.append("형식 오류 %d건" % len(fmt))
        if extra:
            why.append("정의 없는 AC 를 가리키는 테스트 %d건" % len(extra))
        if miss_hard:
            why.append("테스트가 시작된 story 의 AC 누락 %d건" % len(miss_hard))
        block("커밋 차단 — %s. 규칙 = story-ac-write §6.\n%s" % (", ".join(why), "\n".join((fmt + extra + miss_hard)[:40])))
    notes = [l[len("UNCHECKED "):] for l in unchecked]
    if miss_soft:
        notes.append("테스트가 아직 없는 story 의 AC %d건은 알림만(MISSING 은 e2e 작성 뒤 차단 대상)" % len(miss_soft))
    if notes:
        notify(notes)
    sys.exit(0)


if __name__ == "__main__":
    main()
