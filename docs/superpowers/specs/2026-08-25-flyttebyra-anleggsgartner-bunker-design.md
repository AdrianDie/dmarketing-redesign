# Design: nye ringeliste-bunker for flyttebyrå og anleggsgartner

**Dato:** 2026-08-25
**Mål:** "Flyttebyrå - ny" og "Anleggsgartner - ny" i selgerportalens `leads`-tabell
er begge på 45 leads og begge nesten oppbrukt (44 av 45 ringt). Hent friske leads
til nye bunker for de to bransjene, uten å duplisere noe som allerede er ringt.

> ⚠️ Samme regel som forrige sourcing-runde: denne fila er trygg å committe
> (metodikk, ingen ekte bedriftsdata). CSV-ene pipelinen produserer underveis
> skal **aldri** i git — de havner i `OneDrive\Dietrichs Marketing\Leads\Google
> Sheets\`, aldri under `workers/` eller andre steder i dette (offentlige) repoet.

---

## Utgangspunktet (verifisert, ikke antatt)

- En "bunke" er ikke en egen tabell. `leads.bunke` er en fri tekstkolonne, og
  `hentBunker()` i `workers/selger/index.js` gjør `GROUP BY bunke`. Ny bunke =
  nye rader i `leads` med et nytt navn i `bunke`-feltet. Ingen kodeendring i
  Worker eller frontend.
- Live D1-sjekk (25.08) bekrefter begge bunkene finnes fra før:
  `Flyttebyrå - ny` (45 leads) og `Anleggsgartner - ny` (45 leads), begge med
  `bransje` konsekvent satt til hhv. "Flyttebyrå" og "Anleggsgartner" og gyldig
  `orgnr` på alle rader.
- Status-fordeling: begge bunker har 44 av 45 rader med status ulik
  `ikke_ringt` — praktisk talt oppbrukt.
- **Viktig funn:** `register.csv` (dedup-registeret i OneDrive-mappa) har **0**
  treff på org.nr-ene eller bransjenavnene fra disse 90 leadsene. De ble aldri
  registrert der da de opprinnelig ble lastet inn. Konsekvens: dedup for denne
  runden kan ikke stole på `register.csv` alene — **live D1 er
  sannhetskilden**, akkurat som forrige sourcing-designs begrunnelse for å
  sjekke begge kilder.
- Det finnes to sourcing-mønstre i `OneDrive\...\Google Sheets\`:
  1. Den eldre Google Places-baserte pipelinen (se
     `2026-08-05-google-places-leadsourcing-design.md`) — krever betalt API,
     fuzzy org.nr-matching mot Brreg, «usikker»-bøtte.
  2. Den nyere, enklere `hent-regnskap.py` (brukt 21.08.2026 for
     Regnskapsfører) — henter direkte fra Brønnøysund filtrert på
     næringskode. Org.nr følger med gratis, ingen fuzzy matching nødvendig.
  Alle 13 bransjene som faktisk ligger i D1 i dag (inkl. de to «- ny»-bunkene)
  har rene `bransje`-verdier og gyldig `orgnr` på alle rader — konsistent med
  mønster 2, ikke mønster 1. Denne runden bruker mønster 2.

---

## Næringskoder (verifisert live mot Brreg 25.08)

| Bransje | Næringskode | Beskrivelse (Brreg) | Totalt i Brreg |
|---|---|---|---|
| Flyttebyrå | `49.420` | Flyttetransport | 526 |
| Anleggsgartner | `81.300` | Beplantning av hager og parkanlegg | 1721 |

Begge bekreftet ved direkte kall mot
`data.brreg.no/enhetsregisteret/api/underenheter?naeringskode=...` — treffene
matcher bransjen (f.eks. "123 FLYTTING & TRANSPORT AS" på 49.420).

---

## Pipeline

```
1. hent-flyttebyra.py / hent-anleggsgartner.py   → leadpool-<bransje>.csv
2. Dedup mot live D1 (org.nr/telefon/nettside)   → fjerner alt inkl. de 90 eksisterende
3. lag-bunker.py                                  → deler i navngitte regionbunker
   --- stoppunkt: Adrian ser oppsummering, sier ja ---
4. SQL-innlasting (wrangler d1 execute --remote)  → nye rader i leads
5. dedup.py legg-inn                              → registrerer de nye i register.csv
```

## Steg 1: `hent-flyttebyra.py` / `hent-anleggsgartner.py` (nye, kopi av `hent-regnskap.py`)

Kopi av malen med kun `NAERINGSKODE`/`UT` endret. Samme filterregler
uendret:

- Ekskluder nedlagte (`nedleggelsesdato` satt)
- Ekskluder junk-navn (`KONKURSBO`, `TVANGSAVVIKLINGSBO`, `DODSBO`, `HOLDING`,
  `KONKURS`, `UNDER AVVIKLING`, `AVVIKLINGSBO`)
- Krev gyldig telefon (mobil eller fast, normalisert til 8 siffer)
- Krev gyldig nettside-format, ekskluder portaler (Facebook, Instagram,
  LinkedIn, Finn, Gulesider, 1881, Proff, sosiale plattformer m.fl. — samme
  liste som i malen)

`hjemmeside=`-filteret på Brreg-kallet betyr «feltet er satt», ikke tomt —
samme API-oppførsel som malen allerede utnytter. Ingen datovindu-splitting
nødvendig (begge populasjoner er langt under paginerings-taket på 10 000).

## Steg 2: Dedup mot live D1

Live spørring mot `dm-salg` (`SELECT bedrift, telefon, nettside, orgnr FROM
leads`) bygger et nøkkelsett (org.nr, normalisert telefon, normalisert
nettside) fra **alle** eksisterende leads, ikke bare de to "- ny"-bunkene —
en flyttebyrå-bedrift kan i prinsippet ligge i "Blandede bransjer" fra før.
Alt som treffer en av de tre nøklene filtreres bort før bunkedeling.

## Steg 3: `lag-bunker.py` (gjenbrukes uendret)

Kjøres på de to nye leadpool-filene. Eksisterende logikk:
`MIN_EGEN_BUNKE = 25`, `MAKS_BUNKE = 60`. Under 25 slås sammen i "Blandede
bransjer", 25–60 blir én bunke med bransjenavnet, over 60 deles på region
(samme regiontabell som brukes for alle andre bransjer i dag), og en region
som fortsatt er for stor nummereres ("Flyttebyrå - Oslo og Viken 1 av 2" osv.)
— identisk mønster som `Regnskapsfører`/`Rørlegger`/`Frisør` i D1 i dag.

**Stoppunkt:** før noe treff steg 4, viser jeg antall per ny bunke og noen
eksempelrader. Adrian sier ja før produksjons-D1 endres — samme stoppunkt som
er brukt for hver tidligere sourcing-runde, fordi dette er databasen ekte
selgere ringer fra akkurat nå.

## Steg 4: SQL-innlasting

`INSERT INTO leads (bunke, bedrift, sted, telefon, nettside, bransje, orgnr,
registrert, status, dato) VALUES (...)` per rad. `id` utelates (SQLite
tildeler neste ledige automatisk). `status = 'ikke_ringt'`, `dato` = dagens
dato. `bransje`-kolonnen settes til den korte, lesbare formen ("Flyttebyrå" /
"Anleggsgartner"), samme stil som de 90 eksisterende radene allerede har.
Kjøres med `wrangler d1 execute dm-salg --remote --file <fil>.sql`.

## Steg 5: `dedup.py legg-inn`

Registrerer de nye radene i `register.csv` med plassering
"Ringeliste: flyttebyrå/anleggsgartner aug 2026", slik at de aldri kan bli
sourcet på nytt i en fremtidig runde — retter samtidig fremover det
`register.csv`-hullet som ble avdekket for de 90 eksisterende radene (uten å
røre de 90 gamle radene selv, se Avgrensning).

---

## Avgrensning (YAGNI)

- **Ingen Google Places.** Brreg-direkte dekker begge bransjer presist nok;
  Places-pipelinen (kostnad + fuzzy matching) er ikke nødvendig når
  næringskoden er entydig.
- **Ingen backfill av `register.csv` for de 90 eksisterende radene.** Dedup
  for denne runden bruker live D1, som dekker dem uansett. Å registrere de
  gamle radene i etterkant er en egen, uavhengig opprydding — nevnes til
  Adrian, gjøres ikke uoppfordret.
- **Ingen oppdatering av `leads-til-selgerportal.csv`.** Denne mirror-fila
  fra forrige design er allerede stale (sist oppdatert 24.07, ikke fulgt opp
  ved Regnskapsfører-runden 21.08) — å late som den holdes i sync nå ville
  vært misvisende. Live D1-spørring er sannhetskilden denne runden også for
  fremtidige runder, med mindre Adrian ber om at mirror-fila gjenopplives.
- **Ingen kodeendring i `dmarketing-redesign`-repoet.** Bunker krever ingen
  endring i Worker eller frontend.
- **Ingen ny abstraksjon/parametrisert fellesscript.** To små
  bransjespesifikke script, samme stil som `hent-regnskap.py` — ikke en
  generalisert "hent-bransje.py \<kode\>"-variant, siden ingen andre script i
  mappa er bygget slik.

---

## Suksesskriterier

1. To (eller flere, hvis regionsplitting slår inn) nye bunker dukker opp i
   `/selger/ringeliste/` med riktig navn og antall, uten kodeendring.
2. Ingen ny lead overlapper (org.nr/telefon/nettside) med noe som allerede
   ligger i `leads`-tabellen — inkludert de 90 eksisterende radene i de to
   "- ny"-bunkene.
3. Adrian har sett og godkjent oppsummeringen før noe skrives til
   produksjons-D1.
4. `register.csv` inneholder de nye radene etter innlasting, så neste
   sourcing-runde dedupliserer korrekt mot dem.
