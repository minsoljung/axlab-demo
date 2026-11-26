import { prisma } from "@/lib/db";
import { listEvents } from "@/lib/events";
import { createAdminEvent } from "@/lib/adminEvents";
import { requireAdmin } from "@/lib/adminAuth";
import { applyHooks } from "@/lib/testHooks";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const hooked = await applyHooks(new URL(req.url).pathname);
  if (hooked) return hooked;
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const [events, carriers] = await Promise.all([
    listEvents(),
    prisma.carrier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return Response.json({ events, carriers });
}

export async function POST(req: Request): Promise<Response> {
  const hooked = await applyHooks(new URL(req.url).pathname);
  if (hooked) return hooked;
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return Response.json({ error: "bad_request" }, { status: 400 });
  const r = await createAdminEvent(body);
  if (r.ok) return Response.json({ id: r.id }, { status: 201 });
  if (r.reason === "invalid") return Response.json({ error: "invalid", errors: r.errors }, { status: 400 });
  return Response.json({ error: r.reason }, { status: 400 });
}
