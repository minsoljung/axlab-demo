import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetAndSeed } from "@/lib/seed";
import { failNext, resetHooks } from "@/lib/testHooks";
import { clearDb } from "@/test/db";
import { GET as list } from "./route";
import { GET as one } from "./[id]/route";

beforeEach(async () => {
  resetHooks();
  await resetAndSeed(prisma, "default");
});
afterAll(async () => {
  resetHooks();
  await clearDb();
  await prisma.$disconnect();
});

describe("AC-001-1 GET /api/events", () => {
  it("이벤트와 통신사 3곳을 돌려준다", async () => {
    const res = await list(new Request("http://x/api/events"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events.length).toBeGreaterThanOrEqual(4);
    expect(body.events[0]).toHaveProperty("title");
    expect(body.carriers.map((c: { name: string }) => c.name).sort()).toEqual(["통신사 A", "통신사 B", "통신사 C"]);
  });
});
describe("AC-001-6 / AC-002-7 서버 오류 주입", () => {
  it("fail-next 후 첫 요청만 500", async () => {
    failNext("/api/events", 500);
    expect((await list(new Request("http://x/api/events"))).status).toBe(500);
    expect((await list(new Request("http://x/api/events"))).status).toBe(200);
  });
});
describe("AC-002-1·002-5 GET /api/events/:id", () => {
  it("있으면 200 + event", async () => {
    const res = await one(new Request("http://x/api/events/evt-a1"), { params: Promise.resolve({ id: "evt-a1" }) });
    expect(res.status).toBe(200);
    expect((await res.json()).event).toMatchObject({ id: "evt-a1", carrier: "통신사 A", status: "open" });
  });
  it("없으면 404", async () => {
    const res = await one(new Request("http://x/api/events/zzz"), { params: Promise.resolve({ id: "zzz" }) });
    expect(res.status).toBe(404);
  });
});
