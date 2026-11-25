// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApplyForm } from "@/components/ApplyForm";
import { jsonResponse, makeEvent } from "@/test/fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
});

type Handler = (url: string, init?: RequestInit) => Promise<Response>;
function stub(submit: Handler, event: Parameters<typeof makeEvent>[0] = {}) {
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "POST") return submit(url, init);
    return jsonResponse({ event: makeEvent({ id: "evt-1", ...event }) });
  });
  vi.stubGlobal("fetch", f);
  return f;
}
const ok: Handler = async () => jsonResponse({ ok: true }, 201);

async function fill(v: { name?: string; phone?: string; consent?: boolean }) {
  await screen.findByRole("button", { name: "제출" });
  if (v.name) await userEvent.type(screen.getByLabelText("이름"), v.name);
  if (v.phone) await userEvent.type(screen.getByLabelText("휴대전화번호"), v.phone);
  if (v.consent) await userEvent.click(screen.getByLabelText("개인정보 수집·이용에 동의합니다"));
}
const submit = () => userEvent.click(screen.getByRole("button", { name: /^제출/ }));

describe("AC-004-1 입력 항목이 이름·휴대전화번호·동의 체크 3개만 보인다", () => {
  it("입력 요소 3개", async () => {
    stub(ok);
    render(<ApplyForm id="evt-1" />);
    await screen.findByRole("button", { name: "제출" });
    const inputs = [...screen.getAllByRole("textbox"), ...screen.queryAllByRole("checkbox")];
    expect(inputs).toHaveLength(3);
    expect(screen.getByLabelText("이름")).toBeTruthy();
    expect(screen.getByLabelText("휴대전화번호")).toBeTruthy();
    expect(screen.getByLabelText("개인정보 수집·이용에 동의합니다")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "이벤트 응모" })).toBeTruthy();
  });
});

describe("AC-004-2 제출하면 응모 완료 화면으로 이동한다", () => {
  it("POST 후 /events/:id/apply/complete", async () => {
    const f = stub(ok);
    render(<ApplyForm id="evt-1" />);
    await fill({ name: "홍길동", phone: "01012345678", consent: true });
    await submit();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/events/evt-1/apply/complete"));
    const post = f.mock.calls.find(([, i]) => i?.method === "POST")!;
    expect(post[0]).toBe("/api/events/evt-1/applications");
    expect(JSON.parse(post[1]!.body as string)).toEqual({ name: "홍길동", phone: "01012345678", consent: true });
  });
});

// astryx 는 오류문구를 필드 아래와 알림 영역(role=alert) 두 곳에 쓸 수 있어, 문구 판정은 1개 이상으로 한다(간헐 실패 원인)
describe("AC-004-4 이름이 비어 있으면 오류문구, 제출 요청 없음", () => {
  it("이름을 입력해 주세요", async () => {
    const f = stub(ok);
    render(<ApplyForm id="evt-1" />);
    await fill({ phone: "01012345678", consent: true });
    await submit();
    expect((await screen.findAllByText("이름을 입력해 주세요")).length).toBeGreaterThan(0);
    expect(f.mock.calls.some(([, i]) => i?.method === "POST")).toBe(false);
  });
});

describe("AC-004-5 휴대전화번호가 숫자가 아니면 오류문구", () => {
  it("휴대전화번호를 확인해 주세요", async () => {
    stub(ok);
    render(<ApplyForm id="evt-1" />);
    await fill({ name: "홍", phone: "abc", consent: true });
    await submit();
    expect((await screen.findAllByText("휴대전화번호를 확인해 주세요")).length).toBeGreaterThan(0);
    expect(push).not.toHaveBeenCalled();
  });
});

describe("AC-004-6 동의하지 않으면 오류문구", () => {
  it("동의 안내", async () => {
    stub(ok);
    render(<ApplyForm id="evt-1" />);
    await fill({ name: "홍", phone: "01012345678" });
    await submit();
    expect((await screen.findAllByText("개인정보 수집·이용에 동의해 주세요")).length).toBeGreaterThan(0);
  });
  it("오류는 동시에 모두 보인다", async () => {
    stub(ok);
    render(<ApplyForm id="evt-1" />);
    await fill({});
    await submit();
    expect((await screen.findAllByText("이름을 입력해 주세요")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("휴대전화번호를 확인해 주세요").length).toBeGreaterThan(0);
    expect(screen.getAllByText("개인정보 수집·이용에 동의해 주세요").length).toBeGreaterThan(0);
  });
});

describe("AC-004-7 이미 응모한 번호면 오류문구", () => {
  it("409 → 이미 응모한 번호입니다", async () => {
    stub(async () => jsonResponse({ errors: { phone: "이미 응모한 번호입니다" } }, 409));
    render(<ApplyForm id="evt-1" />);
    await fill({ name: "홍", phone: "01012345678", consent: true });
    await submit();
    // 필드 오류문구와 astryx 알림 영역(role=alert)이 같은 문구를 쓸 수 있어 1개 이상으로 판정한다
    expect((await screen.findAllByText("이미 응모한 번호입니다")).length).toBeGreaterThanOrEqual(1);
    expect(push).not.toHaveBeenCalled();
  });
});

describe("AC-004-8 다른 이벤트에 응모한 번호도 이 이벤트에서는 완료된다", () => {
  it("201 → 완료 화면 (오류문구 없음)", async () => {
    stub(ok);
    render(<ApplyForm id="evt-1" />);
    await fill({ name: "홍", phone: "01012345678", consent: true });
    await submit();
    await waitFor(() => expect(push).toHaveBeenCalled());
    // astryx 의 접근성 알림 영역(role=alert)은 테스트 사이에 남으므로 폼 안에서만 확인한다
    expect(within(document.querySelector("form")!).queryByText("이미 응모한 번호입니다")).toBeNull();
  });
});

describe("AC-004-9 종료된 이벤트는 입력 폼 대신 안내", () => {
  it("종료된 이벤트입니다 + 폼 요소 없음", async () => {
    stub(ok, { status: "closed" });
    render(<ApplyForm id="evt-1" />);
    expect((await screen.findAllByText("종료된 이벤트입니다")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "제출" })).toBeNull();
    expect(screen.getByRole("link", { name: "상세로 돌아가기" })).toBeTruthy();
  });
});

describe("AC-004-11 제출 응답이 지연되는 동안 제출 버튼은 비활성", () => {
  it("제출 중 + aria-disabled", async () => {
    stub(() => new Promise<Response>(() => {}));
    render(<ApplyForm id="evt-1" />);
    await fill({ name: "홍", phone: "01012345678", consent: true });
    await submit();
    const b = await screen.findByRole("button", { name: "제출 중" });
    expect(b.getAttribute("aria-disabled")).toBe("true");
  });
});

describe("AC-004-12 제출 요청이 서버 오류면 응모에 실패했습니다", () => {
  it("500 → 오류 알림, 입력값 유지", async () => {
    stub(async () => jsonResponse({ error: "x" }, 500));
    render(<ApplyForm id="evt-1" />);
    await fill({ name: "홍", phone: "01012345678", consent: true });
    await submit();
    expect((await screen.findAllByText("응모에 실패했습니다")).length).toBeGreaterThan(0);
    expect((screen.getByLabelText("이름") as HTMLInputElement).value).toBe("홍");
    expect(push).not.toHaveBeenCalled();
  });
});

describe("AC-004-13 상세로 돌아가기는 SCR-02 로 간다", () => {
  it("href=/events/:id", async () => {
    stub(ok);
    render(<ApplyForm id="evt-1" />);
    await screen.findByRole("button", { name: "제출" });
    expect(screen.getByRole("link", { name: "상세로 돌아가기" }).getAttribute("href")).toBe("/events/evt-1");
  });
});

describe("SCR-03 상태: 없는 이벤트·불러오기 오류·로딩 (AC 없음, 디자인 명세)", () => {
  it("없는 이벤트", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 404)));
    render(<ApplyForm id="x" />);
    expect((await screen.findAllByText("존재하지 않는 이벤트입니다")).length).toBeGreaterThan(0);
  });
  it("불러오기 오류", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 500)));
    render(<ApplyForm id="x" />);
    expect((await screen.findAllByText("이벤트를 불러오지 못했습니다")).length).toBeGreaterThan(0);
  });
  it("로딩", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));
    render(<ApplyForm id="x" />);
    expect((await screen.findAllByText("불러오는 중")).length).toBeGreaterThan(0);
  });
});
