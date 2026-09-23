# Design: automatisert lead-rotasjon inn i Instantly (annenhver dag)

**Dato:** 2026-09-23
**Mål:** en rutine som kjører uten tilsyn annenhver dag, finner nye leads for én
sesongbasert bransje av gangen (start: kajakkutleie, deretter campingplasser),
sletter leads i Instantly som har fullført e-postsekvensen uten svar, laster
opp de nye leadsene, og bytter automatisk til neste bransje i en kø når den
aktive bransjen er tom for kvalifiserte leads. Bygger videre på det
eksisterende, ikke-committede sourcing-verktøyet i `scripts/lead-sourcing/`
(brukt til restaurant-rundene siden 03.08.2026).

> ⚠️ **Denne fila er trygg å committe** (metodikk, ingen ekte bedriftsdata).
> CSV-ene pipelinen produserer, og alle Instantly-innloggingsdetaljer, skal
> **aldri** i git — se sikkerhetsavsnittet.

---

## Utgangspunktet (verifisert, ikke gjettet)

- `scripts/lead-sourcing/fetch-restaurant-leads.js` henter restaurant-leads
  via Google Places API (New) `searchText`, dedupliserer mot
  `leads-med-nettside-DISSE_ER_OPPBRUKT.csv` (kun telefon+nettside i dag) og
  mot alle tidligere `restaurant-leads-*.csv` i
  `OneDrive\Dietrichs Marketing\Leads\Instantly leads\`.
- `scrape-emails.js` besøker hver nettside og finner kontakt-epost gratis
  (mailto-lenke eller regex på forside/kontaktside). ~60 % treffrate,
  verifisert på restaurant-batchen 22.09.2026 (100/167).
- Instantly-MCP-tilkoblingen svarer **401 Unauthorized** akkurat nå (verifisert
  22.09.2026, `list_campaigns`/`list_lead_lists` feiler). Automasjonen bygges
  derfor mot **Instantly sitt web-UI via et skriptet nettleser-script**, ikke
  API-et, etter eksplisitt valg fra Adrian.
- **Places API (New)-feltene som brukes i dag (`websiteUri`,
  `nationalPhoneNumber`, `internationalPhoneNumber`) er Enterprise-tier
  SKU-felt**, verifisert direkte mot Googles prisdokumentasjon
  ([Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search),
  [pricing list](https://developers.google.com/maps/billing-and-pricing/pricing)):
  kun **1000 gratis kall/mnd** (ikke 10 000 som Essentials-tier), deretter
  **$35/1000 kall**. Kvoten er delt på ALT Text Search-bruk i GCP-prosjektet,
  ikke per bransje.
- **OpenStreetMap Overpass API er en gratis, ubegrenset (fair-use)
  alternativ kilde**, live-testet 22.09.2026 mot ekte Norge-data (area id
  3602978650, kjørt via `overpass.kumi.systems`-mirroren siden
  hovedserveren timet ut på landsdekkende spørringer):

  | Bransje | OSM-treff Norge | Har nettside-tag | Har telefon-tag |
  |---|---|---|---|
  | Campingplasser (`tourism=camp_site`) | 1401 | 855 (61 %) | 936 (67 %) |
  | Kajakkutleie (`amenity=boat_rental` + navnesøk) | 43 rå, ~15 reelle bedrifter | for tynt til løpende rutine | — |

  Konklusjon: camping dekkes godt av gratis OSM-data, kajakk må bruke Google
  Places (men markedet er lite, så volumet blir naturlig lavt og billig).

---

## Arkitektur

```
scripts/lead-sourcing/
├── .env                        (utvides: INSTANTLY_EMAIL, INSTANTLY_PASSWORD — gitignored)
├── bransje-kø.json              (nytt — se under)
├── fetch-osm-leads.js           (nytt — generisk Overpass-henter)
├── fetch-places-leads.js        (nytt — generalisert fetch-restaurant-leads.js)
├── fetch-restaurant-leads.js    (uendret, holdes som egen fil siden restaurant
│                                  fortsatt kan trenge topp-opp-kjøringer)
├── scrape-emails.js             (uendret, gjenbrukes direkte)
├── dedup-register.js            (nytt — de tre dedup-nøklene, delt av alle fetch-scriptene)
├── instantly-sync.js            (nytt — Playwright: slett fullførte, last opp nye)
├── kjor-runde.js                (nytt — orkestrerer hele syklusen)
└── logs/                        (nytt — én loggfil per kjøring)
```

`kjor-runde.js` er inngangspunktet Windows Task Scheduler kaller annenhver
dag. Den gjør, i rekkefølge:

1. Les `bransje-kø.json` → finn aktiv bransje og dens kilde (`osm` eller
   `places`) + søkeparametere.
2. Kjør riktig fetch-script (`fetch-osm-leads.js` eller
   `fetch-places-leads.js`) med bransjens parametere. Scriptet dedupliserer
   selv mot `dedup-register.js` (se under) før det skriver ut CSV-en.
3. Kjør `scrape-emails.js` på resultatet.
4. Kjør `instantly-sync.js`:
   a. Eksporter backup-CSV av leads som skal slettes, til
      `OneDrive...\Instantly leads\backups\<dato>-<bransje>-slettet.csv`.
   b. Logg inn på Instantly, filtrer aktiv kampanje på "fullført uten svar",
      slett de leadsene.
   c. Last opp CSV med de nye leadsene til samme kampanje.
5. Oppdater `dedup-register.js` sin master-fil med de nye leadsene (telefon +
   nettside + epost) — de skal aldri sources på nytt, uansett bransje.
6. Hvis antall NYE leads denne kjøringen er **under 150**: marker aktiv
   bransje som ferdig i `bransje-kø.json`, flytt køpekeren til neste bransje,
   og logg dette tydelig (Adrian ser det i loggen, ingen varsling kreves).
7. Skriv en oppsummeringslinje til `logs/<dato>.log`: bransje, kilde, antall
   funnet, antall med epost, antall slettet i Instantly, antall lastet opp,
   evt. bransjebytte, evt. feil.

---

## `bransje-kø.json` — struktur og innhold

```json
{
  "instantly_kampanje": "Sesongbaserte leads (roterende)",
  "aktiv_index": 0,
  "bransjer": [
    {
      "navn": "Kajakkutleie",
      "kilde": "places",
      "sok": ["kajakkutleie", "kanoutleie"],
      "ekskluder_fil": null
    },
    {
      "navn": "Campingplasser",
      "kilde": "osm",
      "osm_tag": "tourism=camp_site",
      "ekskluder_fil": null
    },
    {
      "navn": "Hagesentre",
      "kilde": "osm",
      "osm_tag": "shop=garden_centre",
      "ekskluder_fil": null
    },
    {
      "navn": "Fjordcruise og sightseeing",
      "kilde": "places",
      "sok": ["fjordcruise", "sightseeing selskap", "fjordtur"],
      "ekskluder_fil": null
    },
    {
      "navn": "Iskrembutikker og strandkiosker",
      "kilde": "places",
      "sok": ["iskrembutikk", "strandkiosk"],
      "ekskluder_fil": null
    }
  ]
}
```

`ekskluder_fil` peker på en kjede-eksklusjonsliste per bransje, samme mønster
som `restaurantkjeder-IKKE-BRUK.csv` — `null` til vi faktisk observerer at en
bransje trenger det (YAGNI, ikke bygg det for bransjer uten kjedeproblem).

**Hvorfor JSON og ikke enda et Node-script med hardkodet array:** dette er
data Adrian selv skal kunne redigere (endre rekkefølge, legge til en bransje)
uten å røre kode. `kjor-runde.js` leser og skriver fila, ingen andre steder.

---

## Dedup — tre nøkler, delt på tvers av alle bransjer

`dedup-register.js` eksporterer to funksjoner brukt av begge fetch-scriptene:

- `lastInnBrukteNokler()` — leser
  `leads-med-nettside-DISSE_ER_OPPBRUKT.csv` (kolonner: epost, navn, telefon,
  nettside) **og** alle `*-leads-*.csv`-filer i `Instantly leads`-mappa
  (uansett bransje-prefiks, ikke bare `restaurant-leads-*` som i dag), og
  returnerer tre `Set`-er: `telefoner` (normalisert, kun siffer, uten
  landkode), `nettsider` (normalisert domene, uten protokoll/www/trailing
  slash), `eposter` (lowercase).
- `erBruktFraFor(lead, nokler)` — sann hvis lead sin telefon, nettside ELLER
  epost matcher noe i settene. Én match er nok til å luke bort raden —
  bevisst konservativt, det er billigere å miste én reell ny lead enn å
  sende to mailer til samme person.
- `registrerNyeLeads(leads)` — kjøres av `kjor-runde.js` etter vellykket
  Instantly-opplasting, appender til
  `leads-med-nettside-DISSE_ER_OPPBRUKT.csv` med alle tre feltene utfylt.

**Hvorfor epost legges til nå:** dagens restaurant-script sjekker kun
telefon+nettside. Det har fungert fordi hver restaurant typisk har én unik
kombinasjon av de to. Men når flere bransjer blandes (en camping som også
driver kajakkutleie, en hagesenter-kjede med felles sentralbord), er epost
den nøkkelen som faktisk følger *personen* som mottar mailen, ikke bare
*bedriften*. Dette var Adrians eksplisitte krav 23.09.2026.

---

## `fetch-osm-leads.js` — generisk Overpass-henter

Tar bransjens OSM-tag (f.eks. `tourism=camp_site`) og bransjenavn som
argumenter. Gjør én Overpass-spørring mot Norges area-id (3602978650) via
`overpass.kumi.systems` (hovedserveren `overpass-api.de` timer ut på
landsdekkende spørringer med `area()`, verifisert 22.09.2026 — bruk mirroren
som primær, med `overpass-api.de` som fallback hvis mirroren er nede).

```
[out:json][timeout:150];
area(3602978650)->.no;
( nwr["<tag>"](area.no); );
out tags center;
```

Filtrerer resultatet på:
1. Har `name`-tag (ikke navnløse elementer).
2. Har `website` ELLER `contact:website` tag (vi vil ha de som allerede har
   nettside, samme filosofi som restaurant-pipelinen).
3. Ikke i `dedup-register.js` sine brukte nøkler.

Skriver samme CSV-format som `fetch-restaurant-leads.js`:
`"navn","adresse","telefon","nettside","by"` — `scrape-emails.js` trenger
ingen endring for å konsumere dette.

**Kostnad: $0, uansett volum.** Overpass er donasjonsdrevet fair-use, ingen
API-nøkkel, ingen fakturering.

---

## `fetch-places-leads.js` — generalisert Google Places-henter

Samme kode som `fetch-restaurant-leads.js` (samme by-liste med 180
byer/bydeler, samme `searchText`-logikk, samme MAX_LEADS=1500-tak), men
`textQuery`-strengen og bransjenavnet leses fra `bransje-kø.json` sitt
`sok`-array i stedet for å være hardkodet `"restauranter i ${city}"`. Kjøres
kun for bransjer der `bransje-kø.json` sier `kilde: "places"`.

**Kostnad:** samme sats som i dag ($35/1000 kall, Enterprise-tier, 1000
gratis/mnd delt på restaurant+alt annet). For kajakkutleie forventes lavt
volum siden det totale markedet er lite (se OSM-testen: 43 rå treff
landsdekkende) — trolig under 200-300 reelle bedrifter uansett kilde, så
denne bransjen blir billig og kortvarig uansett.

---

## `instantly-sync.js` — Playwright-automatisering

Ingen 2FA på kontoen (bekreftet av Adrian 22.09.2026), så innlogging kan
gjøres helt automatisk med epost+passord fra `.env`.

1. Launch headless Chromium (Playwright), logg inn på `app.instantly.ai`.
2. Naviger til kampanjen navngitt i `bransje-kø.json` sitt
   `instantly_kampanje`-felt — én fast kampanje gjenbrukes uansett hvilken
   bransje som er aktiv, kun leadsene inni byttes ut, per Adrians valg om
   "én bransje av gangen".
3. Filtrer leads-visningen på "Completed" / fullført sekvens uten svar.
4. **Eksporter disse til backup-CSV FØR sletting** —
   `OneDrive...\Instantly leads\backups\<ISO-dato>-<bransje>-slettet.csv`.
5. Bulk-velg og slett de filtrerte leadsene.
6. Last opp den nye CSV-en (fra steg 3 i hovedflyten) via Instantly sin
   CSV-importflyt i UI-et.
7. Returner antall slettet / antall lastet opp til `kjor-runde.js` for
   loggføring.

**Skjørhet, akseptert bevisst:** dette scriptet er avhengig av Instantly sitt
nåværende UI (selektorer for knapper/filter). Endrer Instantly UI-et sitt,
må selektorene oppdateres. Risikoen reduseres av at `kjor-runde.js` logger
tydelig ved feil (se feilhåndtering under) i stedet for å feile stille.

---

## Sikkerhet

- `INSTANTLY_EMAIL` og `INSTANTLY_PASSWORD` lagres i
  `scripts/lead-sourcing/.env`. Verifisert 23.09.2026:
  `.env`/`.env.*` er allerede globalt gitignored i repo-roten
  (`git check-ignore -v` bekrefter), så dette er trygt i det offentlige
  repoet uten ytterligere `.gitignore`-endring.
- Ingen credentials hardkodes i noen `.js`-fil.
- Backup-CSV-en i steg 4 over (`instantly-sync.js`) er sikkerhetsnettet mot
  at en bug i slette-logikken mister leads for godt — alt som slettes i
  Instantly finnes fortsatt lokalt i OneDrive-mappa.

---

## Kjøreplan (Windows Task Scheduler)

- Trigger: annenhver dag, kl. 06:00.
- Handling: `node C:\Users\adria\website-mirrors\dmarketing-redesign\scripts\lead-sourcing\kjor-runde.js`
- Arbeidskatalog: `scripts\lead-sourcing\`.
- Ved feil (script kaster exception): Task Scheduler-loggen viser feilen,
  `kjor-runde.js` skriver også feilen til `logs/<dato>.log` FØR den kaster
  videre, slik at delvis fremgang (f.eks. leads hentet, men Instantly-steget
  feilet) ikke går tapt fra loggen.

---

## Feilhåndtering

- Fetch-steget feiler (Places API nede, Overpass timeout) → logg feilen, ikke
  gå videre til Instantly-steget denne runden, ikke rør bransje-køen.
- Instantly-innlogging feiler (endret passord, Instantly nede) → logg feilen
  tydelig, ikke slett noe, ikke last opp noe. De nye leadsene fra fetch-steget
  ligger fortsatt i CSV-en og plukkes opp automatisk neste kjøring siden
  dedup-registeret ikke er oppdatert ennå (leads registreres i
  dedup-registeret KUN etter vellykket opplasting, se arkitektur-steg 5).
- Bransjen gir 0 nye leads (fullstendig tom, ikke bare under 150-terskelen)
  → samme håndtering som "under 150", bytt bransje umiddelbart.

---

## Avgrensning (YAGNI)

Dette bygges **ikke** nå:

- Ingen varsling (e-post/Slack) til Adrian ved bransjebytte eller feil — han
  sjekker loggfila selv. Vurder varsling hvis loggen viser seg å bli
  ignorert i praksis.
- Ingen automatisk kjede-eksklusjonsliste-generering per ny bransje —
  `ekskluder_fil: null` til et konkret kjedeproblem faktisk observeres.
- Ingen retry-logikk utover "prøv igjen om 2 dager" (neste planlagte
  kjøring). Ingen umiddelbar automatisk retry ved feil.
- Ingen håndtering av Instantly 2FA — ikke relevant siden kontoen ikke har
  det, men betyr at scriptet vil feile hardt (ikke henge) hvis 2FA slås på
  senere. Logges tydelig hvis det skjer.
- Ingen UI/dashboard for å se lead-status — loggfilene er nok for nå.

---

## Risiko / kjente svakheter

- **Instantly UI-endringer** kan brekke `instantly-sync.js` sine selektorer
  uten forvarsel — akseptert risiko ved valget av skriptet
  nettleser-automatisering fremfor API (se Utgangspunktet).
- **Overpass sin hovedserver timer ut** på landsdekkende `area()`-spørringer
  under last — mirroren (`overpass.kumi.systems`) løste dette i testingen,
  men er en tredjeparts-drevet speiling av samme data, ikke en Google/OSM
  Foundation-tjeneste. Kan i prinsippet være nede; scriptet bør prøve
  hovedserveren som fallback.
- **Google har endret Places-prisingen før** (siste gang rundt februar/mars
  2025, ifølge sekundærkilder) — tallene her er verifisert 22.09.2026 direkte
  mot Google sin dokumentasjon, men bør sjekkes på nytt hvis kostnaden
  plutselig avviker fra det som er logget.
- **150-terskelen for "bransje er tom"** er satt ut fra ett enkelt
  datapunkt (167 vs. normalt 1000+ for restaurant). Kan vise seg for høy
  eller lav for andre bransjer med naturlig mindre totalvolum (som
  kajakkutleie, hvor selv en frisk bransje kanskje aldri gir 150+ i én
  kjøring) — juster terskelen konkret per bransje i `bransje-kø.json` hvis
  det viser seg nødvendig, i stedet for én global konstant.

---

## Suksesskriterier

1. `kjor-runde.js` kjører ende-til-ende uten manuell inngripen for
   kajakkutleie, deretter campingplasser, og bytter bransje selv når
   150-terskelen treffes.
2. Ingen lead med telefon, nettside ELLER epost som allerede finnes i
   `leads-med-nettside-DISSE_ER_OPPBRUKT.csv` blir noensinne lastet opp til
   Instantly igjen.
3. Hver sletting i Instantly har en tilsvarende backup-CSV i
   `Instantly leads\backups\` fra samme kjøring, daterbar til nøyaktig
   hvilken runde som slettet dem.
4. Campingplasser sources med $0 i Places API-kostnad (kun OSM brukt).
5. Loggfila i `logs/` gjør det mulig for Adrian å se, uten å kjøre noe selv,
   hva som skjedde i enhver tidligere kjøring: bransje, antall funnet/lastet
   opp/slettet, og eventuelle feil.
