import { setAdminCodeOverride } from "@/lib/adminCode";
import { notTestMode } from "@/lib/testHooks";

export async function POST(req: Request): Promise<Response> {
  const off = notTestMode();
  if (off) return off;
  const b = (await req.json().catch(() => ({}))) as { code?: string | null };
  if (b.code !== null && typeof b.code !== "string") return Response.json({ error: "bad_request" }, { status: 400 });
  setAdminCodeOverride(b.code);
  return Response.json({ ok: true });
}
