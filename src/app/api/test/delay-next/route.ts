import { delayNext, notTestMode } from "@/lib/testHooks";

export async function POST(req: Request): Promise<Response> {
  const off = notTestMode();
  if (off) return off;
  const b = (await req.json().catch(() => ({}))) as { route?: string; ms?: number };
  if (typeof b.route !== "string" || typeof b.ms !== "number") {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  delayNext(b.route, b.ms);
  return Response.json({ ok: true });
}
