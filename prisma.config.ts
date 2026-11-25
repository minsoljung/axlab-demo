import { defineConfig, env } from "prisma/config";
import { config as loadEnv } from "dotenv";

// 마이그레이션은 DIRECT_URL(운영 = Supabase direct 연결 문자열). NODE_ENV 와 무관하게 APP_ENV_FILE 로 .env.test 를 고를 수 있다.
loadEnv({ path: process.env.APP_ENV_FILE ?? ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: env("DIRECT_URL") },
});
