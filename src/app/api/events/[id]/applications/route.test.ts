import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { POST } from "./route";
import { clearDb, seedCarriers, day } from "@/test/db";

const good = { name: "홍길동", phone: "01012345678", consent: true };
const call = (id: string, body: unknown) =>
  POST(
    new Request(`http://x/api/events/${id}/applications`, { method: "POST", body: JSON.stringify(body) }),
    { params: Promise.resolve({ id }) },
  );

beforeEach(async () => {
  await clearDb();
  await seedCarriers();
  await prisma.event.create({ data: { id: "e1", title: "t", content: "c", carrierId: "carrier-a", startsAt: day(-5), endsAt: day(30) } });
  await prisma.event.create({ data: { id: "old", title: "t", content: "c", carrierId: "carrier-a", startsAt: day(-50), endsAt: day(-1) } });
});
afterAll(async () => {
  await clearDb();
  await prisma.$disconnect();
});

describe("AC-004-3 POST /api/events/:id/applications", () => {
  it("201 이고 행이 1건 늘어난다", async () => {
    const res = await call("e1", good);
    expect(res.status).toBe(201);
    expect(await prisma.entry.count()).toBe(1);
  });
});
describe("AC-004-7 중복은 409", () => {
  it("409 + errors.phone", async () => {
    await call("e1", good);
    const res = await call("e1", good);
    expect(res.status).toBe(409);
    expect((await res.json()).errors.phone).toBe("이미 응모한 번호입니다");
    expect(await prisma.entry.count()).toBe(1);
  });
});
describe("AC-004-10 종료된 이벤트는 403", () => {
  it("403 이고 행 불변", async () => {
    const res = await call("old", good);
    expect(res.status).toBe(403);
    expect(await prisma.entry.count()).toBe(0);
  });
});
describe("AC-004-4~6 검증 실패는 400", () => {
  it("400 + errors", async () => {
    const res = await call("e1", { name: "", phone: "abc", consent: false });
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).errors).sort()).toEqual(["consent", "name", "phone"]);
    expect(await prisma.entry.count()).toBe(0);
  });
  it("본문이 JSON 이 아니면 400", async () => {
    const res = await POST(new Request("http://x", { method: "POST", body: "zzz" }), { params: Promise.resolve({ id: "e1" }) });
    expect(res.status).toBe(400);
  });
});
describe("없는 이벤트는 404", () => {
  it("404", async () => {
    expect((await call("nope", good)).status).toBe(404);
  });
});
