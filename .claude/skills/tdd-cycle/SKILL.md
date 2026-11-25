---
name: tdd-cycle
description: "AC → 실패하는 테스트 → 구현 → 정리 순서와 변경 단위(maker 용) — Vitest 실행 명령, 순서 증거 기록 형식. developer 가 preload. 개발 검수가 아니다(= develop-review). e2e 작성이 아니다(= e2e-playwright)."
---

# tdd-cycle

## 1. 단위

- 변경 단위 = AC 하나. 한 단위 = 테스트 + 구현 + 기록 한 묶음. 커밋하지 않는다(git 금지 — 커밋은 메인 세션 몫).

## 2. 순서 (건너뛰지 않는다)

1. **AC 고르기** — `docs/stories/*.md` 의 정의 줄 하나(story-ac-write §2). 디자인이 있으면 `docs/design/screens/<화면 ID>.md` 의 AC 연결 행.
2. **실패하는 테스트** — `src/**/<이름>.test.ts(x)`. 테스트 이름에 AC id 를 넣는다(`describe('AC-001-1 ...')`).
3. **실패 확인** — `pnpm exec vitest run <테스트 파일>` → exit ≠ 0, 실패 원인이 기대값 불일치여야 한다. import·문법 오류로 실패하면 테스트를 고치고 다시.
4. **최소 구현** — 그 테스트를 통과시키는 만큼만. AC 에 없는 기능을 넣지 않는다.
5. **통과 확인** — 같은 명령 exit 0.
6. **정리** — 중복 제거·이름 정리 후 `pnpm exec vitest run` 전체와 `pnpm exec tsc --noEmit` 둘 다 exit 0.
7. **기록** — `docs/tdd/<yyyy-mm-dd>-<AC id>.md`(날짜 = `date +%F`):

```
AC: <AC id>
test: <테스트 파일 경로>
red: <3단계 명령> exit=<n> | <실패 메시지 1줄>
green: <5단계 명령> exit=0
refactor: vitest exit=<n> · tsc exit=<n>
```

## 3. 규칙

- DB 가 필요한 테스트는 `scripts/db-up.sh up` 뒤에 돈다. 테스트가 남긴 행은 테스트가 지운다.
- 기록의 exit 값은 실제 실행 결과만 적는다. 실행 못 했으면 `not-run(<사유>)`.
