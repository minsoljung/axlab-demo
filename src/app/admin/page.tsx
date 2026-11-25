import { AdminAccess } from "@/components/AdminAccess";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const sp = await searchParams;
  return <AdminAccess notice={sp.notice === "1"} />;
}
