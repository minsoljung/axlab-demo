# RESUME — axlab-demo

> ✅ **소비됨 2026-11-25 15:10** — CPN 0건 발송 · 0건 폐기(보류 초안 없음) · 서브에이전트 2건 재디스패치(PRD 재검수 · 하네스 수정). 아래 §1~§3 은 재개 직전 상태 기록이다. 새 상태는 `docs/todo.md` 와 다음 `/offline` 이 덮어쓴다. ⚠️ **커밋 못 함**(git 신원 미설정 — §6 G-1) → 이 소비 표시는 이 기기에만 유효하다.

작성: 2026-11-25 15:03 KST (date 실측 15:01:39 이후) · 덮어쓰기 파일 · 재개 세션이 가장 먼저 읽는다

## 1. 하던 일 / 다음 한 걸음

- 하던 일: 프로젝트 하네스(`.claude/`) 개발 → 검수, PRD(`docs/prd/`) 작성 → 검수·수정 → 재검수
- 🔑 다음 한 걸음 (순서대로)
  1. `prd-reviewer` 재검수를 처음부터 다시 디스패치(재검수가 중단됐다 — §3-1. 지시 요지 = §3 표)
  2. 하네스 FAIL 수정: `harness-engineer` 디스패치 — 입력 `docs/reviews/2026-11-25-harness-harness-reviewer.md` 전건(Major 5·Minor 12 · 범위는 리뷰 파일 전건 판정) → `harness-reviewer` 재검수
  3. 사용자 게이트(§6) 정리

## 2. 상태 (사실만)

| 항목 | 상태 |
|---|---|
| 하네스 자산 31개 (agent 10 · skill 12 · hook 5 · script 4 · settings.json) | 생성 완료. 1차 검수 **FAIL** (Critical 0 · Major 5 · Minor 12). 수정 미착수 |
| 하네스 Major | M-1 `if:"Bash(git commit *)"` 가 `git -C`·`/usr/bin/git` 에 안 맞아 ac-trace-gate 우회 · M-2 기획→개발 구간 전 커밋 차단(결함 판정) · M-3 ac-trace 가 주석·skip 테스트를 대응으로 셈 · M-4 `e2e/` 없으면 ac-trace exit 4 로 형식검사 미실행 · M-5 supabase-pg-only 의 `directUrl` 이 Prisma v7+ 에서 제거됨(버전 미고정) |
| PRD 3종 (`docs/prd/prd.md`·`ia.md`·`wbs.md`) | 1차 검수(FAIL 1·부분 4) → `prd-writer` 수정 완료 → 재검수 **중단·미실시** |
| 공식 문서 규격 확인 | 완료. 미확인: skill `name`/`description` 최대 길이 |
| `.gitignore`·`docs/todo.md`·`docs/project-init.md`(§5 하네스 설계) | 작성 완료 |
| 설계 동기화 | `docs/project-init.md` §5 에 "회사 공용 skill 재사용" 문장이 남아 있음(프로젝트 자립 기준과 어긋남) — todo H-5 |

확정 결정: maker=sonnet · checker=opus · 전원 effort medium · 프로젝트 하네스로 자립(회사 config·공용 자산 의존 금지) · 사람용 문서 금지(에이전트용만).

## 3. 서브에이전트 처분

| 작업 | 상태 | 재개 방법 |
|---|---|---|
| 공식 문서 확인 · 하네스 개발 · 하네스 검수 · PRD 작성 · PRD 1차 검수 · PRD 수정 | 종료·회수 완료 | — |
| PRD 재검수 (`prd-reviewer`, id `a97f7883824deca98`) | **중단**(§3-1) | 지시 요지: 1차 지적 해소 확인 + 회귀(S↔SCR↔M↔W 전수 python 대응 · `(가정)` 7개 전이 · 선행 관계 계산·합 7주 · 90일 기준일 모호성 · P-07 로그 삭제가 지표 계산을 깨는지 · 접근 코드 vs 로그인 제외 · 제외 범위 누출). 산출 `docs/reviews/2026-11-25-prd-prd-reviewer-r2.md`, 수정 금지·git 금지 |

### 3-1. 확정 처분

- PRD 재검수(`a97f7883824deca98`)는 **15:02 KST 에 `TaskStop` 으로 중단**했다(오래 걸림 → 중단 갈래). 결과 회수 없음
- 부분 산출물: **없음** — 중단 직후 `docs/reviews/` 에 r2 파일 없음, 스냅샷 이후 바뀐 파일은 `docs/todo.md` 뿐
- 따라서 PRD 재검수는 **처음부터 다시 디스패치**해야 한다(§1 다음 한 걸음 1번). PRD 는 수정본 그대로 검수 대기 상태

## 4. 미커밋 잔여 🔴

- **전부 미커밋이다.** `git status` = `.claude/` · `.gitignore` · `docs/` · `scripts/` 전부 untracked
- git 상태 실측: `.git/` 있음 · 브랜치 `main` · **커밋 0건** · **remote 없음** · **`user.name` 미설정(local·global 모두 비어 있음)**
- 이유: 커밋 신원을 임의로 정할 수 없고(회사 규약 = 각자 `git config --local user.name`), 브랜치·remote 전략도 정해지지 않아 커밋을 보류했다. 파일은 이 기기에만 있다 — 다른 기기에서 이어가려면 먼저 §6 의 git 결정이 필요하다
- 되돌림·정리 없음(`checkout`·`restore`·`stash`·`clean` 미사용)
- `docs/todo.md` E-2 "git init = todo" 는 틀렸다(이미 `.git/` 있음) — 아래 todo 에서 정정함

## 5. 보내지 않은 CPN 초안

없음. (이번 세션은 다른 세션·프로젝트에 위임·통지한 건이 없다)

## 6. 미해소 사람 게이트

| # | 게이트 | 내용 |
|---|---|---|
| G-1 | git 신원·전략 | `user.name` 값(`[<사용자명>]` 접두 규약) · 첫 커밋을 `main` 에 둘지, 보호 브랜치 규약(develop 등)을 만들지 · remote(GitLab 새 repo? 로컬만?) |
| G-2 | 하네스 승인 (todo H-6) | 1차 검수 FAIL 이라 수정·재검수 후에야 결정 가능 |
| G-3 | PRD 가정 확정 (WBS W-04 게이트) | 접근 코드를 "로그인"으로 볼지 · 90일 기준일·원시 로그 보관 기간 · 검수 시간이 7주를 넘는지 · 지표 목표값 3개 미정 |
| G-4 | 디자인 쌍의 피그마 읽기 방식 | MCP 권한을 줄지, 내보낸 이미지로 갈지(현재 구현 = 이미지 Read) |

## 7. 재개 절차

1. 이 파일 → `docs/todo.md` → `docs/reviews/*.md`(날짜순) → `docs/project-init.md` §4·§5
2. `date` 실측, `/usr/bin/git status --short` 로 §4 가 그대로인지 대조
3. §1 의 다음 한 걸음 1번부터 실행
4. 사용자에게 §6 G-1 을 먼저 `AskUserQuestion` 으로 물어 커밋 가능 상태로 만든다
