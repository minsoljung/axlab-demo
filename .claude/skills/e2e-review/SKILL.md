---
name: e2e-review
description: "e2e 검수 체크리스트(checker 용) — AC↔테스트 대응, 항상 통과하는 공허한 테스트 사냥(주석 처리·skip 포함), 불안정(flaky) 대기, 실행 결과. AC·제목 규칙 정본은 story-ac-write. e2e-reviewer 가 preload. 작성 절차가 아니다(= e2e-playwright). story 검수가 아니다(= story-review)."
---

# e2e-review

대상: `e2e/**`. 기준: `docs/stories/*.md` · story-ac-write. maker 용 skill(e2e-playwright)은 로드하지 않는다.

## 1. 대응 (E-1)

- `python3 scripts/ac-trace.py` 의 출력 전체와 exit 를 그대로 적는다. 종료 코드 뜻 = story-ac-write §5.
- exit 0 이 아니면 FAIL. 단 exit 3 이면 FAIL 이 아니라 측정 불가 — `UNCHECKED` 줄이 사유를 말한다(e2e 없음·spec 0건). 대응 축이 `미검사` 면 E-1 은 `미검사` 다(PASS 가 아니다). `TOTAL` 줄이 없거나 exit 4·5 이면 경로·도구부터 확인한다.
- exit 0 이어도 끝이 아니다: ac-trace 는 파일을 읽을 뿐이라 **실제로 도는 테스트**와 같다는 보장이 없다. 아래 둘로 따로 대조한다.
  - `pnpm exec playwright test --list` 가 낸 테스트 제목 집합 ⊇ ac-trace 가 센 대응 AC 집합인가. 목록에 없는 AC 가 있으면 FAIL(설정의 `testMatch`·`testIgnore`·`grep` 이 뺀 테스트다). 못 돌리면(pnpm·node_modules 없음) 이 대조는 `미검사` + 출력 그대로.
  - `SKIP` 줄이 있으면 개수와 사유를 그대로 적는다 — 그 AC 는 `MISSING` 으로도 나와 있다.
- 아래 E-2 로 본문을 판정한다.

## 2. 공허한 테스트 사냥 (E-2)

AC 테스트마다 본문을 읽고, 아래 중 하나면 FAIL(그 테스트가 기능이 없어도 통과하는 이유를 한 줄로):

- `expect` 0개 · `await` 없는 `expect(locator)...`(약속이 버려져 항상 통과)
- `expect(true)`·상수 비교 · locator 객체에 `toBeTruthy()`/`toBeDefined()`
- 테스트가 직접 넣은 값만 단언(화면·DB 를 거치지 않음)
- `try/catch`·`.catch(() => {})` 로 실패 삼킴
- 조건부 `test.skip(...)`·`test.fixme()`·`test.fail()`·`if` 로 단언을 건너뛸 수 있음(제목 없이 본문·describe·파일 수준에서 부른 것 포함 — ac-trace 는 이런 테스트를 `SKIP` 으로 센다)
- `test.describe.skip`·`test.describe.fixme`·`test.describe.fail` 로 감싼 테스트(ac-trace 는 `SKIP` 으로 센다)
- 주석 처리된 테스트(`//`·`/* */`)·템플릿 문자열 안의 `test(`. AC id 가 든 것은 ac-trace 가 `FORMAT` 으로 잡지만 **AC id 가 없는 주석 처리나 이름만 바꾼 호출은 못 본다** — 아래 python 사냥에서 따로 찾는다
- 단언 대상이 AC 의 관찰 결과와 다름(AC 문장과 단언 문구를 나란히 적는다)

python 으로 위 패턴 후보를 전수로 뽑는다. 후보 뽑기에 쓸 최소 패턴: `^\s*(//|/\*).*\btest\b` · `describe\.(skip|fixme|fail)` · `test\.(skip|fixme|fail)\(` · `\.only\(` · `` ` `` 안의 `test(`. 후보와 나머지 모두 읽어서 판정한다 — 패턴에 안 걸렸다고 PASS 가 아니다. 잡혀야 정상인 값: spec 파일 수와 test 호출 수(0 이면 도구 의심).

## 3. 불안정 대기 (E-3)

FAIL: `waitForTimeout` · 고정 sleep · `networkidle` · CSS 클래스·`nth()` 선택자 · `describe.serial` · 다른 테스트가 만든 데이터 사용.

## 4. 실행 (E-4)

- `scripts/e2e-run.sh` 의 결과 줄과 exit. 실행 못 하면 `미검사` + 출력 그대로.
- 결과 줄의 `skipped` 가 0 이 아니면 E-2 의 skip 후보와 맞춘다.

각 축은 PASS/FAIL/미검사. 미검사는 사유 필수.
