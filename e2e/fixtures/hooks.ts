import { expect, type APIRequestContext } from '@playwright/test';

export type SeedEvent = {
  id: string | number;
  title: string;
  carrier: string;
  status: string;
  endsAt: string;
  startsAt?: string;
  content?: string;
};

// default = 통신사 3곳 + 이벤트. empty = 이벤트 0건. carrier-c-empty = 통신사 C 이벤트만 없음(계약 공백: 후자 둘은 제안).
export type SeedName = 'default' | 'empty' | 'carrier-c-empty';

export async function resetApp(request: APIRequestContext, seed: SeedName = 'default') {
  const r = await request.post('/api/test/reset', { data: { seed } });
  expect(r.ok(), `reset(${seed}) status=${r.status()}`).toBeTruthy();
}

export async function seedInfo(request: APIRequestContext): Promise<SeedEvent[]> {
  const r = await request.get('/api/test/seed-info');
  expect(r.ok(), `seed-info status=${r.status()}`).toBeTruthy();
  const j = await r.json();
  return Array.isArray(j) ? j : j.events;
}

export async function setClock(request: APIRequestContext, now: Date | string | null) {
  const v = now === null ? null : new Date(now).toISOString();
  const r = await request.post('/api/test/clock', { data: { now: v } });
  expect(r.ok(), `clock status=${r.status()}`).toBeTruthy();
}

export async function failNext(request: APIRequestContext, route: string, status = 500) {
  const r = await request.post('/api/test/fail-next', { data: { route, status } });
  expect(r.ok(), `fail-next status=${r.status()}`).toBeTruthy();
}

export async function delayNext(request: APIRequestContext, route: string, ms = 1500) {
  const r = await request.post('/api/test/delay-next', { data: { route, ms } });
  expect(r.ok(), `delay-next status=${r.status()}`).toBeTruthy();
}

// 제안 훅(계약 공백): 접근 코드를 실행 중에 바꾼다. null 이면 환경변수 값으로 되돌린다.
export async function setAdminCode(request: APIRequestContext, code: string | null) {
  const r = await request.post('/api/test/admin-code', { data: { code } });
  expect(r.ok(), `admin-code status=${r.status()}`).toBeTruthy();
}

// 제안 훅(계약 공백): DB 행 수.
export type Counts = { events: number; applications: number; applicationsByEvent: Record<string, number> };
export async function getCounts(request: APIRequestContext): Promise<Counts> {
  const r = await request.get('/api/test/counts');
  expect(r.ok(), `counts status=${r.status()}`).toBeTruthy();
  return r.json();
}
export const appCount = (c: Counts, id: string | number) => c.applicationsByEvent[String(id)] ?? 0;

// 시계·접근 코드를 되돌린다. 정리 단계라 실패해도 다음 테스트의 reset 이 다시 정리한다.
export async function restoreHooks(request: APIRequestContext) {
  await request.post('/api/test/clock', { data: { now: null } }).catch(() => undefined);
  await request.post('/api/test/admin-code', { data: { code: null } }).catch(() => undefined);
}

const isClosed = (e: SeedEvent) => /종료|closed|ended|expired/i.test(e.status);
export const openEvents = (info: SeedEvent[]) => info.filter((e) => !isClosed(e));
export const closedEvent = (info: SeedEvent[]) => {
  const e = info.find(isClosed);
  expect(e, '시드에 종료 이벤트가 있어야 한다').toBeTruthy();
  return e as SeedEvent;
};
export const carrierLabel = (e: SeedEvent) => (/^통신사 /.test(e.carrier) ? e.carrier : `통신사 ${e.carrier}`);
export const expireAfter = (e: SeedEvent) => new Date(Date.parse(e.endsAt) + 2 * 86_400_000);
