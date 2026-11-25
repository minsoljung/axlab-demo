---
name: supabase-pg-only
description: "Supabase 를 PostgreSQL 연결로만 쓰는 규칙(공용) — Prisma 버전 고정, 허용 연결 방식(schema·prisma.config.ts·driver adapter), 환경변수 이름, 금지 패키지·API·변수, 막는 장치. developer·develop-reviewer 가 preload. TDD 절차가 아니다(= tdd-cycle). 개발 검수 체크리스트가 아니다(= develop-review)."
---

# supabase-pg-only

## 1. 허용

- Supabase = PostgreSQL 호스트. 접근은 Prisma 하나로만 한다.
- 🔴 **버전 고정 — `prisma` 를 태그 없이 설치하지 않는다.** npm 실측(2026-11-25): `prisma` 의 `latest` 태그 = `8.0.0-rc.35`(사전 배포판), 안정 최신 = `7.10.1`(태그 `prev`). `pnpm add prisma` 는 rc 를 깐다.
  - 설치: `pnpm add -D prisma@7.10.1 dotenv` · `pnpm add @prisma/client@7.10.1 @prisma/adapter-pg@7.10.1` (세 Prisma 패키지는 같은 버전). 올리는 것은 사람이 정한다 — developer 가 스스로 올리지 않는다.
  - 전제: Node.js `^20.19 || ^22.12 || >=24`(`prisma@7.10.1` 의 engines) · TypeScript 5.4 이상.
  - 근거: Prisma 공식 문서 prisma.io/docs/orm/reference/prisma-config-reference — *"The `datasource.directUrl` property has been removed in Prisma ORM v7 in favor of the `url` property"*. 같은 문서 upgrade guide(guides/upgrade-prisma-orm/v7) — *"If you were previously using `directUrl` to run migrations then you need to pass the `directUrl` value in the `url` field of `prisma.config.ts` instead as the connection string defined in `url` is used by Prisma CLI for migrations."*, *"The `output` field is now **required** in the generator block."*, *"In Prisma ORM 7.0.0, environment variables are not loaded by default."*(→ `dotenv`).
- `prisma/schema.prisma` — **`url`·`directUrl` 줄을 쓰지 않는다**(v7 에서 deprecated/removed):

~~~
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
~~~

- `prisma.config.ts`(프로젝트 루트) — **마이그레이션용 직접 연결**(`DIRECT_URL`)을 CLI 가 읽는다:

~~~
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DIRECT_URL") },
});
~~~

- 런타임 클라이언트(`src/lib/prisma.ts` 등) — **런타임 쿼리용 풀러 연결**(`DATABASE_URL`)은 adapter 가 받는다:

~~~
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
~~~

- 생성물(`src/generated/`)은 커밋하지 않는다(`.gitignore` 에 있다). `pnpm exec prisma generate` 로 만든다.
- 위 snippet 은 문서의 모양이다 — 이 프로젝트에서 실제로 돌려 본 적은 없다(스캐폴딩 전). 첫 실행에서 어긋나면 임의로 고치지 말고 정지·보고한다.

## 2. 환경변수 이름 (값은 repo 에 넣지 않는다)

| 이름 | 용도 | 어디서 읽나 | 로컬 | 운영 |
|---|---|---|---|---|
| `DATABASE_URL` | 런타임 쿼리 | `src` 의 adapter | `scripts/db-up.sh` 의 Docker PostgreSQL | Supabase 대시보드의 pooler 연결 문자열 |
| `DIRECT_URL` | 마이그레이션 | `prisma.config.ts` 의 `datasource.url` | 위와 같음 | Supabase 대시보드의 direct 연결 문자열 |

- `.env.example` 에는 이름만 적고 값은 비운다.
- 존재 확인 = `scripts/check-env.sh`(값을 출력하지 않는다).

## 3. 금지

- `@supabase/*` 패키지 전부(`supabase-js`·`ssr`·`auth-helpers` 등) — PostgreSQL 연결에 필요 없다.
- `supabase.auth`·`storage`·`realtime`·`channel`·`functions` 호출, `*.supabase.co` 주소, `/auth/v1/`·`/rest/v1/`·`/storage/v1/` 같은 Supabase API 경로.
- 환경변수 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`·`SUPABASE_SERVICE_ROLE_KEY`·그 밖의 `SUPABASE_*`(`NEXT_PUBLIC_SUPABASE_*` 포함 — 이름 앞부분으로 가려낸다).
- 인증·파일 저장·실시간이 필요해 보이면 구현하지 말고 정지·보고한다(범위 밖).

## 4. 막는 장치

- `block-supabase-extras` 훅(PreToolUse Write·Edit·NotebookEdit)이 코드(`.ts`·`.tsx`·`.js`·`.mts` 등)·`package.json`·lockfile·`.json`·`.yml`·`.toml`·`.env*` 의 위 패턴을 차단한다. 규칙 정본은 그 스크립트이고 develop-review R-3 이 같은 스크립트를 파일마다 다시 돌린다.
- `scripts/check-env.sh` 가 금지 변수를 `FORBIDDEN` 으로 낸다 — `SUPABASE_*`·`NEXT_PUBLIC_SUPABASE_*` 이름 전체(프로세스 환경·`.env`·`.env.local` 의 값 있는 것, `.env.example` 은 값이 비어도).
- 🔴 훅은 Write·Edit·NotebookEdit 만 본다. Bash 로 만든 파일·설치한 패키지는 못 막는다 — develop-review 가 python 으로 다시 센다. `supabase` 가 이름에 없는 변수로 부르는 `.auth` 호출도 훅이 못 본다(SDK 도입 경로를 막는 쪽으로 대신한다).
