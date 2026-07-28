-- Apple Wallet pass auth + device registrations for live updates
CREATE TABLE "WalletPassAuth" (
    "ticketId" TEXT NOT NULL,
    "authenticationToken" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletPassAuth_pkey" PRIMARY KEY ("ticketId")
);

CREATE TABLE "WalletPassRegistration" (
    "id" TEXT NOT NULL,
    "deviceLibraryIdentifier" TEXT NOT NULL,
    "pushToken" TEXT NOT NULL,
    "passTypeIdentifier" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletPassRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WalletPassAuth_authenticationToken_key" ON "WalletPassAuth"("authenticationToken");

CREATE UNIQUE INDEX "WalletPassRegistration_deviceLibraryIdentifier_passTypeIdentifier_serialNumber_key" ON "WalletPassRegistration"("deviceLibraryIdentifier", "passTypeIdentifier", "serialNumber");

CREATE INDEX "WalletPassRegistration_ticketId_idx" ON "WalletPassRegistration"("ticketId");

CREATE INDEX "WalletPassRegistration_serialNumber_idx" ON "WalletPassRegistration"("serialNumber");

ALTER TABLE "WalletPassAuth" ADD CONSTRAINT "WalletPassAuth_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
