#!/usr/bin/env python3
"""PostToolUse(Write|Edit) — 경고 전용. 도구가 이미 실행된 뒤라 막지 못한다(hooks.md §Exit code 2 behavior per event: PostToolUse 는 stderr 만 Claude 에게 보인다).
.ts·.tsx·.mts·.cts(대소문자 무시) 수정 시 tsc·eslint 오류를 exit 2 + stderr 로 Claude 에 알린다.
검사하지 못한 축(tsc·eslint 없음, 시간 초과)은 additionalContext 로 `미검사` 라고 알린다 — 조용히 통과하지 않는다.
시간: tsc 70초 + eslint 30초 = 100초로 합계를 settings.json 의 훅 timeout(120초) 안에 둔다. 넘어서 훅이 강제 종료되면 경고가 통째로 사라진다.
NotebookEdit 는 이 훅의 matcher 에 없다 — .ipynb 는 이 훅이 보는 확장자가 아니다."""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _hooklib  # noqa: E402

EXT = (".ts", ".tsx", ".mts", ".cts")


def emit(msg):
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": "check-types: " + msg}}, ensure_ascii=False))
    sys.exit(0)


def run(cmd, root, timeout):
    try:
        p = subprocess.run(cmd, cwd=root, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return None, "시간 초과"
    return p.returncode, (p.stdout + p.stderr).strip()


def main():
    try:
        d = json.load(sys.stdin)
    except ValueError:
        emit("stdin JSON 파싱 실패 — 타입 미검사")
    path = str((d.get("tool_input") or {}).get("file_path", ""))
    if not path.lower().endswith(EXT) or "/node_modules/" in path:
        sys.exit(0)
    root = _hooklib.project_root(d)
    tsc = os.path.join(root, "node_modules", ".bin", "tsc")
    if not os.path.isfile(os.path.join(root, "tsconfig.json")) or not os.path.isfile(tsc):
        emit("미검사: tsconfig.json 또는 node_modules/.bin/tsc 없음 — %s 의 타입·린트를 검사하지 못했다" % path)
    errs, unchecked = [], []
    code, out = run([tsc, "--noEmit", "-p", root], root, 70)
    if code is None:
        unchecked.append("tsc 70초 초과 — 타입 미검사")
    elif code != 0:
        errs.append("tsc exit=%d\n%s" % (code, "\n".join(out.splitlines()[:30])))
    eslint = os.path.join(root, "node_modules", ".bin", "eslint")
    if not os.path.isfile(eslint):
        unchecked.append("node_modules/.bin/eslint 없음 — 린트 미검사")
    else:
        code, out = run([eslint, path], root, 30)
        if code is None:
            unchecked.append("eslint 30초 초과 — 린트 미검사")
        elif code != 0:
            errs.append("eslint exit=%d\n%s" % (code, "\n".join(out.splitlines()[:20])))
    if errs:
        print("check-types(경고 — 이미 저장됨): " + path + "\n" + "\n".join(errs + ["미검사: " + u for u in unchecked]), file=sys.stderr)
        sys.exit(2)
    if unchecked:
        emit("미검사: " + " / ".join(unchecked) + " (%s)" % path)
    sys.exit(0)


if __name__ == "__main__":
    main()
