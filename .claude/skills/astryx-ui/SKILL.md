---
name: astryx-ui
description: "meta astryx 디자인시스템 사용 규칙(공용) — 컴포넌트·토큰 인벤토리 위치와 확인 명령, 써야 하는 것과 쓰면 안 되는 패턴. design-builder·design-reviewer·developer 가 preload. 화면별 매핑 절차가 아니다(= design-build). 디자인 검수 체크리스트가 아니다(= design-review)."
---

# astryx-ui — astryx 사용 규칙

## 1. 정본

- 패키지: `@astryxdesign/core`(컴포넌트·테마 시스템) · `@astryxdesign/theme-<name>`(테마 하나) · `@astryxdesign/cli`(dev). peer = `react`·`react-dom`·`@stylexjs/stylex`.
- 컴포넌트·props·토큰 이름의 정본 = **astryx CLI 출력**이다. 기억·추측으로 쓰지 않는다.
  - 목록: `pnpm exec astryx component --list`
  - 문서: `pnpm exec astryx docs`
- 인벤토리 파일 `docs/design/astryx-inventory.md` — 위 출력에서 이 프로젝트가 쓰는 컴포넌트·props·테마 custom property 이름과 테마 이름, CLI 버전, 측정 날짜를 적는다. 작성 = design-builder.
- CLI 가 없거나 실패하면 인벤토리를 지어내지 말고 정지·보고한다.

## 2. MUST

- 화면 요소는 인벤토리의 astryx 컴포넌트로 먼저 만든다.
- 색·간격·글꼴·반경·그림자는 테마 CSS custom property 로만 지정한다.
- 테마 변경은 theme custom property override 로 한다.
- astryx 에 없는 요소는 `docs/design/screens/<화면 ID>.md` 의 이탈 표에 사유와 함께 적는다.

## 3. NEVER

- 인벤토리에 없는 컴포넌트 이름·props 사용.
- 컴포넌트 소스 복제·감싸기로 모양 바꾸기. `swizzle` 은 이탈 표에 사유를 적은 뒤에만.
- 색 리터럴(`#fff`·`rgb(...)`·`hsl(...)`)과 px 고정 간격을 제품 코드 스타일에 직접 쓰기.
- astryx 와 같은 역할의 다른 UI 라이브러리 추가.
