import { createHash, timingSafeEqual } from "node:crypto";
import { getAdminCode } from "./adminCode";
import { checkSession, type SessionState } from "./adminSession";

export const COOKIE = "admin_session";

export function readSessionId(req: Request): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === COOKIE) return part.slice(i + 1).trim();
  }
  return undefined;
}

// 세션 쿠키 = Max-Age·Expires 없음 → 브라우저를 닫으면 사라진다(A-16).
export const sessionCookie = (id: string): string =>
  `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
export const clearedCookie = (): string => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

const digest = (s: string) => createHash("sha256").update(s).digest();
export function codeMatches(input: unknown): boolean {
  const code = getAdminCode();
  if (!code || typeof input !== "string" || !input) return false;
  return timingSafeEqual(digest(input), digest(code));
}

// 관리자 API 맨 앞에서 부른다. 통과하면 null, 아니면 401(P-05).
export async function requireAdmin(req: Request): Promise<Response | null> {
  const state: SessionState = await checkSession(readSessionId(req));
  return state === "ok" ? null : Response.json({ error: "unauthorized", reason: state }, { status: 401 });
}
