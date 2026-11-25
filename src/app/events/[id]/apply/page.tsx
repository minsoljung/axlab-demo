import { ApplyForm } from "@/components/ApplyForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApplyForm id={id} />;
}
