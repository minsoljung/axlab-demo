// 서버 시계. 테스트 훅(POST /api/test/clock)이 고정·해제한다. 라우트 번들이 달라도 같은 상태를 보도록 globalThis 에 둔다.
const g = globalThis as unknown as { __clockFixedMs?: number | null };

export function now(): Date {
  return g.__clockFixedMs != null ? new Date(g.__clockFixedMs) : new Date();
}

export function setClock(iso: string | null): void {
  if (iso === null) {
    g.__clockFixedMs = null;
    return;
  }
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new Error("잘못된 시각");
  g.__clockFixedMs = ms;
}
