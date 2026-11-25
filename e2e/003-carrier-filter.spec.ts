import { test, expect } from '@playwright/test';
import { resetApp, seedInfo, restoreHooks, carrierLabel } from './fixtures/hooks';
import { carrierFilter, carrierOption, carrierOptions, visibleMessage } from './fixtures/helpers';
import { routes } from './fixtures/routes';

test.describe('003 통신사별 필터', () => {
  test.beforeEach(async ({ request }) => { await resetApp(request); });
  test.afterEach(async ({ request }) => { await restoreHooks(request); });

  test('AC-003-1 통신사 필터에 선택지 3개가 보인다', async ({ page }) => {
    await page.goto(routes.hub);
    await expect(carrierFilter(page)).toBeVisible();
    await expect(carrierOptions(page)).toHaveCount(3);
    for (const name of ['통신사 A', '통신사 B', '통신사 C']) await expect(carrierOption(page, name)).toBeVisible();
  });

  test('AC-003-2 통신사를 선택하면 그 통신사 이벤트만 보인다', async ({ page, request }) => {
    const info = await seedInfo(request);
    await page.goto(routes.hub);
    await carrierOption(page, '통신사 B').click();
    const mine = info.filter((e) => carrierLabel(e) === '통신사 B');
    const others = info.filter((e) => carrierLabel(e) !== '통신사 B');
    expect(mine.length).toBeGreaterThanOrEqual(1);
    expect(others.length).toBeGreaterThanOrEqual(1);
    for (const e of mine) await expect(page.getByText(e.title)).toBeVisible();
    for (const e of others) await expect(page.getByText(e.title)).toHaveCount(0);
  });

  test('AC-003-3 선택한 통신사의 이벤트가 0건이면 없음 문구가 보인다', async ({ page, request }) => {
    await resetApp(request, 'carrier-c-empty');
    await page.goto(routes.hub);
    await carrierOption(page, '통신사 C').click();
    await expect(visibleMessage(page, '해당 통신사의 이벤트가 없습니다')).toBeVisible();
  });

  test('AC-003-4 통신사를 선택해도 URL 경로는 허브 경로 그대로이다', async ({ page, request }) => {
    const info = await seedInfo(request);
    const other = info.find((e) => carrierLabel(e) !== '통신사 A');
    await page.goto(routes.hub);
    await carrierOption(page, '통신사 A').click();
    // 선택이 실제로 반영된 뒤에 경로를 본다(반영 전 검사는 아무것도 증명하지 못한다).
    await expect(page.getByText((other as { title: string }).title)).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe(routes.hub);
  });
});
