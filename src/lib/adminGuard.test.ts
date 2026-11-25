import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSession, clearSessions } from "./adminSession";
import { setAdminCodeOverride } from "./adminCode";
import { setClock } from "./clock";

let cookieValue: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "admin_session" && cookieValue ? { value: cookieValue } : undefined) }),
}));
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));

import { requireAdminPage } from "./adminGuard";

beforeEach(() => {
  clearSessions();
  setAdminCodeOverride("c1");
  cookieValue = undefined;
  redirect.mockClear();
});
afterEach(() => {
  setClock(null);
  setAdminCodeOverride(null);
  clearSessions();
});

describe("AC-008-4·AC-008-5·AC-008-20 미확인 세션이 SCR-06·07 에 직접 들어가면 SCR-05(안내 포함)로 보낸다", () => {
  it("쿠키 없음 → /admin?notice=1", async () => {
    await expect(requireAdminPage()).rejects.toThrow("REDIRECT:/admin?notice=1");
  });
});
describe("AC-008-2 확인한 세션은 통과한다", () => {
  it("유효한 세션 → 리다이렉트 없음", async () => {
    cookieValue = createSession();
    await requireAdminPage();
    expect(redirect).not.toHaveBeenCalled();
  });
});
describe("AC-008-9·AC-008-12 만료·코드 변경 세션은 SCR-05 로 보낸다", () => {
  it("31분 뒤", async () => {
    const t = Date.now();
    setClock(new Date(t).toISOString());
    cookieValue = createSession();
    setClock(new Date(t + 31 * 60_000).toISOString());
    await expect(requireAdminPage()).rejects.toThrow("REDIRECT:/admin?notice=1");
  });
  it("코드 변경 뒤", async () => {
    cookieValue = createSession();
    setAdminCodeOverride("c2");
    await expect(requireAdminPage()).rejects.toThrow("REDIRECT:/admin?notice=1");
  });
});
