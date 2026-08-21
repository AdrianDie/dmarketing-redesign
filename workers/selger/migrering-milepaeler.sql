-- Legger til milepaeler-tabellen: firmaets egne nyheter (nye partnere o.l.),
-- vist paa Min uke atskilt fra selgerens personlige ringelogg.
--
-- Additiv og trygg, CREATE TABLE IF NOT EXISTS kan kjores flere ganger.
--
-- Kjor én gang:
--   npx wrangler d1 execute dm-salg --remote --file migrering-milepaeler.sql

CREATE TABLE IF NOT EXISTS milepaeler (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  dato  TEXT,
  tekst TEXT NOT NULL
);

INSERT INTO milepaeler (dato, tekst) VALUES
  ('2026-08-18', 'Fikk inn Bergen IT Center som partner'),
  ('2026-08-19', 'Fikk inn Layer One IT Company som partner'),
  ('2026-08-20', 'Fikk inn TrønderData som partner'),
  ('2026-08-21', 'Fikk inn Agder IT som partner');
