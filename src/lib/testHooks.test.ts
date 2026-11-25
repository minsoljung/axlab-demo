import { describe, it, expect, afterEach, vi } from "vitest";
import { isTestMode, failNext, delayNext, resetHooks, applyHooks } from "@/lib/testHooks";
import { now, setClock } from "@/lib/clock";
import { getAdminCode, setAdminCodeOverride } from "@/lib/adminCode";

afterEach(() => {
  resetHooks();
  vi.unstubAllEnvs();
});

describe("TH-gate 테스트 훅은 APP_TEST_MODE=1 이고 NODE_ENV!==production 일 때만 켜진다", () => {
  it("APP_TEST_MODE=1, NODE_ENV=test → 켜짐", () => {
    vi.stubEnv("APP_TEST_MODE", "1");
    vi.stubEnv("NODE_ENV", "test");
    expect(isTestMode()).toBe(true);
  });
  it("NODE_ENV=production 이면 꺼짐", () => {
    vi.stubEnv("APP_TEST_MODE", "1");
    vi.stubEnv("NODE_ENV", "production");
    expect(isTestMode()).toBe(false);
  });
  it("APP_TEST_MODE 가 1 이 아니면 꺼짐", () => {
    vi.stubEnv("APP_TEST_MODE", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(isTestMode()).toBe(false);
  });
});

describe("TH-fail-next 다음 1회 요청만 실패시킨다", () => {
  it("접두가 맞는 첫 요청만 지정 상태로 실패, 두 번째는 통과", async () => {
    failNext("/api/events", 500);
    const first = await applyHooks("/api/events/abc");
    expect(first?.status).toBe(500);
    expect(await applyHooks("/api/events/abc")).toBeNull();
  });
  it("접두가 다른 요청은 소진하지 않는다", async () => {
    failNext("/api/events/x/applications", 503);
    expect(await applyHooks("/api/events")).toBeNull();
    expect((await applyHooks("/api/events/x/applications"))?.status).toBe(503);
  });
  it("/api/test/ 요청에는 적용하지 않는다", async () => {
    failNext("/api", 500);
    expect(await applyHooks("/api/test/clock")).toBeNull();
    expect((await applyHooks("/api/events"))?.status).toBe(500);
  });
});

describe("TH-delay-next 다음 1회 요청을 지연시킨다", () => {
  it("ms 이상 지연되고 한 번만 적용된다", async () => {
    delayNext("/api/events", 120);
    const t0 = Date.now();
    expect(await applyHooks("/api/events")).toBeNull();
    expect(Date.now() - t0).toBeGreaterThanOrEqual(110);
    const t1 = Date.now();
    await applyHooks("/api/events");
    expect(Date.now() - t1).toBeLessThan(80);
  });
});

describe("TH-reset 훅 상태를 전부 해제한다", () => {
  it("fail·delay·시계·접근 코드 override", async () => {
    failNext("/api", 500);
    delayNext("/api", 5000);
    setClock("2030-01-01T00:00:00.000Z");
    setAdminCodeOverride("zzz");
    resetHooks();
    expect(await applyHooks("/api/events")).toBeNull();
    expect(now().getFullYear()).not.toBe(2030);
    expect(getAdminCode()).toBe(process.env.ADMIN_ACCESS_CODE);
  });
});

describe("TH-admin-code 실행 중 접근 코드 변경", () => {
  it("override 가 우선이고 null 이면 환경변수로 복귀", () => {
    setAdminCodeOverride("other");
    expect(getAdminCode()).toBe("other");
    setAdminCodeOverride(null);
    expect(getAdminCode()).toBe(process.env.ADMIN_ACCESS_CODE);
  });
});
