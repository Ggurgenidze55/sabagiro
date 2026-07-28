-- Add doorsOpen to ClubEvent
ALTER TABLE "ClubEvent" ADD COLUMN IF NOT EXISTS "doorsOpen" TEXT NOT NULL DEFAULT '';
