-- D1-skjema for selgerportalen. Kjor: wrangler d1 execute dm-salg --file schema.sql
-- Speiler den faktiske databasen (kolonner lagt til underveis er tatt inn her).

CREATE TABLE IF NOT EXISTS selgere (
  epost            TEXT PRIMARY KEY,
  navn             TEXT NOT NULL,
  passordhash      TEXT,
  token            TEXT NOT NULL,
  aktiv            TEXT NOT NULL DEFAULT 'ja',
  resettoken       TEXT,
  resettoken_utlop INTEGER,
  admin            INTEGER DEFAULT 0,
  aktiv_bunke      TEXT,           -- bunken selgeren er inne paa naa (reservasjon)
  aktiv_bunke_tid  INTEGER         -- livstegn; gammel reservasjon regnes som forlatt
);

CREATE TABLE IF NOT EXISTS leads (
  id         INTEGER PRIMARY KEY,
  bunke      TEXT NOT NULL,
  bedrift    TEXT NOT NULL,
  sted       TEXT,
  telefon    TEXT,
  nettside   TEXT,
  bransje    TEXT,
  orgnr      TEXT,
  registrert TEXT,
  nyetablert INTEGER DEFAULT 0,
  status     TEXT DEFAULT 'ikke_ringt',
  selger     TEXT,                 -- attribusjon: hvem ringte (varig)
  dato       TEXT,
  notat      TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_bunke  ON leads(bunke);
CREATE INDEX IF NOT EXISTS idx_leads_selger ON leads(selger);

CREATE TABLE IF NOT EXISTS bookinger (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  dato        TEXT,
  selger      TEXT,
  bedrift     TEXT,
  telefon     TEXT,
  nettside    TEXT,
  kontakt     TEXT,
  epost       TEXT,
  notat       TEXT,
  status      TEXT DEFAULT 'sendt',
  betalt_dato TEXT,                -- naar den ble betalt (styrer maanedlig provisjon)
  jira_key    TEXT,                -- speilet Jira-kort i AN
  status_dato TEXT                 -- naar statusen sist ble flyttet (kvitteringssloyfa)
);
CREATE INDEX IF NOT EXISTS idx_bookinger_selger ON bookinger(selger);

CREATE TABLE IF NOT EXISTS milepaeler (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  dato  TEXT,
  tekst TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS innstillinger (
  noekkel TEXT PRIMARY KEY,
  verdi   TEXT
);
INSERT OR IGNORE INTO innstillinger (noekkel, verdi) VALUES ('pris', '3900');
INSERT OR IGNORE INTO innstillinger (noekkel, verdi) VALUES ('provisjonsgrunnlag', '3120');
