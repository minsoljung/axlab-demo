import { test, expect } from '@playwright/test';
import { resetApp, seedInfo, restoreHooks, openEvents, closedEvent } from './fixtures/hooks';
import { action, loginAdmin, rowOf, closeViaUi } from './fixtures/helpers';
import { routes } from './fixtures/routes';

const CONFIRM_BODY = '이 이벤트를 종료하면 응모를 받을 수 없고 다시 열 수 없습니다';

test.describe('007 운영자 이벤트 종료', () => {
  test.beforeEach(async ({ request }) => { await resetApp(request); });
  test.afterEach(async ({ request }) => { await restoreHooks(request); });

  test('AC-007-1 진행 중 이벤트의 종료 동작을 하면 확인 단계가 보이고 이벤트는 진행 중이다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await loginAdmin(page);
    await action(rowOf(page, e.title), '이벤트 종료').click();
    await expect(page.getByText(CONFIRM_BODY)).toBeVisible();
    await expect(rowOf(page, e.title).getByText('진행 중', { exact: true })).toBeVisible();
  });

  test('AC-007-2 종료 확인에서 확인을 누르면 이벤트 상태가 종료로 바뀐다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await loginAdmin(page);
    await action(rowOf(page, e.title), '이벤트 종료').click();
    await action(page, '확인').click();
    await expect(rowOf(page, e.title).getByText('종료', { exact: true })).toBeVisible();
  });

  test('AC-007-3 종료 확인에서 취소를 누르면 이벤트는 진행 중 그대로이다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await loginAdmin(page);
    await action(rowOf(page, e.title), '이벤트 종료').click();
    await expect(page.getByText(CONFIRM_BODY)).toBeVisible();
    await action(page, '취소').click();
    await expect(page.getByText(CONFIRM_BODY)).toHaveCount(0);
    await expect(rowOf(page, e.title).getByText('진행 중', { exact: true })).toBeVisible();
    await expect(rowOf(page, e.title).getByText('종료', { exact: true })).toHaveCount(0);
  });

  test('AC-007-4 수동 종료한 이벤트의 상세에서 응모 버튼은 비활성이다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await loginAdmin(page);
    await closeViaUi(page, e);
    await page.goto(routes.detail(e.id));
    await expect(page.getByRole('button', { name: '응모하기' })).toBeDisabled();
  });

  test('AC-007-5 종료된 이벤트의 관리자 행에는 종료 동작과 재개 동작이 보이지 않는다', async ({ page, request }) => {
    const e = closedEvent(await seedInfo(request));
    await loginAdmin(page);
    const row = rowOf(page, e.title);
    await expect(action(row, '수정')).toBeVisible();
    await expect(action(row, '이벤트 종료')).toHaveCount(0);
    await expect(row.getByRole('button', { name: /재개|다시 열기/ })).toHaveCount(0);
    await expect(row.getByRole('link', { name: /재개|다시 열기/ })).toHaveCount(0);
  });
});
