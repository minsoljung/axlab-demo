import { prisma } from "@/lib/db";
import { listEvents } from "@/lib/events";
import { applyHooks } from "@/lib/testHooks";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const hooked = await applyHooks(new URL(req.url).pathname);
  if (hooked) return hooked;
  const [events, carriers] = await Promise.all([
    listEvents(),
    prisma.carrier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return Response.json({ events, carriers });
}
