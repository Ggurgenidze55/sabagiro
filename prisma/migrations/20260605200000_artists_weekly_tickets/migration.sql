-- Artist roster + weekly comp ticket dispatch log
ALTER TYPE "TicketSource" ADD VALUE 'ARTIST';

CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "stageName" TEXT NOT NULL DEFAULT '',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "personalId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "weeklyTickets" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArtistTicketDispatch" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "eventSlug" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistTicketDispatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Artist_userId_key" ON "Artist"("userId");
CREATE INDEX "Artist_active_weeklyTickets_idx" ON "Artist"("active", "weeklyTickets");
CREATE INDEX "Artist_email_idx" ON "Artist"("email");

CREATE UNIQUE INDEX "ArtistTicketDispatch_ticketId_key" ON "ArtistTicketDispatch"("ticketId");
CREATE UNIQUE INDEX "ArtistTicketDispatch_artistId_eventSlug_weekKey_key" ON "ArtistTicketDispatch"("artistId", "eventSlug", "weekKey");
CREATE INDEX "ArtistTicketDispatch_weekKey_idx" ON "ArtistTicketDispatch"("weekKey");

ALTER TABLE "Artist" ADD CONSTRAINT "Artist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArtistTicketDispatch" ADD CONSTRAINT "ArtistTicketDispatch_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtistTicketDispatch" ADD CONSTRAINT "ArtistTicketDispatch_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
