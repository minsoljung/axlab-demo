import type { EventDto } from "@/lib/types";

export function makeEvent(over: Partial<EventDto> = {}): EventDto {
  return {
    id: "evt-1",
    title: "챗봇 체험단 모집",
    content: "챗봇을 체험하고 후기를 남겨 주세요.",
    carrierId: "carrier-a",
    carrier: "통신사 A",
    startsAt: "2026-11-01T00:00:00.000Z",
    endsAt: "2026-12-31T00:00:00.000Z",
    status: "open",
    ...over,
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}
