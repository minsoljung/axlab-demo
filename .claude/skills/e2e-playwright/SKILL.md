---
name: e2e-playwright
description: "Playwright e2e 작성 절차(maker 용) — 파일 이름·구조, 테스트 데이터 준비, 대기·선택자 규칙, 실행·대조 명령. 제목의 AC 규칙은 story-ac-write §4 가 정본. e2e-writer 가 preload. e2e 검수가 아니다(= e2e-review)."
---

# e2e-playwright

## 1. 파일

- `e2e/<story>-<slug>.spec.ts` — story 하나 = 파일 하나. 이름은 `docs/stories/` 파일과 같다.
- 테스트 데이터 헬퍼: `e2e/fixtures/*.ts`(Prisma 로 행 생성·삭제). spec 이 아니므로 AC id 를 쓰지 않는다.
- 제목·skip·only 규칙 = story-ac-write §4. 여기서 다시 정하지 않는다.

## 2. 구조

```ts
import { test, expect } from '@playwright/test';

test.describe('<story> <제목>', () => {
  test('<AC id> <설명>', async ({ page }) => {
    // 준비: 이 테스트 전용 데이터 생성
    // 행동: AC 의 조건
    // 판정: AC 의 관찰 결과를 await expect 로
  });
});
```

## 3. 규칙

- 테스트마다 자기 데이터를 만들고 지운다. 다른 테스트의 데이터·순서에 기대지 않는다(`describe.serial` 금지).
- 판정은 AC 문장의 관찰 결과를 그대로 단언한다. 문구는 `docs/design/screens/<화면 ID>.md` 와 같다.
- 모든 `expect` 앞에 `await`. 기능이 없으면 실패하는 단언이 최소 1개.
- 선택자: `getByRole`·`getByLabel`·`getByText` 우선. CSS 클래스·`nth()` 위치 선택 금지.
- 대기: web-first 단언(`toBeVisible`·`toHaveURL`·`toHaveCount`)만. `waitForTimeout`·고정 sleep·`networkidle` 금지.
- 조건부 `test.skip(...)`·`test.fixme()`·`test.describe.skip` 금지. 테스트를 주석으로 끄지 않는다 — 끌 이유가 있으면 멈추고 회수에 사유를 적는다(ac-trace 는 주석 안의 AC id 를 형식 오류로, skip 은 대응 아님으로 센다).

## 4. 실행

1. `python3 scripts/ac-trace.py` → exit 0 이 될 때까지 제목·누락을 고친다(종료 코드 뜻 = story-ac-write §5).
2. `scripts/e2e-run.sh` → 결과 줄과 exit 를 회수에 그대로 적는다. 실행 못 하면 사유를 그대로 적는다.
