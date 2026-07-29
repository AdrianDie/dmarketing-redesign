-- Legger til status_dato paa bookinger. Driver kvitteringssloyfa paa Min uke,
-- der selgeren ser at bookingen hans faktisk beveger seg.
--
-- Additiv og trygg: eksisterende rader far NULL, og workeren leser
-- COALESCE(status_dato, dato), saa gamle bookinger viser opprettelsesdatoen.
--
-- Kjor én gang:
--   npx wrangler d1 execute dm-salg --remote --file migrering-status-dato.sql
--
-- Kjores den to ganger feiler den med "duplicate column name", og det er ufarlig.

ALTER TABLE bookinger ADD COLUMN status_dato TEXT;
