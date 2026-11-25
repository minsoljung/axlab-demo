// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventHub } from "@/components/EventHub";
import { jsonResponse, makeEvent } from "@/test/fixtures";

function stubFetch(impl: () => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
}
afterEach(() => vi.unstubAllGlobals());

describe("AC-001-1 진행 중 이벤트의 제목과 통신사 이름이 목록에 보인다", () => {
  it("제목과 통신사 이름", async () => {
    stubFetch(async () =>
      jsonResponse({ events: [makeEvent({ title: "챗봇 체험단 모집", carrier: "통신사 A" })] }),
    );
    render(<EventHub />);
    const link = await screen.findByRole("link", { name: "챗봇 체험단 모집" });
    const item = link.closest("li")!;
    expect(item.textContent).toContain("통신사 A");
  });
});

describe("AC-001-2 종료된 이벤트 항목에 종료 표시가 보인다", () => {
  it("종료 배지", async () => {
    stubFetch(async () =>
      jsonResponse({
        events: [
          makeEvent({ id: "o", title: "진행 이벤트" }),
          makeEvent({ id: "c", title: "끝난 이벤트", status: "closed" }),
        ],
      }),
    );
    render(<EventHub />);
    const closed = (await screen.findByRole("link", { name: "끝난 이벤트" })).closest("li")!;
    expect(closed.textContent).toContain("종료");
    const open = screen.getByRole("link", { name: "진행 이벤트" }).closest("li")!;
    expect(open.textContent).not.toContain("종료");
  });
});

describe("AC-001-3 진행 중 이벤트를 선택하면 SCR-02 로 이동한다", () => {
  it("항목 링크 = 상세 경로", async () => {
    stubFetch(async () => jsonResponse({ events: [makeEvent({ id: "evt-9", title: "음성 비서" })] }));
    render(<EventHub />);
    const link = await screen.findByRole("link", { name: "음성 비서" });
    expect(link.getAttribute("href")).toBe("/events/evt-9");
  });
});

describe("AC-001-4 이벤트가 0건이면 빈 상태 문구가 보인다", () => {
  it("진행 중인 이벤트가 없습니다", async () => {
    stubFetch(async () => jsonResponse({ events: [] }));
    render(<EventHub />);
    expect(await screen.findByText("진행 중인 이벤트가 없습니다")).toBeTruthy();
  });
});

describe("AC-001-5 목록 응답이 지연되는 동안 불러오는 중이 보인다", () => {
  it("로딩 문구", async () => {
    stubFetch(() => new Promise<Response>(() => {}));
    render(<EventHub />);
    expect(await screen.findByText("불러오는 중")).toBeTruthy();
  });
});

describe("AC-001-6 목록 요청이 서버 오류로 실패하면 오류 문구가 보인다", () => {
  it("이벤트를 불러오지 못했습니다", async () => {
    stubFetch(async () => jsonResponse({ error: "boom" }, 500));
    render(<EventHub />);
    expect(await screen.findByText("이벤트를 불러오지 못했습니다")).toBeTruthy();
  });
});

const carriers = [
  { id: "carrier-a", name: "통신사 A" },
  { id: "carrier-b", name: "통신사 B" },
  { id: "carrier-c", name: "통신사 C" },
];
const mixed = () => [
  makeEvent({ id: "a1", title: "에이 이벤트", carrierId: "carrier-a", carrier: "통신사 A" }),
  makeEvent({ id: "b1", title: "비 이벤트", carrierId: "carrier-b", carrier: "통신사 B" }),
];

describe("AC-003-1 통신사 필터에 선택지 3개가 보인다", () => {
  it("통신사 A·B·C", async () => {
    stubFetch(async () => jsonResponse({ events: mixed(), carriers }));
    render(<EventHub />);
    await screen.findByRole("link", { name: "에이 이벤트" });
    const group = screen.getByRole("group", { name: "통신사 필터" });
    const opts = within(group).getAllByRole("button");
    expect(opts.every((o) => o.getAttribute("aria-pressed") === "false")).toBe(true);
    expect(opts.map((o) => o.getAttribute("aria-label"))).toEqual(["통신사 A", "통신사 B", "통신사 C"]);
  });
});

describe("AC-003-2 통신사를 선택하면 그 통신사 이벤트만 보인다", () => {
  it("B 선택 → B 만, 다시 누르면 해제", async () => {
    stubFetch(async () => jsonResponse({ events: mixed(), carriers }));
    render(<EventHub />);
    await screen.findByRole("link", { name: "에이 이벤트" });
    await userEvent.click(screen.getByRole("button", { name: "통신사 B" }));
    expect(screen.queryByRole("link", { name: "에이 이벤트" })).toBeNull();
    expect(screen.getByRole("link", { name: "비 이벤트" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "통신사 B" }));
    expect(screen.getByRole("link", { name: "에이 이벤트" })).toBeTruthy();
  });
});

describe("AC-003-3 선택한 통신사 이벤트가 0건이면 안내가 보인다", () => {
  it("해당 통신사의 이벤트가 없습니다", async () => {
    stubFetch(async () => jsonResponse({ events: mixed(), carriers }));
    render(<EventHub />);
    await screen.findByRole("link", { name: "에이 이벤트" });
    await userEvent.click(screen.getByRole("button", { name: "통신사 C" }));
    expect(screen.getByText("해당 통신사의 이벤트가 없습니다")).toBeTruthy();
    expect(screen.queryByText("진행 중인 이벤트가 없습니다")).toBeNull();
  });
});

describe("AC-003-4 통신사를 선택해도 URL 경로는 그대로이다", () => {
  it("history 변경 없음", async () => {
    stubFetch(async () => jsonResponse({ events: mixed(), carriers }));
    window.history.replaceState(null, "", "/");
    const before = window.location.href;
    const push = vi.spyOn(window.history, "pushState");
    render(<EventHub />);
    await screen.findByRole("link", { name: "에이 이벤트" });
    await userEvent.click(screen.getByRole("button", { name: "통신사 A" }));
    expect(window.location.href).toBe(before);
    expect(push).not.toHaveBeenCalled();
  });
});
