import { test, expect } from '@playwright/test';
import { resetApp, seedInfo, restoreHooks, delayNext, getCounts, openEvents } from './fixtures/hooks';
import {
  action, loginAdmin, submitCode, expectScr06, rowOf, fillEventForm, validEventForm, clickSave,
  visibleMessage, failAlways,
} from './fixtures/helpers';
import { routes, api } from './fixtures/routes';

const TITLE = 'e2e 신규 이벤트';

async function openNewForm(page: import('@playwright/test').Page) {
  await loginAdmin(page);
  await action(page, '이벤트 등록').click();
  await expect(page.getByRole('heading', { name: '이벤트 등록' })).toBeVisible();
}

test.describe('005 운영자 이벤트 등록', () => {
  test.beforeEach(async ({ request }) => { await resetApp(request); });
  test.afterEach(async ({ request }) => { await restoreHooks(request); });

  test('AC-005-1 이벤트 등록 동작을 하면 빈 입력 폼이 열린다', async ({ page }) => {
    await openNewForm(page);
    await expect(page.getByLabel('제목', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('시작일', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('종료 예정일', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('내용', { exact: true })).toHaveValue('');
  });

  test('AC-005-2 모두 입력해 저장하면 관리자 목록으로 이동하고 이벤트 행이 1건 늘어난다', async ({ page, request }) => {
    const before = (await getCounts(request)).events;
    await openNewForm(page);
    await fillEventForm(page, validEventForm(TITLE));
    await clickSave(page);
    await expectScr06(page);
    await expect(rowOf(page, TITLE)).toBeVisible();
    await expect.poll(async () => (await getCounts(request)).events).toBe(before + 1);
  });

  test('AC-005-3 등록 저장 후 방문자 목록에 새 이벤트의 제목이 보인다', async ({ page }) => {
    await openNewForm(page);
    await fillEventForm(page, validEventForm(TITLE));
    await clickSave(page);
    await expectScr06(page);
    await page.goto(routes.hub);
    await expect(page.getByText(TITLE)).toBeVisible();
  });

  test('AC-005-4 제목이 비어 있으면 오류 문구가 보이고 이벤트 행은 늘지 않는다', async ({ page, request }) => {
    const before = (await getCounts(request)).events;
    await openNewForm(page);
    await fillEventForm(page, { ...validEventForm(''), title: '' });
    await clickSave(page);
    await expect(visibleMessage(page, '제목을 입력해 주세요')).toBeVisible();
    expect((await getCounts(request)).events).toBe(before);
  });

  test('AC-005-5 저장 응답이 지연되는 동안 저장 버튼은 비활성이다', async ({ page, request }) => {
    await openNewForm(page);
    await fillEventForm(page, validEventForm(TITLE));
    await delayNext(request, api.adminEvents, 1500);
    await clickSave(page);
    await expect(page.getByRole('button', { name: '저장 중' })).toBeDisabled();
  });

  test('AC-005-6 저장이 서버 오류로 실패하면 실패 문구가 보이고 이벤트 행은 늘지 않는다', async ({ page, request }) => {
    const before = (await getCounts(request)).events;
    await openNewForm(page);
    await fillEventForm(page, validEventForm(TITLE));
    await failAlways(page, api.adminEvents, 'POST');
    await clickSave(page);
    await expect(visibleMessage(page, '저장에 실패했습니다')).toBeVisible();
    expect((await getCounts(request)).events).toBe(before);
  });

  test('AC-005-7 이벤트가 0건이면 관리자 목록에 빈 목록 문구가 보인다', async ({ page, request }) => {
    await resetApp(request, 'empty');
    await loginAdmin(page);
    await expect(visibleMessage(page, '등록된 이벤트가 없습니다')).toBeVisible();
  });

  test('AC-005-8 관리자 목록 응답이 지연되는 동안 불러오는 중이 보인다', async ({ page, request }) => {
    await page.goto(routes.admin);
    await delayNext(request, api.adminEvents, 1500);
    await submitCode(page);
    await expect(visibleMessage(page, '불러오는 중')).toBeVisible();
  });

  test('AC-005-9 관리자 목록 요청이 서버 오류로 실패하면 오류 문구가 보인다', async ({ page, request }) => {
    await page.goto(routes.admin);
    await failAlways(page, api.adminEvents);
    await submitCode(page);
    await expect(visibleMessage(page, '이벤트를 불러오지 못했습니다')).toBeVisible();
  });
});
