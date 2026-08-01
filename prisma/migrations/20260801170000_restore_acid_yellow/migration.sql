-- Restore classic Sabagiro acid yellow on events
UPDATE "ClubEvent" SET "accent" = '#f9c108' WHERE lower("accent") IN ('#f7e892', '#faf0b8');
