import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { validateApplication, createApplication } from "@/lib/application";
import { clearDb, seedCarriers, day } from "@/test/db";

const good = { name: "홍길동", phone: "01012345678", consent: true };

beforeEach(async () => {
  await clearDb();
  await seedCarriers();
  for (const [id, over] of [
    ["e1", {}],
    ["e2", {}],
    ["old", { endsAt: day(-1) }],
  ] as const) {
    await prisma.event.create({
      data: { id, title: id, content: id, carrierId: "carrier-a", startsAt: day(-5), endsAt: day(30), ...over },
    });
  }
});
afterAll(async () => {
  await clearDb();
  await prisma.$disconnect();
});
const count = (eventId: string) => prisma.entry.count({ where: { eventId } });

describe("AC-004-4 이름이 비어 있으면 오류", () => {
  it("검증 + 응모 행 불변", async () => {
    const v = validateApplication({ ...good, name: "  " });
    expect(v).toEqual({ ok: false, errors: { name: "이름을 입력해 주세요" } });
    const r = await createApplication("e1", { ...good, name: "" });
    expect(r.ok).toBe(false);
    expect(await count("e1")).toBe(0);
  });
});

describe("AC-004-5 휴대전화번호에 숫자가 아닌 값이면 오류", () => {
  it("abc", async () => {
    expect(validateApplication({ ...good, phone: "abc" })).toEqual({
      ok: false,
      errors: { phone: "휴대전화번호를 확인해 주세요" },
    });
    expect((await createApplication("e1", { ...good, phone: "abc" })).ok).toBe(false);
    expect(await count("e1")).toBe(0);
  });
  it("하이픈은 허용하고 숫자만으로 정규화한다", () => {
    expect(validateApplication({ ...good, phone: "010-1234-5678" })).toEqual({ ok: true, phone: "01012345678" });
  });
});

describe("AC-004-6 동의를 체크하지 않으면 오류", () => {
  it("동의 없음", async () => {
    expect(validateApplication({ ...good, consent: false })).toEqual({
      ok: false,
      errors: { consent: "개인정보 수집·이용에 동의해 주세요" },
    });
    expect((await createApplication("e1", { ...good, consent: false })).ok).toBe(false);
    expect(await count("e1")).toBe(0);
  });
  it("오류는 해당하는 것을 동시에 모두 낸다", () => {
    const v = validateApplication({ name: "", phone: "abc", consent: false });
    expect(v.ok === false && Object.keys(v.errors).sort()).toEqual(["consent", "name", "phone"]);
  });
});

describe("AC-004-3 제출하면 그 이벤트의 응모 행이 1건 늘어난다", () => {
  it("+1, 방문자 ID 필드 없음", async () => {
    const r = await createApplication("e1", good);
    expect(r).toEqual({ ok: true });
    expect(await count("e1")).toBe(1);
    const row = await prisma.entry.findFirst();
    expect(row).toMatchObject({ name: "홍길동", phone: "01012345678" });
    expect(Object.keys(row!).sort()).toEqual(["consentAt", "createdAt", "eventId", "id", "name", "phone"]);
  });
});

describe("AC-004-7 같은 이벤트에 같은 번호는 다시 응모할 수 없다", () => {
  it("duplicate, 행 불변", async () => {
    await createApplication("e1", good);
    const r = await createApplication("e1", { ...good, name: "다른이름" });
    expect(r).toEqual({ ok: false, reason: "duplicate", errors: { phone: "이미 응모한 번호입니다" } });
    expect(await count("e1")).toBe(1);
  });
  it("하이픈 표기가 달라도 같은 번호로 본다", async () => {
    await createApplication("e1", good);
    const r = await createApplication("e1", { ...good, phone: "010-1234-5678" });
    expect(r.ok).toBe(false);
  });
});

describe("AC-004-8 다른 이벤트에 응모한 번호로 이 이벤트에 응모할 수 있다", () => {
  it("e1 응모 뒤 e2 성공", async () => {
    await createApplication("e1", good);
    expect(await createApplication("e2", good)).toEqual({ ok: true });
    expect(await count("e2")).toBe(1);
  });
});

describe("AC-004-10 종료된 이벤트에 응모 요청을 보내면 행이 늘지 않는다", () => {
  it("기간 만료 이벤트", async () => {
    const r = await createApplication("old", good);
    expect(r).toMatchObject({ ok: false, reason: "closed" });
    expect(await count("old")).toBe(0);
  });
  it("수동 종료 이벤트", async () => {
    await prisma.event.update({ where: { id: "e1" }, data: { closedAt: day(-1) } });
    expect(await createApplication("e1", good)).toMatchObject({ ok: false, reason: "closed" });
    expect(await count("e1")).toBe(0);
  });
  it("없는 이벤트", async () => {
    expect(await createApplication("nope", good)).toMatchObject({ ok: false, reason: "not_found" });
  });
});
