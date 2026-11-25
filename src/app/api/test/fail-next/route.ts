import { failNext, notTestMode } from "@/lib/testHooks";

export async function POST(req: Request): Promise<Response> {
  const off = notTestMode();
  if (off) return off;
  const b = (await req.json().catch(() => ({}))) as { route?: string; status?: number };
  if (typeof b.route !== "string" || typeof b.status !== "number") {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  failNext(b.route, b.status);
  return Response.json({ ok: true });
}
