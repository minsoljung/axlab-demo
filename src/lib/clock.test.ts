import { describe, it, expect, afterEach } from "vitest";
import { now, setClock } from "@/lib/clock";

afterEach(() => setClock(null));

describe("TH-clock 서버 시계 고정·이동·해제", () => {
  it("고정하면 now() 가 그 시각이다", () => {
    setClock("2026-12-01T00:00:00.000Z");
    expect(now().toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });
  it("고정한 뒤 실시간이 흘러도 같은 시각(고정)이다", async () => {
    setClock("2026-12-01T00:00:00.000Z");
    await new Promise((r) => setTimeout(r, 20));
    expect(now().toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });
  it("null 로 해제하면 실제 시각이다", () => {
    setClock("2026-12-01T00:00:00.000Z");
    setClock(null);
    expect(Math.abs(now().getTime() - Date.now())).toBeLessThan(1000);
  });
  it("잘못된 시각은 거부한다", () => {
    expect(() => setClock("not-a-date")).toThrow();
  });
});
