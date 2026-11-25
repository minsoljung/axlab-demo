import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// 런타임 연결 = DATABASE_URL (운영 = Supabase pooler). PostgreSQL 만 쓴다(Prisma 하나로만 접근).
const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

function create(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL 이 없다");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma: PrismaClient = globalForPrisma.__prisma ?? (globalForPrisma.__prisma = create());
