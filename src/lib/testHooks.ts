import { setClock } from "./clock";
import { setAdminCodeOverride } from "./adminCode";

// 테스트 훅은 APP_TEST_MODE=1 이고 NODE_ENV!=='production' 일 때만 존재한다 (아니면 404).
export function isTestMode(): boolean {
  return process.env.APP_TEST_MODE === "1" && process.env.NODE_ENV !== "production";
}

type Pending = { route: string; status: number } | null;
type Delay = { route: string; ms: number } | null;
// 라우트마다 번들이 따로 만들어질 수 있어 상태는 globalThis 에 둔다
const g = globalThis as unknown as { __failNext?: Pending; __delayNext?: Delay };

export function failNext(route: string, status: number): void {
  g.__failNext = { route, status };
}
export function delayNext(route: string, ms: number): void {
  g.__delayNext = { route, ms };
}
export function resetHooks(): void {
  g.__failNext = null;
  g.__delayNext = null;
  setClock(null);
  setAdminCodeOverride(null);
}

// API 라우트 맨 앞에서 부른다. 지연을 기다린 뒤, 실패가 걸려 있으면 그 응답을 돌려준다(없으면 null).
// 운영(isTestMode=false)에서는 아무것도 하지 않는다. /api/test/ 요청에는 적용하지 않는다.
export async function applyHooks(pathname: string): Promise<Response | null> {
  if (!isTestMode() || pathname.startsWith("/api/test/")) return null;
  const d = g.__delayNext;
  if (d && pathname.startsWith(d.route)) {
    g.__delayNext = null;
    await new Promise((r) => setTimeout(r, d.ms));
  }
  const f = g.__failNext;
  if (f && pathname.startsWith(f.route)) {
    g.__failNext = null;
    return Response.json({ error: "injected_failure" }, { status: f.status });
  }
  return null;
}

// /api/test/* 라우트용: 테스트 모드가 아니면 404
export function notTestMode(): Response | null {
  return isTestMode() ? null : new Response(null, { status: 404 });
}
