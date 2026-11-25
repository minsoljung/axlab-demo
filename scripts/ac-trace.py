#!/usr/bin/env python3
"""AC 대응 대조. 규칙·출력·종료 코드 정본 = .claude/skills/story-ac-write/SKILL.md §2·§4·§5. 표준 라이브러리만, Python 3.9 호환."""
import argparse
import pathlib
import re
import sys

ID = r"AC-\d{3}-[1-9]\d*"
DEF = re.compile(r"^- (" + ID + r"): \S")
RETIRED = re.compile(r"^- (" + ID + r") \(폐기\): \S")
LIST_AC = re.compile(r"^\s*(?:[-*+]|\d+\.)\s+AC-", re.I)
# 대문자 AC- 는 뒤가 무엇이든, 소문자·혼합(ac-001-2)은 숫자가 이어질 때만 — 소문자 정의 줄이 조용히 빠지지 않게 한다
LOOSE = re.compile(r"(?<![0-9A-Za-z_-])(?:AC-[0-9A-Za-z_-]*|[Aa][Cc]-\d[0-9A-Za-z_-]*)")
STRICT = re.compile(r"^" + ID + r"$")
STORY_FILE = re.compile(r"^(\d{3})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$")
TITLE = re.compile(r"^(" + ID + r")((?: " + ID + r")*) \S")
FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})")
MODS = {"only", "skip", "fixme", "fail", "slow", "describe", "serial", "parallel", "configure"}
SKIP_MODS = ("skip", "fixme", "fail")
REGEX_AFTER_ID = {"return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw", "case", "do", "else", "yield", "await"}


def line_of(text, pos):
    return text.count("\n", 0, pos) + 1


# ---------- story 문서 ----------
def scan_stories(root, sdir, fmt):
    defined, retired, refs = {}, {}, []
    for f in sorted(sdir.rglob("*")):
        if f.is_file() and f.suffix != ".md" and not f.name.startswith("."):
            fmt.append((str(f.relative_to(root)), 0, "story 문서 확장자는 .md 만 읽는다 — 이 파일은 대응 대조에서 빠진다"))
    story_files = 0
    for f in sorted(sdir.rglob("*.md")):
        story_files += 1
        rel = str(f.relative_to(root))
        lines = f.read_text(encoding="utf-8", errors="replace").splitlines()
        m = STORY_FILE.match(f.name)
        active, fence, fence_line = 0, None, 0
        for i, line in enumerate(lines, 1):
            fm = FENCE.match(line)
            if fence is not None:
                if fm and fm.group(1)[0] == fence[0] and len(fm.group(1)) >= fence[1] and line.strip() == fm.group(1):
                    fence = None
                continue
            if fm:
                fence, fence_line = (fm.group(1)[0], len(fm.group(1))), i
                continue
            toks = list(LOOSE.finditer(line))
            if not toks:
                continue
            if not m:
                fmt.append((rel, i, "story 파일명 규칙 위반(<story>-<slug>.md)"))
                break
            d, r = DEF.match(line), RETIRED.match(line)
            head = (d or r).group(1) if (d or r) else None
            if head is None and LIST_AC.match(line):
                fmt.append((rel, i, "정의 줄 형식 오류"))
            if head:
                if head.split("-")[1] != m.group(1):
                    fmt.append((rel, i, head + " 의 story 번호가 파일명과 다름"))
                target = defined if d else retired
                if head in defined or head in retired:
                    fmt.append((rel, i, head + " 중복 정의"))
                else:
                    target[head] = (rel, i)
                    active += 1 if d else 0
            for k, t in enumerate(toks):
                tok = t.group(0)
                if head and k == 0:
                    continue
                if not STRICT.match(tok):
                    fmt.append((rel, i, "AC id 형식 오류: " + tok))
                else:
                    refs.append((tok, rel, i))
        if fence is not None:
            fmt.append((rel, fence_line, "코드펜스가 닫히지 않음 — 이후 줄을 읽지 않았다"))
        if m and active == 0:
            fmt.append((rel, 0, "유효 AC 정의 0"))
    for tok, rel, i in refs:
        if tok not in defined and tok not in retired:
            fmt.append((rel, i, "정의 없는 AC 참조: " + tok))
    return defined, retired, story_files


# ---------- spec 파일: 주석·문자열·정규식을 건너뛰는 토큰화 ----------
def _regex_ok(prev):
    if prev is None:
        return True
    kind, val = prev[0], prev[3]
    if kind == "id":
        return val in REGEX_AFTER_ID
    if kind == "p":
        return val not in ")]}"
    return False


def _template(text, i):
    n, interp = len(text), False
    while i < n:
        c = text[i]
        if c == "\\":
            i += 2
        elif c == "`":
            return i + 1, interp
        elif c == "$" and text.startswith("${", i):
            interp = True
            i = _lex(text, i + 2, True)[1] + 1
        else:
            i += 1
    return n, interp


def _lex(text, i, nested):
    """-> (토큰들, 끝 위치). 토큰 = (종류, 시작, 끝, 값, 보간여부). nested 면 짝 없는 `}` 에서 멈춘다."""
    n, toks, depth = len(text), [], 0
    while i < n:
        c = text[i]
        if c in " \t\r\n":
            i += 1
        elif text.startswith("//", i):
            j = text.find("\n", i)
            i = n if j < 0 else j
        elif text.startswith("/*", i):
            j = text.find("*/", i + 2)
            i = n if j < 0 else j + 2
        elif c in "'\"":
            j = i + 1
            while j < n and text[j] != c and text[j] != "\n":
                j += 2 if text[j] == "\\" else 1
            toks.append(("str", i, min(j + 1, n), text[i + 1:j], False))
            i = j + 1
        elif c == "`":
            j, interp = _template(text, i + 1)
            toks.append(("str", i, j, text[i + 1:j - 1], interp))
            i = j
        elif c == "/" and _regex_ok(toks[-1] if toks else None):
            j, incls = i + 1, False
            while j < n and text[j] != "\n":
                ch = text[j]
                if ch == "\\":
                    j += 2
                    continue
                if ch == "[":
                    incls = True
                elif ch == "]":
                    incls = False
                elif ch == "/" and not incls:
                    break
                j += 1
            j += 1
            while j < n and text[j].isalpha():
                j += 1
            toks.append(("re", i, j, "", False))
            i = j
        elif c.isalpha() or c in "_$":
            j = i + 1
            while j < n and (text[j].isalnum() or text[j] in "_$"):
                j += 1
            toks.append(("id", i, j, text[i:j], False))
            i = j
        elif c.isdigit():
            j = i + 1
            while j < n and (text[j].isalnum() or text[j] in "._"):
                j += 1
            toks.append(("num", i, j, text[i:j], False))
            i = j
        else:
            if nested:
                if c == "{":
                    depth += 1
                elif c == "}":
                    if depth == 0:
                        return toks, i
                    depth -= 1
            toks.append(("p", i, i + 1, c, False))
            i += 1
    return toks, i


def _unescape(s):
    return re.sub(r"\\(.)", r"\1", s)


def find_calls(text):
    """test(...) 호출 목록. 주석·문자열·정규식 리터럴 안의 `test(` 는 토큰이 아니라서 안 잡힌다."""
    toks, _ = _lex(text, 0, False)
    n, raw = len(toks), []
    for k, t in enumerate(toks):
        if t[0] != "id" or t[3] != "test":
            continue
        if k > 0 and toks[k - 1][0] == "p" and toks[k - 1][3] == ".":
            continue
        j, mods = k + 1, []
        while j + 1 < n and toks[j][3] == "." and toks[j][0] == "p" and toks[j + 1][0] == "id" and toks[j + 1][3] in MODS:
            mods.append(toks[j + 1][3])
            j += 2
        if j >= n or toks[j][3] != "(" or toks[j][0] != "p":
            continue
        depth, e = 0, j
        while e < n:
            if toks[e][0] == "p" and toks[e][3] == "(":
                depth += 1
            elif toks[e][0] == "p" and toks[e][3] == ")":
                depth -= 1
                if depth == 0:
                    break
            e += 1
        first = toks[j + 1] if j + 1 < n else None
        single = (first is not None and first[0] == "str" and j + 2 < n and toks[j + 2][3] in (",", ")") and toks[j + 2][0] == "p")
        raw.append({
            "mods": mods, "lo": j, "hi": e, "pos": t[1],
            "kind": "describe" if "describe" in mods else "test",
            "title": first if single else None,
        })
    stack = []
    for c in raw:
        while stack and stack[-1]["hi"] < c["lo"]:
            stack.pop()
        c["parent"] = stack[-1] if stack else None
        stack.append(c)
    return raw


def skip_reasons(call, calls):
    """이 test 가 돌지 않는 이유 목록(없으면 비어 있다)."""
    reasons = ["test." + m for m in call["mods"] if m in SKIP_MODS]
    anc = call["parent"]
    chain = []
    while anc:
        chain.append(anc)
        if anc["kind"] == "describe":
            reasons += ["describe." + m for m in anc["mods"] if m in SKIP_MODS]
        anc = anc["parent"]
    for m in calls:  # 제목 없이 부른 test.skip(조건)·test.fixme()·test.fail() — 본문·describe·파일 수준
        if m["title"] is not None or not any(x in SKIP_MODS for x in m["mods"]) or m["kind"] != "test":
            continue
        if m["parent"] is None:
            reasons.append("파일 수준 test.%s(…)" % [x for x in m["mods"] if x in SKIP_MODS][0])
        elif m["parent"] is call or any(m["parent"] is x for x in chain):
            reasons.append("본문 test.%s(…)" % [x for x in m["mods"] if x in SKIP_MODS][0])
    return reasons


def scan_tests(root, tdir, fmt):
    covered, skipped, nspec = {}, [], 0
    for f in sorted(tdir.rglob("*.spec.ts")):
        if "node_modules" in f.parts:
            continue
        nspec += 1
        rel = str(f.relative_to(root))
        text = f.read_text(encoding="utf-8", errors="replace")
        calls = find_calls(text)
        spans, ntests = [], 0
        for c in calls:
            ln = line_of(text, c["pos"])
            t = c["title"]
            if t is not None:
                spans.append((t[1], t[2]))
            if c["kind"] == "describe":
                if "only" in c["mods"]:
                    fmt.append((rel, ln, "test.describe.only"))
                if t is not None and LOOSE.search(t[3]):
                    fmt.append((rel, ln, "describe 제목에 AC id"))
                continue
            if t is None:
                if any(x in SKIP_MODS for x in c["mods"]) or "slow" in c["mods"] or "configure" in c["mods"]:
                    continue  # 제목 없는 조건부 skip·slow — 아래 skip_reasons 가 본다
                fmt.append((rel, ln, "테스트 제목이 문자열 리터럴 한 개가 아님"))
                continue
            ntests += 1
            title = _unescape(t[3])
            if t[4]:
                fmt.append((rel, ln, "보간된 테스트 제목"))
                continue
            if "only" in c["mods"]:
                fmt.append((rel, ln, "test.only"))
            mt = TITLE.match(title)
            if not mt:
                fmt.append((rel, ln, "테스트 제목이 AC id 로 시작하지 않음"))
                continue
            ids = [mt.group(1)] + mt.group(2).split()
            why = skip_reasons(c, calls)
            if why:
                skipped.extend((x, rel, ln, why[0]) for x in ids)
            else:
                for x in ids:
                    covered.setdefault(x, (rel, ln))
        if ntests == 0:
            fmt.append((rel, 0, "spec 파일에서 실행되는 test 호출을 찾지 못함(전부 주석 처리됐거나 test 이름을 바꿔 불렀나)"))
        for t in LOOSE.finditer(text):
            if not any(a <= t.start() < b for a, b in spans):
                fmt.append((rel, line_of(text, t.start()), "테스트 제목 밖 AC 표기: " + t.group(0)))
    return covered, skipped, nspec


def run(a):
    root = pathlib.Path(a.root).resolve()
    sdir, tdir = root / a.stories, root / a.tests
    if not sdir.is_dir():
        print("UNCHECKED 미검사: 형식·대응 두 축 모두 — story 디렉터리 없음: " + str(sdir))
        print("USAGE 디렉터리 없음: " + str(sdir), file=sys.stderr)
        return 4
    fmt = []
    defined, retired, story_files = scan_stories(root, sdir, fmt)
    why_unchecked = None
    covered, skipped, nspec = {}, [], 0
    if not tdir.is_dir():
        why_unchecked = "테스트 디렉터리 없음: " + str(tdir)
    else:
        covered, skipped, nspec = scan_tests(root, tdir, fmt)
        if nspec == 0:
            why_unchecked = "*.spec.ts 0건: " + str(tdir)
    missing = sorted(set(defined) - set(covered))
    extra = sorted(set(covered) - set(defined))
    matched = len(set(defined) & set(covered))
    if why_unchecked:
        print("UNCHECKED 미검사: 대응(AC↔테스트) 축 — " + why_unchecked + " (형식 축은 검사함)")
    else:
        for x in missing:
            print("MISSING " + x)
        for x in extra:
            print("EXTRA %s %s:%d" % ((x,) + covered[x]))
        for x, rel, ln, why in skipped:
            print("SKIP %s %s:%d (%s)" % (x, rel, ln, why))
            if x not in defined:
                print("EXTRA %s %s:%d" % (x, rel, ln))
                extra.append(x)
    for rel, ln, why in fmt:
        print("FORMAT %s:%d %s" % (rel, ln, why))
    if not why_unchecked:
        seen = {x for x in covered} | {x for x, _, _, _ in skipped}
        for num in sorted({k.split("-")[1] for k in defined}):
            mine = [k for k in defined if k.split("-")[1] == num]
            print("STORY %s defined=%d tested=%d started=%s" % (
                num, len(mine), len([k for k in mine if k in covered]),
                "yes" if any(k.split("-")[1] == num for k in seen) else "no"))
    na = "n/a" if why_unchecked else None
    print("TOTAL defined=%d retired=%d tested=%s matched=%s missing=%s extra=%s format=%d spec_files=%d story_files=%d"
          % (len(defined), len(retired), na or len(covered), na or matched, na or len(missing), na or len(extra),
             len(fmt), nspec, story_files))
    if not defined:
        print("측정 불가: 정의된 AC 가 0 — 경로·도구부터 의심", file=sys.stderr)
        return 3
    if why_unchecked:
        print("측정 불가: 대응 축 미검사 — " + why_unchecked, file=sys.stderr)
        return 3
    if matched == 0:
        print("측정 불가: 잡혀야 정상인 값(matched)이 0 — 경로·도구부터 의심", file=sys.stderr)
        return 3
    if fmt:
        return 2
    if missing or extra:
        return 1
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=str(pathlib.Path(__file__).resolve().parent.parent))
    ap.add_argument("--stories", default="docs/stories")
    ap.add_argument("--tests", default="e2e")
    a = ap.parse_args()
    try:
        return run(a)
    except Exception as e:  # 도구 고장이 exit 1(대응 불일치)로 읽히지 않게 따로 낸다
        print("ac-trace 내부 오류: %s: %s" % (type(e).__name__, e), file=sys.stderr)
        return 5


if __name__ == "__main__":
    sys.exit(main())
