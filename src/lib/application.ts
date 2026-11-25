import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";
import { now } from "./clock";
import { statusOf } from "./events";
import { MESSAGES, validateApplication, type ApplicationErrors, type ApplicationInput } from "./application-shared";

export * from "./application-shared";

export type CreateResult =
  | { ok: true }
  | { ok: false; reason: "closed" | "not_found" | "duplicate" | "invalid"; errors?: ApplicationErrors };

export async function createApplication(eventId: string, i: ApplicationInput): Promise<CreateResult> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { ok: false, reason: "not_found" };
  // P-04: 종료 이벤트는 서버에서도 거부한다 (검증보다 먼저)
  if (statusOf(event) === "closed") return { ok: false, reason: "closed" };
  const v = validateApplication(i);
  if (!v.ok) return { ok: false, reason: "invalid", errors: v.errors };
  try {
    await prisma.entry.create({
      data: { eventId, name: i.name.trim(), phone: v.phone, consentAt: now() },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, reason: "duplicate", errors: { phone: MESSAGES.duplicate } };
    }
    throw e;
  }
  return { ok: true };
}
