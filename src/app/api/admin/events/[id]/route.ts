import { updateAdminEvent } from "@/lib/adminEvents";
import { requireAdmin } from "@/lib/adminAuth";
import { applyHooks } from "@/lib/testHooks";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const hooked = await applyHooks(new URL(req.url).pathname);
  if (hooked) return hooked;
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return Response.json({ error: "bad_request" }, { status: 400 });
  const r = await updateAdminEvent(id, body);
  if (r.ok) return Response.json({ id: r.id });
  if (r.reason === "invalid") return Response.json({ error: "invalid", errors: r.errors }, { status: 400 });
  return Response.json({ error: r.reason }, { status: r.reason === "not_found" ? 404 : 409 });
}
