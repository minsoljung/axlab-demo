import { AdminEventList } from "@/components/AdminEventList";
import { requireAdminPage } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminPage();
  return <AdminEventList />;
}
