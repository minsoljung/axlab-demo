# develop-review — 슬라이스 1·2 (S-01~S-08) — develop-reviewer

- 날짜: 2026-11-25 (`date +%F`) · 검수 1회 · 기준 = develop-review R-1~R-5 + supabase-pg-only
- 대상 파일과 수정 시각(mtime, 2026-11-25 KST 기준)

| 묶음 | 파일 수 | 가장 이른 시각 | 가장 늦은 시각 |
|---|---|---|---|
| src/ (src/generated 제외) | 73 | 15:27:12 `src/astryx-themes.js` | 15:57:56 `src/components/AdminEventList.tsx` |
| prisma/ | 4 | 15:28:48 `schema.prisma` | 15:34:48 `seed.ts` |
| docs/tdd/ | 82 (AC 73 + TH 8 + test-hooks.md) | 15:37:36 `AC-001-1` | 15:59:41 `AC-002-7` |
| 루트 | prisma.config.ts 15:28:48 · next.config.ts 15:29:13 · scripts/start-test.mjs 15:34:48 · package.json·package-lock.json 15:35:50 · vitest.config.ts 15:39:19 | | |

## 판정표

| 축 | 판정 | 근거 요약 |
|---|---|---|
| R-1 테스트 먼저 | FAIL(3건) + 나머지 70건 미확인(기록만 있음) | AC-007-4·008-17·008-19 는 기록의 test 파일에 AC id 없음 |
| R-2 AC 밖 구현 | PASS(이월 2) | route 23개 전부 AC 또는 테스트 훅 계약에 연결. 지표 모델 5개는 AC 없음(PRD W-15·W-26 근거) |
| R-3 Supabase PG 만 | PASS(이월 1) | 훅 exit 2 = 0/187 · python 전수 0 · FORBIDDEN 0 |
| R-4 비밀값 | PASS | 훅 exit 2 = .env 3개(이름 규칙)뿐 · 테스트 훅 production 404 실측 |
| R-5 실행 | PASS | vitest exit 0(21 파일·179 통과) · tsc exit 0 · build exit 0 |

**Blocker 0건 · 이월 9건**

## R-1 테스트 먼저 — FAIL(3) / 미확인(70)
- 근거: python 으로 stories AC 73 ↔ docs/tdd `*-AC-*.md` 73 대조 → 빠짐 0 · 남는 것 0. 각 기록의 `test:` 파일 본문에서 AC id 를 셈(`AC-005-7·8·9` 같은 줄임 표기 풀어서).
  - AC id 가 그 기록의 test 파일 어디에도 없는 것 = 3: `AC-007-4`(adminEvents.test.ts) · `AC-008-17`(AdminEventForm.test.tsx) · `AC-008-19`(adminEvents.test.ts). src 전체 단위 테스트가 덮는 AC = 71/73 → 같은 3건이 단위 테스트 0(AC-007-4 는 다른 파일에도 없음). 기록 비고가 *"전용 단위 테스트 없음(e2e 가 판정)"* 이라 스스로 적었는데도 `red:` 줄은 다른 AC 의 실행(R2·R6)을 빌려 적었다 → **기록과 테스트 파일 모순**.
  - 덜 심한 불일치 10쌍(기록이 든 test 파일 중 일부에 AC id 없음, 다른 파일엔 있음): AC-005-3↔format.test.ts · AC-008-2·9·10·11·12·13·14↔kst.test.ts · AC-008-9↔admin.test.ts · AC-008-15↔adminGuard.test.ts.
  - 잡혀야 정상인 값: e2e/ 안의 AC id = 73/73(같은 파서).
- red 사유: import·문법 오류 0. 슬라이스 1(001~004) 은 AC 마다 개별 실패 문구. 슬라이스 2(005~008, 47건)는 묶음 실행 6종(예: "23건 실패: expected 501 …" 이 22개 기록에 공용) — 어느 실패가 어느 AC 인지 기록으로 구분 불가.
- 기록 수치 검산: 기록의 green 건수(kst+session 10 · adminEvents 17 · api/admin 23 · adminGuard 4 · Admin* 28 · format 1) = 실제 파일의 `it/test` 수와 전부 일치, 합계 179 = 실제 실행 179.
- TH-counts 의 red 사유 = `PrismaClientKnownRequestError`(기대값 불일치가 아닌 DB 오류). AC 가 아니라 판정 밖, 기록만 남김.
- 반증: 3건은 단위 red→green 증거가 없다. 위험 = "TDD 로 만들었다"는 기록이 사람 게이트에서 그대로 믿기는 것. 동작 자체는 e2e(73/73 id 대응)가 판정하므로 AC 위반은 아님 → 이월.

## R-2 AC 밖 구현 — PASS
- route 23(`next build` 출력 실측): 화면 8(SCR-01~07 + 완료) · 공개 API 3 · 관리자 API 4(session POST/DELETE = AC-008 확인·로그아웃, events GET/POST = AC-005·007-1, [id] PATCH = AC-006, close = AC-007) · 테스트 훅 7(`docs/tdd/test-hooks.md` 계약, story T-4·T-5 주입 경로).
- exported 함수: 앱에서 안 쓰는 export = 타입·테스트 헬퍼·상수뿐(`IDLE_MS`·`clearSessions`·`normalizePhone` 등 — 테스트에서 사용). 제외 범위(결제·회원가입·경품·다국어) 구현 0.
- 응모 정보: `Entry` = name·phone·consentAt·createdAt(+id·eventId) — P-01 과 일치. 방문자 ID 필드 없음. `MetricEvent` 에 응모 식별자·이름·번호 필드 없음·외래키 없음 → P-07 비연결 PASS(`prisma/schema.prisma:40-64`). 클라이언트 `localStorage`·방문자 ID 코드 0.
- 반증: AC 없는 기능이 있으면 e2e·AC 추적에 안 잡히고 검수 없이 남는다 → route 전수와 export 전수로 확인, 없음.

## R-3 Supabase PG 만 — PASS
- (a) 훅 `block-supabase-extras.py` 에 파일 187개(src·prisma·scripts·docs/tdd·e2e·루트 설정·lockfile·.env*, src/generated·node_modules 제외)를 Write 입력으로: exit 0 = 187 · exit 2 = 0. 잡혀야 정상인 값: `src/x.ts` 에 `@supabase/supabase-js` → exit 2.
- (b) python 전수: `@supabase/` 0 · `.supabase.co` 0 · `SUPABASE_` 2 = `scripts/check-env.sh:5,45`(금지 규칙 설명 문장 — 문맥 확인). 같은 집합에서 `prisma` 포함 파일 27(측정 정상).
- `scripts/check-env.sh` exit 0 · FORBIDDEN 0.
- `schema.prisma` datasource 에 `url`·`directUrl` 없음(:4-11) · generator `output` 있음 · `prisma.config.ts` = `env("DIRECT_URL")` · `src/lib/db.ts` = PrismaPg + `DATABASE_URL`.
- 버전: lockfile 실설치 prisma·@prisma/client·@prisma/adapter-pg = 7.10.1(package-lock.json:2226·2238·6330). package.json 표기는 `^7.10.1` → 이월 D-1. rc·latest 표기 아님.
- `src/generated/` .gitignore 등재(2회 중복).

## R-4 비밀값 — PASS
- 훅 `block-secrets.py` 에 같은 187개: exit 0 = 184 · exit 2 = 3(`.env`·`.env.test`·`.env.unit` — 파일 이름 규칙으로 막힘, git 제외 로컬 파일). 이 3개는 값을 출력하지 않고 따로 확인: DB URL 호스트 전부 localhost. 잡혀야 정상인 값: `sk-…` 문자열 → exit 2.
- `test-admin-code` 위치: `.env.test:4`·`.env.unit:4`(git 제외) · `playwright.config.ts:27` · `e2e/fixtures/routes.ts:2`. src/ 0건. 운영 코드는 `ADMIN_ACCESS_CODE` 만 읽음(`src/lib/adminCode.ts:5`), 미설정이면 확인 항상 실패(`adminAuth.ts:24`).
- `/api/test/*` 7개를 tsx 로 직접 호출(exit 0): `NODE_ENV=production APP_TEST_MODE=1` → 7개 전부 404 · `production`+APP_TEST_MODE 빈 값 → 404 · `development`+미설정 → 404. 잡혀야 정상인 값: `development`+`APP_TEST_MODE=1` → 200(4개). 근거 `src/lib/testHooks.ts:5-7`. 일반 API 의 `applyHooks` 도 같은 가드(:30). build 산출에 test route 는 들어가지만 runtime 404.
- 접근 코드 비교 = sha256 양쪽 + `timingSafeEqual`(`adminAuth.ts:21-26`) — 길이·타이밍 누출 없음. 쿠키 = `HttpOnly; SameSite=Lax; Path=/`, production 에서 `Secure`, Max-Age 없음(브라우저 종료 = A-16)(`adminAuth.ts:17-19`).
- 반증: 테스트 훅이 운영에서 살아 있으면 누구나 DB 초기화·시계 조작·접근 코드 교체가 된다 → 운영 조건 2종을 실제 호출해 404 확인.

## R-5 실행 — PASS
- `npx vitest run`(DB `axlab_demo_unit`, `scripts/db-up.sh status` = running) 1회: Test Files 21 passed · Tests 179 passed · exit 0. 재실행 불필요.
- `npx tsc --noEmit` exit 0 · `npm run build` exit 0(route 23).
- Playwright 미실행(지시: 진행자가 3100 에서 실행 중).
- 참고: skill 표기는 `pnpm exec` 이나 프로젝트는 npm 전환(todo E-3) — npx 로 실행.

## 미검사·한계
- R-1 70건 = 기록만으로 확인(재현에는 코드 되돌리기 필요 — checker 수정 금지).
- e2e 결과 = 이 검수 밖(진행자 실행 중).
- 화면 문구·디자인 명세 대조는 develop-review 축 밖이라 하지 않음.

## Blocker

없음(0건). 판정 근거: 아래 이월 중 무거운 것(E-1 메모리 세션·E-2 파기 미구현)은 **이번 한 바퀴(로컬 e2e 까지, 배포 항목 없음 — wbs·todo 확인)** 를 막지 않고, 보안상 fail-closed(세션을 못 찾으면 401·SCR-05)라 노출이 없으며, 파기는 PRD 상 별도 WBS(W-16·W-20)이고 story 004 가 구현 W-16·W-26 으로 미뤄 둠(`docs/stories/004-event-apply.md:27`). 한 바퀴 범위에 운영 배포가 들어가면 E-1·E-2 는 Blocker 로 올린다.

## 이월 (9)

| # | 분류 | 내용 | 근거 |
|---|---|---|---|
| E-1 | 배포 게이트 | 관리자 세션이 프로세스 메모리(`globalThis` Map). Vercel 서버리스는 인스턴스가 여럿·수시 재시작 → 로그인 직후 다른 인스턴스에서 401, AC-008 세션 유지(유휴 30분·절대 8시간)가 운영에서 깨진다. 코드 주석이 "단일 서버 인스턴스 가정(시연용)"이라 적었으나 PRD P-06(운영 Vercel)에 없는 가정. fail-closed 라 보안 노출은 없음 | `src/lib/adminSession.ts:5,11-12` |
| E-2 | 배포 게이트 | 응모 개인정보 90일 파기(P-02) 실행 로직 없음. `purgeBaseDate` 는 수동 종료 때만 채움(`adminEvents.ts:91-92`), 기간 만료 종료는 null — 만료 후 종료 예정일 수정이 막혀 있어(`adminEvents.ts:56-58`) `coalesce(purgeBaseDate, endsAt)` 로 같은 값이 나오지만 W-16 구현 때 이 규칙을 명시해야 함 | prd P-02 · wbs W-16·W-20 |
| E-3 | PRD 범위 | 지표 수집(M-01~03, W-15)·집계(W-26)·원시 로그 파기(P-07) 미구현. 스키마 5모델만 있음(AC 0개 연결). 73 AC 에 지표 AC 가 없어 이번 슬라이스 완료 기준은 안 막음. PRD 목표 3지표는 측정 불가 상태 | `schema.prisma:33-38,57-95` · wbs W-15·W-26 |
| E-4 | R-1 | AC-007-4·008-17·008-19 단위 테스트·개별 red 없음인데 기록이 다른 AC 의 red 를 빌려 적음. 기록을 "단위 없음 — e2e 판정"으로 고치거나 단위 테스트에 AC id 추가 | 위 R-1 |
| E-5 | R-1 | 슬라이스 2 red 증거가 묶음 실행 6종 — AC 별 실패 구분 불가 · 기록 test 파일과 실제 AC id 불일치 10쌍 | 위 R-1 |
| E-6 | 보안 | 접근 코드 시도 횟수 제한 없음(무차별 대입). PRD·AC 에 요구 없음 | `src/app/api/admin/session/route.ts:6-9` |
| E-7 | 검증 | 등록 시 시작일 > 종료 예정일·과거 종료 예정일 검사 없음(수정에만 과거 검사). AC 에 없음 — 바로 종료 상태 이벤트가 만들어질 수 있음 | `adminEvents.ts:26-36`, `adminEvents-shared.ts:17` |
| E-8 | 가정 | 휴대전화번호 규칙(하이픈·공백 제거, 숫자 9~11자리)은 AC 밖 가정(AC-004-5 는 "abc" 만 정함). 코드에 가정 표시는 있음 | `application-shared.ts:12-16` |
| D-1 | R-3 | package.json Prisma 3종이 `^7.10.1`(supabase-pg-only §1 은 7.10.1 고정). 캐럿이라 8.x rc 는 안 깔리지만 7.x 상위로 오를 수 있음. 실설치는 7.10.1 | `package.json` |

리뷰 파일: `/Users/emotion/axlab/workspace/axlab-demo/docs/reviews/2026-11-25-develop-develop-reviewer.md`
