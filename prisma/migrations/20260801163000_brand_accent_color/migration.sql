-- Align event accents with new brand acid color
UPDATE "ClubEvent" SET "accent" = '#f7e892' WHERE lower("accent") IN ('#f9c108', '#fbc007');
