import { describe, it, expect, beforeEach, afterAll, afterEach } from "vitest";
import { prisma } from "@/lib/db";
import { createAdminEvent, updateAdminEvent, closeAdminEvent } from "@/lib/adminEvents";
import { listEvents, getEvent } from "@/lib/events";
import { setClock } from "@/lib/clock";
import { kstYmd } from "@/lib/kst";
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

const valid = { carrierId: "carrier-a", title: "새 이벤트", startsAt: "2026-11-01", endsAt: "2026-12-31", content: "내용" };
async function mk(id: string, over: Record<string, unknown> = {}) {
  return prisma.event.create({
    data: { id, title: `제목-${id}`, content: `내용-${id}`, carrierId: "carrier-a", startsAt: day(-5), endsAt: day(30), ...over },
  });
}
const today = () => kstYmd(new Date());
const addDays = (ymd: string, n: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

describe("AC-005-2 서버: 모두 입력해 저장하면 이벤트가 1건 늘고 목록에 보인다", () => {
  it("저장 → 행 +1, 통신사·제목·기간 반영", async () => {
    const r = await createAdminEvent(valid);
    expect(r.ok).toBe(true);
    expect(await prisma.event.count()).toBe(1);
    const list = await listEvents();
    expect(list[0]).toMatchObject({ title: "새 이벤트", carrier: "통신사 A", status: "open" });
    expect(kstYmd(new Date(list[0].endsAt))).toBe("2026-12-31");
    expect(kstYmd(new Date(list[0].startsAt))).toBe("2026-11-01");
  });
  it("e2e 가정 본문(carrier = 통신사 이름)도 받는다", async () => {
    const r = await createAdminEvent({ ...valid, carrierId: undefined, carrier: "통신사 B" });
    expect(r.ok).toBe(true);
    expect((await listEvents())[0].carrier).toBe("통신사 B");
  });
});

describe("AC-005-3 서버: 등록한 이벤트는 방문자 목록(listEvents)에 제목이 보인다", () => {
  it("방문자 목록에 새 제목", async () => {
    await createAdminEvent(valid);
    expect((await listEvents()).map((e) => e.title)).toContain("새 이벤트");
  });
});

describe("AC-005-4 서버: 제목이 비어 있으면 저장하지 않는다", () => {
  it("빈 제목 → invalid 와 문구, 행 0", async () => {
    const r = await createAdminEvent({ ...valid, title: "  " });
    expect(r).toMatchObject({ ok: false, reason: "invalid", errors: { title: "제목을 입력해 주세요" } });
    expect(await prisma.event.count()).toBe(0);
  });
  it("통신사·기간·내용이 비어도 거부한다", async () => {
    const r = await createAdminEvent({ title: "x" });
    expect(r).toMatchObject({
      ok: false,
      reason: "invalid",
      errors: { carrierId: "통신사를 선택해 주세요", period: "기간을 입력해 주세요", content: "내용을 입력해 주세요" },
    });
  });
});

describe("AC-006-1 서버: 수정 대상의 기존 값을 돌려준다", () => {
  it("getEvent 가 제목·통신사·기간·내용을 준다", async () => {
    await mk("e1");
    expect(await getEvent("e1")).toMatchObject({ title: "제목-e1", content: "내용-e1", carrierId: "carrier-a" });
  });
});

describe("AC-006-2 서버: 종료 예정일을 오늘(KST) 또는 이후로 바꾸면 저장된다", () => {
  it("오늘로 바꿔도 진행 중이고 날짜가 바뀐다", async () => {
    await mk("e1");
    const r = await updateAdminEvent("e1", { endsAt: today() });
    expect(r.ok).toBe(true);
    const e = (await getEvent("e1"))!;
    expect(kstYmd(new Date(e.endsAt))).toBe(today());
    expect(e.status).toBe("open");
  });
  it("이후 날짜로 바꾸면 저장된다", async () => {
    await mk("e1");
    const later = addDays(today(), 60);
    expect((await updateAdminEvent("e1", { endsAt: later })).ok).toBe(true);
    expect(kstYmd(new Date((await getEvent("e1"))!.endsAt))).toBe(later);
  });
  it("경계: 서버 시계의 KST 오늘은 허용한다", async () => {
    await mk("e1", { endsAt: new Date("2026-12-31T00:00:00Z") });
    setClock("2026-12-20T15:30:00Z"); // KST 12-21 00:30
    expect((await updateAdminEvent("e1", { endsAt: "2026-12-21" })).ok).toBe(true);
  });
});

describe("AC-006-3 서버: 종료 예정일을 어제(KST) 이전으로 바꾸면 거부한다", () => {
  it("어제 → invalid 와 문구, 저장값 그대로", async () => {
    const before = (await mk("e1")).endsAt;
    const r = await updateAdminEvent("e1", { endsAt: addDays(today(), -1) });
    expect(r).toMatchObject({ ok: false, reason: "invalid", errors: { endsAt: "종료 예정일은 오늘 이전으로 바꿀 수 없습니다" } });
    expect((await prisma.event.findUnique({ where: { id: "e1" } }))!.endsAt).toEqual(before);
  });
  it("경계: UTC 로는 오늘이지만 KST 로는 어제인 날짜는 거부한다", async () => {
    await mk("e1", { endsAt: new Date("2026-12-31T00:00:00Z") });
    setClock("2026-12-20T15:30:00Z"); // KST 12-21
    const r = await updateAdminEvent("e1", { endsAt: "2026-12-20" });
    expect(r).toMatchObject({ ok: false, reason: "invalid" });
  });
});

describe("AC-006-6 서버: 종료된 이벤트의 종료 예정일 변경은 저장되지 않는다", () => {
  it("수동 종료 이벤트 → closed, 값 그대로", async () => {
    const before = (await mk("e1", { closedAt: new Date() })).endsAt;
    const r = await updateAdminEvent("e1", { endsAt: addDays(today(), 50) });
    expect(r).toEqual({ ok: false, reason: "closed" });
    expect((await prisma.event.findUnique({ where: { id: "e1" } }))!.endsAt).toEqual(before);
  });
  it("기간 만료 이벤트도 같다", async () => {
    await mk("e2", { endsAt: day(-3) });
    expect(await updateAdminEvent("e2", { endsAt: addDays(today(), 50) })).toEqual({ ok: false, reason: "closed" });
  });
  it("없는 이벤트 = not_found", async () => {
    expect(await updateAdminEvent("zzz", { title: "x" })).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("AC-007-2 서버: 종료하면 상태가 종료로 바뀌고 기준일이 고정된다", () => {
  it("closedAt·purgeBaseDate 기록, status closed", async () => {
    const at = new Date("2026-11-25T03:00:00Z");
    await mk("e1", { endsAt: new Date("2026-12-31T00:00:00Z") });
    setClock(at.toISOString());
    expect(await closeAdminEvent("e1")).toEqual({ ok: true });
    const row = (await prisma.event.findUnique({ where: { id: "e1" } }))!;
    expect(row.closedAt).toEqual(at);
    expect(row.purgeBaseDate).toEqual(at); // min(종료 예정일, 종료 처리일)
    expect((await getEvent("e1"))!.status).toBe("closed");
  });
  it("이미 종료된 이벤트·없는 이벤트는 거부한다(재개·재종료 없음, A-21)", async () => {
    await mk("e1", { closedAt: new Date(), purgeBaseDate: new Date() });
    expect(await closeAdminEvent("e1")).toEqual({ ok: false, reason: "already_closed" });
    await mk("e2", { endsAt: day(-3) });
    expect(await closeAdminEvent("e2")).toEqual({ ok: false, reason: "already_closed" });
    expect(await closeAdminEvent("zzz")).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("AC-007-3 서버: 종료하지 않으면 진행 중 그대로다", () => {
  it("종료 호출이 없으면 closedAt 없음", async () => {
    await mk("e1");
    expect((await prisma.event.findUnique({ where: { id: "e1" } }))!.closedAt).toBeNull();
    expect((await getEvent("e1"))!.status).toBe("open");
  });
});
