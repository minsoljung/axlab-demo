// 테스트 서버: 포트 3100, APP_TEST_MODE=1, .env.test 의 테스트 DB.
// 계약상 테스트 훅은 NODE_ENV!=='production' 에서만 존재한다. `next start` 는 NODE_ENV=production 으로 고정돼
// 훅이 꺼지므로 `next dev`(NODE_ENV=development)를 쓰고, 첫 요청 컴파일 지연을 없애려고 주요 경로를 미리 한 번씩 부른다.
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const env = { ...process.env, APP_TEST_MODE: "1", NODE_ENV: "development" };
if (existsSync(".env.test")) {
  for (const line of readFileSync(".env.test", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) env[m[1]] = m[2];
  }
}
env.APP_TEST_MODE = "1";
const PORT = 3100;
const child = spawn("npx", ["next", "dev", "-p", String(PORT)], { env, stdio: "inherit" });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code ?? 0));

const base = `http://localhost:${PORT}`;
async function warm() {
  for (let i = 0; i < 120; i++) {
    try {
      await fetch(`${base}/api/test/seed-info`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  const paths = ["/api/test/seed-info", "/api/events", "/api/events/evt-a1", "/", "/events/evt-a1", "/events/evt-a1/apply", "/events/evt-a1/apply/complete"];
  for (const p of paths) await fetch(base + p).catch(() => undefined);
  for (const [p, body] of [
    ["/api/test/reset", { seed: "default" }],
    ["/api/test/clock", { now: null }],
    ["/api/test/fail-next", { route: "/__warm__", status: 500 }],
    ["/api/test/delay-next", { route: "/__warm__", ms: 1 }],
    ["/api/test/admin-code", { code: null }],
  ]) {
    await fetch(base + p, { method: "POST", body: JSON.stringify(body) }).catch(() => undefined);
  }
  await fetch(`${base}/api/test/counts`).catch(() => undefined);
  console.log(`[start:test] ready ${base}`);
}
warm();
