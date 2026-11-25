import { test, expect } from '@playwright/test';
import { resetApp, seedInfo, restoreHooks, delayNext, openEvents, closedEvent, carrierLabel } from './fixtures/hooks';
import { failAlways, endYmd, datePattern, kstYmd, visibleMessage } from './fixtures/helpers';
import { routes, api, urlEndsWith } from './fixtures/routes';

test.describe('002 이벤트 상세', () => {
  test.beforeEach(async ({ request }) => { await resetApp(request); });
  test.afterEach(async ({ request }) => { await restoreHooks(request); });

  test('AC-002-1 진행 중 이벤트 상세에 통신사 이름·기간·내용이 보인다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    // seed-info 에 startsAt·content 가 있어야 판정된다(계약 공백 — 제안).
    expect(e.content, 'seed-info 에 content 필요').toBeTruthy();
    expect(e.startsAt, 'seed-info 에 startsAt 필요').toBeTruthy();
    await page.goto(routes.detail(e.id));
    await expect(page.getByText(carrierLabel(e))).toBeVisible();
    await expect(page.getByText(datePattern(kstYmd(new Date(e.startsAt as string)))).first()).toBeVisible();
    await expect(page.getByText(datePattern(endYmd(e))).first()).toBeVisible();
    await expect(page.getByText(e.content as string)).toBeVisible();
  });

  test('AC-002-2 진행 중 이벤트 상세에서 응모 버튼은 활성이다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await page.goto(routes.detail(e.id));
    await expect(page.getByRole('button', { name: '응모하기' })).toBeEnabled();
  });

  test('AC-002-3 응모 버튼을 누르면 응모 폼으로 이동한다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await page.goto(routes.detail(e.id));
    await page.getByRole('button', { name: '응모하기' }).click();
    await expect(page).toHaveURL(urlEndsWith(routes.apply(e.id)));
    await expect(page.getByRole('heading', { name: '이벤트 응모' })).toBeVisible();
  });

  test('AC-002-4 종료된 이벤트 상세에 종료 표시가 보이고 응모 버튼은 비활성이다', async ({ page, request }) => {
    const e = closedEvent(await seedInfo(request));
    await page.goto(routes.detail(e.id));
    await expect(page.getByText('종료', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '응모하기' })).toBeDisabled();
  });

  test('AC-002-5 존재하지 않는 이벤트 ID 면 없음 문구가 보인다', async ({ page }) => {
    await page.goto(routes.detail('99999999'));
    await expect(visibleMessage(page, '존재하지 않는 이벤트입니다')).toBeVisible();
  });

  test('AC-002-6 상세 응답이 지연되는 동안 불러오는 중이 보인다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await delayNext(request, api.event(e.id), 1500);
    await page.goto(routes.detail(e.id));
    await expect(visibleMessage(page, '불러오는 중')).toBeVisible();
  });

  test('AC-002-7 상세 요청이 서버 오류로 실패하면 오류 문구가 보인다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await failAlways(page, api.event(e.id));
    await page.goto(routes.detail(e.id));
    await expect(visibleMessage(page, '이벤트를 불러오지 못했습니다')).toBeVisible();
  });

  test('AC-002-8 목록으로 돌아가면 이벤트 허브로 이동한다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await page.goto(routes.detail(e.id));
    await page.getByRole('link', { name: '목록으로' }).click();
    await expect(page).toHaveURL(urlEndsWith(routes.hub));
    await expect(page.getByRole('heading', { name: '이벤트 허브' })).toBeVisible();
  });
});
