import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { clearDb } from "@/test/db";
import { resetHooks, applyHooks } from "@/lib/testHooks";
import { now } from "@/lib/clock";
import { getAdminCode } from "@/lib/adminCode";
import { POST as reset } from "./reset/route";
import { GET as seedInfo } from "./seed-info/route";
import { POST as clock } from "./clock/route";
import { POST as failNextRoute } from "./fail-next/route";
import { POST as delayNextRoute } from "./delay-next/route";
import { GET as counts } from "./counts/route";
import { POST as adminCode } from "./admin-code/route";

const post = (h: (r: Request) => Promise<Response>, body: unknown) =>
  h(new Request("http://x/api/test", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => resetHooks());
afterAll(async () => {
  resetHooks();
  await clearDb();
  await prisma.$disconnect();
});

describe("TH-gate 프로덕션이면 404", () => {
  it("NODE_ENV=production → 모든 훅 404", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await post(reset, { seed: "default" })).status).toBe(404);
    expect((await seedInfo(new Request("http://x"))).status).toBe(404);
    expect((await post(clock, { now: null })).status).toBe(404);
    expect((await post(failNextRoute, { route: "/api", status: 500 })).status).toBe(404);
    expect((await post(delayNextRoute, { route: "/api", ms: 1 })).status).toBe(404);
    expect((await counts(new Request("http://x"))).status).toBe(404);
    expect((await post(adminCode, { code: null })).status).toBe(404);
    vi.unstubAllEnvs();
  });
});

describe("TH-reset / TH-seed-info", () => {
  it("default: 초기화·재주입, seed-info 에 id·title·carrier·status·endsAt·startsAt·content", async () => {
    expect((await post(reset, { seed: "default" })).status).toBe(200);
    const info = await (await seedInfo(new Request("http://x"))).json();
    expect(info.length).toBeGreaterThanOrEqual(4);
    for (const e of info) {
      expect(Object.keys(e)).toEqual(expect.arrayContaining(["id", "title", "carrier", "status", "endsAt", "startsAt", "content"]));
    }
    expect(info.filter((e: { status: string }) => e.status === "종료")).toHaveLength(1);
    expect(Number.isNaN(Date.parse(info[0].endsAt))).toBe(false);
  });
  it("empty·carrier-c-empty 시드", async () => {
    await post(reset, { seed: "empty" });
    expect(await (await seedInfo(new Request("http://x"))).json()).toEqual([]);
    await post(reset, { seed: "carrier-c-empty" });
    const info = await (await seedInfo(new Request("http://x"))).json();
    expect(info.some((e: { carrier: string }) => e.carrier === "통신사 C")).toBe(false);
    expect(info.some((e: { carrier: string }) => e.carrier === "통신사 A")).toBe(true);
  });
  it("모르는 시드는 400", async () => {
    expect((await post(reset, { seed: "nope" })).status).toBe(400);
  });
  it("reset 은 시계·접근 코드 override·대기 중 fail 도 해제한다", async () => {
    await post(clock, { now: "2030-01-01T00:00:00.000Z" });
    await post(adminCode, { code: "zzz" });
    await post(failNextRoute, { route: "/api", status: 500 });
    await post(reset, { seed: "default" });
    expect(now().getFullYear()).not.toBe(2030);
    expect(getAdminCode()).toBe(process.env.ADMIN_ACCESS_CODE);
    expect(await applyHooks("/api/events")).toBeNull();
  });
});

describe("TH-clock", () => {
  it("고정하고 now:null 로 해제", async () => {
    expect((await post(clock, { now: "2030-01-01T00:00:00.000Z" })).status).toBe(200);
    expect(now().toISOString()).toBe("2030-01-01T00:00:00.000Z");
    await post(clock, { now: null });
    expect(now().getFullYear()).not.toBe(2030);
  });
  it("잘못된 시각은 400", async () => {
    expect((await post(clock, { now: "zzz" })).status).toBe(400);
  });
});

describe("TH-fail-next / TH-delay-next 라우트", () => {
  it("fail-next 설정 → 다음 1회 실패", async () => {
    expect((await post(failNextRoute, { route: "/api/events", status: 500 })).status).toBe(200);
    expect((await applyHooks("/api/events"))?.status).toBe(500);
  });
  it("delay-next 설정 → 다음 1회 지연", async () => {
    expect((await post(delayNextRoute, { route: "/api/events", ms: 100 })).status).toBe(200);
    const t = Date.now();
    await applyHooks("/api/events");
    expect(Date.now() - t).toBeGreaterThanOrEqual(90);
  });
  it("잘못된 본문은 400", async () => {
    expect((await post(failNextRoute, { status: 500 })).status).toBe(400);
    expect((await post(delayNextRoute, { route: "/api" })).status).toBe(400);
  });
});

describe("TH-counts / TH-admin-code", () => {
  it("counts: events·applications·applicationsByEvent", async () => {
    await post(reset, { seed: "default" });
    await prisma.entry.create({ data: { eventId: "evt-a1", name: "n", phone: "01000000000", consentAt: new Date() } });
    const c = await (await counts(new Request("http://x"))).json();
    expect(c.events).toBe(5);
    expect(c.applications).toBe(1);
    expect(c.applicationsByEvent).toEqual({ "evt-a1": 1 });
  });
  it("admin-code: 변경·null 복귀", async () => {
    await post(adminCode, { code: "other" });
    expect(getAdminCode()).toBe("other");
    await post(adminCode, { code: null });
    expect(getAdminCode()).toBe(process.env.ADMIN_ACCESS_CODE);
  });
});
