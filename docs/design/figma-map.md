# figma-map

fileKey `6kBDpcYZuJK0R1TlOWJG1z`

## 페이지

| 페이지 ID | 이름 |
|---|---|
| 0:1 | Cover |
| 2:2 | Foundations (변수·스타일은 파일 단위 — 페이지는 비어 있음) |
| 2:3 | Components |
| 2:4 | Screens |

## 컴포넌트 (Components 페이지, 전부 auto layout)

| 이름 | node ID | 종류 | variant 속성 |
|---|---|---|---|
| Button | 3:16 | SET (6) | Type=Primary/Secondary, State=Default/Hover/Disabled · 텍스트 레이어 `Label` |
| Chip | 3:21 | SET (2) | Selected=False/True · `Label`. **Figma 갱신 필요**: 통신사 필터는 토글 버튼 3개로 확정(SCR-01 명세, 2026-11-25) — Chip 을 토글 버튼(`button` + `aria-pressed`)으로 보고 Selected=True 에 색 외 표시(체크 아이콘 또는 굵은 테두리)를 추가하고 묶음 이름 "통신사 필터"를 표기. 이 도구는 Figma 파일을 수정하지 않음 |
| Badge | 3:26 | SET (2) | Kind=Active/Closed · `Label` |
| Link | 3:27 | COMPONENT | `Label` |
| Alert | 3:33 | SET (2) | Kind=Error/Info · `Message` |
| Loading | 3:34 | COMPONENT | `Label` |
| EmptyState | 3:37 | COMPONENT | `Label` |
| HelperText | 3:43 | SET (2) | Kind=Help/Error · `Message` |
| Input | 4:17 | SET (3) | State=Default/Error/Disabled · `Label` `Value` `Message`(Default 에서 숨김) |
| Textarea | 4:28 | SET (2) | State=Default/Error |
| Select | 4:47 | SET (3) | State=Default/Error/Disabled |
| Checkbox | 4:58 | SET (3) | State=Unchecked/Checked/Error · `Label` |
| Card | 4:75 | SET (2) | Status=Active/Closed · `Title` `Carrier` `Period` |
| TableHeader | 4:76 | COMPONENT | |
| TableRow | 4:115 | SET (2) | Status=Active/Closed · `Title` `Carrier` `EndDate` |
| Dialog | 4:116 | COMPONENT | `Title` + 취소/확인 Button 인스턴스 |

## 화면 (Screens 페이지, Section 단위, 프레임 1440 폭 세로 auto layout)

| 화면 | Section ID | 상태 : 프레임 node ID |
|---|---|---|
| SCR-01 | 5:2 | 기본 5:3 · 로딩 5:37 · 빈 목록 5:50 · 필터 결과 없음 5:62 · 오류 5:74 |
| SCR-02 | 5:86 | 기본(진행 중) 5:87 · 종료 5:100 · 로딩 5:115 · 오류 5:120 · 없는 이벤트 5:126 |
| SCR-03 | 5:132 | 기본 5:133 · 입력 오류(이름·번호·동의) 5:155 · 입력 오류(중복 응모) 5:180 · 제출 중 5:203 · 오류(제출 실패) 5:226 · 종료된 이벤트 5:251 · 로딩 5:258 · 없는 이벤트 5:263 · 이벤트 정보 오류 5:269 |
| SCR-04 | 5:275 | 기본(완료) 5:276 |
| SCR-05 | 5:285 | 기본 5:286 · 코드 불일치 5:296 · 이동해 온 상태 5:306 · 확인 중 5:318 |
| SCR-06 | 5:807 | 기본 5:808 · 빈 목록 5:873 · 로딩 5:885 · 오류 5:898 · 종료 확인 5:910 |
| SCR-07 | 5:983 | 신규 5:984 · 수정(진행 중) 5:1019 · 종료된 이벤트 수정 5:1054 · 로딩 5:1089 · 오류(저장 실패) 5:1094 · 입력 오류(신규) 5:1131 · 입력 오류(종료 예정일) 5:1166 · 저장 중 5:1201 |

프레임 이름 = `SCR-xx / <상태>`

## 변수·스타일

| 종류 | 이름 | 내용 |
|---|---|---|
| 변수 컬렉션 | Color (VariableCollectionId:2:5) | 21개 `color/text|bg|accent|danger|info|neutral|border/...` |
| 변수 컬렉션 | Spacing (VariableCollectionId:2:25) | `space/4,8,12,16,24,32,48` |
| 변수 컬렉션 | Radius (VariableCollectionId:2:33) | `radius/sm,md,lg,full` |
| 텍스트 스타일 (Noto Sans KR) | title/lg, title/md, title/sm, body/md, body/sm, label/md, label/sm | |

## 커버

| 프레임 | node ID | 파일 썸네일 |
|---|---|---|
| Cover 1920x960 (Cover 페이지) | 6:449 | 미설정 — 수동 필요 (우클릭 → Set as thumbnail) |
