import { createApplication } from "@/lib/application";
import { applyHooks } from "@/lib/testHooks";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx): Promise<Response> {
  const hooked = await applyHooks(new URL(req.url).pathname);
  if (hooked) return hooked;
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const r = await createApplication(id, {
    name: typeof body.name === "string" ? body.name : "",
    phone: typeof body.phone === "string" ? body.phone : "",
    consent: body.consent === true,
  });
  if (r.ok) return Response.json({ ok: true }, { status: 201 });
  const status = { closed: 403, not_found: 404, duplicate: 409, invalid: 400 }[r.reason];
  return Response.json({ error: r.reason, errors: r.errors }, { status });
}
