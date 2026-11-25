import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { resetAndSeed } from "../src/lib/seed";

// npm run db:seed — 개발 DB(.env)를 초기화하고 default 시드를 넣는다. 시드 이름은 첫 인자(기본 default)
async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  await resetAndSeed(prisma, process.argv[2] ?? "default");
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
