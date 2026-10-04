-- Promo codes scoped to one event + percent discount on checkout
ALTER TABLE "Order" ADD COLUMN "discountGel" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "promoCodeId" TEXT;

CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percentOff" INTEGER NOT NULL,
    "eventSlug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX "PromoCode_eventSlug_idx" ON "PromoCode"("eventSlug");
CREATE INDEX "PromoCode_active_idx" ON "PromoCode"("active");
CREATE INDEX "Order_promoCodeId_idx" ON "Order"("promoCodeId");

ALTER TABLE "Order" ADD CONSTRAINT "Order_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
