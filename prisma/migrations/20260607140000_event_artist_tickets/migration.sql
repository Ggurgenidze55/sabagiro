-- AlterTable
ALTER TABLE "ClubEvent" ADD COLUMN IF NOT EXISTS "artistTicketsEnabled" BOOLEAN NOT NULL DEFAULT false;
