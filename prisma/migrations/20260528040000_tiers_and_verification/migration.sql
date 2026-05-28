-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

-- AlterTable Ticket
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "tierLabel" TEXT NOT NULL DEFAULT '';

-- CreateTable EventTicketTier
CREATE TABLE IF NOT EXISTS "EventTicketTier" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "priceGel" INTEGER NOT NULL,

    CONSTRAINT "EventTicketTier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EventTicketTier_eventId_sortOrder_idx" ON "EventTicketTier"("eventId", "sortOrder");

DO $$ BEGIN
  ALTER TABLE "EventTicketTier" ADD CONSTRAINT "EventTicketTier_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "User_verificationStatus_idx" ON "User"("verificationStatus");
CREATE INDEX IF NOT EXISTS "Ticket_productSlug_idx" ON "Ticket"("productSlug");

-- Existing users (e.g. test accounts) can purchase after deploy
UPDATE "User" SET "verificationStatus" = 'VERIFIED', "verifiedAt" = NOW() WHERE "role" = 'ADMIN';
UPDATE "User" SET "verificationStatus" = 'VERIFIED', "verifiedAt" = NOW() WHERE "email" LIKE '%@sabagiro.test';
