# Design: samarbeidspartnere-side

**Dato:** 2026-08-24
**Mål:** en ny offentlig side på dmarketing.no som viser fram IT-driftsselskapene
Dietrichs Marketing samarbeider med (reseller-partnere, se `project-it-partner-nettverk`-memory),
for å bygge tillit og troverdighet hos besøkende. Ren informasjon, ingen rekruttering,
ingen henvisning bort fra Dietrichs Marketings egne tjenester.

---

## Vinkling (styrende for all copy)

"Etablerte, lokale IT-driftsselskap velger å samarbeide med oss" — ikke
"trenger du mer hjelp, gå til dem". To harde regler av dette:

1. **Ingen CTA om å bli partner.** Siden er ren presentasjon, ingen rekrutteringspitch.
2. **Ingen promotering av noe Dietrichs Marketing selv kan levere.** Partnernes
   tjenestelister skal aldri inneholde noe som overlapper AI-nettsider,
   programvareutvikling eller andre Dietrichs-tjenester. Gjelder også ved
   fremtidige tillegg (Bergen IT Center, IT Relasjon) eller hvis noen av de tre
   utvider tjenestelisten sin senere, sjekk på nytt da.

---

## Side og filer

| Hva | Verdi |
|---|---|
| Ny fil | `samarbeidspartnere/index.html` |
| Live-URL | `https://dmarketing.no/samarbeidspartnere/` |
| Mal | Kopier head-boilerplate fra `personvern/index.html` (gtag+samtykke-script, meta/og-tags, Typekit + Google Fonts, `dm-chrome.css`, samme inline `<style>`-header/mobilmeny-blokk) |
| Engelsk versjon | Ingen. Dropp `hreflang`-alternates helt (kun `canonical`). |
| `sitemap.xml` | Legg til ny `<url>`-oppføring for siden |

---

## Innhold: intro

Eyebrow + H1 + ingress, samme mønster som "Teamet"-seksjonen på forsiden
(`dm-eyebrow` / `dm-h2` klassene, tilpasset `dm-h1` her siden det er sidens hovedoverskrift):

> **Samarbeid**
> # Samarbeidspartnere
> Dietrichs Marketing samarbeider med etablerte IT-driftsselskap flere steder i
> Norge. De kjenner bedriftene sine best, og velger å tilby AI-nettsidene våre
> videre til egne kunder fordi de stoler på teknologien og leveransen. Her er
> noen av dem.

---

## Innhold: partnerkort

Rekkefølge som oppgitt av Adrian. Hvert kort: initial-badge (plassholder til
ekte logo), navn, tag-linje, avsnitt (omskrevet med egne ord, ikke copy-paste),
liten tjenesteliste, diskré lenke til nettsiden deres (tekst-lenke, ikke stor knapp).

### 1. Layer One IT Company
- **Badge:** "L"
- **Tag:** M365, Azure & IT-rådgivning
- **Avsnitt:** Layer One leverer sikre, standardiserte IT-løsninger på Microsoft
  365 og Azure til små og mellomstore bedrifter, inkludert fast innleie og full
  outsourcing av IT-drift. De har også bistått med nettverksinfrastruktur for
  vindparker og fiberutbygging, og fungerer som en uavhengig rådgiver når
  bedrifter skal gjøre større IT-anskaffelser.
- **Tjenester:** Microsoft 365 & Azure · Nettverk og infrastruktur · IT-rådgivning · Driftsavtaler og fast innleie
- **Lenke:** layerone.no

### 2. Agder IT
- **Badge:** "A"
- **Tag:** Serverdrift & sikkerhet · Kristiansand
- **Avsnitt:** Agder IT har over 25 års erfaring og leverer komplette
  IT-tjenester til små og mellomstore bedrifter i Kristiansand-området. De
  overvåker, oppdaterer og sikrer kundenes systemer proaktivt, med kort
  responstid og faste kontaktpunkter.
- **Tjenester:** Serverdrift · Microsoft 365 · IT-sikkerhet · Nettverk og brannmur · Backup
- **Lenke:** agderit.no

### 3. TrønderData
- **Badge:** "T"
- **Tag:** Datahjelp & serviceavtaler · Steinkjer
- **Avsnitt:** TrønderData tilbyr rask og pålitelig datahjelp til bedrifter og
  privatpersoner i Steinkjer, Inderøy, Snåsa og resten av Trøndelag, enten som
  enkeltoppdrag eller som fast serviceavtale. De løser alt fra virus og
  e-postoppsett til nettverk, backup og Microsoft 365.
- **Tjenester:** Fjernhjelp · Virus- og malwarefjerning · Sikkerhetskopiering · Nettverksoppsett · Microsoft 365-støtte
- **Lenke:** tronderdata.no

Ingen adresser/telefonnumre/org.nr publiseres, det er ikke relevant for en
troverdighets-side og er ikke Adrians å publisere uten et konkret formål.

---

## Visuell struktur

Gjenbruker `.dm-team-card`-mønsteret fra forsiden (`index.html`), tilpasset:

- Grid: 3 kolonner desktop → 2 tablet → 1 mobil (samme brytningspunkter som
  `.dm-team-grid`: 900px, 520px).
- Kort: hvit bakgrunn, border, `border-radius` stor, samme skygge som team-kort.
- Badge: rund, `#1B34FF`-bakgrunn, hvit fet bokstav, samme størrelse som
  team-fotoene (66px), erstatter `<img>` til ekte logo kommer senere (enkel
  swap, ingen strukturendring nødvendig).
- Tag-linje: samme stil som `.dm-team-role` (liten, uppercase, blå).
- Tjenesteliste: enkel `<ul>` med små kulepunkter under avsnittet.
- Lenke til partnerens nettside: liten tekstlenke nederst i kortet, ikke en
  fylt knapp (unngår at det leses som en CTA/henvisning).

---

## Footer-lenke (bekreftet omfang)

Footer-navigasjonen (`Programvareutvikling` / `AI-nettsider` / `Kontakt`) er
identisk, hardkodet HTML på i overkant av 50 filer. "Samarbeidspartnere" legges
inn som fjerde lenke i denne kolonnen, via skriptet strengbytte (samme
rot-absolutte lenke-tekst er identisk i alle filene).

**Inkludert:** `index.html`, `kontakt/`, `personvern/`, `vilkar/`,
`programvareutvikling/`, `ai-nettsider/`, `artikler/index.html`, alle
`artikler/*.html`.

**Ekskludert:** `en/*` (ingen engelsk side å lenke til), `maler/*`, `kurs/*`,
`selger/*`, `sikringen-*`, `onboarding.html`, `scroll-test.html`,
`hero-test.html` (egne prosjekter/demoer, har ikke `dm-chrome`).

Etter bytte: stikkprøve 2-3 filer (forsiden, en artikkel, en toppside) for å
bekrefte lenken faktisk peker til `/samarbeidspartnere/` og ikke knekker layout.

---

## Avgrensning (YAGNI)

Bygges **ikke** nå:

- CTA om å bli partner (eksplisitt avslått).
- Ekte partnerlogoer (Adrian skaffer bilder separat, badge er plassholder).
- Engelsk versjon.
- Lenke i hovedmeny/header eller mobilmeny (kun footer, som avtalt).
- Adresser, telefonnumre, org.nr eller andre kontaktdetaljer for partnerne.
- Flere partnere enn de tre (Bergen IT Center, IT Relasjon) inntil Adrian ber
  om det og gir tilsvarende innhold om dem.

---

## Suksesskriterier

1. `/samarbeidspartnere/` laster med header/footer identisk med resten av
   siten, ingen horisontal overflow 320 til 1440px.
2. Alle tre kort viser badge, tag, avsnitt, tjenesteliste og lenke, med
   innhold som stemmer med det Adrian sendte (ingen oppdiktede tall/fakta).
3. Ingen tjeneste eller formulering på siden overlapper Dietrichs Marketings
   eget tilbud (AI-nettsider, programvareutvikling).
4. Ingen em-streker noe sted (tittel, meta, brødtekst).
5. Footer-lenken finnes og virker på stikkprøvde filer i alle kategorier
   (forside, toppside, artikkel), og er fraværende i de eksplisitt ekskluderte
   mappene.
6. `sitemap.xml` inneholder den nye URL-en.
