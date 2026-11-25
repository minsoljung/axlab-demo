import { getEvent } from "@/lib/events";
import { applyHooks } from "@/lib/testHooks";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const hooked = await applyHooks(new URL(req.url).pathname);
  if (hooked) return hooked;
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ event });
}
