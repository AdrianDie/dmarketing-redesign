# Flyttebyrå og anleggsgartner ringeliste-bunker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kilde friske leads for flyttebyrå (næringskode 49.420) og
anleggsgartner (81.300) fra Brønnøysund, dedup mot alt som allerede ligger i
selgerportalens D1-database (inkl. de 90 eksisterende, nesten oppbrukte
leadsene i "Flyttebyrå - ny"/"Anleggsgartner - ny"), del i navngitte
regionbunker, og last inn i produksjons-D1 etter Adrians godkjenning.

**Arkitektur:** Lineær CLI-pipeline av små Python-script (stdlib only, ingen
pip-avhengigheter), samme mønster som `hent-regnskap.py`/`lag-bunker.py` som
allerede brukes for de 13 andre bransjene i D1. Alt kjøres og lagres i
`C:\Users\adria\OneDrive\Dietrichs Marketing\Leads\Google Sheets\` —
**ingen fil i dette git-repoet opprettes eller endres**. `wrangler`-kommandoer
kjøres med `workers/selger/` som working directory (for `wrangler.toml`), men
skriver ikke til noen fil i repoet.

**Tech Stack:** Python 3 (stdlib: `csv`, `json`, `re`, `urllib.request`),
Brønnøysund Enhetsregisteret API, Cloudflare D1 via `wrangler` CLI.

**Referanse:** [docs/superpowers/specs/2026-08-25-flyttebyra-anleggsgartner-bunker-design.md](../specs/2026-08-25-flyttebyra-anleggsgartner-bunker-design.md)

---

## Viktig kontekst for den som utfører denne planen

- **Ingen kodeendring i `dmarketing-redesign`-repoet.** En "bunke" er bare en
  fritekstverdi i D1-kolonnen `leads.bunke`. `hentBunker()` i
  `workers/selger/index.js` gjør `GROUP BY bunke` — nye bunker dukker opp i
  `/selger/ringeliste/` automatisk så snart radene finnes i D1.
- **Leaddata skal aldri i git.** Alle CSV/JSON/SQL-filer denne planen
  produserer skal ligge i OneDrive-mappa over, aldri under `workers/` eller
  andre steder i repoet (som er offentlig).
- `dedup.py`, `lag-bunker.py`, `hent-regnskap.py` finnes allerede i
  OneDrive-mappa og gjenbrukes uendret (unntatt de nye scriptene som
  importerer funksjoner fra `dedup.py`).
- Denne mappa har ingen test-infrastruktur (ingen pytest, ingen `tests/`).
  Verifikasjon i denne planen er derfor "kjør scriptet, les output" — samme
  metode som resten av pipelinen allerede bruker — ikke automatiserte tester.

---

## Filoversikt

| Fil | Type | Ansvar |
|---|---|---|
| `hent-flyttebyra.py` | Ny | Henter+filtrerer flyttebyråer fra Brreg → `leadpool-flyttebyra.csv` |
| `hent-anleggsgartner.py` | Ny | Henter+filtrerer anleggsgartnere fra Brreg → `leadpool-anleggsgartner.csv` |
| `dedup-mot-d1.py` | Ny | Filtrerer en leadpool-CSV mot D1-nøkler (importerer `norm_org`/`norm_tlf`/`norm_web` fra `dedup.py`) |
| `lag-sql.py` | Ny | Leser `lag-bunker.py` sitt output, skriver `INSERT INTO leads`-SQL |
| `lag-bunker.py` | Uendret, gjenbrukt | Deler leadpool i navngitte regionbunker |
| `dedup.py` | Uendret, gjenbrukt | `norm_org`/`norm_tlf`/`norm_web` (importeres) + `legg-inn`-kommandoen til slutt |

---

### Task 1: Hent og filtrer leads fra Brreg for begge bransjer

**Files:**
- Create: `C:\Users\adria\OneDrive\Dietrichs Marketing\Leads\Google Sheets\hent-flyttebyra.py`
- Create: `C:\Users\adria\OneDrive\Dietrichs Marketing\Leads\Google Sheets\hent-anleggsgartner.py`

- [ ] **Step 1: Skriv `hent-flyttebyra.py`**

```python
# -*- coding: utf-8 -*-
"""Henter flyttebyraaer (naeringskode 49.420) som HAR registrert hjemmeside i
Broennoeysund, filtrerer til ringbar leadpool.

Samme logikk som hent-regnskap.py, avgrenset til flyttebyraa. Kolonnen heter
"Regdato" (ikke "Registrert" som i hent-regnskap.py) fordi lag-bunker.py sin
felt-mapping leter etter akkurat "Regdato" i kildefila -- uten dette blir
Nyetablert-flagget stille feil for alle rader.
"""
import csv
import json
import re
import time
import urllib.error
import urllib.request

BASE = "https://data.brreg.no/enhetsregisteret/api/underenheter"
NAERINGSKODE = "49.420"
UT = "leadpool-flyttebyra.csv"

JUNK_ORD = ("KONKURSBO", "TVANGSAVVIKLINGSBO", "DODSBO", "DØDSBO", "HOLDING",
            "KONKURS", "UNDER AVVIKLING", "AVVIKLINGSBO")

PORTALER = ("facebook.", "instagram.", "linkedin.", "bestille.no", "setmore.com",
            "bligg.no", "wixsite.com", "google.com", "gulesider.", "1881.no",
            "proff.no", "finn.no", "blogspot.", "wordpress.com", "weebly.com",
            "webnode.", "yelp.", "tripadvisor.", "youtube.", "tiktok.")


def kall(params, forsok=4):
    url = BASE + "?" + "&".join("%s=%s" % kv for kv in params.items())
    for n in range(forsok):
        try:
            with urllib.request.urlopen(url, timeout=40) as r:
                return json.load(r)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
            if n == forsok - 1:
                raise
            time.sleep(2 * (n + 1))


def norm_tlf(v):
    d = re.sub(r"\D", "", v or "")
    if d.startswith("0047"):
        d = d[4:]
    elif len(d) == 10 and d.startswith("47"):
        d = d[2:]
    return d if len(d) == 8 else ""


def norm_web(v):
    v = (v or "").strip().lower()
    v = re.sub(r"^https?://", "", v)
    v = re.sub(r"^www\.", "", v)
    v = v.split("/")[0].split("?")[0].split("#")[0]
    return v.strip(". ")


if __name__ == "__main__":
    print("Henter naeringskode %s med hjemmeside registrert ..." % NAERINGSKODE)
    alle = []
    side = 0
    while True:
        d = kall({"naeringskode": NAERINGSKODE, "hjemmeside": "", "size": 500, "page": side})
        emb = d.get("_embedded", {}).get("underenheter", [])
        if not emb:
            break
        alle.extend(emb)
        print("  side %d, %d hentet totalt" % (side, len(alle)))
        side += 1
    print("Raatt: %d bedrifter" % len(alle))

    kastet = {"nedlagt": 0, "junk-navn": 0, "ingen telefon": 0,
              "ugyldig nettside": 0, "portal": 0}
    ut = []
    for e in alle:
        if e.get("nedleggelsesdato"):
            kastet["nedlagt"] += 1
            continue
        navn = (e.get("navn") or "").upper()
        if any(o in navn for o in JUNK_ORD):
            kastet["junk-navn"] += 1
            continue

        tlf = norm_tlf(e.get("mobil")) or norm_tlf(e.get("telefon"))
        if not tlf:
            kastet["ingen telefon"] += 1
            continue

        web = norm_web(e.get("hjemmeside"))
        if not re.match(r"^[a-z0-9æøå]([a-z0-9æøå.-]*[a-z0-9æøå])?\.[a-z]{2,}$", web):
            kastet["ugyldig nettside"] += 1
            continue
        if any(p in web for p in PORTALER):
            kastet["portal"] += 1
            continue

        adr = e.get("beliggenhetsadresse") or {}
        nk = e.get("naeringskode1") or {}
        ut.append({
            "Org.nr": e.get("organisasjonsnummer", ""),
            "Bedrift": e.get("navn", ""),
            "Telefon": tlf,
            "Nettside": web,
            "Epost": e.get("epostadresse") or "",
            "Bransje": "Flyttebyrå",
            "Naeringskode": nk.get("kode", ""),
            "Kommune": (adr.get("kommune") or "").title(),
            "Poststed": (adr.get("poststed") or "").title(),
            "Regdato": e.get("registreringsdatoEnhetsregisteret") or "",
        })

    with open(UT, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(ut[0].keys()))
        w.writeheader()
        w.writerows(ut)

    print("Kastet:")
    for k, v in sorted(kastet.items(), key=lambda x: -x[1]):
        print("  %-18s %6d" % (k, v))
    print("Ut: %d ringbare leads med nettside -> %s" % (len(ut), UT))
```

- [ ] **Step 2: Skriv `hent-anleggsgartner.py`**

Identisk fil, tre endringer: `NAERINGSKODE = "81.300"`,
`UT = "leadpool-anleggsgartner.csv"`, `"Bransje": "Anleggsgartner"`, og
docstringens første setning bytter "flyttebyraaer (naeringskode 49.420)" til
"anleggsgartnere (naeringskode 81.300)".

- [ ] **Step 3: Kjør begge scriptene**

```bash
cd "/c/Users/adria/OneDrive/Dietrichs Marketing/Leads/Google Sheets"
python hent-flyttebyra.py
python hent-anleggsgartner.py
```

Forventet: begge avslutter med `Ut: N ringbare leads med nettside -> leadpool-<bransje>.csv`
der N > 0 (i størrelsesorden 100–400, gitt 526/1721 raa treff før filtrering).
Begge CSV-filene skal ha header
`Org.nr,Bedrift,Telefon,Nettside,Epost,Bransje,Naeringskode,Kommune,Poststed,Regdato`.

---

### Task 2: Dedup mot live D1

**Files:**
- Create: `C:\Users\adria\OneDrive\Dietrichs Marketing\Leads\Google Sheets\dedup-mot-d1.py`

- [ ] **Step 1: Eksporter D1-nøkler til JSON**

```bash
cd "/c/Users/adria/website-mirrors/dmarketing-redesign/workers/selger"
npx wrangler d1 execute dm-salg --remote --command "SELECT orgnr, telefon, nettside FROM leads" --json > "/c/Users/adria/OneDrive/Dietrichs Marketing/Leads/Google Sheets/d1-noekler.json"
```

Forventet: kommandoen kjører uten feil. Verifiser at fila er gyldig JSON:

```bash
cd "/c/Users/adria/OneDrive/Dietrichs Marketing/Leads/Google Sheets"
python -c "import json; d = json.load(open('d1-noekler.json', encoding='utf-8')); print(len(d[0]['results']), 'rader')"
```

Forventet: skriver ut antall rader (samme antall som `SELECT COUNT(*) FROM leads`,
altså summen av alle bunker — rundt 1860 basert på tidligere opptelling).

- [ ] **Step 2: Skriv `dedup-mot-d1.py`**

```python
# -*- coding: utf-8 -*-
"""Filtrerer en leadpool-CSV mot alt som allerede ligger i D1 (dm-salg), paa
org.nr/telefon/nettside. Kjoeres etter hent-<bransje>.py, foer lag-bunker.py.

Leser D1-noeklene fra en JSON-fil (output av `wrangler d1 execute --json`),
hentet paa forhaand med:
  npx wrangler d1 execute dm-salg --remote --command \
    "SELECT orgnr, telefon, nettside FROM leads" --json > d1-noekler.json

Bruk: python dedup-mot-d1.py d1-noekler.json <leadpool.csv> [<leadpool2.csv> ...]
Skriver <fil>-uten-duplikater.csv per input-fil.
"""
import csv
import json
import os
import sys

from dedup import norm_org, norm_tlf, norm_web


def les_d1_noekler(json_fil):
    with open(json_fil, encoding="utf-8") as f:
        data = json.load(f)
    rader = data[0]["results"]
    org, tlf, web = set(), set(), set()
    for r in rader:
        o, t, w = norm_org(r.get("orgnr")), norm_tlf(r.get("telefon")), norm_web(r.get("nettside"))
        if o:
            org.add(o)
        if t:
            tlf.add(t)
        if w:
            web.add(w)
    return org, tlf, web


def filtrer(fil, org, tlf, web):
    with open(fil, encoding="utf-8-sig", newline="") as f:
        rader = list(csv.DictReader(f))
    rene, dupe = [], []
    for r in rader:
        o, t, w = norm_org(r.get("Org.nr")), norm_tlf(r.get("Telefon")), norm_web(r.get("Nettside"))
        if (o and o in org) or (t and t in tlf) or (w and w in web):
            dupe.append(r)
        else:
            rene.append(r)
    grunn = os.path.splitext(fil)[0]
    with open("%s-uten-duplikater.csv" % grunn, "w", encoding="utf-8", newline="") as f:
        w2 = csv.DictWriter(f, fieldnames=list(rader[0].keys()))
        w2.writeheader()
        w2.writerows(rene)
    print("%s: %d inn, %d duplikat mot D1, %d igjen -> %s-uten-duplikater.csv"
          % (fil, len(rader), len(dupe), len(rene), grunn))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    org, tlf, web = les_d1_noekler(sys.argv[1])
    print("D1: %d org.nr, %d telefon, %d nettside" % (len(org), len(tlf), len(web)))
    for fil in sys.argv[2:]:
        filtrer(fil, org, tlf, web)
```

- [ ] **Step 3: Sanity-sjekk importen før du kjører på ekte data**

```bash
cd "/c/Users/adria/OneDrive/Dietrichs Marketing/Leads/Google Sheets"
python -c "from dedup import norm_org, norm_tlf, norm_web; print(norm_org('973 209 787'), norm_tlf('+47 900 12 345'), norm_web('HTTPS://WWW.Eksempel.NO/kontakt'))"
```

Forventet: `973209787 90012345 eksempel.no` — bekrefter at importen fra
`dedup.py` fungerer og normaliserer riktig før den kjøres på ekte leadpools.

- [ ] **Step 4: Kjør dedup mot begge leadpoolene**

```bash
python dedup-mot-d1.py d1-noekler.json leadpool-flyttebyra.csv leadpool-anleggsgartner.csv
```

Forventet: to linjer i formen
`leadpool-<bransje>.csv: N inn, M duplikat mot D1, N-M igjen -> ...-uten-duplikater.csv`.
`M` bør være minst i nærheten av 45 for hver bransje (de eksisterende "- ny"-
leadsene bør typisk dukke opp igjen i det ferske Brreg-uttrekket og fanges her).
Åpne en av `-uten-duplikater.csv`-filene og stikkprøv at et par kjente bedrifter
fra `Flyttebyrå - ny`/`Anleggsgartner - ny` (f.eks. "STEINAR LARSEN
ANLEGGSGARTNERI AS", org.nr 973209787) **ikke** finnes i den.

---

### Task 3: Del i navngitte regionbunker

**Files:**
- Modify: ingen nye filer — kjører eksisterende `lag-bunker.py` uendret

- [ ] **Step 1: Kjør `lag-bunker.py` på begge deduperte filene samlet**

```bash
cd "/c/Users/adria/OneDrive/Dietrichs Marketing/Leads/Google Sheets"
python lag-bunker.py leadpool-flyttebyra-uten-duplikater.csv leadpool-anleggsgartner-uten-duplikater.csv
```

Forventet output: en linje per kildefil med radantall, deretter `Unike: N`,
`Nyetablerte (under ett aar): N`, en liste bunker med antall (bunkenavn i
formen `Flyttebyrå - <Region>` / `Anleggsgartner - <Region>`, evt. med
` N av M`-suffiks hvis en region er over 60), og til slutt
`Skrev leads-til-ark.csv med N leads.`

- [ ] **Step 2: Døp om output til noe gjenkjennelig**

```bash
mv leads-til-ark.csv flyttebyra-anleggsgartner-bunker.csv
```

(Samme navnemønster som `regnskap-bunker.csv` fra forrige runde — unngår at
en senere kjøring av `lag-bunker.py` for en annen bransje overskriver denne
fila før den er lastet inn.)

- [ ] **Step 3: Verifiser innholdet**

```bash
python -c "
import csv
from collections import Counter
rader = list(csv.DictReader(open('flyttebyra-anleggsgartner-bunker.csv', encoding='utf-8-sig')))
print(len(rader), 'rader totalt')
for bunke, n in sorted(Counter(r['Bunke'] for r in rader).items()):
    print('  %-45s %4d' % (bunke, n))
"
```

Forventet: alle bunkenavn starter med "Flyttebyrå" eller "Anleggsgartner", og
hver bunke har mellom 25 og 60 rader (evt. under 25 kun hvis den havnet i en
felles "Blandede bransjer"-bunke — sjekk i så fall at det ikke var ment å bli
en egen bunke).

---

### Task 4: Generer SQL for innlasting

**Files:**
- Create: `C:\Users\adria\OneDrive\Dietrichs Marketing\Leads\Google Sheets\lag-sql.py`

- [ ] **Step 1: Skriv `lag-sql.py`**

```python
# -*- coding: utf-8 -*-
"""Leser lag-bunker.py sitt output og skriver INSERT-setninger for D1
leads-tabellen. id utelates bevisst -- SQLite tildeler neste ledige selv
(se schema.sql-notatet i workers/selger).

Skriver til fil med eksplisitt UTF-8 (ikke print() + shell-omdirigering --
paa Windows faller stdout tilbake til systemets ANSI-kodeside naar det er
omdirigert til fil, som staver om aeoeaa i bedrifts-/stedsnavn).

Bruk: python lag-sql.py <bunker.csv> <ut.sql>
"""
import csv
import sys


def sql_streng(v):
    return "'" + (v or "").replace("'", "''") + "'"


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    with open(sys.argv[1], encoding="utf-8-sig", newline="") as f:
        rader = list(csv.DictReader(f))

    verdier = []
    for r in rader:
        nyetablert = 1 if (r.get("Nyetablert") or "").strip().lower() == "ja" else 0
        verdier.append("  (%s, %s, %s, %s, %s, %s, %s, %s, %d, 'ikke_ringt', date('now'))" % (
            sql_streng(r.get("Bunke")), sql_streng(r.get("Bedrift")), sql_streng(r.get("Sted")),
            sql_streng(r.get("Telefon")), sql_streng(r.get("Nettside")), sql_streng(r.get("Bransje")),
            sql_streng(r.get("Org.nr")), sql_streng(r.get("Registrert")), nyetablert,
        ))

    sql = ("INSERT INTO leads (bunke, bedrift, sted, telefon, nettside, bransje, "
           "orgnr, registrert, nyetablert, status, dato) VALUES\n"
           + ",\n".join(verdier) + ";\n")
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        f.write(sql)
    print("Skrev %d rader -> %s" % (len(rader), sys.argv[2]))
```

**Viktig (funnet under kjøring):** ikke bruk `print()` + `>`-omdirigering til fil
for denne typen script på Windows — stdout faller da tilbake til systemets
ANSI-kodeside i stedet for UTF-8, og bedrifts-/stedsnavn med æøå blir stavet
om til feil byte (f.eks. "ø" som cp1252-byte `\xf8` i stedet for UTF-8
`\xc3\xb8`). Skriv alltid eksplisitt med `open(..., encoding="utf-8")`.

- [ ] **Step 2: Sanity-sjekk escaping**

```bash
cd "/c/Users/adria/OneDrive/Dietrichs Marketing/Leads/Google Sheets"
python -c "
exec(open('lag-sql.py', encoding='utf-8').read().split('if __name__')[0])
print(sql_streng(\"O'BRIEN FLYTTING AS\"))
"
```

Forventet: `'O''BRIEN FLYTTING AS'` — bekrefter at et enkelt anførselstegn i
bedriftsnavnet escapes riktig før du genererer SQL fra ekte data.

- [ ] **Step 3: Generer SQL-fila**

```bash
python lag-sql.py flyttebyra-anleggsgartner-bunker.csv innlasting-flyttebyra-anleggsgartner.sql
```

Forventet: fila starter med `INSERT INTO leads (bunke, bedrift, sted, telefon,
nettside, bransje, orgnr, registrert, nyetablert, status, dato) VALUES`,
etterfulgt av én parentes-linje per lead, avsluttet med `;`. Antall
parentes-linjer skal være likt antall rader i `flyttebyra-anleggsgartner-bunker.csv`
fra Task 3.

---

### Task 5: Stoppunkt — Adrians godkjenning

**Files:** ingen — kun rapportering i chat, ingen filoperasjon.

- [ ] **Step 1: Presenter oppsummering til Adrian**

Vis, hentet fra Task 3/4 sine outputs:
- Antall nye bunker per bransje og navnene deres
- Antall rader per bunke
- 3–5 eksempelrader (bedrift, sted, telefon, nettside) per bransje
- Totalt antall rader som vil skrives til produksjons-D1

- [ ] **Step 2: Vent på eksplisitt ja før Task 6**

Ikke gå videre til Task 6 før Adrian har bekreftet. Dette er databasen ekte
selgere ringer fra akkurat nå — samme stoppunkt som er brukt for hver
tidligere sourcing-runde.

---

### Task 6: Last inn i produksjons-D1

**Files:** ingen nye/endrede filer — kun en `wrangler`-kommando.

- [ ] **Step 1: Kjør innlastingen**

```bash
cd "/c/Users/adria/website-mirrors/dmarketing-redesign/workers/selger"
npx wrangler d1 execute dm-salg --remote --file "/c/Users/adria/OneDrive/Dietrichs Marketing/Leads/Google Sheets/innlasting-flyttebyra-anleggsgartner.sql"
```

Forventet: `"success": true` i output, `"changes"` lik antall rader fra
Task 4 Step 3.

- [ ] **Step 2: Verifiser i D1**

```bash
npx wrangler d1 execute dm-salg --remote --command "SELECT bunke, COUNT(*) as antall FROM leads WHERE bunke LIKE 'Flyttebyrå%' OR bunke LIKE 'Anleggsgartner%' GROUP BY bunke ORDER BY bunke"
```

Forventet: de to gamle bunkene (`Flyttebyrå - ny`, `Anleggsgartner - ny`,
45 hver) pluss de nye regionbunkene fra Task 3, alle med `status = 'ikke_ringt'`
implisitt siden de nettopp ble satt inn.

---

### Task 7: Registrer i dedup-registeret

**Files:**
- Modify: `C:\Users\adria\OneDrive\Dietrichs Marketing\Leads\Google Sheets\register.csv` (via `dedup.py`, ikke direkte redigering)

- [ ] **Step 1: Kjør `dedup.py legg-inn`**

```bash
cd "/c/Users/adria/OneDrive/Dietrichs Marketing/Leads/Google Sheets"
python dedup.py legg-inn flyttebyra-anleggsgartner-bunker.csv "Ringeliste: flyttebyrå og anleggsgartner aug 2026"
```

Forventet: én linje per bunke i formen
`Ringeliste: flyttebyrå og anleggsgartner aug 2026 / <Bunke>    N`, avsluttet
med `Lagt N rader i registeret.` der N er totalt antall rader fra Task 3.

- [ ] **Step 2: Verifiser at registeret vokste riktig**

```bash
python -c "
import csv
rader = list(csv.DictReader(open('register.csv', encoding='utf-8-sig')))
nye = [r for r in rader if 'flyttebyrå og anleggsgartner' in r.get('Plassering', '').lower()]
print(len(nye), 'nye rader registrert')
"
```

Forventet: samme antall som ble lastet inn i D1 i Task 6.

---

## Ikke inkludert i denne planen (se spec, avsnitt Avgrensning)

- Ingen backfill av `register.csv` for de 90 eksisterende "- ny"-radene.
- Ingen oppdatering av den allerede utdaterte `leads-til-selgerportal.csv`.
- Ingen endring i `dmarketing-redesign`-repoet (verken kode eller commits).
