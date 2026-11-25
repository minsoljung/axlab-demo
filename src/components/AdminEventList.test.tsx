// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminEventList } from "@/components/AdminEventList";
import { jsonResponse, makeEvent } from "@/test/fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
});

const open = makeEvent({ id: "e1", title: "진행 이벤트", status: "open", endsAt: "2026-12-31T14:59:59.999Z" });
const closed = makeEvent({ id: "e2", title: "끝난 이벤트", status: "closed" });
type Fn = (url: string, init?: RequestInit) => Promise<Response>;
function stub(handler: Fn) {
  const f = vi.fn(handler);
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return f;
}
const listOk = (events = [open, closed]): Fn => async () => jsonResponse({ events, carriers: [] });
const rowOf = (t: string) => screen.getByText(t).closest("tr") as HTMLElement;

describe("AC-005-7 이벤트가 0건이면 빈 목록 문구가 보인다", () => {
  it("등록된 이벤트가 없습니다 + 상단 동작 유지", async () => {
    stub(listOk([]));
    render(<AdminEventList />);
    expect((await screen.findAllByText("등록된 이벤트가 없습니다")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "이벤트 관리" })).toBeTruthy();
    expect(screen.getByText("이벤트 등록")).toBeTruthy();
  });
});
describe("AC-005-8 목록 응답이 지연되는 동안 불러오는 중이 보인다", () => {
  it("응답 전 불러오는 중", () => {
    stub(() => new Promise(() => {}));
    render(<AdminEventList />);
    expect(screen.getAllByText("불러오는 중").length).toBeGreaterThanOrEqual(1);
  });
});
describe("AC-005-9 목록 요청이 서버 오류면 오류 문구가 보인다", () => {
  it("이벤트를 불러오지 못했습니다", async () => {
    stub(async () => jsonResponse({ error: "x" }, 500));
    render(<AdminEventList />);
    expect((await screen.findAllByText("이벤트를 불러오지 못했습니다")).length).toBeGreaterThanOrEqual(1);
  });
});
describe("AC-005-2·AC-006-2 표에 제목·통신사·종료 예정일(KST)·상태가 보인다", () => {
  it("행 내용", async () => {
    stub(listOk());
    render(<AdminEventList />);
    await screen.findByText("진행 이벤트");
    const row = within(rowOf("진행 이벤트"));
    expect(row.getByText("통신사 A")).toBeTruthy();
    expect(row.getByText("2026-12-31")).toBeTruthy(); // 14:59Z = KST 23:59
    expect(row.getByText("진행 중")).toBeTruthy();
    expect(within(rowOf("끝난 이벤트")).getByText("종료")).toBeTruthy();
  });
});
describe("AC-005-1·AC-006-1 등록·수정 동작은 SCR-07 주소로 간다", () => {
  it("이벤트 등록 → /admin/events/new, 수정 → /admin/events/e1/edit", async () => {
    stub(listOk());
    render(<AdminEventList />);
    await screen.findByText("진행 이벤트");
    expect(screen.getByRole("link", { name: "이벤트 등록" }).getAttribute("href")).toBe("/admin/events/new");
    expect(within(rowOf("진행 이벤트")).getByRole("link", { name: "수정" }).getAttribute("href")).toBe("/admin/events/e1/edit");
  });
});
describe("AC-007-5 종료된 이벤트의 행에는 종료 동작과 재개 동작이 없다", () => {
  it("수정만 있다", async () => {
    stub(listOk());
    render(<AdminEventList />);
    await screen.findByText("끝난 이벤트");
    const row = within(rowOf("끝난 이벤트"));
    expect(row.getByRole("link", { name: "수정" })).toBeTruthy();
    expect(row.queryByRole("button", { name: "이벤트 종료" })).toBeNull();
    expect(row.queryByText(/재개|다시 열기/)).toBeNull();
  });
});
describe("AC-007-1·2·3 종료 확인 단계", () => {
  const withClose = (): ReturnType<typeof stub> => {
    let closedNow = false;
    return stub(async (url, init) => {
      if (init?.method === "POST") {
        closedNow = true;
        return jsonResponse({ ok: true });
      }
      return jsonResponse({ events: [{ ...open, status: closedNow ? "closed" : "open" }], carriers: [] });
    });
  };
  const body = "이 이벤트를 종료하면 응모를 받을 수 없고 다시 열 수 없습니다";
  it("AC-007-1 종료 동작 → 확인 단계가 보이고 아직 진행 중", async () => {
    const f = withClose();
    render(<AdminEventList />);
    await screen.findByText("진행 이벤트");
    await userEvent.click(within(rowOf("진행 이벤트")).getByRole("button", { name: "이벤트 종료" }));
    expect((await screen.findAllByText(body)).length).toBeGreaterThanOrEqual(1);
    expect(within(rowOf("진행 이벤트")).getByText("진행 중")).toBeTruthy();
    expect(f.mock.calls.some(([, i]) => i?.method === "POST")).toBe(false);
  });
  it("AC-007-2 확인 → POST close 후 상태가 종료", async () => {
    const f = withClose();
    render(<AdminEventList />);
    await screen.findByText("진행 이벤트");
    await userEvent.click(within(rowOf("진행 이벤트")).getByRole("button", { name: "이벤트 종료" }));
    await screen.findAllByText(body);
    await userEvent.click(screen.getByRole("button", { name: "확인" }));
    await waitFor(() => expect(within(rowOf("진행 이벤트")).getByText("종료")).toBeTruthy());
    expect(f.mock.calls.find(([, i]) => i?.method === "POST")![0]).toBe("/api/admin/events/e1/close");
  });
  it("AC-007-3 취소 → 요청 없이 진행 중 그대로", async () => {
    const f = withClose();
    render(<AdminEventList />);
    await screen.findByText("진행 이벤트");
    await userEvent.click(within(rowOf("진행 이벤트")).getByRole("button", { name: "이벤트 종료" }));
    await screen.findAllByText(body);
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    // 대화상자가 화면에서 사라지는 것은 퇴장 애니메이션 뒤라 jsdom 에서는 판정하지 않는다(e2e AC-007-3 이 본다)
    expect(within(rowOf("진행 이벤트")).getByText("진행 중")).toBeTruthy();
    expect(f.mock.calls.some(([, i]) => i?.method === "POST")).toBe(false);
  });
});
describe("AC-008-13 로그아웃하면 SCR-05 로 이동한다", () => {
  it("DELETE /api/admin/session 후 /admin?notice=1", async () => {
    const f = stub(async (url, init) => (init?.method === "DELETE" ? jsonResponse({ ok: true }) : jsonResponse({ events: [], carriers: [] })));
    render(<AdminEventList />);
    await userEvent.click(await screen.findByRole("button", { name: "로그아웃" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin?notice=1"));
    expect(f.mock.calls.find(([, i]) => i?.method === "DELETE")![0]).toBe("/api/admin/session");
  });
});
describe("AC-008-18 방문자 화면으로 가는 동작은 SCR-01 로 간다", () => {
  it("href=/", async () => {
    stub(listOk([]));
    render(<AdminEventList />);
    expect((await screen.findByRole("link", { name: "방문자 화면으로" })).getAttribute("href")).toBe("/");
  });
});
describe("AC-008-9·16 목록 요청이 401 이면 SCR-05 로 이동한다", () => {
  it("401 → /admin?notice=1", async () => {
    stub(async () => jsonResponse({ error: "unauthorized" }, 401));
    render(<AdminEventList />);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin?notice=1"));
  });
});
