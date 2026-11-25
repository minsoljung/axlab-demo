import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createSession, checkSession, destroySession, clearSessions, IDLE_MS, ABSOLUTE_MS } from "./adminSession";
import { setClock } from "./clock";
import { setAdminCodeOverride } from "./adminCode";

const T0 = "2026-11-25T00:00:00.000Z";
const at = (ms: number) => new Date(Date.parse(T0) + ms).toISOString();

beforeEach(() => {
  clearSessions();
  setAdminCodeOverride("code-1");
  setClock(T0);
});
afterEach(() => {
  setClock(null);
  setAdminCodeOverride(null);
  clearSessions();
});

describe("AC-008-2 접근 코드를 확인하면 세션이 생기고 유효하다", () => {
  it("만든 직후 ok", () => {
    const id = createSession();
    expect(checkSession(id)).toBe("ok");
  });
});

describe("AC-008-4·5·6·7·8·11 세션이 없으면 미확인이다", () => {
  it("쿠키 없음·모르는 값 = none", () => {
    expect(checkSession(undefined)).toBe("none");
    expect(checkSession("nope")).toBe("none");
  });
});

describe("AC-008-9 마지막 요청으로부터 30분이 지나면 만료된다", () => {
  it("29분 뒤 요청은 ok 이고 유휴 시간을 갱신한다", () => {
    const id = createSession();
    setClock(at(29 * 60_000));
    expect(checkSession(id)).toBe("ok");
    setClock(at(29 * 60_000 + IDLE_MS));
    expect(checkSession(id)).toBe("ok");
  });
  it("마지막 요청 뒤 30분 초과 = expired, 이후에도 되살아나지 않는다", () => {
    const id = createSession();
    setClock(at(IDLE_MS + 1));
    expect(checkSession(id)).toBe("expired");
    setClock(at(IDLE_MS + 2));
    expect(checkSession(id)).toBe("none");
  });
});

describe("AC-008-10 계속 써도 8시간이 지나면 만료된다", () => {
  it("20분마다 써도 8시간 초과 = expired", () => {
    const id = createSession();
    for (let m = 20; m <= 460; m += 20) {
      setClock(at(m * 60_000));
      expect(checkSession(id)).toBe("ok");
    }
    setClock(at(ABSOLUTE_MS - 60_000));
    expect(checkSession(id)).toBe("ok");
    setClock(at(ABSOLUTE_MS + 60_000));
    expect(checkSession(id)).toBe("expired");
  });
});

describe("AC-008-12 접근 코드가 바뀌면 기존 세션은 무효이다", () => {
  it("코드 변경 후 = code_changed", () => {
    const id = createSession();
    setAdminCodeOverride("code-2");
    expect(checkSession(id)).toBe("code_changed");
    expect(checkSession(id)).toBe("none");
  });
});

describe("AC-008-13·AC-008-14 로그아웃하면 세션이 사라진다", () => {
  it("destroy 후 = none", () => {
    const id = createSession();
    destroySession(id);
    expect(checkSession(id)).toBe("none");
  });
});
