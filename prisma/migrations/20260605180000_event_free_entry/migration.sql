-- Free-entry events: complimentary tickets via free ticket generator only.
ALTER TABLE "ClubEvent" ADD COLUMN "isFreeEntry" BOOLEAN NOT NULL DEFAULT false;
