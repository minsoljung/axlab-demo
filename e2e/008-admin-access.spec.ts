import { test, expect } from '@playwright/test';
import {
  resetApp, seedInfo, restoreHooks, setClock, setAdminCode, getCounts, openEvents,
} from './fixtures/hooks';
import {
  NOTICE, action, loginAdmin, submitCode, expectScr05, expectScr06, rowOf, fillEventForm, validEventForm,
  clickSave, openEditOf, closeViaUi, todayKst, addDays, endYmd, datePattern,
  visibleMessage,
} from './fixtures/helpers';
import { routes, api } from './fixtures/routes';

const MIN = 60_000;
const T0 = () => new Date();
const plus = (t: Date, min: number) => new Date(t.getTime() + min * MIN);

test.describe('008 운영자 접근 통제', () => {
  test.beforeEach(async ({ request }) => { await resetApp(request); });
  test.afterEach(async ({ request }) => { await restoreHooks(request); });

  test('AC-008-1 관리자 주소로 들어가면 접근 코드 입력란과 확인 버튼이 보인다', async ({ page }) => {
    await page.goto(routes.admin);
    await expectScr05(page);
  });

  test('AC-008-2 올바른 접근 코드를 확인하면 관리자 목록으로 이동한다', async ({ page }) => {
    await page.goto(routes.admin);
    await submitCode(page);
    await expectScr06(page);
  });

  test('AC-008-3 틀린 접근 코드를 확인하면 오류 문구가 보이고 진입 화면에 머문다', async ({ page }) => {
    await page.goto(routes.admin);
    await submitCode(page, 'wrong-code');
    await expect(visibleMessage(page, '접근 코드가 올바르지 않습니다')).toBeVisible();
    await expectScr05(page);
    await expect(page.getByRole('heading', { name: '이벤트 관리' })).toHaveCount(0);
  });

  test('AC-008-4 미확인 세션이 관리자 목록 주소로 들어가면 진입 화면으로 이동하고 목록은 보이지 않는다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    await page.goto(routes.adminList);
    await expectScr05(page);
    await expect(page.getByRole('heading', { name: '이벤트 관리' })).toHaveCount(0);
    await expect(page.getByText(e.title)).toHaveCount(0);
  });

  test('AC-008-5 미확인 세션이 등록 폼 주소로 들어가면 진입 화면으로 이동하고 입력 폼은 보이지 않는다', async ({ page }) => {
    await page.goto(routes.adminNew);
    await expectScr05(page);
    await expect(page.getByLabel('제목', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(0);
  });

  // 관리자 API 경로·본문은 계약 공백(가정). 인증이 검증보다 먼저 걸러야 하므로 본문 형식은 판정에 영향이 없다.
  test('AC-008-6 미확인 세션의 이벤트 등록 요청은 거부되고 이벤트 행은 늘지 않는다', async ({ request }) => {
    const before = (await getCounts(request)).events;
    const r = await request.post(api.adminEvents, {
      data: { carrier: '통신사 A', title: 'e2e 무단 등록', startsAt: todayKst(), endsAt: addDays(todayKst(), 30), content: 'x' },
    });
    expect([401, 403]).toContain(r.status());
    expect((await getCounts(request)).events).toBe(before);
  });

  test('AC-008-7 미확인 세션의 이벤트 수정 요청은 거부되고 저장된 값은 그대로이다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    const r = await request.patch(api.adminEvent(e.id), { data: { endsAt: addDays(todayKst(), 200), title: 'e2e 무단 수정' } });
    expect([401, 403]).toContain(r.status());
    await loginAdmin(page);
    await expect(rowOf(page, e.title)).toContainText(datePattern(endYmd(e)));
    await expect(page.getByText('e2e 무단 수정')).toHaveCount(0);
  });

  test('AC-008-8 미확인 세션의 이벤트 종료 요청은 거부되고 이벤트는 진행 중 그대로이다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    const r = await request.post(api.adminClose(e.id));
    expect([401, 403]).toContain(r.status());
    await loginAdmin(page);
    await expect(rowOf(page, e.title).getByText('진행 중', { exact: true })).toBeVisible();
  });

  test('AC-008-9 확인 후 마지막 요청으로부터 30분이 지나 관리자 목록을 요청하면 진입 화면으로 이동한다', async ({ page, request }) => {
    const t = T0();
    await setClock(request, t);
    await loginAdmin(page);
    await setClock(request, plus(t, 29));
    await page.goto(routes.adminList);
    await expectScr06(page);
    await setClock(request, plus(t, 60));
    await page.goto(routes.adminList);
    await expectScr05(page);
  });

  test('AC-008-10 계속 사용해도 8시간이 지나 관리자 목록을 요청하면 진입 화면으로 이동한다', async ({ page, request }) => {
    const t = T0();
    await setClock(request, t);
    await loginAdmin(page);
    for (let i = 1; i <= 23; i++) {
      await setClock(request, plus(t, i * 20));
      await page.goto(routes.adminList);
      await expectScr06(page);
    }
    await setClock(request, plus(t, 475));
    await page.goto(routes.adminList);
    await expectScr06(page);
    await setClock(request, plus(t, 481));
    await page.goto(routes.adminList);
    await expectScr05(page);
  });

  test('AC-008-11 브라우저를 종료했다가 다시 열어 관리자 목록 주소로 들어가면 진입 화면으로 이동한다', async ({ page, browser }) => {
    await loginAdmin(page);
    const reopened = await browser.newContext({ baseURL: 'http://localhost:3100' });
    const page2 = await reopened.newPage();
    await page2.goto(routes.adminList);
    await expectScr05(page2);
    await reopened.close();
  });

  test('AC-008-12 접근 코드가 바뀐 뒤 기존 세션이 관리자 목록을 요청하면 진입 화면으로 이동한다', async ({ page, request }) => {
    await loginAdmin(page);
    await setAdminCode(request, 'changed-admin-code');
    await page.goto(routes.adminList);
    await expectScr05(page);
  });

  test('AC-008-13 로그아웃 동작을 하면 진입 화면으로 이동한다', async ({ page }) => {
    await loginAdmin(page);
    await action(page, '로그아웃').click();
    await expectScr05(page);
  });

  test('AC-008-14 로그아웃한 뒤 관리자 목록 주소로 들어가면 진입 화면으로 이동한다', async ({ page }) => {
    await loginAdmin(page);
    await action(page, '로그아웃').click();
    await expectScr05(page);
    await page.goto(routes.adminList);
    await expectScr05(page);
    await expect(page.getByRole('heading', { name: '이벤트 관리' })).toHaveCount(0);
  });

  test('AC-008-15 로그아웃으로 진입 화면에 이동하면 다시 확인 안내가 보인다', async ({ page }) => {
    await loginAdmin(page);
    await action(page, '로그아웃').click();
    await expect(visibleMessage(page, NOTICE)).toBeVisible();
  });

  test('AC-008-15 30분 만료로 진입 화면에 이동하면 다시 확인 안내가 보인다', async ({ page, request }) => {
    const t = T0();
    await setClock(request, t);
    await loginAdmin(page);
    await setClock(request, plus(t, 31));
    await page.goto(routes.adminList);
    await expect(visibleMessage(page, NOTICE)).toBeVisible();
  });

  test('AC-008-15 접근 코드 변경으로 진입 화면에 이동하면 다시 확인 안내가 보인다', async ({ page, request }) => {
    await loginAdmin(page);
    await setAdminCode(request, 'changed-admin-code');
    await page.goto(routes.adminList);
    await expect(visibleMessage(page, NOTICE)).toBeVisible();
  });

  test('AC-008-16 만료된 세션에서 저장하면 진입 화면으로 이동하고 이벤트 행은 늘지 않는다', async ({ page, request }) => {
    const t = T0();
    await setClock(request, t);
    const before = (await getCounts(request)).events;
    await loginAdmin(page);
    await action(page, '이벤트 등록').click();
    await fillEventForm(page, validEventForm('e2e 만료 중 저장'));
    await setClock(request, plus(t, 31));
    await clickSave(page);
    await expectScr05(page);
    expect((await getCounts(request)).events).toBe(before);
  });

  test('AC-008-17 만료 뒤 다시 확인하고 등록 폼을 열면 모든 입력란이 빈 값이다', async ({ page, request }) => {
    const t = T0();
    await setClock(request, t);
    await loginAdmin(page);
    await action(page, '이벤트 등록').click();
    await fillEventForm(page, validEventForm('e2e 만료 중 입력'));
    await setClock(request, plus(t, 31));
    await clickSave(page);
    await expectScr05(page);
    await loginAdmin(page);
    await action(page, '이벤트 등록').click();
    await expect(page.getByRole('heading', { name: '이벤트 등록' })).toBeVisible();
    await expect(page.getByLabel('제목', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('시작일', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('종료 예정일', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('내용', { exact: true })).toHaveValue('');
  });

  test('AC-008-18 방문자 화면으로 가는 동작을 하면 이벤트 허브로 이동한다', async ({ page }) => {
    await loginAdmin(page);
    await action(page, '방문자 화면으로').click();
    await expect(page.getByRole('heading', { name: '이벤트 허브' })).toBeVisible();
  });

  test('AC-008-19 만료 뒤 다시 확인하고 수정 폼을 열면 입력란에 서버에 저장된 값이 채워져 있다', async ({ page, request }) => {
    const e = openEvents(await seedInfo(request))[0];
    const t = T0();
    await setClock(request, t);
    await loginAdmin(page);
    await openEditOf(page, e);
    await fillEventForm(page, { title: 'e2e 수정 중 제목' });
    await setClock(request, plus(t, 31));
    await clickSave(page);
    await expectScr05(page);
    await loginAdmin(page);
    await openEditOf(page, e);
    await expect(page.getByLabel('제목', { exact: true })).toHaveValue(e.title);
  });

  test('AC-008-20 미확인 세션이 관리자 목록 주소로 들어가면 다시 확인 안내가 보인다', async ({ page }) => {
    await page.goto(routes.adminList);
    await expect(visibleMessage(page, NOTICE)).toBeVisible();
  });

  test('AC-008-20 미확인 세션이 등록 폼 주소로 들어가면 다시 확인 안내가 보인다', async ({ page }) => {
    await page.goto(routes.adminNew);
    await expect(visibleMessage(page, NOTICE)).toBeVisible();
  });
});
