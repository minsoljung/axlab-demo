#!/usr/bin/env python3
"""Stop·SubagentStop(developer) — Vitest 단위 테스트가 실패하면 끝내지 못하게 막는다.
막는 방법은 exit 2 가 아니라 stdout JSON `{"decision":"block","reason":…}` + exit 0 이다.
근거(hooks.md §Exit code output): Stop·SubagentStop 은 "exit 2 + stdout 빔 + stderr 에 `No such file or directory`" 이면 막지 않고 non-blocking 으로 처리한다.
vitest 가 ENOENT 를 출력하는 실패(파일 없음 류)가 정확히 그 모양이라, exit 2 로 막으면 실패한 테스트 출력이 오히려 차단을 무효로 만들었다.
SubagentStop 은 settings.json 에서 matcher `developer` 로만 건다 — developer 서브에이전트가 끝날 때도 깨진 상태를 못 넘기게 한다(Stop 은 메인 세션 종료에만 뜬다).
stop_hook_active=true 면 이미 한 번 막은 뒤라 통과시킨다(무한 루프 방지). 실행 못 하면 systemMessage 로 `미검사` 를 알리고 통과."""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _hooklib  # noqa: E402


def note(msg):
    print(json.dumps({"systemMessage": "test-gate: " + msg}, ensure_ascii=False))
    sys.exit(0)


def main():
    try:
        d = json.load(sys.stdin)
    except ValueError:
        note("stdin JSON 파싱 실패 — 단위 테스트 미검사")
    if d.get("stop_hook_active") is True:
        sys.exit(0)
    root = _hooklib.project_root(d)
    if not os.path.isfile(os.path.join(root, "package.json")):
        sys.exit(0)
    vitest = os.path.join(root, "node_modules", ".bin", "vitest")
    if not os.path.isfile(vitest):
        note("미검사: node_modules/.bin/vitest 없음 — 단위 테스트를 돌리지 못했다")
    try:
        p = subprocess.run([vitest, "run", "--reporter=dot"], cwd=root, capture_output=True, text=True, timeout=540)
    except subprocess.TimeoutExpired:
        note("미검사: vitest 540초 초과 — 단위 테스트를 끝까지 돌리지 못했다")
    if p.returncode != 0:
        tail = "\n".join((p.stdout + p.stderr).strip().splitlines()[-40:])
        print(json.dumps({
            "decision": "block",
            "reason": "test-gate: vitest run exit=%d — 단위 테스트를 고친 뒤 끝낸다.\n%s" % (p.returncode, tail),
        }, ensure_ascii=False))
    sys.exit(0)


if __name__ == "__main__":
    main()
