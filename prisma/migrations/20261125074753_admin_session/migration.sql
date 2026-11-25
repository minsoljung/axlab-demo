-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "lastAt" TIMESTAMP(3) NOT NULL,
    "codeHash" TEXT NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);
