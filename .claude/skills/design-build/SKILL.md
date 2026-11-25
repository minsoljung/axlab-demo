---
name: design-build
description: "피그마 → astryx 매핑 절차(maker 용) — 인벤토리 확인, 화면별 컴포넌트 매핑 표, 상태(기본·빈 목록·로딩·오류) 빠짐없이 적는 순서, AC 연결. design-builder 가 preload. 디자인 검수가 아니다(= design-review). astryx 규칙 자체는 astryx-ui 가 정본."
---

# design-build

## 1. 입력·산출

- 입력: `docs/prd/ia.md`(화면 ID) · `docs/stories/*.md`(AC) · 피그마. 피그마는 `docs/design/figma/<화면 ID>-<상태>.png` 로 내보낸 이미지를 Read 로 본다. 이미지가 없으면 그 화면은 정지·보고.
- 산출: `docs/design/astryx-inventory.md`(astryx-ui §1) · `docs/design/screens/<화면 ID>.md`. 다른 경로에 쓰지 않는다. 제품 코드(`src/`)는 쓰지 않는다.

## 2. 순서

1. 인벤토리를 만들거나 갱신한다(astryx-ui §1 명령). 실패하면 정지.
2. IA 의 화면 ID 마다 `screens/<화면 ID>.md` 를 하나씩 만든다(폐기 화면 제외).
3. 각 파일에 아래 표를 이 순서로 채운다.

| 표 | 열 |
|---|---|
| 매핑 | 영역 · astryx 컴포넌트 · props · 사용 토큰 · 피그마 이미지 |
| 상태 | `기본` · `빈 목록` · `로딩` · `오류` — 각각 보이는 요소와 문구. 해당 없음이면 `해당 없음(사유)` |
| 폼 상태 | 폼이 있는 화면만: `입력 오류` · `제출 중` · `제출 완료` |
| AC 연결 | AC id · 그 AC 를 판정하는 화면 요소(문구·역할·레이블) |
| 이탈 | astryx 에 없는 요소 · 대신 쓴 것 · 사유 |

4. 상태 칸을 비워 두지 않는다 — 비우면 검수가 "없음"과 "안 봄"을 구분하지 못한다.
5. 문구는 AC 문장의 관찰 결과와 글자 그대로 맞춘다(e2e 가 그 문구로 판정한다).
