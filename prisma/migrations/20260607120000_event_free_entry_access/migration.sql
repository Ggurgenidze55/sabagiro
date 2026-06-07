-- CreateEnum
CREATE TYPE "FreeEntryAccess" AS ENUM ('ALL_VERIFIED', 'INVITED_ONLY');

-- AlterTable
ALTER TABLE "ClubEvent" ADD COLUMN IF NOT EXISTS "freeEntryAccess" "FreeEntryAccess" NOT NULL DEFAULT 'INVITED_ONLY';
