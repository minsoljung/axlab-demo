# astryx 인벤토리

- 측정 날짜: 2026-11-25 (2차 — 설치된 패키지에서 채움)
- CLI 버전: 0.7.17 (`npx --no-install astryx --version` → `0.7.17`, exit 0)
- 컴포넌트 목록: `npx --no-install astryx component --list` → "Components (174)", exit 0. props 는 `npx --no-install astryx component <이름> --props` 출력 그대로(exit 0).
- 테마 이름: `neutral` — 패키지 `@astryxdesign/theme-neutral` 0.7.17 (근거: `node_modules/@astryxdesign/theme-neutral/package.json` displayName "Neutral Theme", `src/astryx-themes.js` 의 `defaultThemeSlug = "neutral"`)
- 설치 버전 근거: `package.json` dependencies `@astryxdesign/core ^0.7.17`·`@astryxdesign/theme-neutral ^0.7.17`·devDependencies `@astryxdesign/cli ^0.7.17`, `node_modules/@astryxdesign/{core,theme-neutral,cli}/package.json` version 0.7.17.
- 규칙: `확정` = 위 CLI 출력 또는 설치된 파일에서 직접 본 것. 못 본 것은 `[미확인]`. 컴포넌트는 이름별 deep import(`import { X } from '@astryxdesign/core/<X>'`)이며 `component --list` 의 `import:` 줄이 정본이다.
- 이 파일의 `C-nn`·`T-nn` ID 는 `screens/*.md` 가 참조한다(ID 불변).

## A. 패키지

| ID | 이름 | 상태 | 출처 |
|---|---|---|---|
| PK-01 | `@astryxdesign/core` 0.7.17 | 확정 | node_modules/@astryxdesign/core/package.json |
| PK-02 | `@astryxdesign/theme-neutral` 0.7.17 | 확정 | node_modules/@astryxdesign/theme-neutral/package.json |
| PK-03 | `@astryxdesign/cli` 0.7.17 | 확정 | node_modules/@astryxdesign/cli/package.json |
| PK-04 | `react` | 확정 | package.json dependencies |
| PK-05 | `react-dom` | 확정 | package.json dependencies |
| PK-06 | `@stylexjs/stylex` | 확정 | package.json dependencies |

## B. 컴포넌트 (역할 → astryx 이름)

props 는 화면이 쓰는 것만 적었다(전체 = `astryx component <이름> --props`). `(필수)` = CLI 출력의 required.

| ID | 역할 | astryx 컴포넌트 | props(화면이 쓰는 것) | 상태 | 쓰는 화면 |
|---|---|---|---|---|---|
| C-01 | 제목·본문 텍스트 | `Heading`(`@astryxdesign/core/Heading`) · `Text`(`.../Text`) | Heading: `level`(필수) `children`(필수) · Text: `type`(body/large/label/supporting…) `color` `weight` `as` | 확정 | 전체 |
| C-02 | 버튼 | `Button`(`.../Button`) | `label`(필수) `variant`(primary/secondary/ghost/destructive) `type`(button/submit/reset) `isDisabled` `isLoading` `onClick` `href` | 확정 | 전체 |
| C-03 | 한 줄 텍스트 입력 | `TextInput`(`.../TextInput`) | `label`(필수) `value`(필수) `onChange` `type`(text/password/email/search/tel/url) `isDisabled` `status`({type:'error', message}) `isLoading` `htmlName` | 확정 | SCR-03, 05, 07 |
| C-04 | 체크박스 | `CheckboxInput`(`.../CheckboxInput`) | `label`(필수) `value`(필수, boolean) `onChange` `isDisabled` `status`({type:'error', message}) | 확정 | SCR-03 |
| C-05 | 통신사 필터(토글 버튼 3개 — 선택 입력 아님) | `ToggleButtonGroup` + `ToggleButton`(`.../ToggleButton` 한 모듈) | Group: `label`(필수 — 그룹 접근 가능한 이름) `type`('single') `value`(필수) `onChange`(필수) · Button: `label`(필수 — 접근 가능한 이름) `value` `icon` `pressedIcon`(선택됨일 때 아이콘) | 확정 | SCR-01 |
| C-06 | 날짜 입력 | `DateInput`(`.../DateInput`) | `label`(필수) `value`(YYYY-MM-DD) `onChange` `isDisabled` `disabledMessage` `min` `max` `status` | 확정 | SCR-07 |
| C-07 | 여러 줄 텍스트 입력 | `TextArea`(`.../TextArea`) | `label`(필수) `value`(필수) `onChange` `rows` `status` `isDisabled` | 확정 | SCR-07 |
| C-08 | 목록 | `List` + `ListItem`(`.../List`) | List: `children` `hasDividers` · ListItem: `label`(필수) `description` `endContent` `href` | 확정 | SCR-01 |
| C-09 | 표 | `Table`(`.../Table`) | `data` `columns`({key, header, renderCell}) `idKey` `emptyState`. 행 클릭 prop 없음 — 행 안에 Link/Button 을 둔다 | 확정 | SCR-06 |
| C-10 | 배지(상태 표시) | `Badge`(`.../Badge`) | `label`(필수) `variant` | 확정 | SCR-01, 02, 06 |
| C-11 | 로딩 표시 | `Spinner`(`.../Spinner`) | `label` `aria-label` `size` | 확정 | SCR-01, 02, 03, 06 |
| C-12 | 알림·오류 메시지 | `Banner`(`.../Banner`) | `status`(필수: info/warning/error/success) `title`(필수) `description` `collapsible`(false 로 펼침 고정) | 확정 | 전체 |
| C-13 | 폼 필드 묶음(레이블·도움말·오류문구) | `Field`(`.../Field`). 단 C-03·04·06·07 은 자체 `label`·`description`·`status` 를 가져 보통 `Field` 불필요 | `label`(필수) `inputID`(필수) `children`(필수) `description` `status`({type, message}) | 확정 | SCR-03, 05, 07 |
| C-14 | 확인 대화상자 | `AlertDialog`(`.../AlertDialog`) | `isOpen`(필수) `onOpenChange`(필수) `title`(필수 — aria-labelledby) `description`(필수) `actionLabel`(필수) `onAction`(필수) `cancelLabel`(기본 'Cancel' — 한국어로 지정 필요) `actionVariant` `isActionLoading` | 확정 | SCR-06 |
| C-15 | 링크·이동 | `Link`(`.../Link`) | `href` `children`(필수) `onClick` `isDisabled`. 링크처럼 보이는 버튼 = `Button` 의 `href` | 확정 | 전체 |
| C-16 | 레이아웃(컨테이너·간격 묶음) | `VStack`·`HStack`(`.../VStack`·`.../HStack`) | `gap`(0·0.5·1·1.5·2·3·4·5·6·8·10) `padding` `hAlign` `vAlign` `wrap` `as` | 확정 | 전체 |
| C-17 | 빈 상태 표시 | `EmptyState`(`.../EmptyState`) | `title`(필수) `description` `headingLevel`(기본 3) | 확정 | SCR-01, 06 |
| C-18 | 통신사 단일 선택(SCR-07 폼, 드롭다운) | 후보 `Selector`(`.../Selector`) — CLI 에 존재. 네이티브 `<select>` 컴포넌트는 `--list` 에 없음 | `label`(필수) `options`(필수) `value` `onChange` `placeholder` `htmlName` | [미확인] 요소 종류 미결 — 현 e2e(`e2e/fixtures/helpers.ts:75`, `006-admin-event-edit.spec.ts:22`)는 네이티브 select(`selectOption`, `HTMLSelectElement`)를 가정. Selector 는 combobox 라 로케이터 불일치 가능 | SCR-07 |

## C. 테마 custom property

근거: `node_modules/@astryxdesign/core/dist/astryx.css`(301개 선언) · `node_modules/@astryxdesign/theme-neutral/dist/theme.css`(199개 선언)에서 이름을 직접 확인(python 정규식으로 `--이름:` 선언을 셈). 값 자체(색 hex 등)는 확인 대상이 아니다.

| ID | 역할 | custom property 이름 | 상태 |
|---|---|---|---|
| T-01 | 색 | 글자 `--color-text-primary` `--color-text-disabled` `--color-text-error` `--color-text-accent` · 배경 `--color-background-body` `--color-background-muted` `--color-background-card` · 오류 `--color-error` `--color-error-muted` · 강조 `--color-accent` `--color-accent-muted` · 테두리 `--color-border` `--color-border-error` `--color-border-emphasized` | 확정 |
| T-02 | 간격 | `--spacing-0` `--spacing-0-5` `--spacing-1` … `--spacing-12` (core astryx.css 에서 `--spacing-4` 확인. theme.css 에는 없음) | 확정 |
| T-03 | 글꼴(크기·굵기·종류) | `--font-size-2xs`…`--font-size-5xl`(`--font-size-base` 포함) · `--font-weight-normal` `--font-weight-medium` `--font-weight-semibold` `--font-weight-bold` · `--font-family-body` `--font-family-heading` | 확정 |
| T-04 | 반경 | `--radius-element` `--radius-container` `--radius-inner` `--radius-page` `--radius-full` `--radius-none` | 확정 |
| T-05 | 그림자 | `--shadow-low` `--shadow-med` `--shadow-high` `--shadow-inset-selected` `--shadow-inset-error` | 확정 |

## D. 남은 일

- C-18: SCR-07 통신사 선택 요소 종류 결정(Selector 로 갈지, 네이티브 select 를 이탈로 둘지) — 기획·개발 결정, design-builder 가 정하지 않았다.
- 통신사 필터(C-05)의 "색 외 선택 표시"는 `ToggleButton` 의 `pressedIcon`(체크 아이콘)으로 만들 수 있다 — 기본 렌더가 배경색만 바꾸는지는 `ToggleButton.tsx` 에 `pressedStyles.background` 만 보인다(근거: `node_modules/@astryxdesign/core/src/ToggleButton/ToggleButton.tsx`). 렌더 결과의 비색상 표시 여부는 [미검증].
