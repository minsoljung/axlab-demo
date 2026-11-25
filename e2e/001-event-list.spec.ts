import { test, expect } from '@playwright/test';
import { resetApp, seedInfo, restoreHooks, delayNext, openEvents, closedEvent, carrierLabel } from './fixtures/hooks';
import { failAlways, itemOf, visibleMessage } from './fixtures/helpers';
import { routes, api, urlEndsWith } from './fixtures/routes';

test.describe('001 이벤트 목록', () => {
  test.beforeEach(async ({ request }) => { await resetApp(request); });
  test.afterEach(async ({ request }) => { await restoreHooks(request); });

  test('AC-001-1 진행 중 이벤트의 제목과 통신사 이름이 목록에 보인다', async ({ page, request }) => {
    const open = openEvents(await seedInfo(request));
    expect(open.length).toBeGreaterThanOrEqual(1);
    await page.goto(routes.hub);
    for (const e of open) {
      const item = itemOf(page, e.title);
      await expect(item).toBeVisible();
      await expect(item).toContainText(carrierLabel(e));
    }
  });

  test('AC-001-2 종료된 이벤트 항목에 종료 표시가 보인다', async ({ page, request }) => {
    const info = await seedInfo(request);
    const closed = closedEvent(info);
    await page.goto(routes.hub);
    await expect(itemOf(page, closed.title).getByText('종료', { exact: true })).toBeVisible();
    await expect(itemOf(page, openEvents(info)[0].title).getByText('종료', { exact: true })).toHaveCount(0);
  });

  test('AC-001-3 진행 중 이벤트를 선택하면 상세로 이동하고 제목이 보인다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await page.goto(routes.hub);
    await page.getByRole('link', { name: e.title }).click();
    await expect(page).toHaveURL(urlEndsWith(routes.detail(e.id)));
    await expect(page.getByRole('heading', { name: e.title })).toBeVisible();
  });

  test('AC-001-4 이벤트가 0건이면 빈 목록 문구가 보인다', async ({ page, request }) => {
    await resetApp(request, 'empty');
    await page.goto(routes.hub);
    await expect(visibleMessage(page, '진행 중인 이벤트가 없습니다')).toBeVisible();
  });

  test('AC-001-5 목록 응답이 지연되는 동안 불러오는 중이 보인다', async ({ page, request }) => {
    await delayNext(request, api.events, 1500);
    await page.goto(routes.hub);
    await expect(visibleMessage(page, '불러오는 중')).toBeVisible();
  });

  test('AC-001-6 목록 요청이 서버 오류로 실패하면 오류 문구가 보인다', async ({ page, request }) => {
    await failAlways(page, api.events);
    await page.goto(routes.hub);
    await expect(visibleMessage(page, '이벤트를 불러오지 못했습니다')).toBeVisible();
  });
});
