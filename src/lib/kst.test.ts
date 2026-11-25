import { describe, it, expect } from "vitest";
import { kstYmd, startOfKstDay, endOfKstDay, isYmd } from "./kst";

describe("AC-006-2·AC-006-3 종료 예정일 비교는 KST 달력 날짜", () => {
  it("UTC 15:00 이후는 KST 로 다음 날이다", () => {
    expect(kstYmd(new Date("2026-11-25T14:59:59Z"))).toBe("2026-11-25");
    expect(kstYmd(new Date("2026-11-25T15:00:00Z"))).toBe("2026-11-26");
  });
  it("KST 하루의 처음과 끝은 같은 KST 날짜로 돌아온다", () => {
    expect(kstYmd(startOfKstDay("2026-12-31"))).toBe("2026-12-31");
    expect(kstYmd(endOfKstDay("2026-12-31"))).toBe("2026-12-31");
    expect(endOfKstDay("2026-12-31").getTime()).toBeGreaterThan(startOfKstDay("2026-12-31").getTime());
  });
  it("YYYY-MM-DD 만 날짜로 본다", () => {
    expect(isYmd("2026-02-28")).toBe(true);
    expect(isYmd("2026-02-30")).toBe(false);
    expect(isYmd("2026.02.28")).toBe(false);
    expect(isYmd("")).toBe(false);
  });
});
