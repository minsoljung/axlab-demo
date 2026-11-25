---
name: develop-review
description: "개발 검수 체크리스트(checker 용) — 테스트 먼저 규칙, AC 밖 구현, PostgreSQL 외 Supabase 기능 사용, 비밀값, 테스트·타입 실행. develop-reviewer 가 preload. TDD 절차가 아니다(= tdd-cycle). e2e 검수가 아니다(= e2e-review)."
---

# develop-review

대상: `src/**` · `prisma/**` · `package.json` · `docs/tdd/*.md`. 기준: `docs/stories/*.md` · supabase-pg-only. maker 용 skill(tdd-cycle)은 로드하지 않는다 — 기록 형식은 R-1 의 필드(`AC`·`test`·`red`·`green`·`refactor`)만 본다.

| # | 축 | 확인 | FAIL 조건 |
|---|---|---|---|
| R-1 | 테스트 먼저 | 대상 AC 마다 `docs/tdd/*-<AC id>.md` 와 그 `test:` 파일 | 기록 없음 · `red` exit=0 · `red` 실패 사유가 import·문법 오류 · 테스트 파일에 AC id 없음 |
| R-2 | AC 밖 구현 | 새 route(`src/app/**/page.tsx`·`route.ts`)·exported 함수가 어느 AC 에 연결되나 | 연결 AC 없는 기능 · 제외 범위 기능 |
| R-3 | Supabase PG 만 | (a) 대상 파일(`src/`·`prisma/`·루트의 `package.json`·lockfile·`prisma.config.ts`·`.env*`) 마다 `.claude/hooks/block-supabase-extras.py` 에 `{"tool_name":"Write","tool_input":{"file_path":<경로>,"content":<본문>}}` 를 stdin 으로 넣어 exit 확인(R-4 와 같은 방식 — 규칙 정본은 그 스크립트). (b) 훅이 안 보는 것은 python 전수: 확장자 불문 `@supabase/`·`SUPABASE_`·`.supabase.co`, `schema.prisma` 의 `url`·`directUrl` 줄, `package.json` 의 `prisma`·`@prisma/*` 버전이 supabase-pg-only §1 의 고정 버전과 같은지 | (a) exit 2 · (b) 1건 이상 · `scripts/check-env.sh` 의 `FORBIDDEN` 1건 이상 · Prisma 버전이 rc·`latest` 범위 표기 |
| R-4 | 비밀값 | 대상 파일마다 `.claude/hooks/block-secrets.py` 에 `{"tool_name":"Write","tool_input":{"file_path":<경로>,"content":<본문>}}` 를 stdin 으로 넣어 exit 확인 | exit 2 |
| R-5 | 실행 | `pnpm exec vitest run` · `pnpm exec tsc --noEmit` | exit ≠ 0 |

- R-1 은 기록으로만 확인된다(재현하려면 코드를 되돌려야 하고 checker 는 수정 금지). 기록이 실행 결과와 맞는지 검증 못 하면 `PASS` 가 아니라 `미확인(기록만 있음)` 으로 적는다.
- R-3·R-4 잡혀야 정상인 값: 전수 대상 파일 수를 같이 적는다. 0 이면 판정하지 않는다. R-3(a)는 `.claude/` 아래와 `node_modules/` 를 훅이 면제하므로 그 밖의 경로만 대상이다.
- R-5 를 실행 못 했으면(pnpm·node_modules 없음) `미검사` + 명령 출력 그대로.
