# 검수 — axlab-demo 프로젝트 하네스 (first-pass)

- checker: harness-reviewer (opus) · maker: harness-engineer · 설계 정본: docs/project-init.md §5
- 판정: **FAIL** · Critical 0 · Major 5 · Minor 12
- 대상(32): .claude/agents 10 · .claude/skills 12 · .claude/settings.json · .claude/hooks 5 · scripts 4. 마지막 수정 14:50:24, 검수 중 바뀐 파일 0(mtime 확인)
- 대조 문서(curl 로 받아 python 으로 셈, 2026-11-25): code.claude.com/docs/en/{sub-agents,skills,hooks,permissions,tools-reference,commands}.md · Claude Code 2.1.332
- harness-review 확인 문구 `...-HARNESS-REVIEW-COMPANY-ONLY`: 있음. 로드 경로 = 회사 config dir. 덮어쓴 스킬 없음
- 검수 중 관측: docs/prd/{prd,ia,wbs}.md(14:55)와 docs/reviews/2026-11-25-prd-prd-reviewer.md(14:58)가 다른 흐름에서 생겼다. 검수 대상 밖이라 보지 않았다
- 부수 실측: `.git/` 있음(config·HEAD=`ref: refs/heads/main`·hooks 는 *.sample 14개뿐·objects/{info,pack} 비어 있음·refs/heads 비어 있음). git 명령은 실행하지 않았다(ls -a, HEAD 파일 읽기만). docs/todo.md E-2 "git init = todo" 와 맞지 않는다

## 축별 결과

A-1=PASS · A-2=PASS · A-2b=PASS · A-3a=PASS · A-3b=PASS · A-4=PASS(한계) · A-5=부분 · A-6=부분 · A-6-b=PASS · A-7=PASS · A-8=부분

| 축 | 판정 | 근거 / 반증 |
|---|---|---|
| A-1 | PASS | 에이전트 10개 모두 `하지 않는다` 와 description 의 `(= 인접 역할)` 을 갖는다. 스킬 12개 모두 description 에 `~가 아니다(= …)` 가 있다. 모드로 숨긴 역할 없음. 반증 시도: 스킬만 읽는 경로에서 경계가 빠지나 → 스킬 쪽에도 있어서 실패 |
| A-2 | PASS | maker 5 ↔ checker 5. A-2b 스크립트(프로젝트 경로로 돌림)로 짝 5/5 선언 확인, `<쌍 미선언>` 0 |
| A-2b | PASS | 모든 짝이 sonnet ⊥ opus, 같은모델 0. 잡혀야 정상인 값: checker= 목록 5개(비어 있지 않음). ⚠️ 이 축이 닫는 건 "같은 사각" 한 겹뿐이다 |
| A-3a | PASS | PyYAML 파싱 22/22. 에이전트 키 ⊂ 문서 표 19키, 스킬 키 ⊂ 문서 표 20키, 모르는 키 0. tools 는 tools-reference 표(55개, Read/Bash/WebFetch 포함 확인)에 모두 있음. model∈{sonnet,opus} · effort=medium 유효. skills: 가 가리키는 스킬 전부 실존. 스킬 name=디렉터리명 12/12, description 최대 256자(<1,536). 이름 충돌 0 — 아래 §이름 충돌 |
| A-3b | PASS | MISSING 0/10. 잡혀야 정상인 값: 같은 명령에 SKILL.md 하나를 넣으면 `<MISSING>` 이 뜨고 1/11. **한계: 값이 역할에 맞나(medium 이 판단 비중 큰 checker 에 충분한가)는 안 봤다. 확정 전제라서다** |
| A-4 | PASS(한계) | 규율은 설계 §5-1 원칙과 공식 문서에서 나왔다. 신규 프로젝트라 이 repo 실측 사례는 없다(근거 등급 = 원칙·문서). Playwright 공허 단언 패턴은 알려진 실패 유형이다 |
| A-5 | 부분 | 겹치는 소관 0, 개인 식별자·절대경로·회사 자산 이름 0(아래 §9). 빈틈·어긋남은 m-10, m-11 |
| A-6 | 부분 | maker 에 git 권한을 주는 도구 없음(git 금지는 본문 지시). checker 의 "읽기 전용"은 기계로 막히지 않는다 — m-1 |
| A-6-b | PASS | 산출 이름 14개를 `^(REPORT\|SUMMARY\|FINDINGS\|ANALYSIS).*\.md$`(i 플래그)에 실제로 돌림 → 전부 False. 잡혀야 정상인 값: `report-x.md` → True |
| A-7 | PASS | checker 회수 = 축 ID PASS/FAIL/미검사 + 근거(파일:줄·명령·exit·집합 크기) + 반증 + 미검사 사유. maker 회수 = 경로·ID·명령 exit·미검증 |
| A-8 | 부분 | 검사기·게이트 = ac-trace.py·ac-trace-gate·test-gate·check-types·check-env·e2e-run. (a) test-gate·check-types·gate 의 stories 없는 단계는 "미검사"를 systemMessage/additionalContext 로 남긴다 → OK. **ac-trace exit 4 는 형식 검사를 아예 안 돌리고 TOTAL 줄도 없다 → M-4.** (b) TOTAL 줄은 대칭이다. (d) 선택 인자 기본값은 켜져 있다 |

## Major

| ID | 결함 | 근거(재실행) | 반증 — 어떤 오판정을 낳나 |
|---|---|---|---|
| M-1 | `if: "Bash(git commit *)"` 는 `git -C <dir> commit`·`git -c k=v commit`·`/usr/bin/git commit` 에 안 맞는다. 이때 훅이 아예 뜨지 않아 ac-trace-gate 가 우회된다 | 문서: permissions.md §What a Bash rule doesn't match 표 — `Bash(git push *)` 는 *"`git -C . push origin main`, `git -c push.default=current push origin main`"* 을 막지 못한다 · `Bash(curl *)` 는 `/usr/bin/curl …` 을 막지 못한다. hooks.md §Common fields: `if` 는 같은 permission rule 문법이다. 맞는 경우: `git commit` 단독(permissions.md: 끝의 ` *` 는 맨 명령에도 맞는다) · `npm test && git commit`(hooks.md 표: 하위 명령마다 본다) · `FOO=1 git commit`. 스크립트 단독 실측: `git -C /tmp/r commit` → rc=2 로 잡지만 `if` 가 먼저 걸러서 그 코드는 실행될 일이 없다. `/usr/bin/git commit`·`sh -c 'git commit'`·`git -C '/a b' commit`·alias `git ci` → 스크립트 정규식도 rc=0(이중 누락) | 회사 CLAUDE.md §4 는 부재 판정·형상관리에 `/usr/bin/git` 절대경로를 지시한다. git 규율도 `git -C` 를 흔히 쓴다. 이 환경에서 가장 흔한 커밋 형태가 게이트를 조용히 통과하고, 안내 메시지도 남지 않는다. 고칠 방향(maker 몫): `if` 를 빼거나 `Bash(git *)` 로 넓히고 스크립트 정규식이 경로 접두·따옴표를 잡게 한다. 진짜 강제는 git pre-commit 훅으로 한다(hooks.md: *"the `if` filter is best-effort"*) |
| M-2 | 기획→개발 구간(story 있음, e2e 없음 또는 일부)에서 **모든 커밋이 막힌다. 의도된 게이트가 아니라 결함으로 판정** | 임시 픽스처 실측: stories 있고 e2e/ 없음 → ac-trace exit 4 → gate rc=2 · e2e/ 비어 있음 → exit 3 → rc=2 · story 001 은 다 덮이고 002 는 아직 → exit 1 → rc=2 | 결함 근거 셋. (1) 자산끼리 모순: story-writer.md 는 *"이 단계의 exit 3(테스트 없음)은 정상"*, story-ac-write §5 는 *"story 단계(테스트 전)에는 3 이 정상"* 이라고 적었는데 gate 는 0 이 아니면 모두 차단한다. (2) gate 는 stories 없는 단계만 통과로 처리했다. 설계 §5-4 의 "대응이 **깨지면**"은 아직 만들지 않은 상태를 뜻하지 않는다. (3) docs/todo.md 순서가 P-4 기획 → P-5 디자인 → P-6 개발 → P-7 e2e 라서, 세 단계 동안 story·디자인·코드 커밋이 전부 막힌다. 결과: 세션이 M-1 우회 형태나 터미널 커밋으로 빠지게 되고 게이트는 형식만 남는다 |
| M-3 | ac-trace.py 가 실제로 돌지 않는 테스트를 대응으로 세고 exit 0 을 낸다 | 임시 픽스처 실측(전부 exit 0, matched=2): `// test('AC-001-2 …')` 한 줄 주석 · `/* test(…) */` 블록 주석 · `test.describe.skip(…)` 안의 test · `test.describe.fixme(…)` 안 · 템플릿 문자열 안의 `test('AC-001-2 …')` · 본문 안 `test.skip(true)` | 핵심 오라클("세는 일은 스크립트가")이 기능 없이 통과한다. 백스톱도 같은 구멍을 가진다: e2e-review E-2/E-3 목록에 주석 처리·`describe.skip/fixme` 가 없다(조건부 `test.skip` 만 있음). e2e-reviewer 는 exit 0 + 패턴 미검출을 보게 되고, 같은 사각을 두 번 세는 셈이 된다. 게이트도 커밋을 통과시킨다 |
| M-4 | e2e/ 가 없으면 ac-trace 가 exit 4 로 바로 끝나서 story 형식 검사를 아예 안 돌린다. stdout 0줄, TOTAL 없음 | 실측: stories 만 있음 → stdout 빈 문자열, stderr `USAGE 디렉터리 없음`, exit 4. 같은 story 에 e2e/ 빈 디렉터리를 주면 FORMAT 검사를 돌리고 exit 3 | story-writer 의 루프 조건 *"`FORMAT` 줄이 0 이 될 때까지"* 가 검사 없이 바로 참이 된다(FORMAT 줄 0). story-review S-1(*"FORMAT 줄 1건 이상 → FAIL"*)도 같은 출력이면 PASS 로 읽힌다. story-review 는 `defined=0` 만 멈춤 조건으로 두었고 *TOTAL 줄 부재*는 다루지 않는다. A-8(a) 위반 |
| M-5 | supabase-pg-only §1 정본의 `url = env(...)`·`directUrl = env("DIRECT_URL")` 이 현행 Prisma 에서 무효다 | prisma.io v7 Config API 참조(curl): *"The datasource.directUrl property has been removed in Prisma ORM v7"*, URL 은 prisma.config.ts 로 옮겨졌다. npm `prisma` latest = 8.0.0-rc.35(registry 조회). 스킬은 Prisma 버전을 고정하지 않는다 | E-3 스캐폴딩에서 `pnpm add prisma` 를 하면 v7 이상이 깔리고 schema 오류가 난다. 조용한 실패는 아니고 바로 드러난다. 하지만 developer 는 *"skill 에 없는 경로·형식을 만들지 않는다"* 때문에 멈춘다. DIRECT_URL 은 check-env REQUIRED·e2e-run·§2 표 세 곳에 묶여 있어 같이 고쳐야 한다. 고칠 방향(maker 몫): `prisma@6` 으로 고정하거나 v7 방식(prisma.config.ts)으로 정본을 바꾼다 |

## Minor

| ID | 결함 | 근거 / 반증 |
|---|---|---|
| m-1 | checker 5개의 읽기 전용은 본문 지시뿐이다. 기계 강제는 `Edit` 를 안 준 것 한 겹이다 | Write 는 경로 제한이 없고 Bash 는 rm·sed -i·git 을 모두 실행할 수 있다. checker 가 대상을 "고치고" 자기 PASS 를 내도 막는 장치가 없다 = maker⊥checker 붕괴 경로. 기계로 막을 수단은 문서에 있다: 에이전트 frontmatter `hooks`(PreToolUse Write 를 `docs/reviews/**` 로 제한) · `disallowedTools`. 지금 위험도: 프롬프트를 따르는 한 낮다. 그래서 Minor. description 의 "읽기 전용"을 강제로 읽지 않게 한 줄을 붙이는 게 좋다 |
| m-2 | block-secrets 경로 검사가 대소문자를 구분한다 | `.ENV`·`.Env.Local` → rc=0. macOS APFS 는 기본이 대소문자 무시라서 같은 `.env` 파일을 쓰게 된다. .gitignore 대상이라 repo 유출까지 가지는 않는다 |
| m-3 | block-secrets 내용 검사는 문자열을 나누면 빠진다 | JWT `'eyJ…'+'.eyJ…'` → rc=0. Edit 로 `.env.example` 의 값만(`NAME=` 없이) 넣으면 rc=0. DB URL 을 나눈 경우는 잡혔다(rc=2). host 가 `db`·`postgres` 면 진짜 비밀번호도 rc=0. 본문은 Bash 우회만 한계로 적어 두었다 |
| m-4 | block-supabase-extras 가 확장자·경로·이름에서 빠진다 | `.mts`·`.TS` → rc=0 · 경로에 `/.claude/` 가 들어간 `…/.claude/../src/a.ts` 는 면제 → rc=0 · 클라이언트 변수 이름이 `supabase` 를 안 담으면 `db.auth` → rc=0 · lockfile·`.env.example` 의 `SUPABASE_*` → rc=0. develop-review R-3 백스톱은 같은 정규식을 써서 같은 사각이다. 단 `@supabase/` import 와 package.json 은 잡힌다 |
| m-5 | matcher `Write\|Edit` 는 NotebookEdit 를 빼먹는다 | hooks.md: 글자만 있는 matcher 는 정확 일치 목록이다. tools-reference 에 NotebookEdit 가 있다. MultiEdit 는 현행 도구 목록에 0건이라 해당 없음. 지금 스택에 노트북이 없어서 영향은 작다 |
| m-6 | test-gate(Stop)는 메인 세션 종료에만 걸린다. developer 서브에이전트가 끝날 때는 안 걸린다 | hooks.md §Stop: *"Runs when the main Claude Code agent has finished responding"*. SubagentStop 은 설정하지 않았다. 깨진 상태는 메인 턴이 끝날 때에야 걸린다 |
| m-7 | test-gate 가 막는 게 무효가 되는 경우가 있다 | hooks.md: Stop 에서 exit 2 + stdout 이 비었고 stderr 에 `No such file or directory` 가 있으면 non-blocking 으로 처리한다. 가짜 vitest(ENOENT 출력)로 rc=2·stdout 빈 값을 재현했다. Claude Code 쪽 동작은 문서로만 판정했다 |
| m-8 | check-types 의 내부 시간 합(tsc 110s + eslint 110s)이 훅 timeout 120 을 넘는다 | 넘으면 강제로 끝나고, onFailure 가 없어서 non-blocking 이 된다 = 경고가 사라진다. `.mts`·`.TSX` 는 검사하지 않는다(rc=0, 미검사 표기 없음) |
| m-9 | ac-trace 경계 | 소문자 `- ac-001-2:` 정의가 FORMAT 없이 조용히 빠진다(defined=1, exit 0) · `.markdown` story 무시 · 코드펜스 안 예시 AC 를 정의로 셈(→ MISSING, 시끄러운 오탐) · gate 정규식 오탐: `echo git commit`·`git commit-tree` 를 차단(rc=2) |
| m-10 | check-env FORBIDDEN 이 5개 이름뿐이라 skill §3 의 "그 밖의 `SUPABASE_*`" 와 다르다 | develop-review R-3 의 FAIL 조건이 check-env FORBIDDEN 에 기댄다. 다른 `SUPABASE_*` 는 R-3 의 python 전수만 잡는다 |
| m-11 | 설계 정본과 구현이 다르다 | e2e-reviewer 가 story-ac-write 를 preload 한다(§5-3 공용 표의 쓰는 쪽에 없음. 판단 자체는 타당). §5-2·§5-3 의 회사 공용 git-operator·db-modeler·git-commit·git-ops·fixing-accessibility·baseline-ui 재사용 문장이 "자립" 전제와 충돌한다(todo H-5 가 추적 중). 커밋 주체가 tdd-cycle 은 "메인 세션", 설계는 "git-operator" 로 갈린다 |
| m-12 | worktree 세션에서 gate·hook 이 메인 체크아웃을 잰다 | hooks.md: *"`${CLAUDE_PROJECT_DIR}` stays put"*, cwd 만 worktree 를 따라간다. 4개 훅의 root 가 CLAUDE_PROJECT_DIR 를 cwd 보다 먼저 쓴다 |

## 지시 항목별

| # | 판정 | 요지 |
|---|---|---|
| 1 settings 스키마 | PASS | `if`·`timeout`(초)·`onFailure`("continue"\|"block", v2.1.295+ → 설치본 2.1.332)·`matcher`·`args`(exec form, `${CLAUDE_PROJECT_DIR}` 치환 문서화) 모두 hooks.md 표에 있고 값 형식이 맞는다. JSON 파싱 OK. 모르는 키 0 |
| 2 `if` 범위 | FAIL | M-1. 맞는 것: `git commit`·`&&` 체인·`VAR=x git commit` / 안 맞는 것: `git -C`·`git -c`·`/usr/bin/git` |
| 3 hook 직접 실행 | 부분 | 49건: 차단 기대 rc=2·통과 기대 rc=0 양방향 모두 기대대로. maker 가 안 해본 우회 시도 20건 중 14건 통과(m-2~m-5, M-1). 잘못된 JSON → PreToolUse 3개는 rc=2(막는 쪽으로 닫힘), Post/Stop 은 rc=0 + 미검사 통지 |
| 4 ac-trace 픽스처 | 부분 | 26건(임시 디렉터리, 끝나고 삭제). 정상 0·누락 1·초과 1·형식 2·skip 1(MISSING+SKIP)·빈 집합 3·폐기 처리 0·폐기 참조 1 = 문서와 일치. "잡혀야 정상인 값이 0 이면 고장" 규칙은 실제로 돈다(defined=0·spec=0·matched=0 → exit 3 + stderr 문구). 결함 M-3·M-4·m-9 |
| 5 기획→개발 커밋 차단 | FAIL(결함) | M-2 |
| 6 checker read-only | 부분 | m-1 — 기계 강제 아님 |
| 7 preload 짝 | PASS | 실존 22/22. maker 전용(prd-write·design-build·tdd-cycle·e2e-playwright)이 checker 에 새지 않음 0건, checker 전용이 maker 에 0건. 공용 3개: astryx-ui = 설계 일치 · supabase-pg-only = 일치 · story-ac-write = e2e-reviewer 가 하나 더(m-11) |
| 8 이름 충돌 | PASS | 회사 config dir(agents 29·skills 63, 잡혀야 정상인 값 harness-reviewer/harness-review 잡힘) · ~/.claude(agents 7·skills 41, 목록 수 일치) · 두 곳 plugins(skills 71/58·agents 38/46) — 대소문자·NFKC 를 정규화해 대조, 충돌 0. CLI 플래그 71개(잡혀야 정상인 값 `resume` 잡힘)·서브커맨드 15개·내장 명령 149개 충돌 0. ⚠️ skills.md: *"personal over project"* — 나중에 개인·회사 쪽에 같은 이름이 생기면 이 프로젝트 스킬이 조용히 덮인다. 지금은 0 |
| 9 사람용 문서·회사 이름 | PASS | .md 전수 27 = 에이전트 10 + SKILL 12 + docs/{project-init,todo}.md + docs/prd 3(다른 흐름 산출). README 같은 사람용 문서 0. 회사 자산 이름 78개 + `/Users/`·`emotion`·`CLAUDE_CONFIG_DIR` 등 13개를 32개 파일에 전수 대조 → 1건이 걸렸는데 `docs/project-init.md` 파일 경로 일부라 실제 언급은 0(문맥 확인). 잡혀야 정상인 값: `story-ac-write` 26회 |
| 10 maker 미검증 | 부분 | 아래 표 |

### 10. maker 미검증 항목 확인

| 항목 | 결과 |
|---|---|
| 레지스트리 인식 | **미검증**. 중첩 세션은 띄우지 않았다. 정적 근거만 있다: YAML·필드·이름 유일 |
| settings 배선 실제 동작 | **미검증**(런타임). 문서 대조와 스크립트 단독 실행만 했다 |
| Docker/pnpm 경로 | 이 머신에 docker·pnpm 이 없다. 전제 실패 분기만 확인: db-up status → exit 3 · e2e-run → exit 3 · check-env → MISSING 2·exit 1 · 인자 → exit 2. `bash -n` 3/3 OK. 실제 기동 경로는 **미검증** |
| astryx CLI | facebook/astryx packages/cli README(curl): `astryx --json component --list`·`astryx docs` 가 있다. npm @astryxdesign/cli 0.7.17 bin=`astryx`. 실행은 **미검증** |
| Playwright JSON 키 | testReporter.d.ts: `stats.{expected,unexpected,flaky,skipped}` 일치. `PLAYWRIGHT_JSON_OUTPUT_NAME` = 출력 폴더(cwd 또는 config 폴더) 기준 상대경로라고 문서에 있다. config 에 `outputFile` 을 두면 env 는 무시된다. 실행은 **미검증** |
| Prisma directUrl | **FAIL** — M-5 |

## 측정 범위·한계

- hook 49건·ac-trace 26건·gate 명령 18건은 전부 scratchpad 임시 디렉터리에서 돌렸고, 끝나고 삭제했다. 프로젝트에 새로 생긴 파일은 이 리뷰 하나다
- PyYAML 이 시스템 python 에 없어서 scratchpad 에 따로 설치해 썼다(훅·스크립트는 표준 라이브러리만 써서 영향 없음)
- Claude Code 런타임 판정(`if` 매칭·Stop 의 ENOENT 규칙·NotebookEdit matcher)은 공식 문서 근거로만 했고 실제로 재현하지 않았다
- 이 PASS/FAIL 은 first-pass 다. 종결은 진행자 최종 검수와 사용자 결정이다
