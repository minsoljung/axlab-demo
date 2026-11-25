import { AdminEventForm } from "@/components/AdminEventForm";
import { requireAdminPage } from "@/lib/adminGuard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminPage();
  const carriers = await prisma.carrier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return <AdminEventForm carriers={carriers} />;
}
