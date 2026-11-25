# 마케팅 허브 웹 프로젝트

> 상태: draft · demo 프로젝트다. 원문에 없던 항목은 임의로 정한 **가정값**이고 `(가정)`으로 표시했다. 실제 착수 때 바꿔도 된다.

## 1. 프로젝트 설명

- 통신사의 LLM 서비스 홍보 및 이벤트를 진행하는 채널
- 모든 통신사의 이벤트를 **한 페이지(허브)** 에서 수행

### 1-1. 목표 · 범위

| 구분 | 내용 |
|---|---|
| 목표 | 통신사별 LLM 서비스 홍보·이벤트를 한 곳에서 노출하고 참여를 받는다 |
| 포함 범위 (가정) | 이벤트 목록·상세, 통신사별 필터, 이벤트 응모, 운영자용 이벤트 등록·수정·종료 |
| 제외 범위 (가정) | 결제, 회원 가입·로그인, 경품 발송 연동, 다국어 |
| 성공 지표 (가정) | 월 방문자 수, 이벤트당 응모 전환율(상세 조회 대비 응모 완료), 응모 완료까지 걸리는 시간 |

### 1-2. 사용자 · 이해관계자

| 구분 | 설명 |
|---|---|
| 방문자(일반 사용자) | 이벤트를 보고 응모하는 사람. 로그인 없이 쓴다 (가정) |
| 운영 관리자 | 모든 통신사 이벤트를 대행 등록·관리하는 사람 (가정: 통신사 담당자 계정은 만들지 않는다) |

## 2. 프로젝트 수행 환경

| 영역 | 내용 |
|---|---|
| 개발 방법론 | SDD |
| 기획 | user story + acceptance criteria |
| 디자인 | 피그마, 디자인시스템(meta astryx) |
| 개발 | ATDD, TDD |
| 검증 | e2e (Playwright Test) |
| 로컬 | Docker (PostgreSQL) |
| 배포·DB | Vercel + Supabase (PostgreSQL만 사용) |

### 2-1. 기술 스택 (가정)

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js (App Router) | Vercel 배포와 가장 잘 맞는다 |
| 언어 | TypeScript | 타입으로 인수 기준을 코드에 묶기 쉽다 |
| ORM | Prisma | PostgreSQL 마이그레이션 관리가 단순하다 |
| 단위·통합 테스트 | Vitest | TDD 사이클이 빠르다 |
| e2e | Playwright Test | 원문 지정 |
| 패키지 매니저 | pnpm | |

### 2-2. 환경 구성

| 환경 | DB | 배포 | 비고 |
|---|---|---|---|
| 로컬 | Docker PostgreSQL | 로컬 실행 | 개발·테스트용 |
| 운영 | Supabase | Vercel Production | demo 라 스테이징은 따로 두지 않는다 (가정). PR 마다 Vercel Preview 로 확인한다 |

- Supabase는 **PostgreSQL만** 쓴다. (Auth·Storage·Realtime 등은 쓰지 않는다)
- 접속 정보·키는 환경변수로만 관리하고 repo 에 넣지 않는다.

### 2-3. 개발·검증 규칙

- 인수 기준(acceptance criteria)이 먼저, 테스트가 그다음, 구현이 마지막이다. (ATDD → TDD)
- 모든 user story 는 acceptance criteria 를 갖고, 각 criteria 는 e2e 테스트 하나 이상과 연결된다.
- 디자인은 meta astryx 디자인시스템의 컴포넌트·토큰을 우선 쓴다.

## 3. 프로젝트 진행

순서: **PRD → IA → WBS → 기획 → 디자인 → 개발 → 검증**

| 단계 | 산출물 | 완료 기준 | 상태 |
|---|---|---|---|
| PRD | 제품 요구사항 문서 | 목표·범위·성공 지표 확정 | 미착수 |
| IA | 정보구조·화면 목록 | 화면 목록과 이동 흐름 확정 | 미착수 |
| WBS | 작업 분해·일정 | 작업 단위·담당·기간 확정 | 미착수 |
| 기획 | user story + acceptance criteria | 모든 화면의 story·criteria 작성 | 미착수 |
| 디자인 | 피그마 시안 | 모든 화면 시안 + 디자인시스템 적용 | 미착수 |
| 개발 | 동작하는 코드 | criteria 기반 테스트 통과 | 미착수 |
| 검증 | e2e 결과 | Playwright 전체 통과 | 미착수 |

### 3-1. 일정 (가정)

| 단계 | 기간 |
|---|---|
| PRD · IA · WBS | 1주 |
| 기획 · 디자인 | 2주 (일부 병행) |
| 개발 | 3주 |
| 검증 · 보완 | 1주 |
| 합계 | 약 7주 |

## 4. 임의로 정한 값 요약

원문에 없어서 demo 용으로 정한 값이다. 바꾸면 영향이 큰 순서로 적었다.

| # | 항목 | 정한 값 | 바꾸면 영향 |
|---|---|---|---|
| 1 | 이벤트 참여 | 로그인 없이 응모 폼 | 인증·개인정보 설계 |
| 2 | 이벤트 등록 주체 | 운영 관리자가 대행 | 관리자 기능 범위 |
| 3 | 개인정보 | 응모에 필요한 최소 항목만 받고 이벤트 종료 후 일정 기간 뒤 파기. 구체 항목·기간은 PRD 에서 정한다 | 보관·파기 정책 |
| 4 | 기술 스택 | Next.js + TypeScript + Prisma | 개발 착수 |
| 5 | 일정 | 약 7주 | WBS |

## 5. 하네스 제안

> 구현 동기화: 이 절은 `.claude/`·`scripts/` 의 실제 자산에 맞췄다(2026-11-25). 어긋나면 자산 파일이 맞다. 프로젝트 자립 — 회사 config dir·개인 `~/.claude`·회사 공용 자산에 쓰지도 않고 의존하지도 않는다.

### 5-1. 설계 원칙

- **maker ⊥ checker**: 만든 쪽이 자기 산출을 승인하지 않는다. 모든 maker 는 짝이 되는 checker 를 갖는다.
- **쌍의 모델 분리**: maker 와 checker 는 서로 다른 모델로 돌린다. 같은 모델은 같은 사각을 공유한다.
- **근거 있는 회수**: checker 는 "PASS" 만 내지 않고 무엇을 어떻게 확인했는지와 반증을 함께 낸다.
- **세는 일은 스크립트가**: 개수·대응 관계는 LLM 판단이 아니라 script 로 센다. script 는 안 본 축을 `미검사` 로 적는다(0 건과 못 본 것을 섞지 않는다).
- **진행 순서와 맞춘다**: PRD → IA → WBS → 기획 → 디자인 → 개발 → 검증 각 단계에 쌍이 하나씩 붙는다. 단 e2e 는 WBS 상 기획 직후(3주차)에 구현 전 선작성한다 — 인수 기준 → 테스트 → 구현 순서다.

### 5-2. Agent — maker ↔ checker 쌍

모델 배정(확정): **maker = Sonnet · checker = Opus**. 모든 쌍에 똑같이 적용한다.
effort 배정(확정): **모든 에이전트 `effort: medium`** (maker·checker 동일). 에이전트 정의 frontmatter 의 `effort` 필드에 적는다.

| 단계 | maker (Sonnet) | checker (Opus) | checker 가 보는 것 |
|---|---|---|---|
| PRD · IA · WBS | `prd-writer` | `prd-reviewer` | 목표·범위·지표가 서로 모순 없는지, 빠진 화면·역할이 없는지 |
| 기획 | `story-writer` | `story-reviewer` | 모든 story 에 acceptance criteria(AC)가 있는지, AC 가 테스트로 판정 가능한 문장인지 |
| 디자인 | `design-builder` | `design-reviewer` | meta astryx 컴포넌트·토큰 준수, 모든 화면·상태(빈 목록·오류·로딩) 시안 존재 |
| 개발 | `developer` | `develop-reviewer` | 테스트 먼저 작성됐는지, AC 를 벗어난 구현이 없는지, Supabase 는 PostgreSQL 만 쓰는지 |
| 검증 | `e2e-writer` | `e2e-reviewer` | 모든 AC 에 Playwright 테스트가 대응하는지, 항상 통과하는 공허한 테스트가 없는지 |

- 형상관리 에이전트는 만들지 않는다. 모든 에이전트는 git 명령 금지이고 변경은 파일로 남긴다. 커밋은 메인 세션이 사람 지시로 한다(`tdd-cycle` §1 도 같다). DB 모델링 전용 에이전트도 만들지 않는다 — 스키마는 Prisma(`supabase-pg-only`)가 정본이다.
- maker 는 자기 산출의 심각도를 판정하지 않는다. 심각도 판정은 checker 와 사람 몫이다.
- checker 는 읽기 전용이다. 쓰는 파일은 리뷰 파일 하나 — `docs/reviews/<yyyy-mm-dd>-<대상 slug>-<checker 이름>.md`(날짜 = `date +%F`). 기계 강제는 일부다: `Edit` 를 주지 않았고 `checker-guard` hook 이 `Write` 경로와 `Bash` 의 변경 명령 일부를 막는다. `python -c`·스크립트 안의 쓰기 등은 못 막고 지시로만 막힌다(§5-4).
- 산출 경로

| maker | 쓰는 곳 |
|---|---|
| `prd-writer` | `docs/prd/prd.md` · `ia.md` · `wbs.md` |
| `story-writer` | `docs/stories/<story>-<slug>.md` |
| `design-builder` | `docs/design/astryx-inventory.md` · `docs/design/screens/<화면 ID>.md` |
| `developer` | `src/` · `prisma/` · `prisma.config.ts` · `docs/tdd/<yyyy-mm-dd>-<AC id>.md` |
| `e2e-writer` | `e2e/<story>-<slug>.spec.ts` · `e2e/fixtures/` |

### 5-3. Skill — 쌍이 공유하는 작업 기준

skill 은 세 묶음으로 나눈다. maker 용(만드는 법) · checker 용(검수 체크리스트) · 공용(양쪽이 같은 기준을 읽는 정본).
maker 용과 checker 용을 한 skill 에 섞지 않는다 — 섞으면 checker 가 maker 의 관점에 끌린다.

**공용 (정본 — 양쪽이 같이 읽는다)**

| skill | 담는 것 | 쓰는 쪽 |
|---|---|---|
| `story-ac-write` | user story·AC 양식, AC 번호 규칙(`AC-<story>-<n>`), 판정 가능한 문장 예시, e2e 테스트 제목 규칙, `ac-trace.py` 출력·종료 코드, 커밋 게이트의 단계별 동작 | story-writer · story-reviewer · e2e-writer · e2e-reviewer |
| `astryx-ui` | 사용하는 컴포넌트·토큰 목록과 쓰면 안 되는 패턴 | design-builder · design-reviewer · developer |
| `supabase-pg-only` | Supabase 를 PostgreSQL 연결로만 쓰는 규칙, Prisma 버전 고정과 연결 설정, 환경변수 이름 | developer · develop-reviewer |

- e2e-reviewer 가 `story-ac-write` 를 읽는 이유: AC 번호·제목 규칙·`ac-trace` 출력 뜻이 그 skill 에 있고, 검수 체크리스트(`e2e-review`)가 그것을 가리키기만 한다.

**maker 용 (Sonnet 이 로드)**

| skill | 담는 것 | 쓰는 쪽 |
|---|---|---|
| `prd-write` | PRD·IA·WBS 양식, 범위·지표·화면 목록 작성 순서 | prd-writer |
| `design-build` | 피그마 → astryx 컴포넌트 매핑 순서, 화면별 상태(빈·오류·로딩) 빠짐없이 그리는 절차 | design-builder |
| `tdd-cycle` | AC → 실패하는 테스트 → 구현 → 정리 순서와 변경 단위, 순서 증거 기록 | developer |
| `e2e-playwright` | 테스트 파일 이름·구조, AC 번호를 테스트 제목에 넣는 규칙, 테스트 데이터 준비 | e2e-writer |

**checker 용 (Opus 가 로드)**

| skill | 담는 것 | 쓰는 쪽 |
|---|---|---|
| `prd-review` | 목표↔범위↔지표 모순, 빠진 역할·화면, 근거 없는 수치 점검 | prd-reviewer |
| `story-review` | AC 가 판정 가능한가, story 마다 AC 가 있는가, 중복·충돌 AC | story-reviewer |
| `design-review` | astryx 이탈, 누락 화면·상태, 접근성 기본선 | design-reviewer |
| `develop-review` | 테스트 먼저 규칙, AC 밖 구현, PostgreSQL 외 Supabase 기능 사용, 비밀값 | develop-reviewer |
| `e2e-review` | AC↔테스트 대응, 항상 통과하는 공허한 테스트 사냥(주석 처리·skip 포함), 불안정(flaky)한 대기 | e2e-reviewer |

- 총 12개이고 모두 `.claude/skills/` 에 만들었다(재실측: `ls .claude/skills`). 회사 공용 skill 은 쓰지 않는다 — 접근성 기본선은 `design-review`, UI 기본선은 `astryx-ui` 가 담는다.

### 5-4. Hook — 어기면 바로 막는 것

| 시점 | hook | 하는 일 |
|---|---|---|
| PreToolUse (Write·Edit·NotebookEdit) | `block-secrets` | `.env`·키 문자열이 repo 파일에 들어가면 차단. 대소문자·`/.claude/../` 경로·문자열 쪼갬·`.env.example` 의 값 편집까지 본다 |
| PreToolUse (Write·Edit·NotebookEdit) | `block-supabase-extras` | Supabase SDK·`supabase.auth`·`storage`·`realtime`·Supabase 주소·API 경로를 코드·설정·lockfile·`.env*` 에서 차단 (PostgreSQL 만 허용) |
| PreToolUse (Write·Edit·NotebookEdit·Bash) | `checker-guard` | checker 5종(`agent_type` 으로 가림)의 `Write` 를 리뷰 파일 경로로, `Bash` 변경 명령(git·rm·mv·`sed -i`·패키지 설치·파일 리다이렉트)을 차단 |
| PreToolUse (Bash) | `ac-trace-gate` | `git commit` 을 알아보고 `scripts/ac-trace.py` 출력으로 단계별 판정: 형식 오류·정의 없는 AC 를 가리키는 테스트·테스트가 시작된 story 의 AC 누락은 차단, 아직 e2e 가 없는 story 는 알리기만, e2e 없음은 `대응 미검사` 로 알린다(정본 `story-ac-write` §6) |
| PostToolUse (Write·Edit) | `check-types` | 수정한 `.ts`·`.tsx`·`.mts`·`.cts` 의 타입·린트 오류를 바로 알린다. 못 돌린 검사는 `미검사` 로 알린다 |
| Stop · SubagentStop(developer) | `test-gate` | 단위 테스트가 깨진 채로 작업을 끝내지 못하게 한다(JSON `decision: block`) |

- hook 은 경고만 하는 것과 막는 것을 구분해서 단다. 훅이 못 막는 시점(세션 시작 등)은 막는다고 적지 않는다. `check-types` 는 PostToolUse 라 이미 저장된 뒤의 경고다.
- `ac-trace-gate` 에는 `if` 필터를 달지 않았다 — `if` 는 `git -C`·`git -c`·`/usr/bin/git` 에서 훅을 아예 띄우지 못한다(공식 문서: best-effort). 모든 Bash 호출에서 스크립트가 판정한다.
- 🔴 막지 못하는 것(막는다고 적지 않는다): git alias·변수로 만든 명령·스크립트 파일 안의 커밋·`python -c` 로 띄운 git·`merge`/`cherry-pick`/`rebase` 가 만드는 커밋(`ac-trace-gate`) · Bash 로 쓰는 파일과 설치한 패키지(`block-secrets`·`block-supabase-extras`) · `python -c`·스크립트 안의 쓰기(`checker-guard`). 진짜 강제는 git pre-commit 훅이며 아직 설치하지 않았다(열린 점).
- `.claude/hooks/_hooklib.py` 는 hook 이 아니라 공용 도구다(프로젝트 루트 찾기·Bash 명령 해석). settings.json 에 등록하지 않는다.

### 5-5. Script — 결정적으로 도는 도구

| script | 하는 일 |
|---|---|
| `scripts/db-up.sh` | Docker PostgreSQL 기동·초기화·종료. 여러 번 돌려도 결과가 같게 만든다 |
| `scripts/ac-trace.py` | 기획 문서의 AC 번호 전체와 테스트 제목의 AC 번호를 대조해 빠진 것·남는 것을 센다. 형식 축은 e2e 없이도 돌고, 안 본 축은 `UNCHECKED` 로 적는다. 주석·문자열 안의 `test(`·skip 된 테스트는 대응으로 세지 않는다 |
| `scripts/e2e-run.sh` | DB 기동 → 마이그레이션 → Playwright 실행 → 결과 요약을 한 번에 |
| `scripts/check-env.sh` | 필요한 환경변수 이름이 모두 있는지, 금지 이름(`SUPABASE_*`)이 없는지 확인(값은 출력하지 않는다) |

### 5-6. 도입 순서

도입 순서는 아래와 같고 모두 만들었다. 순서는 왜 그 순서로 만들었는지의 기록으로 남긴다.

| 순서 | 만들 것 | 이유 |
|---|---|---|
| 1 | `ac-trace.py` + `story-ac-write` | AC 번호가 기획·개발·검증을 잇는 뼈대다. 이게 먼저 있어야 나머지 쌍이 대조할 기준이 생긴다 |
| 2 | `developer` ↔ `develop-reviewer` + `tdd-cycle` · `develop-review` · `supabase-pg-only` + `test-gate` | 개발 기간이 가장 길다 |
| 3 | `e2e-writer` ↔ `e2e-reviewer` + `e2e-playwright` · `e2e-review` + `e2e-run.sh` | 검증 단계 선행 준비 |
| 4 | `story-writer` ↔ `story-reviewer` + `story-review` | 기획 착수 시점 |
| 5 | `prd-*` · `design-*` 쌍 + `prd-write` · `prd-review` · `design-build` · `design-review` · `astryx-ui` | 해당 단계 착수 시점 |
| 6 | 나머지 hook(`block-secrets` 등)·`db-up.sh` | 개발 시작 전에 깔아 둔다 |

### 5-7. 가정과 열린 점

- 가정: 에이전트·스킬·hook 은 이 repo 의 `.claude/` 아래에 둔다. 회사 config dir·개인 `~/.claude`·회사 공용 자산에는 쓰지 않고 의존하지 않는다(프로젝트 자립).
- 확정: maker 는 Sonnet, checker 는 Opus. 에이전트 정의의 `model` 에 그대로 적는다.
- 열린 점: 디자인 쌍은 피그마를 어떻게 읽을지(MCP·내보낸 이미지)에 따라 도구 권한이 달라진다.
- 열린 점: `git commit` 을 기계로 강제하는 git pre-commit 훅(`core.hooksPath`) 설치 여부 — 첫 커밋 결정(todo E-2)과 같이 정한다.
- 열린 점: Prisma 메이저 버전 — `supabase-pg-only` 는 `7.10.1`(npm 안정 최신)로 고정했다. v6 로 가려면 그 skill 과 `prisma.config.ts` 전제를 같이 바꾼다.
