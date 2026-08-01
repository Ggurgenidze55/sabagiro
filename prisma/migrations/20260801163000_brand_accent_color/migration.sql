-- Align event accents with brand acid color (applied as #f7e892; reverted by later migration)
UPDATE "ClubEvent" SET "accent" = '#f7e892' WHERE lower("accent") IN ('#f9c108', '#fbc007');
