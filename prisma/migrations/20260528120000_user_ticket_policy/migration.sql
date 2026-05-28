-- AlterEnum
ALTER TYPE "TicketSource" ADD VALUE IF NOT EXISTS 'FREE';

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ticketLimitPerEvent" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "freeTicketsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "freeTicketsQuota" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "freeTicketsUsed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Ticket
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "Ticket_createdByUserId_idx" ON "Ticket"("createdByUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Ticket_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill: purchaser / generator = ticket owner for existing rows
UPDATE "Ticket" SET "createdByUserId" = "userId" WHERE "createdByUserId" IS NULL;
