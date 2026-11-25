import { expect, type Locator, type Page } from '@playwright/test';
import { ADMIN_CODE, routes, urlEndsWith } from './routes';
import type { SeedEvent } from './hooks';

export const NOTICE = '다시 접근 코드를 확인해 주세요';

export function kstYmd(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}
export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
export const todayKst = () => kstYmd(new Date());
// 화면 날짜 표기(2026-12-31 · 2026.12.31 · 2026년 12월 31일 등)를 가리지 않고 같은 날짜로 본다.
export function datePattern(ymd: string): RegExp {
  const [y, m, d] = ymd.split('-');
  return new RegExp(`${y}\\D+0?${Number(m)}\\D+0?${Number(d)}(?!\\d)`);
}
export const endYmd = (e: SeedEvent) => kstYmd(new Date(e.endsAt));

// 화면 문구(입력 오류·안내·상태)를 본다. astryx Field 는 같은 오류 문구를 필드 아래 요소와
// 접근성 알림 영역(role="alert", live region)에 둘 다 그리므로, 알림 영역(자신·자손)은 빼고
// 화면에 보이는 본문 쪽 요소만 가리킨다. 알림 영역 쪽 존재는 이 헬퍼가 보지 않는다.
export const visibleMessage = (page: Page, text: string) =>
  page.getByText(text).and(page.locator('xpath=//*[not(ancestor-or-self::*[@role="alert"])]'));

// 오류 상태 판정용: 브라우저가 보내는 해당 경로의 요청을 해제(page.unroute)할 때까지 전부 500 으로 응답한다.
// 서버 훅 failNext(다음 1회만 실패)는 화면이 오류로 그리는 요청이 아닌 다른 요청이 소비하면 오류가 안 보여서 쓰지 않는다.
// 반드시 그 요청을 일으키는 동작(goto·클릭) 전에 부른다. request 픽스처(API 직접 호출)에는 걸리지 않는다.
export async function failAlways(page: Page, path: string, method: 'GET' | 'POST' = 'GET') {
  const re = urlEndsWith(path);
  const handler = (route: import('@playwright/test').Route) =>
    route.request().method() === method
      ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'x' }) })
      : route.fallback();
  await page.route(re, handler);
  return () => page.unroute(re, handler);
}

// 버튼 또는 링크(문구 표는 요소 종류를 정하지 않았다).
export const action = (scope: Page | Locator, name: string) =>
  scope.getByRole('button', { name, exact: true }).or(scope.getByRole('link', { name, exact: true }));

// ---- 방문자 화면
export const itemOf = (page: Page, title: string) => page.getByRole('listitem').filter({ hasText: title });
// SCR-01 통신사 필터: group "통신사 필터" 안의 토글 button(aria-pressed).
export const carrierFilter = (page: Page) => page.getByRole('group', { name: '통신사 필터' });
export const carrierOption = (page: Page, label: string) =>
  carrierFilter(page).getByRole('button', { name: label, exact: true });
export const carrierOptions = (page: Page) => carrierFilter(page).getByRole('button');

export async function gotoApply(page: Page, e: SeedEvent) {
  await page.goto(routes.apply(e.id));
  await expect(page.getByRole('heading', { name: '이벤트 응모' })).toBeVisible();
}
export async function fillApply(page: Page, v: { name?: string; phone?: string; consent?: boolean }) {
  if (v.name !== undefined) await page.getByLabel('이름', { exact: true }).fill(v.name);
  if (v.phone !== undefined) await page.getByLabel('휴대전화번호', { exact: true }).fill(v.phone);
  if (v.consent) await page.getByLabel('개인정보 수집·이용에 동의합니다').check();
}
export const submitApply = (page: Page) => page.getByRole('button', { name: '제출', exact: true }).click();
export async function applyOnce(page: Page, e: SeedEvent, phone: string, name = '홍길동') {
  await gotoApply(page, e);
  await fillApply(page, { name, phone, consent: true });
  await submitApply(page);
  await expect(page.getByText('응모 완료', { exact: true })).toBeVisible();
}

// ---- 관리자 화면
export async function submitCode(page: Page, code = ADMIN_CODE) {
  await page.getByLabel('접근 코드').fill(code);
  await page.getByRole('button', { name: '확인', exact: true }).click();
}
export async function expectScr05(page: Page) {
  await expect(page.getByLabel('접근 코드')).toBeVisible();
  await expect(page.getByRole('button', { name: '확인', exact: true })).toBeVisible();
}
export async function expectScr06(page: Page) {
  await expect(page.getByRole('heading', { name: '이벤트 관리' })).toBeVisible();
}
export async function loginAdmin(page: Page, code = ADMIN_CODE) {
  await page.goto(routes.admin);
  await submitCode(page, code);
  await expectScr06(page);
}
export const rowOf = (page: Page, title: string) => page.getByRole('row').filter({ hasText: title });

export type EventForm = { carrier?: string; title?: string; startsAt?: string; endsAt?: string; content?: string };
// SCR-07 통신사: astryx Selector = combobox(이름 "통신사") → option(이름 "통신사 A/B/C").
export const carrierCombobox = (page: Page) => page.getByRole('combobox', { name: '통신사', exact: true });
export async function selectCarrier(page: Page, label: string) {
  await carrierCombobox(page).click();
  await page.getByRole('option', { name: label, exact: true }).click();
  await expect(carrierCombobox(page)).toContainText(label);
}
export async function fillEventForm(page: Page, v: EventForm) {
  if (v.carrier !== undefined) await selectCarrier(page, v.carrier);
  if (v.title !== undefined) await page.getByLabel('제목', { exact: true }).fill(v.title);
  if (v.startsAt !== undefined) await page.getByLabel('시작일', { exact: true }).fill(v.startsAt);
  if (v.endsAt !== undefined) await page.getByLabel('종료 예정일', { exact: true }).fill(v.endsAt);
  if (v.content !== undefined) await page.getByLabel('내용', { exact: true }).fill(v.content);
}
export function validEventForm(title: string): EventForm {
  const t = todayKst();
  return { carrier: '통신사 A', title, startsAt: t, endsAt: addDays(t, 30), content: 'e2e 내용' };
}
export const clickSave = (page: Page) => page.getByRole('button', { name: '저장', exact: true }).click();
export async function openEditOf(page: Page, e: SeedEvent) {
  await action(rowOf(page, e.title), '수정').click();
  await expect(page.getByRole('heading', { name: '이벤트 수정' })).toBeVisible();
}
export async function closeViaUi(page: Page, e: SeedEvent) {
  await action(rowOf(page, e.title), '이벤트 종료').click();
  await action(page, '확인').click();
  await expect(rowOf(page, e.title).getByText('종료', { exact: true })).toBeVisible();
}
