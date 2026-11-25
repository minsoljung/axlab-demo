"""hook 스크립트 공용 도구 — hook 이 아니다(settings.json 에 등록하지 않는다). 표준 라이브러리만, Python 3.9 호환.

두 가지를 준다.
1) project_root(d): 이 프로젝트의 루트. cwd 에서 위로 올라가며 이 파일이 있는 `.claude/hooks/` 를 가진 첫 디렉터리를 쓴다.
   worktree 안에서는 worktree 루트가 나온다. 근거(hooks.md): worktree 에 들어가도 `${CLAUDE_PROJECT_DIR}` 은 세션을 시작한
   루트에 머무르고 입력 JSON 의 `cwd` 만 worktree 를 따라간다 — 그래서 환경변수를 먼저 쓰면 메인 체크아웃을 잰다.
2) Bash 명령 문자열 해석: invocations(cmd) = 명령 하나하나(프로그램 이름·인자·리다이렉트)를 펼쳐 준다.
   `;`·`&&`·`||`·`|`·`(`·줄바꿈 분리, 앞의 `VAR=x`·`env`·`sudo` 등 접두, `sh -c '…'`·`eval`·`$(…)`·백틱 안쪽, 셸이 받는 heredoc 본문을 푼다.

못 푸는 것(= 이 도구가 판정하지 못하는 우회): 셸 alias·함수, 변수가 명령 이름이 되는 경우(`$G commit`), 스크립트 파일 안의 명령,
`python -c`·`node -e` 안에서 만든 하위 프로세스, `xargs`·`find -exec`·`ssh` 로 넘긴 명령, 둘 이상이 한 줄에 붙은 heredoc.
호출한 쪽은 이 한계를 사용자에게 거짓 없이 적어야 한다.
"""
import collections
import os
import re
import shlex

MARKER = os.path.join(".claude", "hooks", "_hooklib.py")
PUNCT = ";&|()<>\n"
SHELLS = {"sh", "bash", "zsh", "dash", "ksh"}
KEYWORDS = {"if", "then", "else", "elif", "do", "while", "until", "!", "{", "time"}
ASSIGN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
# 접두 프로그램 → (값을 받는 옵션, 옵션 뒤에 오는 위치 인자 수)
WRAPPERS = {
    "env": ({"-u", "-C", "-S", "--unset", "--chdir"}, 0),
    "command": (set(), 0),
    "exec": ({"-a"}, 0),
    "sudo": ({"-u", "-g", "-h", "-p", "-C", "-D", "-R", "-T", "-U"}, 0),
    "nohup": (set(), 0),
    "nice": ({"-n"}, 0),
    "builtin": (set(), 0),
    "stdbuf": ({"-i", "-o", "-e"}, 0),
    "timeout": ({"-k", "-s"}, 1),
}
GIT_VALUE_OPTS = {"-c", "--git-dir", "--work-tree", "--namespace", "--super-prefix", "--config-env", "--attr-source"}

Invocation = collections.namedtuple("Invocation", "prog args redirs")


def project_root(d):
    cwd = (d or {}).get("cwd") or os.getcwd()
    cur = os.path.realpath(cwd)
    while True:
        if os.path.isfile(os.path.join(cur, MARKER)):
            return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent
    return os.environ.get("CLAUDE_PROJECT_DIR") or cwd


def root_from(d, start):
    """start(상대면 cwd 기준)에서 올라가 프로젝트 루트를 찾는다. 프로젝트 밖이면 None."""
    base = (d or {}).get("cwd") or os.getcwd()
    p = start if os.path.isabs(start) else os.path.join(base, start)
    p = os.path.realpath(p)
    if not os.path.isdir(p):
        return None
    while True:
        if os.path.isfile(os.path.join(p, MARKER)):
            return p
        parent = os.path.dirname(p)
        if parent == p:
            return None
        p = parent


# ---------- heredoc ----------
_HD = re.compile(r"(?<!<)<<(-?)[ \t]*(?:'([^'\n]*)'|\"([^\"\n]*)\"|\\?([A-Za-z_][A-Za-z0-9_]*))")


def _split_heredocs(cmd):
    """-> (본문을 뺀 명령, [(헤더 줄 접두, 본문)])"""
    out, bodies, pos = [], [], 0
    while True:
        m = _HD.search(cmd, pos)
        if not m:
            out.append(cmd[pos:])
            break
        delim = next(g for g in m.groups()[1:] if g is not None)
        eol = cmd.find("\n", m.end())
        if eol < 0:
            out.append(cmd[pos:])
            break
        line_start = cmd.rfind("\n", 0, m.start()) + 1
        i, body_end, resume = eol + 1, None, None
        while i <= len(cmd):
            j = cmd.find("\n", i)
            line = cmd[i:j if j >= 0 else len(cmd)]
            if (line.lstrip("\t") if m.group(1) else line) == delim:
                body_end, resume = i, (j + 1 if j >= 0 else len(cmd))
                break
            if j < 0:
                break
            i = j + 1
        if body_end is None:  # 종결자가 없으면 끝까지가 본문
            out.append(cmd[pos:eol + 1])
            bodies.append((cmd[line_start:m.start()], cmd[eol + 1:]))
            pos = len(cmd)
            break
        out.append(cmd[pos:eol + 1])
        bodies.append((cmd[line_start:m.start()], cmd[eol + 1:body_end]))
        pos = resume
    return "".join(out), bodies


# ---------- 토큰·분절 ----------
def _lex(text):
    text = re.sub(r"`([^`]*)`", r"$(\1)", text)
    lx = shlex.shlex(text, posix=True, punctuation_chars=PUNCT)
    lx.whitespace = " \t\r"
    lx.whitespace_split = True
    lx.commenters = ""
    return list(lx)


def _is_punct(t):
    return bool(t) and all(c in PUNCT for c in t)


def _segments(tokens):
    segs, words, redirs, i = [], [], [], 0
    while i < len(tokens):
        t = tokens[i]
        if _is_punct(t):
            if "<" in t or ">" in t:
                tgt = tokens[i + 1] if i + 1 < len(tokens) else ""
                if not tgt or _is_punct(tgt):
                    redirs.append((t, ""))
                    i += 1
                else:
                    redirs.append((t, tgt))
                    i += 2
                continue
            if words or redirs:
                segs.append((words, redirs))
            words, redirs = [], []
            i += 1
            continue
        words.append(t)
        i += 1
    if words or redirs:
        segs.append((words, redirs))
    return segs


def _unwrap(words):
    i = 0
    while i < len(words):
        w = words[i]
        if ASSIGN.match(w) or w in KEYWORDS:
            i += 1
            continue
        b = os.path.basename(w)
        if b in WRAPPERS:
            valopts, positional = WRAPPERS[b]
            i += 1
            while i < len(words) and words[i].startswith("-"):
                i += 2 if words[i] in valopts else 1
            i += positional
            continue
        break
    return words[i:]


def _subst_bodies(word):
    """단어 안의 $( … ) 안쪽 문자열들."""
    out, i = [], 0
    while True:
        k = word.find("$(", i)
        if k < 0:
            return out
        depth, j = 1, k + 2
        while j < len(word) and depth:
            depth += {"(": 1, ")": -1}.get(word[j], 0)
            j += 1
        out.append(word[k + 2:j - 1 if depth == 0 else j])
        i = j


def _inner_scripts(prog, args):
    if prog in SHELLS:
        for k, a in enumerate(args):
            if a.startswith("-") and not a.startswith("--") and "c" in a[1:] and k + 1 < len(args):
                return [args[k + 1]]
    if prog == "eval":
        return [" ".join(args)]
    return []


def invocations(cmd, depth=0):
    """명령 문자열 → Invocation 목록. 따옴표가 안 맞는 등 못 풀면 ValueError."""
    if depth > 5:
        return []
    stripped, bodies = _split_heredocs(cmd)
    result = []
    for words, redirs in _segments(_lex(stripped)):
        argv = _unwrap(words)
        if not argv:
            result.append(Invocation("", [], redirs))
            continue
        prog = os.path.basename(argv[0])
        result.append(Invocation(prog, argv[1:], redirs))
        for s in _inner_scripts(prog, argv[1:]):
            result.extend(invocations(s, depth + 1))
        for w in argv:
            for body in _subst_bodies(w):
                result.extend(invocations(body, depth + 1))
    for prefix, body in bodies:  # 셸이 받는 heredoc 본문은 실행되는 스크립트다
        try:
            segs = _segments(_lex(_split_heredocs(prefix)[0]))
        except ValueError:
            segs = []
        last = _unwrap(segs[-1][0]) if segs else []
        if last and os.path.basename(last[0]) in SHELLS and not _inner_scripts(os.path.basename(last[0]), last[1:]):
            result.extend(invocations(body, depth + 1))
    return result


def git_parts(inv):
    """git 호출이면 (하위 명령, -C 경로 목록, 나머지 인자). 아니면 None."""
    if inv.prog == "git-commit":
        return "commit", [], inv.args
    if inv.prog not in ("git", "git.exe"):
        return None
    args, i, cdirs = inv.args, 0, []
    while i < len(args):
        a = args[i]
        if a == "-C":
            cdirs.append(args[i + 1] if i + 1 < len(args) else "")
            i += 2
        elif a in GIT_VALUE_OPTS:
            i += 2
        elif a.startswith("-"):
            i += 1
        else:
            return a, cdirs, args[i + 1:]
    return None, cdirs, []


LOOSE_GIT_COMMIT = re.compile(r"\bgit(?:\.exe)?\b[^;&|\n]*\bcommit\b|\bgit-commit\b")


def git_commits(cmd):
    """명령 안의 `git commit` 호출 목록 [(-C 경로들)…]. 풀 수 없으면 느슨한 정규식으로 닫는 쪽(있다고 본다)."""
    try:
        invs = invocations(cmd)
    except Exception:
        return [[]] if LOOSE_GIT_COMMIT.search(cmd) else []
    found = []
    for inv in invs:
        g = git_parts(inv)
        if g and g[0] == "commit":
            found.append(g[1])
    return found
