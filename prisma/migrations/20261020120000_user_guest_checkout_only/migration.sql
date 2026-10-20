ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "guestCheckoutOnly" BOOLEAN NOT NULL DEFAULT false;

-- Shadow rows from ID-only guest checkout (no social links) are not members awaiting verification.
UPDATE "User"
SET "guestCheckoutOnly" = true
WHERE "guestCheckoutOnly" = false
  AND "role" = 'USER'
  AND "verificationStatus" = 'PENDING'
  AND "facebookUrl" = ''
  AND "instagramUrl" = ''
  AND "linkedinUrl" = '';
