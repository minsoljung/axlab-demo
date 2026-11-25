import { describe, it, expect, beforeEach, afterAll, afterEach } from "vitest";
import { prisma } from "@/lib/db";
import { listEvents, getEvent } from "@/lib/events";
import { setClock } from "@/lib/clock";
import { clearDb, seedCarriers, day } from "@/test/db";

beforeEach(async () => {
  await clearDb();
  await seedCarriers();
});
afterEach(() => setClock(null));
afterAll(async () => {
  await clearDb();
  await prisma.$disconnect();
});

async function mk(id: string, over: Record<string, unknown> = {}) {
  return prisma.event.create({
    data: {
      id,
      title: `제목-${id}`,
      content: `내용-${id}`,
      carrierId: "carrier-a",
      startsAt: day(-5),
      endsAt: day(30),
      ...over,
    },
  });
}

describe("AC-001-1 서버: 진행 중 이벤트의 제목과 통신사 이름을 돌려준다", () => {
  it("제목·통신사 이름·상태 open", async () => {
    await mk("e1");
    const list = await listEvents();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: "e1", title: "제목-e1", carrier: "통신사 A", status: "open" });
  });
});

describe("AC-001-2 서버: 기간 만료·수동 종료 이벤트는 closed 이다", () => {
  it("종료 예정일이 지났다", async () => {
    await mk("old", { endsAt: day(-1) });
    expect((await listEvents())[0].status).toBe("closed");
  });
  it("수동 종료했다", async () => {
    await mk("manual", { closedAt: day(-1) });
    expect((await listEvents())[0].status).toBe("closed");
  });
  it("서버 시계를 뒤로 보내면 종료 예정일 판정이 그 시계를 따른다", async () => {
    await mk("e1", { endsAt: new Date("2026-12-31T00:00:00.000Z"), startsAt: new Date("2026-11-01T00:00:00.000Z") });
    setClock("2026-12-30T00:00:00.000Z");
    expect((await listEvents())[0].status).toBe("open");
    setClock("2027-01-01T00:00:00.000Z");
    expect((await listEvents())[0].status).toBe("closed");
  });
});

describe("AC-001-4 서버: 이벤트가 없으면 빈 배열이다", () => {
  it("0건", async () => {
    expect(await listEvents()).toEqual([]);
  });
});

describe("AC-002-5 서버: 없는 이벤트 ID 는 null 이다", () => {
  it("getEvent(없는 id)", async () => {
    expect(await getEvent("no-such-id")).toBeNull();
  });
  it("있는 id 는 통신사 이름·기간·내용을 돌려준다 (AC-002-1)", async () => {
    await mk("e1");
    const e = await getEvent("e1");
    expect(e).toMatchObject({ id: "e1", carrier: "통신사 A", content: "내용-e1", status: "open" });
    expect(e!.startsAt).toBeTruthy();
    expect(e!.endsAt).toBeTruthy();
  });
});
