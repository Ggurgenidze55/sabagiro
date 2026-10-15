CREATE TABLE "EventStatistics" (
    "id" TEXT NOT NULL,
    "eventSlug" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "eventDate" TEXT,
    "dayLabel" TEXT NOT NULL DEFAULT '',
    "dateLabel" TEXT NOT NULL DEFAULT '',
    "paidTotal" INTEGER NOT NULL DEFAULT 0,
    "paidUsed" INTEGER NOT NULL DEFAULT 0,
    "paidUnused" INTEGER NOT NULL DEFAULT 0,
    "paidCancelled" INTEGER NOT NULL DEFAULT 0,
    "inviteTotal" INTEGER NOT NULL DEFAULT 0,
    "inviteUsed" INTEGER NOT NULL DEFAULT 0,
    "inviteUnused" INTEGER NOT NULL DEFAULT 0,
    "inviteCancelled" INTEGER NOT NULL DEFAULT 0,
    "inviteAdmin" INTEGER NOT NULL DEFAULT 0,
    "inviteFree" INTEGER NOT NULL DEFAULT 0,
    "inviteArtist" INTEGER NOT NULL DEFAULT 0,
    "paidRevenueGel" INTEGER NOT NULL DEFAULT 0,
    "promoTicketsSold" INTEGER NOT NULL DEFAULT 0,
    "promoOrdersCount" INTEGER NOT NULL DEFAULT 0,
    "promoDiscountGel" INTEGER NOT NULL DEFAULT 0,
    "promoRevenueGel" INTEGER NOT NULL DEFAULT 0,
    "promoBreakdown" JSONB NOT NULL DEFAULT '[]',
    "finalizedAt" TIMESTAMP(3),
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventStatistics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventStatistics_eventSlug_key" ON "EventStatistics"("eventSlug");
CREATE INDEX "EventStatistics_eventDate_idx" ON "EventStatistics"("eventDate");
CREATE INDEX "EventStatistics_finalizedAt_idx" ON "EventStatistics"("finalizedAt");
