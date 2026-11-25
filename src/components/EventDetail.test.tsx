// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventDetail } from "@/components/EventDetail";
import { jsonResponse, makeEvent } from "@/test/fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
});
const stub = (impl: () => Promise<Response>) => vi.stubGlobal("fetch", vi.fn(impl));
const okEvent = (over = {}) => stub(async () => jsonResponse({ event: makeEvent(over) }));

describe("AC-002-1 진행 중 이벤트 상세에 통신사 이름·기간·내용이 보인다", () => {
  it("통신사·기간·내용·제목 제목요소", async () => {
    okEvent({ title: "음성 비서", carrier: "통신사 B", content: "경품 드립니다", startsAt: "2026-11-01T00:00:00.000Z", endsAt: "2026-12-31T00:00:00.000Z" });
    render(<EventDetail id="evt-1" />);
    expect(await screen.findByRole("heading", { name: "음성 비서" })).toBeTruthy();
    expect(screen.getByText("통신사 B")).toBeTruthy();
    expect(screen.getByText("2026-11-01 ~ 2026-12-31")).toBeTruthy();
    expect(screen.getByText("경품 드립니다")).toBeTruthy();
  });
});

describe("AC-002-2 진행 중 이벤트의 응모 버튼은 활성이다", () => {
  it("enabled", async () => {
    okEvent();
    render(<EventDetail id="evt-1" />);
    const b = await screen.findByRole("button", { name: "응모하기" });
    expect(b.getAttribute("aria-disabled")).not.toBe("true");
  });
});

describe("AC-002-3 응모 버튼을 누르면 SCR-03 으로 이동한다", () => {
  it("/events/:id/apply", async () => {
    okEvent({ id: "evt-7" });
    render(<EventDetail id="evt-7" />);
    await userEvent.click(await screen.findByRole("button", { name: "응모하기" }));
    expect(push).toHaveBeenCalledWith("/events/evt-7/apply");
  });
});

describe("AC-002-4 종료된 이벤트는 종료 표시와 비활성 응모 버튼", () => {
  it("배지·disabled", async () => {
    okEvent({ status: "closed" });
    render(<EventDetail id="evt-1" />);
    const b = await screen.findByRole("button", { name: "응모하기" });
    // astryx 는 비활성을 aria-disabled 로 낸다 (Playwright toBeDisabled 가 같은 속성을 비활성으로 본다)
    expect(b.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText("종료")).toBeTruthy();
  });
});

describe("AC-002-5 없는 이벤트 ID", () => {
  it("존재하지 않는 이벤트입니다", async () => {
    stub(async () => jsonResponse({ error: "not_found" }, 404));
    render(<EventDetail id="nope" />);
    expect(await screen.findByText("존재하지 않는 이벤트입니다")).toBeTruthy();
  });
});

describe("AC-002-6 응답 지연 중 불러오는 중", () => {
  it("로딩, 응모 버튼 없음", async () => {
    stub(() => new Promise<Response>(() => {}));
    render(<EventDetail id="evt-1" />);
    expect(await screen.findByText("불러오는 중")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "응모하기" })).toBeNull();
  });
});

describe("AC-002-7 서버 오류", () => {
  it("이벤트를 불러오지 못했습니다", async () => {
    stub(async () => jsonResponse({ error: "x" }, 500));
    render(<EventDetail id="evt-1" />);
    expect(await screen.findByText("이벤트를 불러오지 못했습니다")).toBeTruthy();
  });
  // fail-next 는 "다음 1회 요청"만 실패시킨다. 마운트 때 API 를 두 번 부르거나 재시도하면 둘째가 성공해 오류를 덮는다.
  it("한 번 실패하면 API 는 한 번만 불리고 오류 상태가 유지된다", async () => {
    const f = vi.fn().mockResolvedValueOnce(jsonResponse({ error: "x" }, 500)).mockResolvedValue(jsonResponse({ event: makeEvent() }));
    vi.stubGlobal("fetch", f);
    render(<EventDetail id="evt-1" />);
    expect(await screen.findByText("이벤트를 불러오지 못했습니다")).toBeTruthy();
    await new Promise((r) => setTimeout(r, 100));
    expect(f).toHaveBeenCalledTimes(1);
    expect(screen.getByText("이벤트를 불러오지 못했습니다")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "응모하기" })).toBeNull();
  });
});

describe("AC-002-8 목록으로 링크는 SCR-01 로 간다", () => {
  it("href=/", async () => {
    okEvent();
    render(<EventDetail id="evt-1" />);
    const l = await screen.findByRole("link", { name: "목록으로" });
    expect(l.getAttribute("href")).toBe("/");
  });
});
