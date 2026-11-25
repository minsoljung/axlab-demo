import { randomBytes } from "node:crypto";
import { now } from "./clock";
import { getAdminCode } from "./adminCode";

// 관리자 세션(P-05·A-22). 서버 메모리에 둔다 — 단일 서버 인스턴스 가정(시연용). 시계는 now() 만 쓴다.
export const IDLE_MS = 30 * 60_000;
export const ABSOLUTE_MS = 8 * 60 * 60_000;
export type SessionState = "ok" | "none" | "expired" | "code_changed";

type Session = { createdAt: number; lastAt: number; code: string | undefined };
const g = globalThis as unknown as { __adminSessions?: Map<string, Session> };
const store = (): Map<string, Session> => (g.__adminSessions ??= new Map());

export function createSession(): string {
  const id = randomBytes(24).toString("hex");
  const t = now().getTime();
  store().set(id, { createdAt: t, lastAt: t, code: getAdminCode() });
  return id;
}

// 요청마다 부른다. ok 면 마지막 요청 시각을 갱신한다. 만료·코드 변경이면 세션을 지운다.
export function checkSession(id: string | null | undefined): SessionState {
  if (!id) return "none";
  const s = store().get(id);
  if (!s) return "none";
  const t = now().getTime();
  if (s.code !== getAdminCode()) {
    store().delete(id);
    return "code_changed";
  }
  if (t - s.lastAt > IDLE_MS || t - s.createdAt > ABSOLUTE_MS) {
    store().delete(id);
    return "expired";
  }
  s.lastAt = t;
  return "ok";
}

export function destroySession(id: string | null | undefined): void {
  if (id) store().delete(id);
}
export function clearSessions(): void {
  store().clear();
}
