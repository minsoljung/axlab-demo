-- CreateEnum
CREATE TYPE "MetricKind" AS ENUM ('page_view', 'form_open', 'apply_complete');

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "purgeBaseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricEvent" (
    "id" TEXT NOT NULL,
    "kind" "MetricKind" NOT NULL,
    "eventId" TEXT,
    "visitorId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "aggregatedAt" TIMESTAMP(3),

    CONSTRAINT "MetricEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMetric" (
    "day" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "kind" "MetricKind" NOT NULL,
    "count" INTEGER NOT NULL,
    "uniqueVisitors" INTEGER NOT NULL,

    CONSTRAINT "DailyMetric_pkey" PRIMARY KEY ("day","eventId","kind")
);

-- CreateTable
CREATE TABLE "MonthlyVisitors" (
    "month" TEXT NOT NULL,
    "uniqueVisitors" INTEGER NOT NULL,

    CONSTRAINT "MonthlyVisitors_pkey" PRIMARY KEY ("month")
);

-- CreateTable
CREATE TABLE "EventMetricSummary" (
    "eventId" TEXT NOT NULL,
    "pageViewVisitors" INTEGER NOT NULL,
    "completeVisitors" INTEGER NOT NULL,
    "durationsSeconds" INTEGER[],
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventMetricSummary_pkey" PRIMARY KEY ("eventId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Carrier_name_key" ON "Carrier"("name");

-- CreateIndex
CREATE INDEX "Event_carrierId_idx" ON "Event"("carrierId");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_eventId_phone_key" ON "Entry"("eventId", "phone");

-- CreateIndex
CREATE INDEX "MetricEvent_occurredAt_idx" ON "MetricEvent"("occurredAt");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
