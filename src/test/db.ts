import { prisma } from "@/lib/db";

// 테스트가 남긴 행은 테스트가 지운다 (FK 순서: Entry → Event → Carrier)
export async function clearDb() {
  await prisma.metricEvent.deleteMany();
  await prisma.dailyMetric.deleteMany();
  await prisma.monthlyVisitors.deleteMany();
  await prisma.eventMetricSummary.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.event.deleteMany();
  await prisma.carrier.deleteMany();
  await prisma.adminSession.deleteMany();
}

export async function seedCarriers() {
  await prisma.carrier.createMany({
    data: [
      { id: "carrier-a", name: "통신사 A" },
      { id: "carrier-b", name: "통신사 B" },
      { id: "carrier-c", name: "통신사 C" },
    ],
  });
}

export function day(offset: number, from = new Date()): Date {
  return new Date(from.getTime() + offset * 86400000);
}
