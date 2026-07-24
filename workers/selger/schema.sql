-- D1-skjema for selgerportalen. Kjor: wrangler d1 execute dm-salg --file schema.sql

CREATE TABLE IF NOT EXISTS selgere (
  epost            TEXT PRIMARY KEY,
  navn             TEXT NOT NULL,
  passordhash      TEXT,
  token            TEXT NOT NULL,
  aktiv            TEXT NOT NULL DEFAULT 'ja',
  resettoken       TEXT,
  resettoken_utlop INTEGER
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
  selger     TEXT,
  dato       TEXT,
  notat      TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_bunke  ON leads(bunke);
CREATE INDEX IF NOT EXISTS idx_leads_selger ON leads(selger);

CREATE TABLE IF NOT EXISTS bookinger (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  dato     TEXT,
  selger   TEXT,
  bedrift  TEXT,
  telefon  TEXT,
  nettside TEXT,
  kontakt  TEXT,
  epost    TEXT,
  notat    TEXT,
  status   TEXT DEFAULT 'sendt'
);
CREATE INDEX IF NOT EXISTS idx_bookinger_selger ON bookinger(selger);

CREATE TABLE IF NOT EXISTS innstillinger (
  noekkel TEXT PRIMARY KEY,
  verdi   TEXT
);
INSERT OR IGNORE INTO innstillinger (noekkel, verdi) VALUES ('pris', '3900');
