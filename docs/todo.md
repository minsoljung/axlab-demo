# todo

갱신: 2026-11-25 · 상태 값: `todo` · `doing` · `done` · `blocked`
정본: 이 파일. 설계 정본: `docs/project-init.md`.

## 브랜치·형상관리·배포 규약 (2026-11-25 사용자 지시, 같은 날 개정)

- 원격: GitHub `minsoljung/axlab-demo`(public). 기본 브랜치 = `develop`.
- 보호 브랜치: `production` · `staging` · `develop` — 직접 push·강제 push·삭제 금지, PR 필수(승인 수 0, 관리자 포함). 서버가 거부한다.
- 🔴 **`staging`·`production` 은 당분간 사용하지 않는다**(사용자 지시). 승격 PR 을 만들지 않는다. 브랜치·보호 규칙은 그대로 둔다.
- 작업 흐름: `feature/<주제>` 에서 작업 → `develop` 으로 PR → 머지.
- 배포(Vercel, 프로젝트 `sol-7dc2/axlab-demo`): **Vercel 운영 브랜치 = `develop`** — `develop` 에 머지되면 운영 주소 https://axlab-demo.vercel.app 이 갱신된다. `feature/*` 브랜치·PR 은 미리보기 배포(Vercel 로그인 필요).
- DB: Supabase(PostgreSQL 만, 도쿄) 하나를 운영·미리보기가 공유한다. 로컬은 Docker PostgreSQL(`scripts/db-up.sh`). 운영 연결·환경변수 설정 = `scripts/deploy-setup.sh`.
- 커밋 메시지: `[<user.name>] <type>(<scope>): <설명>`. 신원은 `--local` 만(글로벌 gitconfig 수정 금지). 이 repo 의 user.name = `minsoljung`, 이메일 = GitHub noreply.
- 🔴 public repo — 비밀값·접속 문자열·개인 경로를 커밋하지 않는다. `.env*` 는 `.env.example`(이름만) 외 git 제외.

## 진행 방침 (사용자 지시 2026-11-25: 기획 → 디자인 → 개발 → 검증을 빠르게 한 바퀴 돈다)

- 목적 = 한 바퀴를 빨리 돌려 하네스·절차를 실물로 검증한다. 문서·하네스 완성도 다듬기가 아니다.
- 단계마다 checker 검수는 **1회**. 재검수는 Critical·진행을 막는 FAIL 이 있을 때만 한다. 나머지 지적은 목록으로 쌓고 다음 단계와 병행하거나 한 바퀴 뒤에 처리한다.
- 막는 것만 막는다: git 신원 미설정은 커밋을 막을 뿐 진행을 막지 않는다 — 파일로만 진행하고 커밋은 사용자 결정 뒤.
- 단계 순서·착수 조건: PRD(수정 중) → story·AC → 디자인 → 개발(TDD) → e2e. 앞 단계 산출이 있으면 바로 다음 maker 착수.
- 미룬 지적 목록은 아래 "이월 지적" 에 쌓는다.

## 이월 지적 (한 바퀴 뒤 처리)

| 출처 | 내용 |
|---|---|
| story Blocker 수정 후 | B-1~B-3 수정 완료(AC 73개). 디자인 명세 `docs/design/screens/SCR-05.md` 가 새 AC(008-17 의미 변경·008-19·008-20)·"(미정)" 문구 결정을 반영하지 않음 — 디자인 쪽 갱신 필요(Figma 에도 영향) |
| story 검수 이월 | T-1~T-12 (`docs/reviews/2026-11-25-stories-story-reviewer.md`). e2e 착수 전 합의 필요: T-4·T-5 테스트 주입 경로(지연·서버 오류·30분·8시간·코드 변경) · T-3 화면 문구 22종(디자인에서 확정, W-17 이 W-22 를 안 기다림) · T-2 `story-ac-write` §3 "좋음" 예시가 규칙 위반(하네스) · `ac-trace.py` 가 e2e/ 없을 때 exit 3+UNCHECKED 로 바뀌어 story-ac-write §5 표와 불일치(하네스) |
| 디자인 검수 이월 | E-1~E-17 (`docs/reviews/2026-11-25-design-design-reviewer.md`). Blocker B-1~B-5 는 수정 완료. 남음: SCR-07 통신사 입력 요소 종류(astryx 에 네이티브 select 없음, `Selector` combobox — e2e 는 `selectOption` 가정) · Figma 반영 필요(통신사 칩→토글 버튼 `aria-pressed`·SCR-05 미확인 진입·SCR-07 신규/수정 재진입) · 이탈 표는 SCR-01 만 재판정 · 색 외 선택 표시 미구현 |
| e2e 1차 실행(headed·slowMo 600, spec 001~004, 15:38~15:39, 1분 23초) | 26 통과 · 7 실패. (a) AC-004-4·5·6·7: astryx Field 오류 문구가 필드 + `role="alert"` 알림 영역에 이중 렌더 → `getByText` strict 위반(slowMo 로 드러남) → e2e-writer 가 로케이터 수정 중. (b) AC-001-1·002-1·002-2: 시드 이벤트 0건/null — developer 의 참고 e2e 와 같은 서버·DB 동시 사용 경합 의심, **미확정(조용한 상태 재실행 필요)** |
| e2e 2차 실행(headed·slowMo 600, spec 001~004, 조용한 상태, 1분 23초) | 32 통과 · 1 실패(AC-002-7). 1차 실패 7건 중 6건 해소(AC-004-4~7 이중 문구 = `visibleMessage` 헬퍼, AC-001-1·002-1·002-2 = 경합이었음 확인). 남은 1건: 실패 시점 DOM 이 정상 렌더 → `fail-next` 소비 문제 가설(상세 API 이중 호출) — developer 에 확인 요청, 미확정. 주의: `visibleMessage` 가 `role="alert"` 를 통째 제외하므로 astryx `Banner`(role=alert)로 그려지는 문구에는 부적합할 수 있음 — AC-001-6·002-7·003 빈 결과·005~008 오류 문구가 Banner 인지 확인 필요(관리자 e2e 실행 시) |
| develop 검수 이월 (Blocker 0 · `docs/reviews/2026-11-25-develop-develop-reviewer.md`) | E-1 관리자 세션이 프로세스 메모리(`src/lib/adminSession.ts`) — Vercel 서버리스 배포 전 필수 변경(DB 저장) · E-2 P-02 90일 파기 로직 없음(`purgeBaseDate` 는 수동 종료 때만 채워짐, 기간 만료 종료는 null) · E-3 M-01~03 지표 수집·집계·P-07 로그 파기 없음(스키마만, 연결 AC 0) · R-1: AC-007-4·008-17·008-19 는 전용 단위 테스트 없음(tdd 기록이 다른 AC 실행 결과를 빌려 적음) · 나머지 이월 6건은 리뷰 파일 |
| e2e 3차 실행(headed·slowMo 600, 전체 77건, 16:00~16:04, 4분 23초, Docker DB) | 76 통과 · 1 실패(AC-005-9). 실패 시점 DOM = 목록 정상 렌더, AC-002-7 과 같은 모양 → `fail-next`(1회성)가 목록 요청이 아닌 다른 요청에서 소비되는 의심. 이번엔 소스 수정 중이 아니었음(앞선 "dev 서버 재컴파일" 추정은 이 건엔 해당 없음). 조치: e2e-writer 가 오류 상태 테스트를 `page.route` 결정적 실패로 전환 + developer 가 요청 순서 조사. 가장 느린 테스트: AC-008-10 20.1s·AC-008-17 10.0s(90초 한도 안) |
| Vitest 파일 병렬 DB 경합 (정정) | 15:50 `axlab_demo_unit` 분리 후·e2e 없이도 `application.test.ts` AC-004-8 이 "ok 인데 count 0" 재발 → 앞선 "e2e 와의 경합" 단정은 틀렸을 가능성(최소한 유일 원인 아님). 가설: Vitest 파일 21개 병렬 + 공유 DB → 서로 테이블을 지움. developer 에 `fileParallelism: false` 적용·5회 반복 검증 요청 중. 미확정 |
| test-gate 동시 실행 (조치: DB 분리) | 15:5x e2e 실행(`reset` 이 `axlab_demo_test` 를 비움)과 Vitest 가 같은 DB 를 써서 "201 인데 행 0건" 실패 관측 → 단위 테스트 전용 DB `axlab_demo_unit` 생성, developer 에 `.env.unit`·vitest.config 전환 요청(e2e 는 `axlab_demo_test` 유지). 아래는 원 기록: Stop·SubagentStop 훅 `test-gate` 가 Vitest 를 돌릴 때 개발 에이전트도 같은 테스트 DB(`axlab_demo_test`)로 Vitest 를 돌리면 DB 경합(reset 이 상대 실행 중 데이터를 지움)으로 가짜 실패 가능. 15:3x 관측: `Entry_eventId_fkey` 위반이 reset+create 테스트에서 발생 — 경합인지 테스트 격리 문제인지 미확정. 단독 실행으로 재현 확인 필요 |
| 환경 변경 | pnpm→npm, Docker→brew PostgreSQL: `scripts/db-up.sh`·`e2e-run.sh`·`check-env.sh`·`docs/project-init.md` §2 의 Docker·pnpm 서술을 실제 환경에 맞게 정리 |
| 하네스 1차 검수 | Minor 12 중 진행을 막지 않는 것(수정 중인 `harness-engineer` 회수에서 확정) |
| PRD 2차 수정본 | 3차 재검수 미실시 — 선행 표 순환·주차 위반·IA 이동 대칭을 스크립트로 재확인하지 않음(손 추적). 개발 5주차 과밀(W-12·13·14·26 동시) 미검증. 89일 초과 이벤트의 지표 결손 처리 미정 |

## 하네스 (프로젝트 하네스 — 이 repo 안에서 자립)

| # | 작업 | 상태 | 비고 |
|---|---|---|---|
| H-1 | 공식 문서 규격 확인 (subagent·skill·hook) | done | 미확인: skill name/description 최대 길이, hook 문서 후반부 |
| H-2 | 자산 개발: agent 10 · skill 12 · hook 5 · script 4 (`harness-engineer`) | done | 31개 파일. 미검증: settings 배선 실동작·Docker/pnpm 경로·astryx CLI 형태 |
| H-3 | 개발 결과 검수 (`harness-reviewer`) | done | 1차 FAIL: Critical 0 · Major 5 · Minor 12. 산출 `docs/reviews/2026-11-25-harness-harness-reviewer.md` |
| H-4 | 검수 지적 수정 → 재검수 | done(수정 완료·재검수 생략 — 진행 방침) | 지적 Major 5·Minor 12 전건 처리(M-5 Prisma 7.10.1 고정). 새 훅 `_hooklib.py`·`checker-guard.py`, `ac-trace.py` JS 토큰화 파서·단계별 게이트(M-2 표는 `story-ac-write` §5·§6). 미검증: 훅 런타임 발화(`agent_type` 실림·`if` 제거 후 동작)·레지스트리·`prisma generate`. 사람 결정 2건: Prisma 메이저(7.10.1 기본 유지) · git pre-commit 훅(E-2 와 함께) |
| H-5 | `docs/project-init.md` §5 를 구현·프로젝트 자립 기준으로 동기화 | done | H-4 에서 함께 처리. §2 의 Docker·pnpm 서술은 이월 |
| H-6 | 사람 게이트: 하네스 승인 | todo | H-4 통과 후 |

## 환경

| # | 작업 | 상태 | 비고 |
|---|---|---|---|
| E-1 | `.gitignore` | done | |
| E-2 | git 신원(`--local`)·브랜치·remote + 첫 커밋 | done | GitHub public `minsoljung/axlab-demo`, 보호 브랜치 3·작업 브랜치 `feature/*`, 서버가 develop 직접 push 거부 확인, PR #1~#4 머지. 위 규약 절 참조 |
| E-3 | 기술 스택 스캐폴딩: Next.js + TypeScript + Prisma + Vitest + Playwright + **npm** | todo | 한 바퀴 방침으로 H-6 승인 전 착수. 패키지 매니저 pnpm→npm 변경(pnpm 은 내 가정이었고 머신에 없음) — `scripts/e2e-run.sh`·`check-env.sh` 등 pnpm 참조는 한 바퀴 뒤 정리(이월) |
| E-4 | 로컬 PostgreSQL | done | 사용자 결정 2026-11-25(2차): brew PostgreSQL 은 **삭제**(formula·데이터 디렉터리 80M·서비스 없음 확인), **Docker PostgreSQL 17** 로 전환. 컨테이너 `axlab-demo-pg`(`scripts/db-up.sh up|reset|down|status` — 두 번 실행해도 같은 결과 확인), `127.0.0.1:54329`, DB 3개(`axlab_demo`·`axlab_demo_test`·`axlab_demo_unit`) 마이그레이션 `20261125062850_init` 적용·테이블 각 8. `.env`·`.env.test`·`.env.unit` 의 URL 을 새 주소로 변경(git 제외 파일). Docker Desktop 4.99.0 은 사용자가 sudo 단계를 pane 에서 설치. 주의: Docker Desktop 앱이 켜져 있어야 DB 가 뜬다(재부팅 후 앱 실행 + `db-up.sh up`) · `e2e-run.sh`·`check-env.sh` 의 pnpm 서술은 이월 |
| E-5 | `.env.example` 작성 (값 없이 이름만) | todo | |

## 프로젝트 진행 (PRD → IA → WBS → 기획 → 디자인 → 개발 → 검증)

| # | 단계 | 상태 | 선행 |
|---|---|---|---|
| P-1 | PRD | done(3차 재검수 생략 — 진행 방침) | 2차 수정 반영 완료(개인정보·WBS·접근 통제). 미검증: 선행 표 순환·주차 위반 재계산, 가정값(유휴 30분·8시간 등) 사람 확정. 구 기록: | 1차 검수: FAIL 1(가정 표시 누락)·부분 4 → `prd-writer` 수정 완료 → 2차 검수(`docs/reviews/2026-11-25-prd-prd-reviewer-r2.md`): P-1~P-6 PASS · 개인정보 FAIL(P-07 월 집계가 M-02·M-03 재계산 불가)·부분 3 → `prd-writer` 수정 중 → 3차 재검수. 하네스 승인(H-6) 전 착수는 사용자 지시 |
| P-2 | IA | todo | P-1 |
| P-3 | WBS | todo | P-1 |
| P-4 | 기획: user story + AC (`AC-<story>-<n>`) | todo | P-2 |
| P-5 | 디자인: 피그마 + meta astryx | doing | 명세 `docs/design/` 완료 · Figma 완료(페이지 4·컴포넌트 16종·화면 프레임 37·변수 3컬렉션·텍스트 스타일 7·auto layout 전수 NONE 0 — 맵 `docs/design/figma-map.md`) · **파일 커버 설정은 API 미지원으로 실패 → 사용자 수동: 커버 프레임 6:449 우클릭 → Set as thumbnail** · 미비: Foundations 견본 비어 있음, 프레임 37개 중 6개만 시각 확인, 컴포넌트 시트 HUG 전환 후 미확인, SCR-05 새 AC 미반영 · `design-reviewer` 1회 검수 중(명세·맵만, Figma 실물 미검수) |
| P-6 | 개발: ATDD → TDD | todo | P-4, E-3 |
| P-7 | 검증: Playwright e2e, AC 전수 대응 | todo | P-6 |

## 열린 점

- 디자인 쌍의 도구 권한: 피그마를 MCP 로 읽을지 내보낸 이미지로 읽을지 미정
- PRD 에서 정할 것: 개인정보 항목·보관 기간 (현재 가정: 최소 항목, 종료 후 파기)
- 임의로 정한 값(로그인 없음·운영자 대행 등록·일정 약 7주)은 `docs/project-init.md` §4 참조
