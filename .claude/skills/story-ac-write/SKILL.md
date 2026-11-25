---
name: story-ac-write
description: "user story·AC 양식과 AC 번호 규칙의 정본(공용) — story 문서 위치, AC 정의 줄 형식, 판정 가능한 문장, e2e 테스트 제목 규칙, scripts/ac-trace.py 판정·종료 코드, 커밋 게이트의 단계별 동작. story-writer·story-reviewer·e2e-writer·e2e-reviewer 가 preload. 검수 체크리스트가 아니다(= story-review·e2e-review). e2e 작성 절차가 아니다(= e2e-playwright)."
---

# story-ac-write — AC 계약 정본

이 파일이 AC 규칙의 유일한 정본이다. 다른 skill·script 는 여기를 가리킨다. 규칙을 바꾸면 `scripts/ac-trace.py` 와 `.claude/hooks/ac-trace-gate.py` 를 같은 변경에서 고친다.

## 1. story 문서

- 위치: `docs/stories/<story>-<slug>.md` — `<story>` = 3자리 숫자(`001`), `<slug>` = kebab-case ASCII. 한 파일 = story 하나. 확장자는 `.md` 만 읽는다(`.markdown` 등은 형식 오류).
- 양식(글자 그대로):

~~~
# <story> <제목>

- 화면: <IA 화면 ID>  (docs/prd/ia.md 의 ID — prd-write 정의)

## Story
<역할>로서 <목표>를 원한다. <이유> 때문이다.

## AC
- AC-<story>-<n>: <조건>이면 <관찰 가능한 결과>이다.
~~~

## 2. AC 줄 규칙 (ac-trace.py 가 기계로 읽는다)

| 종류 | 형식(정규식) |
|---|---|
| 정의 | `^- (AC-\d{3}-[1-9]\d*): \S` |
| 폐기 | `^- (AC-\d{3}-[1-9]\d*) \(폐기\): \S` — 사유를 적는다 |

- AC id 의 `<story>` = 파일명 앞 3자리와 같다.
- `<n>` 은 1부터. 번호 재사용 금지 — 지우지 말고 폐기 줄로 바꾼다(빈 번호 허용).
- 같은 id 를 두 번 정의하지 않는다.
- 본문에서 다른 AC 를 언급할 때는 정의된 id 만 쓴다. `AC-1-1`·`AC-001-01`·소문자 `ac-001-2` 같은 변형은 형식 오류다.
- story 파일마다 정의 줄이 1개 이상 있어야 한다.
- 코드펜스(``` 또는 ~~~) 안의 줄은 읽지 않는다 — 예시 AC 를 정의로 세지 않기 위해서다. 닫히지 않은 펜스는 형식 오류다(뒤 줄이 통째로 안 읽히므로).

## 3. 판정 가능한 문장

- 형태: **<조건>이면 <관찰 가능한 결과>이다.** 결과는 화면 텍스트·URL·요소 상태·DB 행·HTTP 상태 중 하나로 확인된다.
- 금지어(측정 불가): `적절히`·`빠르게`·`쉽게`·`잘`·`자연스럽게`·`사용자 친화`·`등`·`필요 시`. 수치·관찰 대상으로 바꾼다.
- 한 AC = 결과 하나. `그리고`로 결과를 이으면 나눈다.

| 나쁨 | 좋음 |
|---|---|
| 이벤트 목록이 빠르게 보인다 | 이벤트가 0건이면 목록 영역에 "진행 중인 이벤트가 없습니다"가 보인다 |
| 응모가 잘 처리된다 | 필수 항목을 모두 채워 제출하면 "응모 완료" 화면으로 이동하고 응모 행이 1건 늘어난다 |

## 4. e2e 테스트 제목 규칙

- 위치: `e2e/**/*.spec.ts`.
- 모든 `test(...)` 제목은 AC id 로 시작한다: `'<AC id>[ <AC id>...] <설명>'`. 정규식 `^(AC-\d{3}-[1-9]\d*)( AC-\d{3}-[1-9]\d*)* \S`.
- 제목은 **문자열 리터럴 하나**(`'`·`"`·보간 없는 `` ` ``). `${` 가 든 제목·변수·`+` 로 이은 제목은 형식 오류.
- `test.describe(...)` 제목에 AC id 를 넣지 않는다(story 번호 `001` 만 허용).
- `test.only`·`test.describe.only` = 형식 오류.
- **대응으로 세지 않는 것(SKIP)**: `test.skip`·`test.fixme`·`test.fail` 제목 테스트 · `test.describe.skip|fixme|fail` 안의 테스트 · 테스트 본문(또는 describe·파일 수준)에서 제목 없이 부른 `test.skip(조건)`·`test.fixme()`·`test.fail()` 이 걸린 테스트(조건부여도 센다 — 돌지 않을 수 있는 테스트는 대응이 아니다).
- 주석 처리된 `test(` 와 문자열(템플릿 포함) 안의 `test(` 는 호출이 아니다 — 세지 않는다. 그 안의 AC id 는 아래 규칙으로 형식 오류가 된다.
- 테스트 제목 밖(주석·문자열)에 AC id 를 쓰지 않는다 — 형식 오류로 센다.
- `*.spec.ts` 파일에서 `test(` 호출을 하나도 못 찾으면 형식 오류다(전부 주석 처리됐거나 `test` 이름을 바꿔 부른 경우).
- 🔴 한계: ac-trace 는 파일을 읽는 도구라 Playwright 설정(`testMatch`·`testIgnore`·`grep`)·프로젝트 필터가 실행에서 빼는 테스트는 모른다. 실행되는 목록은 e2e-review E-1 이 `playwright test --list` 로 따로 대조한다.

## 5. scripts/ac-trace.py

- 실행: `python3 scripts/ac-trace.py [--root DIR] [--stories docs/stories] [--tests e2e]` — `--root` 기본값은 스크립트가 들어 있는 repo(worktree 안에서도 그 worktree).
- 출력 줄(한 줄 = 한 사실):
  - `MISSING <id>` — 기획에 정의, 유효 테스트 없음
  - `EXTRA <id> <file>:<line>` — 테스트에 있고 기획에 정의 없음(폐기 포함)
  - `SKIP <id> <file>:<line> (<사유>)` — 위 §4 의 돌지 않는 테스트(대응 아님)
  - `FORMAT <file>:<line> <사유>` — 이 문서 규칙 위반
  - `STORY <번호> defined=.. tested=.. started=yes|no` — story 별 요약. `started=yes` = 그 story 의 AC 를 가리키는 테스트(SKIP 포함)가 하나라도 있음. 커밋 게이트가 쓴다
  - `UNCHECKED 미검사: <축> — <사유>` — 이번 실행이 **보지 않은 축**. 이 줄이 있으면 `MISSING`·`EXTRA` 가 0줄이어도 "대응 이상 없음"이 아니다
  - 마지막 줄 `TOTAL defined=.. retired=.. tested=.. matched=.. missing=.. extra=.. format=.. spec_files=.. story_files=..` — 대응 축을 못 봤으면 `tested`·`matched`·`missing`·`extra` 가 `n/a`
- 보는 축은 둘이다. **형식 축**(story 문서·테스트 제목 규칙)은 `docs/stories/` 가 있으면 e2e 유무와 무관하게 항상 돈다. **대응 축**(AC ↔ 테스트)은 `e2e/` 에 `*.spec.ts` 가 1개 이상일 때만 돈다 — 아니면 `UNCHECKED` 줄을 내고 `MISSING`·`EXTRA`·`STORY` 줄은 내지 않는다.
- 종료 코드(앞쪽이 우선):

| exit | 뜻 |
|---|---|
| 5 | 도구 내부 오류(stderr 에 사유) — 결과를 믿지 않는다 |
| 4 | 사용법 오류 — story 디렉터리 없음(이때도 `UNCHECKED` 줄을 낸다) |
| 3 | 측정 불가 — 정의 AC 0, 대응 축 미검사(`UNCHECKED`: e2e 디렉터리 없음·spec 0건), 또는 matched 0. 잡혀야 정상인 값이 0 이면 도구·경로 고장을 먼저 의심한다 |
| 2 | 형식 오류 1건 이상 — 개수를 믿지 않는다 |
| 1 | MISSING 또는 EXTRA 1건 이상 |
| 0 | 대응 일치 |

- 🔴 exit 3 을 "대응 문제 없음"으로 읽지 마라. story 단계(테스트 전)에는 3 이 정상이고, 그때 볼 것은 `FORMAT` 줄과 `UNCHECKED` 줄뿐이다. 앞쪽 코드가 우선이라 exit 3 이어도 `FORMAT` 줄은 출력에 그대로 나온다 — `TOTAL` 의 `format=` 과 `FORMAT` 줄 개수를 본다.

## 6. 커밋 게이트(`.claude/hooks/ac-trace-gate.py`) — 단계별 동작

순서는 기획 → e2e 선작성 → 구현이다(ATDD). 그래서 게이트는 "아직 안 만든 것"과 "깨진 것"을 가른다. 판정은 §5 의 출력 줄로 한다(종료 코드만으로 판정하지 않는다).

| 상태 | 게이트 |
|---|---|
| `docs/stories/` 없음·`.md` 0개(기획 전) | 알리고 통과 |
| `FORMAT` 1건 이상(story 또는 테스트 형식이 깨짐) | **차단** |
| `EXTRA` 1건 이상(정의 없는·폐기된 AC 를 테스트가 가리킴) | **차단** |
| `MISSING` 인데 그 story 가 `started=yes` | **차단** — 테스트를 쓰기 시작한 story 는 AC 를 다 덮어야 한다 |
| `MISSING` 인데 그 story 가 `started=no` | 알리기만 — e2e 가 아직 안 쓰인 story |
| `UNCHECKED`(e2e 없음·spec 0건) | 형식만 검사하고 `대응 미검사` 를 알리고 통과 |
| ac-trace 가 0~3 이 아닌 코드로 끝남·`TOTAL` 줄 없음 | **차단** — 측정 도구 고장 |

- 이 게이트는 부분 검사다. **모든 AC 가 덮였는지(MISSING 0)는 게이트가 아니라 e2e-reviewer E-1 이 본다.**
- 🔴 게이트가 못 막는 것: git alias(`git ci`)·변수로 만든 명령·스크립트 파일 안의 커밋·`python -c` 로 띄운 git·`merge`/`cherry-pick`/`rebase` 가 만드는 커밋. 진짜 강제는 git 의 pre-commit 훅인데 이 프로젝트는 아직 설치하지 않았다. 게이트를 "커밋을 막아 준다"로 읽지 마라 — Claude 가 쓰는 흔한 커밋 형태(`git commit`·`git -C`·`git -c`·`/usr/bin/git`·`sh -c`)를 알아보고 막는 장치다.
