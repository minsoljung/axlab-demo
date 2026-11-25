import { listEvents } from "@/lib/events";
import { notTestMode } from "@/lib/testHooks";

export const dynamic = "force-dynamic";

export async function GET(_req?: Request): Promise<Response> {
  const off = notTestMode();
  if (off) return off;
  const events = await listEvents();
  return Response.json(
    events.map((e) => ({
      id: e.id,
      title: e.title,
      carrier: e.carrier,
      status: e.status === "closed" ? "종료" : "진행 중",
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      content: e.content,
    })),
  );
}
