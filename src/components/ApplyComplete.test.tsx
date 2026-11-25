// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApplyComplete } from "@/components/ApplyComplete";

describe("AC-004-2 응모 완료 화면에 응모 완료가 보인다", () => {
  it("문구는 한 요소에만 있다", () => {
    render(<ApplyComplete id="evt-1" />);
    expect(screen.getAllByText("응모 완료")).toHaveLength(1);
  });
});
describe("AC-004-14 목록으로 가는 동작은 SCR-01 로 간다", () => {
  it("href=/", () => {
    render(<ApplyComplete id="evt-1" />);
    expect(screen.getByRole("link", { name: "목록으로" }).getAttribute("href")).toBe("/");
  });
});
describe("AC-004-15 이벤트 상세로 가는 동작은 SCR-02 로 간다", () => {
  it("href=/events/:id", () => {
    render(<ApplyComplete id="evt-1" />);
    expect(screen.getByRole("link", { name: "이벤트 상세로" }).getAttribute("href")).toBe("/events/evt-1");
  });
});
