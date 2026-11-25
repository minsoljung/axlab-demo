import { test, expect } from '@playwright/test';
import { resetApp, seedInfo, restoreHooks, setClock, openEvents, expireAfter, carrierLabel } from './fixtures/hooks';
import {
  action, carrierCombobox, loginAdmin, expectScr06, rowOf, fillEventForm, clickSave, openEditOf, closeViaUi,
  todayKst, addDays, endYmd, datePattern, kstYmd,
  visibleMessage,
} from './fixtures/helpers';
import { routes } from './fixtures/routes';

test.describe('006 운영자 이벤트 수정', () => {
  test.beforeEach(async ({ request }) => { await resetApp(request); });
  test.afterEach(async ({ request }) => { await restoreHooks(request); });

  test('AC-006-1 진행 중 이벤트의 수정 동작을 하면 기존 값이 채워진 폼이 열린다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await loginAdmin(page);
    await openEditOf(page, e);
    await expect(page.getByLabel('제목', { exact: true })).toHaveValue(e.title);
    await expect(page.getByLabel('종료 예정일', { exact: true })).toHaveValue(endYmd(e));
    if (e.startsAt) await expect(page.getByLabel('시작일', { exact: true })).toHaveValue(kstYmd(new Date(e.startsAt)));
    if (e.content) await expect(page.getByLabel('내용', { exact: true })).toHaveValue(e.content);
    await expect(carrierCombobox(page)).toContainText(carrierLabel(e));
  });

  test('AC-006-2 종료 예정일을 오늘로 바꿔 저장하면 목록에 바뀐 값이 보인다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    const today = todayKst();
    await loginAdmin(page);
    await openEditOf(page, e);
    await fillEventForm(page, { endsAt: today });
    await clickSave(page);
    await expectScr06(page);
    await expect(rowOf(page, e.title)).toContainText(datePattern(today));
  });

  test('AC-006-2 종료 예정일을 이후 날짜로 바꿔 저장하면 목록에 바뀐 값이 보인다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    const later = addDays(endYmd(e), 1);
    await loginAdmin(page);
    await openEditOf(page, e);
    await fillEventForm(page, { endsAt: later });
    await clickSave(page);
    await expectScr06(page);
    await expect(rowOf(page, e.title)).toContainText(datePattern(later));
  });

  test('AC-006-3 종료 예정일을 어제로 바꿔 저장하면 오류 문구가 보이고 저장값은 그대로이다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    const yesterday = addDays(todayKst(), -1);
    await loginAdmin(page);
    await openEditOf(page, e);
    await fillEventForm(page, { endsAt: yesterday });
    await clickSave(page);
    await expect(visibleMessage(page, '종료 예정일은 오늘 이전으로 바꿀 수 없습니다')).toBeVisible();
    await expect(page.getByRole('heading', { name: '이벤트 수정' })).toBeVisible();
    await action(page, '취소').click();
    await expectScr06(page);
    await expect(rowOf(page, e.title)).toContainText(datePattern(endYmd(e)));
    await expect(rowOf(page, e.title)).not.toContainText(datePattern(yesterday));
  });

  test('AC-006-4 수동 종료된 이벤트의 수정 폼에서 종료 예정일 입력은 비활성이다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await loginAdmin(page);
    await closeViaUi(page, e);
    await openEditOf(page, e);
    await expect(page.getByLabel('종료 예정일', { exact: true })).toBeDisabled();
  });

  test('AC-006-5 기간이 만료된 이벤트의 수정 폼에서 종료 예정일 입력은 비활성이다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await setClock(request, expireAfter(e));
    await loginAdmin(page);
    await expect(rowOf(page, e.title).getByText('종료', { exact: true })).toBeVisible();
    await openEditOf(page, e);
    await expect(page.getByLabel('종료 예정일', { exact: true })).toBeDisabled();
  });

  test('AC-006-6 폼을 연 뒤 이벤트가 종료돼 종료 예정일 변경을 저장해도 저장값은 그대로이다', async ({ page, context, request }) => {
    // 변경 API 경로를 가정하지 않으려고, 편집 폼을 연 채 다른 탭에서 이벤트를 종료한 뒤 저장한다.
    const e = openEvents(await seedInfo(request))[0];
    await loginAdmin(page);
    await openEditOf(page, e);
    await fillEventForm(page, { endsAt: addDays(endYmd(e), 5) });

    const other = await context.newPage();
    await other.goto(routes.adminList);
    await closeViaUi(other, e);

    const done = page.waitForResponse((r) => r.request().method() !== 'GET' && r.url().includes('/api/'));
    await clickSave(page);
    await done;

    await other.reload();
    await expect(rowOf(other, e.title)).toContainText(datePattern(endYmd(e)));
    await expect(rowOf(other, e.title)).not.toContainText(datePattern(addDays(endYmd(e), 5)));
  });
});
