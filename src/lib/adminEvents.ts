import { prisma } from "./db";
import { now } from "./clock";
import { statusOf } from "./events";
import { endOfKstDay, kstYmd, startOfKstDay } from "./kst";
import { MSG, validateRequired, type EventFormErrors, type EventFormValues } from "./adminEvents-shared";

// 관리자 이벤트 등록·수정·종료(S-05~S-07). 날짜는 KST 달력 날짜 문자열로 받는다.
// 종료 예정일은 그 날짜의 KST 마지막 순간, 시작일은 KST 0시로 저장한다.
export type EventInput = Partial<Record<"carrierId" | "carrier" | "title" | "startsAt" | "endsAt" | "content", unknown>>;
export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; reason: "invalid"; errors: EventFormErrors }
  | { ok: false; reason: "not_found" | "closed" };
export type CloseResult = { ok: true } | { ok: false; reason: "not_found" | "already_closed" };

const str = (v: unknown): string => (typeof v === "string" ? v : "");

// carrierId 또는 carrier(통신사 id 또는 이름)로 통신사를 찾는다. 없으면 null.
async function resolveCarrier(input: EventInput): Promise<string | null> {
  const key = str(input.carrierId) || str(input.carrier);
  if (!key) return null;
  const c = await prisma.carrier.findFirst({ where: { OR: [{ id: key }, { name: key }] }, select: { id: true } });
  return c?.id ?? null;
}

export async function createAdminEvent(input: EventInput): Promise<SaveResult> {
  const carrierId = await resolveCarrier(input);
  const values: EventFormValues = {
    carrierId: carrierId ?? "",
    title: str(input.title),
    startsAt: str(input.startsAt),
    endsAt: str(input.endsAt),
    content: str(input.content),
  };
  const errors = validateRequired(values);
  if (Object.keys(errors).length > 0) return { ok: false, reason: "invalid", errors };
  const row = await prisma.event.create({
    data: {
      carrierId: values.carrierId,
      title: values.title.trim(),
      content: values.content,
      startsAt: startOfKstDay(values.startsAt),
      endsAt: endOfKstDay(values.endsAt),
    },
  });
  return { ok: true, id: row.id };
}

// 보낸 필드만 바꾼다(PATCH). 종료된 이벤트의 종료 예정일 변경은 거부한다(A-21).
export async function updateAdminEvent(id: string, input: EventInput): Promise<SaveResult> {
  const row = await prisma.event.findUnique({ where: { id } });
  if (!row) return { ok: false, reason: "not_found" };
  const at = now();
  const curEnd = kstYmd(row.endsAt);
  const curStart = kstYmd(row.startsAt);
  const endChanged = input.endsAt !== undefined && str(input.endsAt) !== curEnd;
  const isClosed = statusOf(row, at) === "closed";
  if (isClosed && endChanged) return { ok: false, reason: "closed" };

  const carrierId = input.carrierId !== undefined || input.carrier !== undefined ? await resolveCarrier(input) : row.carrierId;
  const values: EventFormValues = {
    carrierId: carrierId ?? "",
    title: input.title !== undefined ? str(input.title) : row.title,
    startsAt: input.startsAt !== undefined ? str(input.startsAt) : curStart,
    endsAt: input.endsAt !== undefined ? str(input.endsAt) : curEnd,
    content: input.content !== undefined ? str(input.content) : row.content,
  };
  const errors = validateRequired(values);
  if (endChanged && !errors.period && values.endsAt < kstYmd(at)) errors.endsAt = MSG.past;
  if (Object.keys(errors).length > 0) return { ok: false, reason: "invalid", errors };

  await prisma.event.update({
    where: { id },
    data: {
      carrierId: values.carrierId,
      title: values.title.trim(),
      content: values.content,
      ...(values.startsAt !== curStart ? { startsAt: startOfKstDay(values.startsAt) } : {}),
      ...(endChanged ? { endsAt: endOfKstDay(values.endsAt) } : {}),
    },
  });
  return { ok: true, id };
}

// 수동 종료. closedAt·purgeBaseDate(= min(종료 예정일, 종료 처리일))를 이때 고정한다(A-17·A-21). 재개 없음.
export async function closeAdminEvent(id: string): Promise<CloseResult> {
  const row = await prisma.event.findUnique({ where: { id } });
  if (!row) return { ok: false, reason: "not_found" };
  const at = now();
  if (statusOf(row, at) === "closed") return { ok: false, reason: "already_closed" };
  const base = row.endsAt.getTime() < at.getTime() ? row.endsAt : at;
  await prisma.event.update({ where: { id }, data: { closedAt: at, purgeBaseDate: base } });
  return { ok: true };
}
