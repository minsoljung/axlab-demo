import { prisma } from "@/lib/db";
import { resetAndSeed } from "@/lib/seed";
import { resetHooks, notTestMode } from "@/lib/testHooks";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const off = notTestMode();
  if (off) return off;
  const body = (await req.json().catch(() => ({}))) as { seed?: string };
  try {
    await resetAndSeed(prisma, body.seed ?? "default");
  } catch {
    return Response.json({ error: "unknown_seed" }, { status: 400 });
  }
  resetHooks();
  return Response.json({ ok: true });
}
