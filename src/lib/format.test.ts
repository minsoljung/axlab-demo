import { describe, it, expect } from "vitest";
import { formatPeriod } from "./format";

describe("AC-005-2·AC-006-2 관리자가 저장한 KST 날짜가 방문자 화면에도 같은 날짜로 보인다", () => {
  it("KST 0시 시작·KST 23:59 종료도 입력한 날짜로 표기한다", () => {
    expect(formatPeriod("2026-10-31T15:00:00.000Z", "2026-12-31T14:59:59.999Z")).toBe("2026-11-01 ~ 2026-12-31");
  });
});
