import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetAndSeed } from "@/lib/seed";
import { listEvents } from "@/lib/events";
import { clearDb } from "@/test/db";

afterAll(async () => {
  await clearDb();
  await prisma.$disconnect();
});

describe("TH-seed default 시드: 통신사 3곳 + 통신사별 진행 중 이벤트 + 종료 1개", () => {
  it("통신사 3곳 A·B·C 가명", async () => {
    await resetAndSeed(prisma, "default");
    const names = (await prisma.carrier.findMany({ orderBy: { name: "asc" } })).map((c) => c.name);
    expect(names).toEqual(["통신사 A", "통신사 B", "통신사 C"]);
  });
  it("통신사별 진행 중 1개 이상, 종료 정확히 1개", async () => {
    await resetAndSeed(prisma, "default");
    const list = await listEvents();
    for (const c of ["통신사 A", "통신사 B", "통신사 C"]) {
      expect(list.filter((e) => e.carrier === c && e.status === "open").length).toBeGreaterThanOrEqual(1);
    }
    expect(list.filter((e) => e.status === "closed")).toHaveLength(1);
  });
  it("두 번 불러도 같은 결과(초기화 후 재주입)이다", async () => {
    await resetAndSeed(prisma, "default");
    const a = (await listEvents()).map((e) => e.id).sort();
    await prisma.entry.deleteMany();
    await resetAndSeed(prisma, "default");
    const b = (await listEvents()).map((e) => e.id).sort();
    expect(b).toEqual(a);
  });
  it("empty 시드는 통신사만 있고 이벤트가 없다", async () => {
    await resetAndSeed(prisma, "empty");
    expect(await prisma.carrier.count()).toBe(3);
    expect(await listEvents()).toEqual([]);
  });
  it("모르는 시드 이름은 거부한다", async () => {
    await expect(resetAndSeed(prisma, "nope")).rejects.toThrow();
  });
});

describe("TH-reset 초기화는 관리자 세션 테이블도 비운다 (AC-008 세션이 DB 에 있으므로)", () => {
  it.each(["default", "empty", "carrier-c-empty"])("%s 시드 뒤 세션 0건", async (seed) => {
    await prisma.adminSession.create({ data: { id: "x", createdAt: new Date(), lastAt: new Date(), codeHash: "h" } });
    await resetAndSeed(prisma, seed);
    expect(await prisma.adminSession.count()).toBe(0);
  });
});
