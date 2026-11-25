import { setClock } from "@/lib/clock";
import { notTestMode } from "@/lib/testHooks";

export async function POST(req: Request): Promise<Response> {
  const off = notTestMode();
  if (off) return off;
  const body = (await req.json().catch(() => ({}))) as { now?: string | null };
  if (body.now !== null && typeof body.now !== "string") return Response.json({ error: "bad_request" }, { status: 400 });
  try {
    setClock(body.now);
  } catch {
    return Response.json({ error: "bad_time" }, { status: 400 });
  }
  return Response.json({ ok: true });
}
