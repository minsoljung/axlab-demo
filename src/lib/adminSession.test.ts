import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createSession, checkSession, destroySession, clearSessions, IDLE_MS, ABSOLUTE_MS } from "./adminSession";
import { setClock } from "./clock";
import { setAdminCodeOverride } from "./adminCode";
import { prisma } from "./db";
import { createHash } from "node:crypto";

const T0 = "2026-11-25T00:00:00.000Z";
const at = (ms: number) => new Date(Date.parse(T0) + ms).toISOString();

beforeEach(async () => {
  await clearSessions();
  setAdminCodeOverride("code-1");
  setClock(T0);
});
afterEach(async () => {
  setClock(null);
  setAdminCodeOverride(null);
  await clearSessions();
});

describe("AC-008-2 접근 코드를 확인하면 세션이 생기고 유효하다", () => {
  it("만든 직후 ok", async () => {
    const id = await createSession();
    expect(await checkSession(id)).toBe("ok");
  });
});

describe("AC-008-4·5·6·7·8·11 세션이 없으면 미확인이다", () => {
  it("쿠키 없음·모르는 값 = none", async () => {
    expect(await checkSession(undefined)).toBe("none");
    expect(await checkSession("nope")).toBe("none");
  });
});

describe("AC-008-9 마지막 요청으로부터 30분이 지나면 만료된다", () => {
  it("29분 뒤 요청은 ok 이고 유휴 시간을 갱신한다", async () => {
    const id = await createSession();
    setClock(at(29 * 60_000));
    expect(await checkSession(id)).toBe("ok");
    setClock(at(29 * 60_000 + IDLE_MS));
    expect(await checkSession(id)).toBe("ok");
  });
  it("마지막 요청 뒤 30분 초과 = expired, 이후에도 되살아나지 않는다", async () => {
    const id = await createSession();
    setClock(at(IDLE_MS + 1));
    expect(await checkSession(id)).toBe("expired");
    setClock(at(IDLE_MS + 2));
    expect(await checkSession(id)).toBe("none");
  });
});

describe("AC-008-10 계속 써도 8시간이 지나면 만료된다", () => {
  it("20분마다 써도 8시간 초과 = expired", async () => {
    const id = await createSession();
    for (let m = 20; m <= 460; m += 20) {
      setClock(at(m * 60_000));
      expect(await checkSession(id)).toBe("ok");
    }
    setClock(at(ABSOLUTE_MS - 60_000));
    expect(await checkSession(id)).toBe("ok");
    setClock(at(ABSOLUTE_MS + 60_000));
    expect(await checkSession(id)).toBe("expired");
  });
});

describe("AC-008-12 접근 코드가 바뀌면 기존 세션은 무효이다", () => {
  it("코드 변경 후 = code_changed", async () => {
    const id = await createSession();
    setAdminCodeOverride("code-2");
    expect(await checkSession(id)).toBe("code_changed");
    expect(await checkSession(id)).toBe("none");
  });
});

describe("AC-008-13·AC-008-14 로그아웃하면 세션이 사라진다", () => {
  it("destroy 후 = none", async () => {
    const id = await createSession();
    await destroySession(id);
    expect(await checkSession(id)).toBe("none");
  });
});

// 서버리스 장애 회귀: 로그인을 처리한 인스턴스와 다음 요청을 받는 인스턴스가 다르다. 인스턴스 메모리(globalThis)는 공유되지 않는다.
const newInstance = () => {
  delete (globalThis as unknown as { __adminSessions?: unknown }).__adminSessions;
};

describe("AC-008-2·AC-008-9 다른 서버 인스턴스가 받아도 세션이 유지된다", () => {
  it("만든 뒤 메모리 캐시를 비워도 ok", async () => {
    const id = await createSession();
    newInstance();
    expect(await checkSession(id)).toBe("ok");
  });
  it("인스턴스가 바뀌어도 유휴 30분 초과 = expired", async () => {
    const id = await createSession();
    newInstance();
    setClock(at(IDLE_MS + 1));
    expect(await checkSession(id)).toBe("expired");
    newInstance();
    expect(await checkSession(id)).toBe("none");
  });
  it("인스턴스가 바뀌어도 코드 변경 = code_changed", async () => {
    const id = await createSession();
    newInstance();
    setAdminCodeOverride("code-2");
    expect(await checkSession(id)).toBe("code_changed");
  });
  it("인스턴스가 바뀌어도 로그아웃하면 none", async () => {
    const id = await createSession();
    newInstance();
    await destroySession(id);
    newInstance();
    expect(await checkSession(id)).toBe("none");
  });
});

describe("AC-008-10 인스턴스가 바뀌어도 절대 8시간이 적용된다", () => {
  it("계속 써도 8시간 초과 = expired", async () => {
    const id = await createSession();
    for (let m = 20; m <= 460; m += 20) {
      newInstance();
      setClock(at(m * 60_000));
      expect(await checkSession(id)).toBe("ok");
    }
    newInstance();
    setClock(at(ABSOLUTE_MS + 60_000));
    expect(await checkSession(id)).toBe("expired");
  });
});

describe("AC-008-2 세션 두 개는 서로 독립이다", () => {
  it("하나를 로그아웃해도 다른 하나는 ok", async () => {
    const a = await createSession();
    const b = await createSession();
    expect(a).not.toBe(b);
    await destroySession(a);
    expect(await checkSession(a)).toBe("none");
    expect(await checkSession(b)).toBe("ok");
  });
  it("하나가 유휴 만료돼도 다른 하나(계속 사용)는 ok", async () => {
    const a = await createSession();
    const b = await createSession();
    setClock(at(20 * 60_000));
    expect(await checkSession(b)).toBe("ok");
    setClock(at(IDLE_MS + 1));
    expect(await checkSession(a)).toBe("expired");
    expect(await checkSession(b)).toBe("ok");
  });
});

describe("AC-008-2 DB 에는 토큰·접근 코드 평문을 저장하지 않는다", () => {
  it("id = 토큰의 sha256, codeHash = 코드의 sha256", async () => {
    const token = await createSession();
    const rows = await prisma.adminSession.findMany();
    expect(rows).toHaveLength(1);
    const sha = (s: string) => createHash("sha256").update(s).digest("hex");
    expect(rows[0].id).toBe(sha(token));
    expect(rows[0].id).not.toBe(token);
    expect(rows[0].codeHash).toBe(sha("code-1"));
    expect(JSON.stringify(rows)).not.toContain("code-1");
  });
});

describe("AC-008-9·10 오래된 세션 행은 로그인할 때 정리된다", () => {
  it("8시간을 넘긴 행은 새 로그인 때 지워진다", async () => {
    const old = await createSession();
    setClock(at(ABSOLUTE_MS + 60_000));
    await createSession();
    expect(await prisma.adminSession.count()).toBe(1);
    expect(await checkSession(old)).toBe("none");
  });
});
