---
name: design-review
description: "디자인 검수 체크리스트(checker 용) — astryx 이탈, 누락 화면·상태, 접근성 기본선(최소 항목 내장), AC 연결. astryx 규칙 정본은 astryx-ui. design-reviewer 가 preload. 매핑 절차가 아니다(= design-build). 제품 코드 검수가 아니다(= develop-review)."
---

# design-review

대상: `docs/design/astryx-inventory.md` · `docs/design/screens/*.md` · `docs/design/figma/*.png`. 기준: `docs/prd/ia.md` · `docs/stories/*.md` · astryx-ui.

| # | 축 | FAIL 조건 |
|---|---|---|
| D-1 | astryx 이탈 | 매핑 표의 컴포넌트·props·토큰이 인벤토리에 없음(python 집합 대조) · 이탈 표에 사유 없는 대체 · 인벤토리에 CLI 버전·측정 날짜 없음 |
| D-2 | 화면 누락 | IA 화면 ID(폐기 제외) 중 `screens/<ID>.md` 없음 |
| D-3 | 상태 누락 | 화면마다 `기본`·`빈 목록`·`로딩`·`오류` 중 빈 칸 · 폼 화면에 `입력 오류`·`제출 중`·`제출 완료` 빈 칸 · `해당 없음` 에 사유 없음 |
| D-4 | 접근성 기본선 | 아래 A-1~A-6 중 하나라도 위반 |
| D-5 | AC 연결 | 화면 `화면:` 이 그 ID 인 story 의 AC 중 AC 연결 표에 없는 것 · 문구가 AC 결과와 다름 |

## 접근성 기본선 (D-4)

- A-1 모든 입력·버튼·링크에 보이는 이름 또는 레이블이 있다.
- A-2 폼 오류는 텍스트로 보이고 해당 필드 옆에 있다. 색만으로 알리지 않는다.
- A-3 텍스트 대비 4.5:1 이상(큰 텍스트 3:1). 토큰 값을 모르면 미검사로 적는다.
- A-4 상태(선택·비활성·오류)를 색 하나로만 구분하지 않는다.
- A-5 의미 있는 이미지에 대체 텍스트 문구가 정의돼 있다.
- A-6 키보드 포커스 순서가 화면 읽기 순서와 같고 포커스 표시가 있다.

- 각 축은 PASS/FAIL/미검사. 피그마 이미지로 확인 못 한 항목은 미검사 + 사유.
