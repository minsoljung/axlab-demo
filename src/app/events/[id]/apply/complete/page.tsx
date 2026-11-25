import type { Metadata } from "next";
import { ApplyComplete } from "@/components/ApplyComplete";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApplyComplete id={id} />;
}

// Next 의 경로 안내(route announcer)는 문서 제목이 있으면 그것을 읽는다. 제목이 h1("응모 완료")과 같으면 같은 문구가 두 번 잡힌다.
export const metadata: Metadata = { title: "응모 접수 | 마케팅 허브" };
