// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminEventForm } from "@/components/AdminEventForm";
import { jsonResponse } from "@/test/fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
});

const carriers = [
  { id: "carrier-a", name: "통신사 A" },
  { id: "carrier-b", name: "통신사 B" },
];
const initial = { id: "e1", closed: false, values: { carrierId: "carrier-b", title: "기존 제목", startsAt: "2026-11-01", endsAt: "2026-12-31", content: "기존 내용" } };
type Fn = (url: string, init?: RequestInit) => Promise<Response>;
function stub(h: Fn) {
  const f = vi.fn(h);
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return f;
}
const posts = (f: ReturnType<typeof stub>) => f.mock.calls.filter(([, i]) => i?.method);
const save = () => userEvent.click(screen.getByRole("button", { name: /^저장/ }));
async function fillAll() {
  await userEvent.click(screen.getByRole("combobox", { name: "통신사" }));
  await userEvent.click(await screen.findByRole("option", { name: "통신사 A" }));
  await userEvent.type(screen.getByLabelText("제목"), "새 제목");
  await userEvent.type(screen.getByLabelText("시작일"), "2026-11-01");
  await userEvent.type(screen.getByLabelText("종료 예정일"), "2026-12-31");
  await userEvent.type(screen.getByLabelText("내용"), "새 내용");
}

describe("AC-005-1 신규 폼은 모든 입력란이 빈 값이다", () => {
  it("제목 '이벤트 등록' + 빈 입력란 + 통신사 선택지 이름", async () => {
    render(<AdminEventForm carriers={carriers} />);
    expect(screen.getByRole("heading", { name: "이벤트 등록" })).toBeTruthy();
    for (const l of ["제목", "시작일", "종료 예정일", "내용"]) expect((screen.getByLabelText(l) as HTMLInputElement).value).toBe("");
    await userEvent.click(screen.getByRole("combobox", { name: "통신사" }));
    expect(await screen.findByRole("option", { name: "통신사 A" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "통신사 B" })).toBeTruthy();
  });
});
describe("AC-005-2 모두 입력해 저장하면 등록 요청 후 SCR-06 으로 이동한다", () => {
  it("POST /api/admin/events → /admin/events", async () => {
    const f = stub(async () => jsonResponse({ id: "n1" }, 201));
    render(<AdminEventForm carriers={carriers} />);
    await fillAll();
    await save();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/events"));
    const [url, init] = posts(f)[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/admin/events");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ carrierId: "carrier-a", title: "새 제목", startsAt: "2026-11-01", endsAt: "2026-12-31", content: "새 내용" });
  });
});
describe("AC-005-4 제목이 비어 있으면 오류 문구를 보이고 요청하지 않는다", () => {
  it("제목을 입력해 주세요 + 요청 0", async () => {
    const f = stub(async () => jsonResponse({ id: "n1" }, 201));
    render(<AdminEventForm carriers={carriers} />);
    await save();
    expect((await screen.findAllByText("제목을 입력해 주세요")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("통신사를 선택해 주세요").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("기간을 입력해 주세요").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("내용을 입력해 주세요").length).toBeGreaterThanOrEqual(1);
    expect(posts(f)).toHaveLength(0);
  });
});
describe("AC-005-5 저장 응답이 지연되는 동안 저장 버튼은 비활성이다", () => {
  it("저장 중 + disabled", async () => {
    stub(() => new Promise(() => {}));
    render(<AdminEventForm carriers={carriers} />);
    await fillAll();
    await save();
    const b = await screen.findByRole("button", { name: "저장 중" });
    expect((b as HTMLButtonElement).disabled || b.getAttribute("aria-disabled") === "true").toBe(true);
  });
});
describe("AC-005-6 저장이 서버 오류로 실패하면 실패 문구가 보이고 이동하지 않는다", () => {
  it("저장에 실패했습니다 + 입력값 유지", async () => {
    stub(async () => jsonResponse({ error: "x" }, 500));
    render(<AdminEventForm carriers={carriers} />);
    await fillAll();
    await save();
    expect((await screen.findAllByText("저장에 실패했습니다")).length).toBeGreaterThanOrEqual(1);
    expect(push).not.toHaveBeenCalled();
    expect((screen.getByLabelText("제목") as HTMLInputElement).value).toBe("새 제목");
    expect(screen.getByRole("button", { name: "저장" })).toBeTruthy();
  });
});
describe("AC-006-1 수정 폼은 기존 값이 채워진 상태로 열린다", () => {
  it("제목 '이벤트 수정' + 값 + 통신사 선택값", () => {
    render(<AdminEventForm carriers={carriers} initial={initial} />);
    expect(screen.getByRole("heading", { name: "이벤트 수정" })).toBeTruthy();
    expect((screen.getByLabelText("제목") as HTMLInputElement).value).toBe("기존 제목");
    expect((screen.getByLabelText("시작일") as HTMLInputElement).value).toBe("2026-11-01");
    expect((screen.getByLabelText("종료 예정일") as HTMLInputElement).value).toBe("2026-12-31");
    expect((screen.getByLabelText("내용") as HTMLTextAreaElement).value).toBe("기존 내용");
    expect(screen.getByRole("combobox", { name: "통신사" }).textContent).toContain("통신사 B");
  });
});
describe("AC-006-2 수정 저장은 PATCH 후 SCR-06 으로 이동한다", () => {
  it("PATCH /api/admin/events/e1", async () => {
    const f = stub(async () => jsonResponse({ id: "e1" }));
    render(<AdminEventForm carriers={carriers} initial={initial} />);
    await save();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/events"));
    const [url, init] = posts(f)[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/admin/events/e1");
    expect(init.method).toBe("PATCH");
  });
});
describe("AC-006-3 서버가 종료 예정일 과거를 거부하면 그 문구가 보이고 머문다", () => {
  it("400 errors.endsAt", async () => {
    stub(async () => jsonResponse({ error: "invalid", errors: { endsAt: "종료 예정일은 오늘 이전으로 바꿀 수 없습니다" } }, 400));
    render(<AdminEventForm carriers={carriers} initial={initial} />);
    await save();
    expect((await screen.findAllByText("종료 예정일은 오늘 이전으로 바꿀 수 없습니다")).length).toBeGreaterThanOrEqual(1);
    expect(push).not.toHaveBeenCalled();
  });
});
describe("AC-006-4·AC-006-5 종료된 이벤트의 종료 예정일 입력은 비활성이다", () => {
  it("closed → aria-disabled/disabled + 도움말", () => {
    render(<AdminEventForm carriers={carriers} initial={{ ...initial, closed: true }} />);
    const d = screen.getByLabelText("종료 예정일") as HTMLInputElement;
    expect(d.disabled || d.getAttribute("aria-disabled") === "true").toBe(true);
    expect(screen.getAllByText("종료된 이벤트는 종료 예정일을 바꿀 수 없습니다").length).toBeGreaterThanOrEqual(1);
  });
  it("진행 중이면 활성", () => {
    render(<AdminEventForm carriers={carriers} initial={initial} />);
    const d = screen.getByLabelText("종료 예정일") as HTMLInputElement;
    expect(d.disabled).toBe(false);
    expect(d.getAttribute("aria-disabled")).not.toBe("true");
  });
});
describe("AC-006-6 폼을 연 뒤 종료돼 서버가 409 를 주면 안내하고 이동하지 않는다", () => {
  it("409 → 종료된 이벤트 문구", async () => {
    stub(async () => jsonResponse({ error: "closed" }, 409));
    render(<AdminEventForm carriers={carriers} initial={initial} />);
    await save();
    expect((await screen.findAllByText("종료된 이벤트는 종료 예정일을 바꿀 수 없습니다")).length).toBeGreaterThanOrEqual(1);
    expect(push).not.toHaveBeenCalled();
  });
});
describe("AC-008-16 저장 요청이 401(만료)이면 SCR-05 로 이동한다", () => {
  it("401 → /admin?notice=1", async () => {
    stub(async () => jsonResponse({ error: "unauthorized" }, 401));
    render(<AdminEventForm carriers={carriers} />);
    await fillAll();
    await save();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin?notice=1"));
  });
});
