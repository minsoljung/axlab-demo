// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminAccess } from "@/components/AdminAccess";
import { jsonResponse } from "@/test/fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
});
const stub = (status: number) => {
  const f = vi.fn(async () => jsonResponse(status === 200 ? { ok: true } : { error: "x" }, status));
  vi.stubGlobal("fetch", f);
  return f;
};
const enter = async (code: string) => {
  await userEvent.type(screen.getByLabelText("접근 코드"), code);
  await userEvent.click(screen.getByRole("button", { name: "확인" }));
};

describe("AC-008-1 관리자 주소로 들어가면 접근 코드 입력란과 확인 버튼이 보인다", () => {
  it("입력란(비밀번호형)·확인 버튼, 안내 없음", () => {
    render(<AdminAccess />);
    const input = screen.getByLabelText("접근 코드") as HTMLInputElement;
    expect(input.type).toBe("password");
    expect(screen.getByRole("button", { name: "확인" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "관리자 접근 확인" })).toBeTruthy();
    expect(screen.queryByText("다시 접근 코드를 확인해 주세요")).toBeNull();
  });
});
describe("AC-008-2 올바른 접근 코드를 확인하면 SCR-06 으로 이동한다", () => {
  it("POST /api/admin/session 후 /admin/events", async () => {
    const f = stub(200);
    render(<AdminAccess />);
    await enter("good");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/events"));
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/admin/session");
    expect(JSON.parse(init.body as string)).toEqual({ code: "good" });
  });
});
describe("AC-008-3 틀린 접근 코드는 오류 문구를 보이고 머문다", () => {
  it("401 → 문구, 이동 없음", async () => {
    stub(401);
    render(<AdminAccess />);
    await enter("bad");
    expect((await screen.findAllByText("접근 코드가 올바르지 않습니다")).length).toBeGreaterThanOrEqual(1);
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "확인" })).toBeTruthy();
  });
});
describe("AC-008-15·AC-008-20 이동해 온 상태에는 다시 확인 안내가 보인다", () => {
  it("notice → 안내 문구", () => {
    render(<AdminAccess notice />);
    expect(screen.getAllByText("다시 접근 코드를 확인해 주세요").length).toBeGreaterThanOrEqual(1);
  });
});
