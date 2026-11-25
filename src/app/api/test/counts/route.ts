import { prisma } from "@/lib/db";
import { notTestMode } from "@/lib/testHooks";

export const dynamic = "force-dynamic";

export async function GET(_req?: Request): Promise<Response> {
  const off = notTestMode();
  if (off) return off;
  const [events, grouped] = await Promise.all([
    prisma.event.count(),
    prisma.entry.groupBy({ by: ["eventId"], _count: { _all: true } }),
  ]);
  const applicationsByEvent: Record<string, number> = {};
  let applications = 0;
  for (const g of grouped) {
    applicationsByEvent[g.eventId] = g._count._all;
    applications += g._count._all;
  }
  return Response.json({ events, applications, applicationsByEvent });
}
