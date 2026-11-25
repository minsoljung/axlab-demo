---
name: story-review
description: "user story·AC 검수 체크리스트(checker 용) — AC 판정 가능성, story 마다 AC 존재, 중복·충돌 AC, 화면 커버리지. 규칙 정본은 story-ac-write. story-reviewer 가 preload. 작성 절차가 아니다(= story-ac-write). e2e 대응 검수가 아니다(= e2e-review)."
---

# story-review

대상: `docs/stories/*.md`. 규칙 정본 = story-ac-write.

## 1. 기계 판정 먼저

- `python3 scripts/ac-trace.py` 실행. 출력 전체와 exit 를 그대로 적는다. 이 단계에서 exit 3 은 테스트가 없어서일 수 있다 — 대응 판정에 쓰지 않는다. 볼 것은 `FORMAT` 줄·`TOTAL` 줄·`UNCHECKED` 줄이다.
- `TOTAL` 줄이 없거나 exit 가 4·5 이면 판정을 멈추고 경로·도구부터 확인한다(형식 검사가 돌지 않았다는 뜻이다 — `FORMAT` 줄 0건을 PASS 로 읽지 마라).
- `defined=0` 이면 판정을 멈추고 경로부터 확인한다(잡혀야 정상인 값).
- `UNCHECKED` 줄은 사유를 리뷰 파일에 그대로 옮긴다. 대응 축은 이 skill 의 범위 밖(= e2e-review)이라 `미검사` 가 정상이지만, "이번 판정이 보지 않은 것"으로 적는다.

## 2. 축

| # | 축 | FAIL 조건 |
|---|---|---|
| S-1 | 형식 | `FORMAT` 줄 1건 이상(유효 AC 0 인 story 포함) · `TOTAL` 줄 없음(→ FAIL 이 아니라 미검사 + 사유) |
| S-2 | 판정 가능성 | AC 가 story-ac-write §3 형태가 아님 · 금지어 포함 · 결과가 둘 이상 · 관찰 대상(텍스트·URL·요소 상태·DB 행·HTTP 상태)이 없음 |
| S-3 | 중복·충돌 | 같은 조건에 다른 결과 · 같은 조건·결과의 AC 두 개 |
| S-4 | 화면 커버리지 | `docs/prd/ia.md` 의 화면 ID(폐기 제외) 중 story 0 · story 의 `화면:` 이 IA 에 없음 |
| S-5 | 범위 | 제외 범위 기능을 요구하는 AC |

- S-2 는 AC 마다 판정한다. FAIL 이면 그 AC 를 어떤 테스트도 판정할 수 없는 이유를 한 줄로 적는다.
- 각 축은 PASS/FAIL/미검사. 미검사는 사유 필수.
