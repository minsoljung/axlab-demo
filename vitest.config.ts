import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";

// 테스트는 항상 단위 테스트 전용 DB(.env.unit = axlab_demo_unit)를 쓴다. e2e 서버(.env.test)·개발 DB 와 데이터를 섞지 않는다.
loadEnv({ path: ".env.unit", override: true });

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    // DB 를 쓰는 테스트가 같은 테스트 DB 를 공유하므로 파일 단위로 순차 실행한다
    fileParallelism: false,
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 15000,
  },
});
