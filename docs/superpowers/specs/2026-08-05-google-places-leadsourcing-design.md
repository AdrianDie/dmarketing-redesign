# Design: nye ringeliste-bunker fra Google Places + Brreg

**Dato:** 2026-08-05
**Mål:** Adrian har en liste med 10 nye nisjer (taksering/skadetakst, skadedyrkontroll,
ventilasjonsrengjøring, radonmåling/inneklima, stillas/fasadevask, spesialtransport,
kran-/liftutleie, dørservice/adgangskontroll, byggteknisk rådgivning, regnskapsbyrå).
Sourcing skal bruke Google Places API til å finne bedrifter, filtreres på en konkret
seriøs-regel, og lastes inn i selgerportalens `leads`-tabell som nye bunker Kevin (eller
andre selgere) kan ringe fra `/selger/ringeliste/`.

> ⚠️ **Denne fila er trygg å committe** (metodikk, ingen ekte bedriftsdata). Men CSV-ene
> pipelinen produserer underveis (200+ ekte telefonnumre/navn) skal **aldri** i git,
> samme regel som resten av lead-verktøyet. De havner i
> `OneDrive\Dietrichs Marketing\Leads\Google Sheets\`, aldri under `workers/`.

---

## Utgangspunktet (verifisert i kode, ikke bare i minne)

- Ringelista er en ren frontend (`selger/ringeliste/`) mot Cloudflare Worker
  `selger-worker` → D1-database `dm-salg`.
- En "bunke" er **ikke** en egen tabell/registrering. `leads.bunke` er en fri
  tekstkolonne, og `hentBunker()` i `workers/selger/index.js` gjør bare
  `GROUP BY bunke`. Å lage en ny bunke = sette inn rader i `leads` med et nytt
  navn i `bunke`-feltet. Ingen kodeendring i Worker eller frontend trengs.
- `leads`-skjema (fra `workers/selger/schema.sql`):
  `id, bunke, bedrift, sted, telefon, nettside, bransje, orgnr, registrert, nyetablert, status, selger, dato, notat`.
  `id` er `INTEGER PRIMARY KEY` uten `AUTOINCREMENT` — SQLite tildeler neste
  ledige id automatisk så lenge `id` utelates fra INSERT-setningen.
- Adrian har allerede et fungerende sourcing-verktøy i
  `OneDrive\Dietrichs Marketing\Leads\Google Sheets\`: `dedup.py` (register på
  org.nr/telefon/nettside), `brreg.py` (Brønnøysund-oppslag per org.nr),
  `lag-ark.py`. Alt stdlib-Python, ingen pip-avhengigheter. Denne pipelinen
  bygger videre på det samme verktøyet, ikke noe parallelt.

---

## Pipeline

```
1. places.py hent            → rå CSV, alle 10 nisjer, Google Places
2. dedup.py sjekk             → luker bort alt som ligger i det gamle registeret
3. dedup_mot_d1.py            → luker bort alt som allerede ligger i D1 leads
4. finn_orgnr.py               → matcher hver rad mot Brreg, fyller Org.nr
5. brreg.py (utvidet)          → henter status/ansatte/registreringsdato per org.nr
6. filtrer.py                  → seriøs-regel + trim til ~20/bunke → godkjent + usikker
   --- Adrian ser gjennom godkjent + usikker, sier ja ---
7. dedup.py legg-inn           → registrerer de godkjente så de aldri sources på nytt
8. lag_sql.py                  → skriver INSERT-setninger til innlasting.sql
   --- gjennomgang av selve SQL-fila ---
9. wrangler d1 execute --remote --file innlasting.sql
```

Hvert steg leser forrige stegs output og skriver en ny fil med lengre
filnavn (`<fil>-rene.csv`, `<fil>-med-orgnr.csv` osv.) — samme
navnekonvensjon som `dedup.py`/`brreg.py` allerede bruker. Feiler ett steg,
kan du rette og kjøre akkurat det steget på nytt uten å source alt på nytt
fra Google.

---

## Steg 1: `places.py` (nytt)

Bruker **Places API (New)** `searchText`, ikke det gamle Places API (som er
under utfasing). Én sirkel dekker hele piloten i stedet for én kommune-liste:

- `locationBias`: sirkel sentrert på Drammen sentrum (59.744, 10.204),
  radius 45 km. Dekker Drammen, Lier, Kongsberg, Øvre Eiker, Modum,
  Ringerike, Asker, Bærum uten å måtte liste kommuner separat.
- `languageCode: "no"`, `regionCode: "NO"`.
- Feltmaske (`X-Goog-FieldMask`) ber om det som trengs i ett kall — ingen
  separat Place Details-runde: `places.id, places.displayName,
  places.formattedAddress, places.nationalPhoneNumber, places.websiteUri,
  places.businessStatus, places.rating, places.userRatingCount`.
- 2 søkefraser per nisje (for å fange navnevarianter), maks 2 sider
  (`nextPageToken`) per frase → opptil 80 rå kandidater per nisje (før
  dubletter mellom de to søkefrasene fjernes — i praksis vesentlig færre
  unike, siden begge fraser typisk treffer mange av de samme bedriftene).

De 10 nisjene og søkefrasene ligger som en konfig-tabell øverst i scriptet:

| Nøkkel | Søkefraser | Bunkenavn |
|---|---|---|
| taksering | "taksering", "skadetakst" | Taksering og skadetakst - Drammen og omegn |
| skadedyr | "skadedyrkontroll", "skadedyrbekjempelse" | Skadedyrkontroll - Drammen og omegn |
| ventilasjon | "ventilasjonsrengjøring", "kanalrens" | Ventilasjonsrengjøring - Drammen og omegn |
| radon | "radonmåling", "inneklima bedrift" | Radonmåling og inneklima - Drammen og omegn |
| stillas | "stillasutleie", "fasadevask bedrift" | Stillas og fasadevask - Drammen og omegn |
| spesialtransport | "spesialtransport", "tungtransport" | Spesialtransport - Drammen og omegn |
| kranlift | "kranutleie", "liftutleie" | Kran- og liftutleie - Drammen og omegn |
| dorservice | "dørservice", "adgangskontroll bedrift" | Dørservice og adgangskontroll - Drammen og omegn |
| byggteknisk | "byggteknisk rådgivning", "byggesaksrådgiver" | Byggteknisk rådgivning - Drammen og omegn |
| regnskap | "regnskapsbyrå", "regnskapsfører" | Regnskapsbyrå - Drammen og omegn |

**Regnskapsbyrå-presiseringen:** "for én bransje" er en pitch-vinkel Adrian/Kevin
bruker i samtalen, ikke noe Google Places kan filtrere på. Søket henter
ordinære regnskapsbyråer i området; spissingen skjer i ringemanuset, ikke i
sourcingen.

`python places.py hent alle-nisjer-raa.csv` kjører alle 10 og skriver én
kombinert CSV med kolonner: `Bedrift, Telefon, Nettside, Sted, Nisje, Bunke,
GooglePlaceId, GoogleStatus, GoogleRating, GoogleAnmeldelser, Org.nr` (siste
tom, fylles i steg 4). Kolonnen heter bevisst **`Nisje`**, ikke `Bransje` —
`brreg.py` skriver sin egen `Bransje`-kolonn (næringskode-beskrivelse) i steg
5, og de to skal kunne sammenlignes side om side som en sanity-sjekk (treffer
Brreg-bransjen dårlig med søke-nisjen, er org.nr-matchen mistenkelig).

---

## Steg 2–3: Dedup (gjenbruk + ett nytt lite script)

- `dedup.py sjekk alle-nisjer-raa.csv` — uendret bruk av eksisterende script.
  Fanger overlapp mot e-postkampanjer, gamle ark og ANS-kortene registeret
  allerede kjenner.
- `dedup_mot_d1.py <fil>` (nytt, ~30 linjer) — kjører
  `wrangler d1 execute dm-salg --remote --command "SELECT telefon, orgnr,
  nettside FROM leads" --json` via subprocess, bygger samme type
  org/telefon/nettside-nøkkelsett som `dedup.py sin noekler()`, og filtrerer
  input-fila på samme måte som `cmd_sjekk`. Importerer `dedup.py` sine
  `norm_tlf`/`norm_web`/`norm_org`-funksjoner direkte i stedet for å
  duplisere dem.

  Grunnen til at dette må sjekkes separat fra registeret: registeret ble
  sist bygget 23.07, én dag før D1-migreringen. Det er trolig i sync, men
  "trolig" er ikke godt nok når konsekvensen er at et selskap blir ringt av
  to selgere — så jeg sjekker mot den **faktiske** D1-tabellen i tillegg,
  ikke i stedet for.

---

## Steg 4: `finn_orgnr.py` (nytt)

Google Places gir ikke organisasjonsnummer. Dette scriptet søker Brreg sitt
navnesøk (`data.brreg.no/enhetsregisteret/api/enheter?navn=<bedrift>`) for
hver rad:

- Ett treff → bruk det.
- Flere treff → case-insensitiv substreng-sjekk: Brreg-treffets `poststed`
  finnes i Google sin `formattedAddress` (eller omvendt). Nøyaktig ett av
  treffene består sjekken → bruk det. Null eller flere enn ett består →
  ingen match.
- Ingen treff → ingen match.

Ingen match betyr **ikke** automatisk avvisning — raden går videre uten
Org.nr, og seriøs-filteret (steg 6) ruter den til "usikker" i stedet for å
stryke den. Bevisst enkel tekstmatching (ingen Levenshtein/ML-bibliotek) —
det som er utrygt på treff, skal havne i manuell-sjekk-bøtta, ikke bli
feilaktig godkjent eller feilaktig kastet.

---

## Steg 5: `brreg.py` (utvidet, ikke erstattet)

`hent(orgnr)`-funksjonen gjør allerede riktig API-kall og henter
`registreringsdatoEnhetsregisteret`, `oppstartsdato`, kommune, poststed,
næringskode, hjemmeside. Samme JSON-svar inneholder også feltene jeg
trenger for seriøs-sjekken, så utvidelsen er bare å lese tre felt til fra
et svar som allerede hentes:

- `konkurs`, `underAvvikling`, `underTvangsavviklingEllerTvangsopplosning`
  (booleans) → samles til én kolonne `BrregStatus` (`aktiv` / `avvikling`).
- `antallAnsatte` → kolonne `Ansatte`.
- `organisasjonsform.kode` → kolonne `Selskapsform`.

`TOMT`-fallback-dict og retur-dict i `hent()` må holde samme nøkkelsett i
begge grener (suksess og feil), ellers klager `csv.DictWriter` på rader
med ulike kolonner. Rene tillegg — ingenting eksisterende brukere av
scriptet mister.

---

## Steg 6: `filtrer.py` (nytt) — den konkrete seriøs-regelen

**Hardt filter, må bestå alle (ellers ekskludert helt):**

1. `GoogleStatus == "OPERATIONAL"`
2. `Telefon` er ikke tom
3. Har Org.nr-match **og** `BrregStatus == "avvikling"` → ekskludert
   (aktivt under avvikling/konkurs/tvangsavvikling er den ene tingen som
   diskvalifiserer uansett andre signaler)

**Usikker-bøtte (ikke lastet inn, vist til Adrian for manuell vurdering):**

- Består hardt filter, men har **ingen** Org.nr-match.

**Godkjent (kandidat for innlasting):**

- Består hardt filter **og** har bekreftet aktiv Brreg-status.

**Rangering innad i godkjent**, når flere enn `MAKS_PER_BUNKE = 20` består,
for å velge de beste:

1. Boost = 1 hvis (`Ansatte >= MIN_ANSATTE` **eller** registrert
   `>= MIN_REGISTRERT_MANEDER` siden), ellers 0.
2. Sorter på `(Boost synkende, GoogleAnmeldelser synkende, GoogleRating synkende)`.
3. Ta de første 20.

```python
MIN_REGISTRERT_MANEDER = 12
MIN_ANSATTE = 1
MAKS_PER_BUNKE = 20
```

Alle tre er navngitte konstanter øverst i scriptet — juster fritt etter å ha
sett resultatet av piloten.

**Hvorfor Brreg veier tyngre enn Google-stjerner:** disse nisjene er
B2B/håndverk, ikke forbrukertjenester som frisør. De har typisk få
Google-anmeldelser selv når de er solide, reelle firmaer. Et høyt
anmeldelseskrav ville luket bort ellers gode leads. Et aktivt,
ikke-avviklingsselskap i Brreg med reell historikk er også vesentlig
vanskeligere å forfalske enn en Google-oppføring — derfor er Brreg-status
det harde kravet, og Google-signaler brukes til rangering, ikke som
hovedterskel.

---

## Steg 7–9: Registrering og innlasting

- `dedup.py legg-inn <godkjent-fil> "Ringeliste: ny-nisje-pilot aug 2026"` —
  uendret bruk. `Bunke`-kolonnen i fila gjør at hver nisje får riktig
  `Plassering` i registeret automatisk (samme mekanisme som frisør-arkene
  brukte).
- `lag_sql.py <godkjent-fil>` (nytt, ~20 linjer) — skriver
  `INSERT INTO leads (bunke, bedrift, sted, telefon, nettside, bransje,
  orgnr, registrert, status, dato) VALUES (...)` per rad, én fil
  `innlasting.sql`. `id` utelates bevisst (se skjema-notatet innledningsvis).
  `status` settes til `'ikke_ringt'` for alle, `dato` til dagens dato.
  `bransje`-kolonnen fylles fra **`Nisje`** (f.eks. "Taksering og
  skadetakst"), ikke fra Brreg sin `Bransje`/næringskode-beskrivelse — samme
  type rene, lesbare kategori-tekst som `"Frisering og barbering"` i de
  eksisterende leadsene. Brreg sin `Bransje`-kolonne er kun til sanity-sjekk
  i gjennomgangen, den lastes ikke inn noe sted.
- **Stopp-punkt før steg 9:** jeg viser deg en oppsummering (antall
  godkjent/usikker/avvist per nisje, noen eksempelrader) før noe registreres
  eller lastes inn. Du sier ja før jeg kjører `dedup.py legg-inn` og før jeg
  kjører `wrangler d1 execute --remote --file innlasting.sql`. Dette skriver
  til databasen ekte selgere ringer fra, og navnematchingen i steg 4 er
  heuristisk — verdt en ekstra stopp.

---

## Kostnad

- **Places API (New):** ~10 nisjer × 2 søkefraser × inntil 2 sider = maks
  ~40 `searchText`-kall. Selv i øvre prisleie for kall med kontakt- og
  vurderings-felt (typisk rundt $30-35/1000 i dagens prismodell) blir
  totalen under $2 for hele piloten — godt innenfor Googles $200/mnd
  gratiskreditt. Jeg regner et ferskt anslag rett før faktisk kjøring, i
  tilfelle Google har endret prisene.
- **Brreg-API:** gratis, ingen nøkkel, ingen kostnadstak å bekymre seg om.
- Nøkkelen settes som miljøvariabel (`$env:GOOGLE_PLACES_API_KEY`) i
  terminalen før `places.py` kjøres — ikke lagret i noen fil.

---

## Avgrensning (YAGNI)

Dette bygges **ikke** nå:

- Ingen scheduled task / automatisk gjentakende sourcing. Kjøres manuelt på
  kommando denne runden; vurder automatisering når mønsteret er bevist.
- Ingen admin-UI i selgerportalen for å trigge sourcing (vurdert som
  Tilnærming C, utsatt til seriøs-regelen er utprøvd og stabil).
- Ingen fuzzy-matching-bibliotek (Levenshtein/ML) for org.nr-matching.
  Enkel tekstoverlapp er nok når usikre treff uansett havner i
  manuell-sjekk-bøtta i stedet for å bli feilaktig godkjent.
- Ingen kommunenummer-oppslagstabell. `finn_orgnr.py` disambiguerer på
  poststed-tekst, ikke offisielle kommunenumre.
- Ingen paginering utover side 2 per søkefrase. Nok volum for 20/bunke uten
  å drive kostnaden opp.

---

## Risiko / kjente svakheter

- Navnematching mot Brreg kan bomme på generiske navn (flere
  "Byggservice AS" i samme område) — havner i usikker, aldri feilaktig
  godkjent, som er den trygge retningen å bomme i.
- Googles dekning av disse nisjene i de minste kommunene (Modum, Øvre
  Eiker) kan være tynn — noen bunker kan lande under 20 reelle kandidater.
  Rapporteres tydelig i stopp-punktet, ikke fylt opp med dårligere kandidater
  bare for å nå tallet.
- "Regnskapsbyrå for én bransje"-spissingen sources ikke automatisk, den er
  et manus-/pitch-valg for senere.

---

## Suksesskriterier

1. Full kjøring på piloten gir 10 bunker i D1, hver med opptil 20 godkjente
   leads (færre er greit — se risiko over — så lenge det rapporteres).
2. Ingen ny lead i D1 overlapper (telefon/org.nr/nettside) med noe som
   allerede lå i `leads`-tabellen eller i det eksisterende registeret.
3. Bunkene dukker opp i `/selger/ringeliste/`-UI-et med riktig navn og
   riktig antall, uten noen kodeendring i Worker eller frontend.
4. `dedup.py sjekk` kjørt på nytt mot en frisk D1-eksport etter innlasting
   gir 0 treff (bekrefter at selve innlastingen ikke skapte duplikater).
5. Ingen lead lastes inn i D1 uten at Adrian har sett og godkjent
   godkjent/usikker-oppsummeringen først.
