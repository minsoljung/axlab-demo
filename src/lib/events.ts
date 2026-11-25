import type { Event, Carrier } from "@/generated/prisma/client";
import { prisma } from "./db";
import { now } from "./clock";
import type { EventDto, EventStatus } from "./types";

// 종료 = 수동 종료 처리됨(closedAt) 또는 종료 예정일 도달 (A-08·A-21). 시계는 서버 시계를 쓴다.
export function statusOf(e: Pick<Event, "closedAt" | "endsAt">, at: Date = now()): EventStatus {
  if (e.closedAt && e.closedAt.getTime() <= at.getTime()) return "closed";
  return e.endsAt.getTime() <= at.getTime() ? "closed" : "open";
}

function toDto(e: Event & { carrier: Carrier }, at: Date): EventDto {
  return {
    id: e.id,
    title: e.title,
    content: e.content,
    carrierId: e.carrierId,
    carrier: e.carrier.name,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    status: statusOf(e, at),
  };
}

export async function listEvents(): Promise<EventDto[]> {
  const at = now();
  const rows = await prisma.event.findMany({
    include: { carrier: true },
    orderBy: [{ startsAt: "desc" }, { id: "asc" }],
  });
  return rows.map((r) => toDto(r, at));
}

export async function getEvent(id: string): Promise<EventDto | null> {
  const row = await prisma.event.findUnique({ where: { id }, include: { carrier: true } });
  return row ? toDto(row, now()) : null;
}
