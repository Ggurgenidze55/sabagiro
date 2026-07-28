-- Auto-send verified member invitations 2 days before invitation-only events
ALTER TABLE "ClubEvent" ADD COLUMN IF NOT EXISTS "verifiedInvitesEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "VerifiedInviteDispatch" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventSlug" TEXT NOT NULL,
  "dispatchKey" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerifiedInviteDispatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VerifiedInviteDispatch_ticketId_key" ON "VerifiedInviteDispatch"("ticketId");
CREATE UNIQUE INDEX IF NOT EXISTS "VerifiedInviteDispatch_userId_eventSlug_dispatchKey_key" ON "VerifiedInviteDispatch"("userId", "eventSlug", "dispatchKey");
CREATE INDEX IF NOT EXISTS "VerifiedInviteDispatch_eventSlug_idx" ON "VerifiedInviteDispatch"("eventSlug");

DO $$ BEGIN
  ALTER TABLE "VerifiedInviteDispatch" ADD CONSTRAINT "VerifiedInviteDispatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "VerifiedInviteDispatch" ADD CONSTRAINT "VerifiedInviteDispatch_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
