import type { PrismaClient } from "@/generated/prisma/client";

const DAY = 86400000;
export const SEED_NAMES = ["default", "empty", "carrier-c-empty"] as const;

const CARRIERS = [
  { id: "carrier-a", name: "통신사 A" },
  { id: "carrier-b", name: "통신사 B" },
  { id: "carrier-c", name: "통신사 C" },
];

// 시작·종료는 시드 시점의 실제 시각 기준 (시계 훅이 고정돼 있어도 시드는 실제 시각을 쓴다)
function events(base: number) {
  const open = (id: string, carrierId: string, title: string, content: string) => ({
    id,
    carrierId,
    title,
    content,
    startsAt: new Date(base - 5 * DAY),
    endsAt: new Date(base + 30 * DAY),
  });
  return [
    open("evt-a1", "carrier-a", "챗봇 체험단 모집", "챗봇 서비스를 체험하고 후기를 남겨 주세요."),
    open("evt-a2", "carrier-a", "문서 요약 도우미 이벤트", "문서 요약 기능을 써 보고 의견을 알려 주세요."),
    open("evt-b1", "carrier-b", "음성 비서 체험 이벤트", "음성 비서를 체험하는 분께 경품을 드립니다."),
    open("evt-c1", "carrier-c", "번역 도우미 체험 이벤트", "번역 도우미를 체험해 보세요."),
    {
      id: "evt-b-closed",
      carrierId: "carrier-b",
      title: "코딩 도우미 체험 이벤트",
      content: "이미 끝난 이벤트입니다.",
      startsAt: new Date(base - 40 * DAY),
      endsAt: new Date(base - 10 * DAY),
    },
  ];
}

export async function resetAndSeed(prisma: PrismaClient, seed: string): Promise<void> {
  if (!(SEED_NAMES as readonly string[]).includes(seed)) throw new Error(`모르는 시드: ${seed}`);
  await prisma.$transaction([
    prisma.metricEvent.deleteMany(),
    prisma.dailyMetric.deleteMany(),
    prisma.monthlyVisitors.deleteMany(),
    prisma.eventMetricSummary.deleteMany(),
    prisma.entry.deleteMany(),
    prisma.event.deleteMany(),
    prisma.carrier.deleteMany(),
  ]);
  await prisma.carrier.createMany({ data: CARRIERS });
  if (seed === "empty") return;
  let list = events(Date.now());
  if (seed === "carrier-c-empty") list = list.filter((e) => e.carrierId !== "carrier-c");
  await prisma.event.createMany({ data: list });
}
