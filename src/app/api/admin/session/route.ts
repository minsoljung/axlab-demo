import { createSession, destroySession } from "@/lib/adminSession";
import { clearedCookie, codeMatches, readSessionId, sessionCookie } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { code?: unknown };
  if (!codeMatches(body.code)) return Response.json({ error: "invalid_code" }, { status: 401 });
  return Response.json({ ok: true }, { headers: { "set-cookie": sessionCookie(await createSession()) } });
}

export async function DELETE(req: Request): Promise<Response> {
  await destroySession(readSessionId(req));
  return Response.json({ ok: true }, { headers: { "set-cookie": clearedCookie() } });
}
