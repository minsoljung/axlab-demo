import { createHash, randomBytes } from "node:crypto";
import { now } from "./clock";
import { getAdminCode } from "./adminCode";
import { prisma } from "./db";

// 관리자 세션(P-05·A-22). DB(AdminSession)에 둔다 — 서버리스는 요청마다 다른 인스턴스가 받을 수 있어 메모리에 두면 안 된다.
// 쿠키에는 원 토큰, DB 에는 토큰의 sha256 만 둔다(DB 가 유출돼도 세션을 가로챌 수 없다). 시계는 now() 만 쓴다.
export const IDLE_MS = 30 * 60_000;
export const ABSOLUTE_MS = 8 * 60 * 60_000;
export type SessionState = "ok" | "none" | "expired" | "code_changed";

const sha256 = (s: string): string => createHash("sha256").update(s).digest("hex");

export async function createSession(): Promise<string> {
  const token = randomBytes(24).toString("hex");
  const t = now();
  // 오래된 행 정리(별도 크론 없음): 절대 만료(8시간)를 넘긴 행은 어차피 쓸 수 없다
  await prisma.adminSession.deleteMany({ where: { createdAt: { lt: new Date(t.getTime() - ABSOLUTE_MS) } } });
  await prisma.adminSession.create({
    data: { id: sha256(token), createdAt: t, lastAt: t, codeHash: sha256(getAdminCode() ?? "") },
  });
  return token;
}

// 요청마다 부른다. ok 면 마지막 요청 시각을 갱신한다. 만료·코드 변경이면 세션을 지운다.
export async function checkSession(token: string | null | undefined): Promise<SessionState> {
  if (!token) return "none";
  const id = sha256(token);
  const s = await prisma.adminSession.findUnique({ where: { id } });
  if (!s) return "none";
  const t = now().getTime();
  if (s.codeHash !== sha256(getAdminCode() ?? "")) {
    await prisma.adminSession.deleteMany({ where: { id } });
    return "code_changed";
  }
  if (t - s.lastAt.getTime() > IDLE_MS || t - s.createdAt.getTime() > ABSOLUTE_MS) {
    await prisma.adminSession.deleteMany({ where: { id } });
    return "expired";
  }
  await prisma.adminSession.updateMany({ where: { id }, data: { lastAt: new Date(t) } });
  return "ok";
}

export async function destroySession(token: string | null | undefined): Promise<void> {
  if (token) await prisma.adminSession.deleteMany({ where: { id: sha256(token) } });
}
export async function clearSessions(): Promise<void> {
  await prisma.adminSession.deleteMany();
}
