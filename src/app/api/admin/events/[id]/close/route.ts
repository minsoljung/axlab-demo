import { closeAdminEvent } from "@/lib/adminEvents";
import { requireAdmin } from "@/lib/adminAuth";
import { applyHooks } from "@/lib/testHooks";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const hooked = await applyHooks(new URL(req.url).pathname);
  if (hooked) return hooked;
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const r = await closeAdminEvent(id);
  if (r.ok) return Response.json({ ok: true });
  return Response.json({ error: r.reason }, { status: r.reason === "not_found" ? 404 : 409 });
}
