import { test, expect } from '@playwright/test';
import {
  resetApp, seedInfo, restoreHooks, delayNext, setClock, getCounts, appCount,
  openEvents, closedEvent, expireAfter,
} from './fixtures/hooks';
import { failAlways, gotoApply, fillApply, submitApply, applyOnce, visibleMessage } from './fixtures/helpers';
import { routes, api, urlEndsWith } from './fixtures/routes';

const PHONE = '01012345678';

test.describe('004 이벤트 응모', () => {
  test.beforeEach(async ({ request }) => { await resetApp(request); });
  test.afterEach(async ({ request }) => { await restoreHooks(request); });

  test('AC-004-1 응모 폼의 입력 항목은 이름·휴대전화번호·동의 체크 3개뿐이다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await gotoApply(page, e);
    await expect(page.getByLabel('이름', { exact: true })).toBeVisible();
    await expect(page.getByLabel('휴대전화번호', { exact: true })).toBeVisible();
    await expect(page.getByLabel('개인정보 수집·이용에 동의합니다')).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(2);
    await expect(page.getByRole('checkbox')).toHaveCount(1);
    await expect(page.getByRole('combobox')).toHaveCount(0);
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(page.getByRole('spinbutton')).toHaveCount(0);
  });

  test('AC-004-2 입력하고 동의해 제출하면 응모 완료가 보인다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await gotoApply(page, e);
    await fillApply(page, { name: '홍길동', phone: PHONE, consent: true });
    await submitApply(page);
    await expect(page.getByText('응모 완료', { exact: true })).toBeVisible();
    await expect(page.getByLabel('이름', { exact: true })).toHaveCount(0);
  });

  test('AC-004-3 제출하면 그 이벤트의 응모 행이 1건 늘어난다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    const before = appCount(await getCounts(request), e.id);
    await applyOnce(page, e, PHONE);
    await expect.poll(async () => appCount(await getCounts(request), e.id)).toBe(before + 1);
  });

  test('AC-004-4 이름이 비어 있으면 오류 문구가 보이고 응모 행은 늘지 않는다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    const before = await getCounts(request);
    await gotoApply(page, e);
    await fillApply(page, { name: '', phone: PHONE, consent: true });
    await submitApply(page);
    await expect(visibleMessage(page, '이름을 입력해 주세요')).toBeVisible();
    expect((await getCounts(request)).applications).toBe(before.applications);
  });

  test('AC-004-5 휴대전화번호가 숫자가 아니면 오류 문구가 보이고 응모 행은 늘지 않는다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    const before = await getCounts(request);
    await gotoApply(page, e);
    await fillApply(page, { name: '홍길동', phone: 'abc', consent: true });
    await submitApply(page);
    await expect(visibleMessage(page, '휴대전화번호를 확인해 주세요')).toBeVisible();
    expect((await getCounts(request)).applications).toBe(before.applications);
  });

  test('AC-004-6 동의하지 않고 제출하면 오류 문구가 보이고 응모 행은 늘지 않는다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    const before = await getCounts(request);
    await gotoApply(page, e);
    await fillApply(page, { name: '홍길동', phone: PHONE, consent: false });
    await submitApply(page);
    await expect(visibleMessage(page, '개인정보 수집·이용에 동의해 주세요')).toBeVisible();
    expect((await getCounts(request)).applications).toBe(before.applications);
  });

  test('AC-004-7 같은 이벤트에 같은 번호로 다시 제출하면 중복 문구가 보이고 응모 행은 늘지 않는다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await applyOnce(page, e, PHONE);
    const before = await getCounts(request);
    await gotoApply(page, e);
    await fillApply(page, { name: '홍길동', phone: PHONE, consent: true });
    await submitApply(page);
    await expect(visibleMessage(page, '이미 응모한 번호입니다')).toBeVisible();
    expect((await getCounts(request)).applications).toBe(before.applications);
  });

  test('AC-004-8 다른 이벤트에 응모한 번호로 이 이벤트에 제출하면 응모 완료로 이동한다', async ({ page, request }) => {
    const [first, second] = openEvents(await seedInfo(request));
    expect(second, '진행 중 이벤트 2개 이상 필요').toBeTruthy();
    await applyOnce(page, first, PHONE);
    await gotoApply(page, second);
    await fillApply(page, { name: '홍길동', phone: PHONE, consent: true });
    await submitApply(page);
    await expect(page.getByText('응모 완료', { exact: true })).toBeVisible();
    await expect.poll(async () => appCount(await getCounts(request), second.id)).toBe(1);
  });

  test('AC-004-9 종료된 이벤트의 응모 주소로 들어가면 폼 대신 종료 안내가 보인다', async ({ page, request }) => {
    const e = closedEvent(await seedInfo(request));
    await page.goto(routes.apply(e.id));
    await expect(visibleMessage(page, '종료된 이벤트입니다')).toBeVisible();
    await expect(page.getByLabel('이름', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('checkbox')).toHaveCount(0);
  });

  test('AC-004-10 폼을 연 뒤 이벤트가 종료돼 제출하면 응모 행은 늘지 않는다', async ({ page, request }) => {
    // 응모 API 경로를 가정하지 않으려고, 열려 있던 폼에서 서버 시계가 종료 뒤로 간 상태로 제출한다.
    const e = openEvents(await seedInfo(request))[0];
    await gotoApply(page, e);
    await fillApply(page, { name: '홍길동', phone: PHONE, consent: true });
    const before = await getCounts(request);
    await setClock(request, expireAfter(e));
    const done = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/api/'));
    await submitApply(page);
    await done;
    expect((await getCounts(request)).applications).toBe(before.applications);
    await expect(page.getByText('응모 완료', { exact: true })).toHaveCount(0);
  });

  test('AC-004-11 제출 응답이 지연되는 동안 제출 버튼은 비활성이다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await gotoApply(page, e);
    await fillApply(page, { name: '홍길동', phone: PHONE, consent: true });
    await delayNext(request, api.applications(e.id), 1500);
    await submitApply(page);
    await expect(page.getByRole('button', { name: '제출 중' })).toBeDisabled();
  });

  test('AC-004-12 제출이 서버 오류로 실패하면 실패 문구가 보이고 응모 행은 늘지 않는다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    const before = await getCounts(request);
    await gotoApply(page, e);
    await fillApply(page, { name: '홍길동', phone: PHONE, consent: true });
    await failAlways(page, api.applications(e.id), 'POST');
    await submitApply(page);
    await expect(visibleMessage(page, '응모에 실패했습니다')).toBeVisible();
    expect((await getCounts(request)).applications).toBe(before.applications);
  });

  test('AC-004-13 상세로 돌아가기를 누르면 이벤트 상세로 이동한다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await gotoApply(page, e);
    await page.getByRole('link', { name: '상세로 돌아가기' }).click();
    await expect(page).toHaveURL(urlEndsWith(routes.detail(e.id)));
    await expect(page.getByRole('heading', { name: e.title })).toBeVisible();
  });

  test('AC-004-14 응모 완료에서 목록으로를 누르면 이벤트 허브로 이동한다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await applyOnce(page, e, PHONE);
    await page.getByRole('link', { name: '목록으로' }).click();
    await expect(page).toHaveURL(urlEndsWith(routes.hub));
    await expect(page.getByRole('heading', { name: '이벤트 허브' })).toBeVisible();
  });

  test('AC-004-15 응모 완료에서 이벤트 상세로를 누르면 이벤트 상세로 이동한다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await applyOnce(page, e, PHONE);
    await page.getByRole('link', { name: '이벤트 상세로' }).click();
    await expect(page).toHaveURL(urlEndsWith(routes.detail(e.id)));
    await expect(page.getByRole('heading', { name: e.title })).toBeVisible();
  });
});
