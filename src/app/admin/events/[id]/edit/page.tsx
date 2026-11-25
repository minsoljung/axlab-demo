import { notFound } from "next/navigation";
import { AdminEventForm } from "@/components/AdminEventForm";
import { requireAdminPage } from "@/lib/adminGuard";
import { prisma } from "@/lib/db";
import { getEvent } from "@/lib/events";
import { kstYmd } from "@/lib/kst";

export const dynamic = "force-dynamic";

// 수정 대상은 항상 서버 저장값으로 채운다(AC-006-1·AC-008-19: 만료 전 미저장 입력은 남지 않는다)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const [event, carriers] = await Promise.all([
    getEvent(id),
    prisma.carrier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!event) notFound();
  return (
    <AdminEventForm
      carriers={carriers}
      initial={{
        id: event.id,
        closed: event.status === "closed",
        values: {
          carrierId: event.carrierId,
          title: event.title,
          startsAt: kstYmd(new Date(event.startsAt)),
          endsAt: kstYmd(new Date(event.endsAt)),
          content: event.content,
        },
      }}
    />
  );
}
