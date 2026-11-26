import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetAndSeed } from "@/lib/seed";
import { failNext, delayNext, resetHooks } from "@/lib/testHooks";
import { setClock } from "@/lib/clock";
import { setAdminCodeOverride } from "@/lib/adminCode";
import { clearSessions } from "@/lib/adminSession";
import { clearDb } from "@/test/db";
import { POST as login, DELETE as logout } from "./session/route";
import { GET as list, POST as create } from "./events/route";
import { PATCH as patch } from "./events/[id]/route";
import { POST as close } from "./events/[id]/close/route";

const CODE = "unit-code";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const json = (url: string, method: string, body?: unknown, cookie?: string) =>
  new Request(`http://x${url}`, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const valid = { carrierId: "carrier-a", title: "새 이벤트", startsAt: "2026-11-01", endsAt: "2099-12-31", content: "내용" };

async function signIn(): Promise<string> {
  const res = await login(json("/api/admin/session", "POST", { code: CODE }));
  const set = res.headers.get("set-cookie") ?? "";
  return set.split(";")[0];
}
const count = () => prisma.event.count();

beforeEach(async () => {
  resetHooks();
  await clearSessions();
  setAdminCodeOverride(CODE);
  await resetAndSeed(prisma, "default");
});
afterAll(async () => {
  resetHooks();
  await clearSessions();
  await clearDb();
  await prisma.$disconnect();
});

describe("AC-008-2 올바른 접근 코드면 세션 쿠키를 준다", () => {
  it("200 + 브라우저 종료 시 사라지는 세션 쿠키(Max-Age·Expires 없음, HttpOnly)", async () => {
    const res = await login(json("/api/admin/session", "POST", { code: CODE }));
    expect(res.status).toBe(200);
    const set = res.headers.get("set-cookie")!;
    expect(set).toMatch(/^admin_session=[0-9a-f]+/);
    expect(set).toMatch(/HttpOnly/i);
    expect(set).not.toMatch(/Max-Age|Expires/i);
  });
});

describe("AC-008-3 틀린 접근 코드는 거부한다", () => {
  it("401, 쿠키 없음", async () => {
    const res = await login(json("/api/admin/session", "POST", { code: "wrong" }));
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
  it("코드가 비어 있거나 본문이 깨져도 401", async () => {
    expect((await login(json("/api/admin/session", "POST", { code: "" }))).status).toBe(401);
    expect((await login(new Request("http://x/api/admin/session", { method: "POST", body: "{" }))).status).toBe(401);
  });
});

describe("AC-008-6 미확인 세션의 등록 요청은 거부되고 행은 늘지 않는다", () => {
  it("401 또는 403", async () => {
    const before = await count();
    const res = await create(json("/api/admin/events", "POST", valid));
    expect([401, 403]).toContain(res.status);
    expect(await count()).toBe(before);
  });
});
describe("AC-008-7 미확인 세션의 수정 요청은 거부되고 저장값은 그대로이다", () => {
  it("401 또는 403", async () => {
    const res = await patch(json("/api/admin/events/evt-a1", "PATCH", { title: "무단" }), ctx("evt-a1"));
    expect([401, 403]).toContain(res.status);
    expect((await prisma.event.findUnique({ where: { id: "evt-a1" } }))!.title).not.toBe("무단");
  });
});
describe("AC-008-8 미확인 세션의 종료 요청은 거부되고 진행 중 그대로이다", () => {
  it("401 또는 403", async () => {
    const res = await close(json("/api/admin/events/evt-a1/close", "POST"), ctx("evt-a1"));
    expect([401, 403]).toContain(res.status);
    expect((await prisma.event.findUnique({ where: { id: "evt-a1" } }))!.closedAt).toBeNull();
  });
});
describe("AC-008-4 미확인 세션은 목록 API 도 거부한다", () => {
  it("401", async () => {
    expect((await list(json("/api/admin/events", "GET"))).status).toBe(401);
  });
});

describe("AC-008-16 만료된 세션의 저장 요청은 거부되고 행은 늘지 않는다", () => {
  it("31분 뒤 POST → 401, 행 불변", async () => {
    const t = Date.now();
    setClock(new Date(t).toISOString());
    const cookie = await signIn();
    const before = await count();
    setClock(new Date(t + 31 * 60_000).toISOString());
    const res = await create(json("/api/admin/events", "POST", valid, cookie));
    expect(res.status).toBe(401);
    expect(await count()).toBe(before);
  });
});

describe("AC-008-13·14 로그아웃하면 같은 쿠키는 더 이상 통하지 않는다", () => {
  it("DELETE 후 목록 401, 쿠키 비움", async () => {
    const cookie = await signIn();
    expect((await list(json("/api/admin/events", "GET", undefined, cookie))).status).toBe(200);
    const out = await logout(json("/api/admin/session", "DELETE", undefined, cookie));
    expect(out.status).toBe(200);
    expect(out.headers.get("set-cookie")).toMatch(/Max-Age=0/i);
    expect((await list(json("/api/admin/events", "GET", undefined, cookie))).status).toBe(401);
  });
});

describe("AC-008-12 접근 코드가 바뀌면 기존 쿠키는 거부된다", () => {
  it("코드 변경 후 목록 401", async () => {
    const cookie = await signIn();
    setAdminCodeOverride("changed");
    expect((await list(json("/api/admin/events", "GET", undefined, cookie))).status).toBe(401);
  });
});

describe("AC-005-2 확인한 세션의 등록 요청은 이벤트를 1건 늘린다", () => {
  it("201 + id", async () => {
    const cookie = await signIn();
    const before = await count();
    const res = await create(json("/api/admin/events", "POST", valid, cookie));
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBeTruthy();
    expect(await count()).toBe(before + 1);
  });
});
describe("AC-005-4 제목이 비면 400 이고 행은 늘지 않는다", () => {
  it("400 + errors.title", async () => {
    const cookie = await signIn();
    const before = await count();
    const res = await create(json("/api/admin/events", "POST", { ...valid, title: "" }, cookie));
    expect(res.status).toBe(400);
    expect((await res.json()).errors.title).toBe("제목을 입력해 주세요");
    expect(await count()).toBe(before);
  });
});
describe("AC-005-5 저장 응답 지연을 주입할 수 있다", () => {
  it("delay-next 가 등록 요청을 늦춘다", async () => {
    const cookie = await signIn();
    delayNext("/api/admin/events", 200);
    const t = Date.now();
    await create(json("/api/admin/events", "POST", valid, cookie));
    expect(Date.now() - t).toBeGreaterThanOrEqual(190);
  });
});
describe("AC-005-6 서버 오류 주입 시 저장하지 않는다", () => {
  it("fail-next → 500, 행 불변", async () => {
    const cookie = await signIn();
    const before = await count();
    failNext("/api/admin/events", 500);
    const res = await create(json("/api/admin/events", "POST", valid, cookie));
    expect(res.status).toBe(500);
    expect(await count()).toBe(before);
  });
});
describe("AC-005-7·8·9 목록 API", () => {
  it("이벤트 전부(종료 포함)를 돌려준다", async () => {
    const cookie = await signIn();
    const body = await (await list(json("/api/admin/events", "GET", undefined, cookie))).json();
    expect(body.events).toHaveLength(5);
    expect(body.events.map((e: { status: string }) => e.status)).toContain("closed");
    expect(body.carriers).toHaveLength(3);
  });
  it("0건이면 빈 배열", async () => {
    await resetAndSeed(prisma, "empty");
    const cookie = await signIn();
    expect((await (await list(json("/api/admin/events", "GET", undefined, cookie))).json()).events).toEqual([]);
  });
  it("지연·오류 주입(AC-005-8·9)", async () => {
    const cookie = await signIn();
    failNext("/api/admin/events", 500);
    expect((await list(json("/api/admin/events", "GET", undefined, cookie))).status).toBe(500);
  });
});

describe("AC-006-2·3·6 수정 요청", () => {
  it("이후 날짜로 수정 → 200", async () => {
    const cookie = await signIn();
    const res = await patch(json("/api/admin/events/evt-a1", "PATCH", { endsAt: "2099-01-01" }, cookie), ctx("evt-a1"));
    expect(res.status).toBe(200);
  });
  it("어제로 수정 → 400 + 문구", async () => {
    const cookie = await signIn();
    const res = await patch(json("/api/admin/events/evt-a1", "PATCH", { endsAt: "2000-01-01" }, cookie), ctx("evt-a1"));
    expect(res.status).toBe(400);
    expect((await res.json()).errors.endsAt).toBe("종료 예정일은 오늘 이전으로 바꿀 수 없습니다");
  });
  it("종료된 이벤트의 종료 예정일 변경 → 409, 저장값 그대로", async () => {
    const cookie = await signIn();
    const before = (await prisma.event.findUnique({ where: { id: "evt-b-closed" } }))!.endsAt;
    const res = await patch(json("/api/admin/events/evt-b-closed", "PATCH", { endsAt: "2099-01-01" }, cookie), ctx("evt-b-closed"));
    expect(res.status).toBe(409);
    expect((await prisma.event.findUnique({ where: { id: "evt-b-closed" } }))!.endsAt).toEqual(before);
  });
  it("없는 이벤트 → 404", async () => {
    const cookie = await signIn();
    expect((await patch(json("/api/admin/events/zzz", "PATCH", { title: "x" }, cookie), ctx("zzz"))).status).toBe(404);
  });
});

describe("AC-007-2 종료 요청", () => {
  it("200 후 종료 상태, 다시 종료하면 409", async () => {
    const cookie = await signIn();
    const res = await close(json("/api/admin/events/evt-a1/close", "POST", undefined, cookie), ctx("evt-a1"));
    expect(res.status).toBe(200);
    expect((await prisma.event.findUnique({ where: { id: "evt-a1" } }))!.closedAt).not.toBeNull();
    expect((await close(json("/api/admin/events/evt-a1/close", "POST", undefined, cookie), ctx("evt-a1"))).status).toBe(409);
  });
  it("없는 이벤트 → 404", async () => {
    const cookie = await signIn();
    expect((await close(json("/api/admin/events/zzz/close", "POST", undefined, cookie), ctx("zzz"))).status).toBe(404);
  });
});
