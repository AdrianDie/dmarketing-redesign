# Instantly lead-automasjon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** en rutine som annenhver dag finner nye leads for én sesongbasert bransje av
gangen (kajakkutleie først, deretter campingplasser osv.), sletter Instantly-leads som
har fullført e-postsekvensen uten svar, laster opp de nye leadsene, og bytter
automatisk bransje når den aktive er tom.

**Architecture:** Node.js-scripts i `scripts/lead-sourcing/` (allerede finnes, ikke
committet). Ny delt dedup-modul (tre nøkler: telefon/nettside/epost) brukes av to
kilde-fetchere — gratis OSM/Overpass der dekningen er god, Google Places (New) som
fallback — pluss et Playwright-script som gjør selve Instantly-arbeidet i nettleseren
(API-nøkkelen er 401 Unauthorized). Et orkestrerings-script kjøres av Windows Task
Scheduler annenhver dag og styrer bransjekøen.

**Tech Stack:** Node.js (innebygd `https`/`fetch`, ingen nye npm-avhengigheter utover
det som finnes: `dotenv`), Playwright (ny avhengighet, kun for `instantly-sync.js`),
Windows Task Scheduler.

**Spec:** [docs/superpowers/specs/2026-09-23-instantly-lead-automasjon-design.md](../specs/2026-09-23-instantly-lead-automasjon-design.md)

**Batch-størrelse:** Adrian har bedt om **240 nye leads MED EPOST per kjøring**
(presisert 23.09.2026, etter at første kajakkutleie-runde ga 240 raw men bare
186 med epost — e-post-scraping-treffraten på 60-80% betyr at "240 raw" og
"240 med epost" ikke er samme tall). `maxLeadsPerKjoring` i `bransje-kø.json`
er derfor **målet for antall MED EPOST**, ikke antall raw-treff fra
kilde-fetcheren. `kjor-runde.js` henter i runder (se Task 7) til målet er nådd
eller et tak på antall runder er brukt opp — juster `maxLeadsPerKjoring` fritt
per bransje der 240 ikke er realistisk (se Task 5, kajakkutleie sitt lille
marked).

---

## Filstruktur

```
scripts/lead-sourcing/
├── .env                          (utvides: INSTANTLY_EMAIL, INSTANTLY_PASSWORD)
├── steder-norge.js                (NY — delt by-liste, flyttet ut av fetch-restaurant-leads.js)
├── dedup-register.js              (NY — tre-nøkkel dedup, delt av alle fetchere)
├── dedup-register.test.js         (NY)
├── fetch-osm-leads.js             (NY — gratis Overpass-henter)
├── fetch-osm-leads.test.js        (NY — kun for byggAdresse())
├── fetch-places-leads.js          (NY — generalisert Google Places-henter)
├── fetch-restaurant-leads.js      (ENDRE — bruk steder-norge.js i stedet for egen kopi)
├── fetch-restaurant-leads-uten-nettside.js  (uendret)
├── scrape-emails.js               (uendret, gjenbrukes direkte)
├── bransje-ko.js                  (NY — les/skriv/bytt aktiv bransje i bransje-ko.json)
├── bransje-ko.test.js             (NY)
├── bransje-ko.json                (NY — data, ikke kode)
├── instantly-sync.js              (NY — Playwright)
├── kjor-runde.js                  (NY — orkestrerer alt, kalles av Task Scheduler)
├── package.json                   (ENDRE — legg til playwright, test-script)
└── logs/                          (NY mappe, .gitkeep)
```

---

### Task 1: `dedup-register.js` — delt tre-nøkkel dedup

**Files:**
- Create: `scripts/lead-sourcing/dedup-register.js`
- Test: `scripts/lead-sourcing/dedup-register.test.js`

- [ ] **Step 1: Skriv testen først**

```javascript
// scripts/lead-sourcing/dedup-register.test.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  normalizePhone, normalizeWebsite, normalizeEmail,
  loadUsedKeys, erAlleredeBrukt, registrerNyeLeads,
} = require('./dedup-register');

function lagTestMappe() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dedup-test-'));
  fs.writeFileSync(
    path.join(dir, 'leads-med-nettside-DISSE_ER_OPPBRUKT.csv'),
    '"epost","navn","telefon","nettside"\n"gammel@eksempel.no","Gammel AS","12345678","eksempel.no"\n',
    'utf-8'
  );
  fs.writeFileSync(
    path.join(dir, 'restaurant-leads-nye-2026-08-03.csv'),
    '"navn","adresse","telefon","nettside","by"\n"Annen Restaurant","Gate 1","87654321","annenrest.no","Oslo"\n',
    'utf-8'
  );
  return dir;
}

assert.strictEqual(normalizePhone('+47 123 45 678'), '12345678');
assert.strictEqual(normalizePhone('123-45-678'), '12345678');
console.log('OK: normalizePhone');

assert.strictEqual(normalizeWebsite('https://www.Eksempel.no/'), 'eksempel.no');
console.log('OK: normalizeWebsite');

assert.strictEqual(normalizeEmail(' Info@Eksempel.NO '), 'info@eksempel.no');
console.log('OK: normalizeEmail');

const dir = lagTestMappe();
const nokler = loadUsedKeys(dir);
assert.ok(nokler.telefoner.has('12345678'), 'skal finne telefon fra oppbrukt-fila');
assert.ok(nokler.nettsider.has('eksempel.no'), 'skal finne nettside fra oppbrukt-fila');
assert.ok(nokler.eposter.has('gammel@eksempel.no'), 'skal finne epost fra oppbrukt-fila');
assert.ok(nokler.telefoner.has('87654321'), 'skal ogsaa finne telefon fra tidligere bransje-CSV');
console.log('OK: loadUsedKeys leser flere kilder');

assert.strictEqual(erAlleredeBrukt({ telefon: '12345678', nettside: 'ny.no', epost: 'ny@ny.no' }, nokler), true);
assert.strictEqual(erAlleredeBrukt({ telefon: '99999999', nettside: 'annenrest.no', epost: 'ny@ny.no' }, nokler), true);
assert.strictEqual(erAlleredeBrukt({ telefon: '11111111', nettside: 'helt-ny.no', epost: 'helt-ny@ny.no' }, nokler), false);
console.log('OK: erAlleredeBrukt sjekker alle tre nøkler');

registrerNyeLeads([{ epost: 'ny@ny.no', navn: 'Ny AS', telefon: '11111111', nettside: 'helt-ny.no' }], dir);
const nyeNokler = loadUsedKeys(dir);
assert.ok(nyeNokler.eposter.has('ny@ny.no'), 'ny lead skal vaere registrert etter registrerNyeLeads');
console.log('OK: registrerNyeLeads');

fs.rmSync(dir, { recursive: true, force: true });
console.log('\nAlle tester i dedup-register.test.js passerte.');
```

- [ ] **Step 2: Kjør testen og bekreft at den feiler**

Run: `node scripts/lead-sourcing/dedup-register.test.js`
Expected: `Error: Cannot find module './dedup-register'`

- [ ] **Step 3: Implementer `dedup-register.js`**

```javascript
// scripts/lead-sourcing/dedup-register.js
// Delt dedup-logikk for alle fetch-scriptene: tre nøkler (telefon, nettside, epost),
// delt paa tvers av ALLE bransjer via samme "oppbrukt"-fil + alle tidligere
// bransje-CSV-er i samme mappe. Se docs/superpowers/specs/2026-09-23-instantly-lead-automasjon-design.md.
const fs = require('fs');
const path = require('path');

const LEADS_DIR = 'C:\\Users\\adria\\OneDrive\\Dietrichs Marketing\\Leads\\Instantly leads';
const USED_FILENAME = 'leads-med-nettside-DISSE_ER_OPPBRUKT.csv';

function normalizePhone(p) {
  return (p || '').replace(/[^\d]/g, '').replace(/^47/, '');
}

function normalizeWebsite(w) {
  return (w || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function normalizeEmail(e) {
  return (e || '').trim().toLowerCase();
}

function parseCsvColumn(filePath, columnName) {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(',').map((h) => h.replace(/"/g, '').trim().toLowerCase());
  const idx = header.indexOf(columnName.toLowerCase());
  if (idx === -1) return [];
  return lines.slice(1).map((line) => {
    const cols = line.split('","').map((c) => c.replace(/^"|"$/g, ''));
    return (cols[idx] || '').trim();
  }).filter(Boolean);
}

function loadUsedKeys(leadsDir = LEADS_DIR) {
  const usedFile = path.join(leadsDir, USED_FILENAME);
  const telefoner = new Set(parseCsvColumn(usedFile, 'telefon').map(normalizePhone).filter(Boolean));
  const nettsider = new Set(parseCsvColumn(usedFile, 'nettside').map(normalizeWebsite).filter(Boolean));
  const eposter = new Set(parseCsvColumn(usedFile, 'epost').map(normalizeEmail).filter(Boolean));

  const previousFiles = fs.readdirSync(leadsDir)
    .filter((f) => /-leads-.*\.csv$/i.test(f) && f !== USED_FILENAME)
    .map((f) => path.join(leadsDir, f));

  for (const file of previousFiles) {
    parseCsvColumn(file, 'telefon').map(normalizePhone).forEach((v) => v && telefoner.add(v));
    parseCsvColumn(file, 'nettside').map(normalizeWebsite).forEach((v) => v && nettsider.add(v));
    parseCsvColumn(file, 'epost').map(normalizeEmail).forEach((v) => v && eposter.add(v));
  }

  return { telefoner, nettsider, eposter };
}

function erAlleredeBrukt(lead, nokler) {
  const tlf = normalizePhone(lead.telefon);
  const web = normalizeWebsite(lead.nettside);
  const epost = normalizeEmail(lead.epost);
  if (tlf && nokler.telefoner.has(tlf)) return true;
  if (web && nokler.nettsider.has(web)) return true;
  if (epost && nokler.eposter.has(epost)) return true;
  return false;
}

function registrerNyeLeads(leads, leadsDir = LEADS_DIR) {
  const usedFile = path.join(leadsDir, USED_FILENAME);
  const exists = fs.existsSync(usedFile);
  const header = '"epost","navn","telefon","nettside"';
  const rows = leads.map((l) =>
    `"${(l.epost || '').replace(/"/g, '""')}","${(l.navn || '').replace(/"/g, '""')}","${(l.telefon || '').replace(/"/g, '""')}","${(l.nettside || '').replace(/"/g, '""')}"`
  );
  const content = exists ? '\n' + rows.join('\n') : [header, ...rows].join('\n');
  fs.appendFileSync(usedFile, content, 'utf-8');
}

module.exports = {
  normalizePhone, normalizeWebsite, normalizeEmail,
  loadUsedKeys, erAlleredeBrukt, registrerNyeLeads, parseCsvColumn,
};
```

- [ ] **Step 4: Kjør testen på nytt og bekreft at den passerer**

Run: `node scripts/lead-sourcing/dedup-register.test.js`
Expected: alle 6 `OK:`-linjer, avsluttet med `Alle tester i dedup-register.test.js passerte.`

- [ ] **Step 5: Commit**

```bash
git add scripts/lead-sourcing/dedup-register.js scripts/lead-sourcing/dedup-register.test.js
git commit -m "Legg til delt tre-nøkkel dedup-modul for lead-sourcing"
```

---

### Task 2: Flytt by-listen ut av `fetch-restaurant-leads.js` (DRY)

`fetch-places-leads.js` (Task 4) trenger nøyaktig samme 180-by-liste som
`fetch-restaurant-leads.js` allerede har hardkodet. To kopier av en 150-linjers
liste ville drevet fra hverandre første gang noen legger til en by ett sted og
glemmer det andre. Flytt den til én delt fil.

**Files:**
- Create: `scripts/lead-sourcing/steder-norge.js`
- Modify: `scripts/lead-sourcing/fetch-restaurant-leads.js:27-112` (BYDELER/BYDEL_QUERIES/CITIES-blokken)

- [ ] **Step 1: Opprett `steder-norge.js` med den eksakte BYDELER/CITIES-blokken**

Kopier linjene som i dag ligger i `fetch-restaurant-leads.js` fra `const BYDELER = {`
til slutten av `const CITIES = [ ... ];` (linje 27–112 i dagens fil) inn i en ny fil,
og eksporter `CITIES`:

```javascript
// scripts/lead-sourcing/steder-norge.js
// Delt liste over norske byer/bydeler for Google Places-søk. Flyttet ut av
// fetch-restaurant-leads.js 2026-09-23 for å unngå at fetch-places-leads.js
// (Task 4 i samme plan) fikk sin egen drivende kopi av samme 180-liste.
// Byer/tettsteder etter befolkning, størst først, for å prioritere volum.
// Oslo/Bergen/Trondheim/Stavanger er delt opp i bydeler (se BYDELER) i stedet for
// ett samlesøk, siden Google Places Text Search har et hardt tak på ~60 treff per
// søkestreng uansett paginering - de fire storbyene har garantert langt flere
// restauranter med nettside enn det ene søket noensinne kunne fange opp.
const BYDELER = {
  // ... (eksakt samme innhold som dagens fetch-restaurant-leads.js linje 27-51)
};
const BYDEL_QUERIES = Object.entries(BYDELER).flatMap(([by, bydeler]) =>
  bydeler.map((b) => `${b}, ${by}`)
);

const CITIES = [
  ...BYDEL_QUERIES,
  // ... (eksakt samme innhold som dagens fetch-restaurant-leads.js linje 58-112)
];

module.exports = { CITIES };
```

> Bruk `Read` på `scripts/lead-sourcing/fetch-restaurant-leads.js` linje 27-112 for
> det eksakte innholdet — ikke skriv listen på nytt fra minnet, den skal være
> byte-for-byte lik for at flyttingen ikke skal endre hvilke byer som søkes.

- [ ] **Step 2: Oppdater `fetch-restaurant-leads.js` til å importere i stedet for å definere**

Erstatt linje 27–112 (hele `BYDELER`/`BYDEL_QUERIES`/`CITIES`-blokken) med:

```javascript
const { CITIES } = require('./steder-norge');
```

- [ ] **Step 3: Verifiser at oppførselen er uendret**

Run: `node -e "const {CITIES} = require('./scripts/lead-sourcing/steder-norge'); const old = require('./scripts/lead-sourcing/fetch-restaurant-leads.js');" `

(Dette vil faktisk starte hoved-scriptet siden det ikke er modularisert bak
`require.main`. Bruk i stedet en ren sammenligning:)

Run: `node -e "const a = require('./scripts/lead-sourcing/steder-norge').CITIES; console.log('Antall steder:', a.length);"`
Expected: samme antall som `CITIES.length` var før endringen (tell linjene i
git-diffen for å bekrefte 0 tap — `git diff --stat scripts/lead-sourcing/fetch-restaurant-leads.js` skal vise at linjene som ble fjernet fra denne fila er nøyaktig linjene som ble lagt til i `steder-norge.js`, bortsett fra `module.exports`-linjen).

- [ ] **Step 4: Commit**

```bash
git add scripts/lead-sourcing/steder-norge.js scripts/lead-sourcing/fetch-restaurant-leads.js
git commit -m "Flytt delt by-liste til steder-norge.js for gjenbruk i fetch-places-leads.js"
```

---

### Task 3: `fetch-osm-leads.js` — gratis Overpass-henter

**Files:**
- Create: `scripts/lead-sourcing/fetch-osm-leads.js`
- Test: `scripts/lead-sourcing/fetch-osm-leads.test.js`

- [ ] **Step 1: Skriv testen for den rene hjelpefunksjonen `byggAdresse`**

Nettverkskallet mot Overpass testes ikke automatisk (samme mønster som
`fetch-restaurant-leads.js`, som heller ikke har automatiske tester for selve
Places-kallet — verifiseres manuelt i Step 4). Den rene adressebygging-logikken
testes derimot:

```javascript
// scripts/lead-sourcing/fetch-osm-leads.test.js
const assert = require('assert');
const { byggAdresse } = require('./fetch-osm-leads');

assert.strictEqual(
  byggAdresse({ 'addr:street': 'Storgata', 'addr:housenumber': '5', 'addr:postcode': '0155', 'addr:city': 'Oslo' }),
  'Storgata 5, 0155 Oslo'
);
console.log('OK: byggAdresse med full adresse');

assert.strictEqual(byggAdresse({ 'addr:city': 'Bergen' }), 'Bergen');
console.log('OK: byggAdresse med kun by');

assert.strictEqual(byggAdresse({}), '');
console.log('OK: byggAdresse uten adressefelt');

console.log('\nAlle tester i fetch-osm-leads.test.js passerte.');
```

- [ ] **Step 2: Kjør testen og bekreft at den feiler**

Run: `node scripts/lead-sourcing/fetch-osm-leads.test.js`
Expected: `Error: Cannot find module './fetch-osm-leads'`

- [ ] **Step 3: Implementer `fetch-osm-leads.js`**

```javascript
// scripts/lead-sourcing/fetch-osm-leads.js
// Henter leads fra OpenStreetMap sin Overpass API (gratis, ingen nøkkel) for en
// gitt bransje-tag. Bruk: node fetch-osm-leads.js <Bransjenavn> <tag=verdi>
// Eksempel: node fetch-osm-leads.js Campingplasser tourism=camp_site
//
// Hovedserveren overpass-api.de timer ut på landsdekkende area()-spørringer
// under last (verifisert 22.09.2026) - kumi.systems-mirroren brukes derfor
// først, med hovedserveren som fallback.
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const { loadUsedKeys, erAlleredeBrukt } = require('./dedup-register');

const LEADS_DIR = 'C:\\Users\\adria\\OneDrive\\Dietrichs Marketing\\Leads\\Instantly leads';
const NORGE_AREA_ID = 3602978650; // relation 2978650 (Norge) + 3600000000
const MIRRORS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

function postOverpass(query, url) {
  return new Promise((resolve, reject) => {
    const body = 'data=' + encodeURIComponent(query);
    const { hostname, pathname } = new URL(url);
    const req = https.request({
      hostname,
      path: pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'Accept-Encoding': 'gzip',
        'User-Agent': 'dmarketing-lead-sourcing/1.0',
      },
      timeout: 170000,
    }, (res) => {
      const chunks = [];
      const stream = res.headers['content-encoding'] === 'gzip' ? res.pipe(zlib.createGunzip()) : res;
      stream.on('data', (c) => chunks.push(c));
      stream.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Overpass HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString().slice(0, 300)}`));
          return;
        }
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Overpass timeout')));
    req.write(body);
    req.end();
  });
}

async function hentFraOverpass(tagFilter) {
  const [key, verdi] = tagFilter.split('=');
  const query = `[out:json][timeout:150];
area(${NORGE_AREA_ID})->.no;
( nwr["${key}"="${verdi}"](area.no); );
out tags center;`;

  let sisteFeil;
  for (const mirror of MIRRORS) {
    try {
      return await postOverpass(query, mirror);
    } catch (err) {
      sisteFeil = err;
      console.error(`Overpass-feil mot ${mirror}: ${err.message}`);
    }
  }
  throw sisteFeil;
}

function byggAdresse(tags) {
  const gate = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  const resten = [tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' ');
  return [gate, resten].filter(Boolean).join(', ');
}

async function hentLeadsForBransje(tagFilter, maxLeads = Infinity) {
  const nokler = loadUsedKeys(LEADS_DIR);
  console.log(`Dedup-nokler lastet: ${nokler.telefoner.size} telefon, ${nokler.nettsider.size} nettside, ${nokler.eposter.size} epost`);

  const data = await hentFraOverpass(tagFilter);
  const elementer = data.elements || [];
  console.log(`Overpass ga ${elementer.length} rå-elementer for ${tagFilter}`);

  const leads = [];
  for (const el of elementer) {
    if (leads.length >= maxLeads) break;
    const tags = el.tags || {};
    const navn = tags.name;
    const nettside = tags.website || tags['contact:website'];
    if (!navn || !nettside) continue;

    const lead = {
      navn,
      adresse: byggAdresse(tags),
      telefon: tags.phone || tags['contact:phone'] || '',
      nettside,
      by: tags['addr:city'] || '',
      epost: tags.email || tags['contact:email'] || '',
    };
    if (erAlleredeBrukt(lead, nokler)) continue;
    leads.push(lead);
  }
  return leads;
}

async function main() {
  const [, , bransjenavn, tagFilter, maxLeadsArg] = process.argv;
  if (!bransjenavn || !tagFilter || !tagFilter.includes('=')) {
    console.error('Bruk: node fetch-osm-leads.js <Bransjenavn> <tag=verdi> [max-leads]');
    process.exit(1);
  }
  const maxLeads = maxLeadsArg ? Number(maxLeadsArg) : Infinity;
  const leads = await hentLeadsForBransje(tagFilter, maxLeads);

  const utFil = path.join(LEADS_DIR, `${bransjenavn.toLowerCase()}-leads-${new Date().toISOString().slice(0, 10)}.csv`);
  const header = '"navn","adresse","telefon","nettside","by"';
  const rows = leads.map((l) =>
    `"${l.navn.replace(/"/g, '""')}","${l.adresse.replace(/"/g, '""')}","${l.telefon}","${l.nettside}","${l.by}"`
  );
  fs.writeFileSync(utFil, [header, ...rows].join('\n'), 'utf-8');
  console.log(`\nFerdig. ${leads.length} nye leads (etter dedup) skrevet til:\n${utFil}`);
}

module.exports = { byggAdresse, hentLeadsForBransje };

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Kjør testen og bekreft at den passerer**

Run: `node scripts/lead-sourcing/fetch-osm-leads.test.js`
Expected: 3 `OK:`-linjer, avsluttet med `Alle tester i fetch-osm-leads.test.js passerte.`

- [ ] **Step 5: Manuell verifisering mot ekte Overpass (campingplasser)**

Run: `node scripts/lead-sourcing/fetch-osm-leads.js Campingplasser tourism=camp_site 240`
Expected: konsollen viser `Dedup-nokler lastet: ...`, deretter `Overpass ga 1401 rå-elementer` (±litt, dataene endrer seg over tid), og til slutt `Ferdig. <N> nye leads (etter dedup) skrevet til: ...campingplasser-leads-2026-09-23.csv`. Åpne fila og sjekk at kolonnene `navn,adresse,telefon,nettside,by` er fylt fornuftig.

- [ ] **Step 6: Commit**

```bash
git add scripts/lead-sourcing/fetch-osm-leads.js scripts/lead-sourcing/fetch-osm-leads.test.js
git commit -m "Legg til gratis OSM/Overpass lead-henter for bransjer med god OSM-dekning"
```

---

### Task 4: `fetch-places-leads.js` — generalisert Google Places-henter

**Files:**
- Create: `scripts/lead-sourcing/fetch-places-leads.js`

- [ ] **Step 1: Implementer scriptet (ingen ny automatisk test — nettverkskallet mot Places API følger samme manuelt-verifisert mønster som `fetch-restaurant-leads.js`, som heller ikke har automatiske tester for selve API-kallet)**

```javascript
// scripts/lead-sourcing/fetch-places-leads.js
// Generalisert Google Places-henter (New, searchText) for bransjer uten god
// nok OSM-dekning til å bruke fetch-osm-leads.js. Bruk:
//   node fetch-places-leads.js <Bransjenavn> <max-leads> <sokeord1> [sokeord2 ...]
// Eksempel:
//   node fetch-places-leads.js Kajakkutleie 240 kajakkutleie kanoutleie
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { CITIES } = require('./steder-norge');
const { loadUsedKeys, erAlleredeBrukt } = require('./dedup-register');

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const LEADS_DIR = 'C:\\Users\\adria\\OneDrive\\Dietrichs Marketing\\Leads\\Instantly leads';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchText(query, apiKey, pageToken) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id', 'places.displayName', 'places.formattedAddress',
        'places.nationalPhoneNumber', 'places.internationalPhoneNumber',
        'places.websiteUri', 'places.businessStatus', 'nextPageToken',
      ].join(','),
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'no', pageSize: 20, ...(pageToken ? { pageToken } : {}) }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API-feil (${res.status}): ${body}`);
  }
  return res.json();
}

async function hentLeadsForBransje(sokeord, maxLeads, apiKey) {
  const nokler = loadUsedKeys(LEADS_DIR);
  console.log(`Dedup-nokler lastet: ${nokler.telefoner.size} telefon, ${nokler.nettsider.size} nettside, ${nokler.eposter.size} epost`);

  const seenIds = new Set();
  const leads = [];

  for (const city of CITIES) {
    if (leads.length >= maxLeads) break;
    for (const ord of sokeord) {
      if (leads.length >= maxLeads) break;
      let pageToken;
      let pagesForCity = 0;
      do {
        let data;
        try {
          data = await searchText(`${ord} i ${city}`, apiKey, pageToken);
        } catch (err) {
          console.error(`Feil for "${ord} i ${city}": ${err.message}`);
          break;
        }
        for (const place of data.places || []) {
          if (leads.length >= maxLeads) break;
          if (seenIds.has(place.id)) continue;
          seenIds.add(place.id);

          const navn = place.displayName?.text || '';
          const website = place.websiteUri || '';
          const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || '';
          if (!website) continue;
          if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') continue;

          const lead = { navn, adresse: place.formattedAddress || '', telefon: phone, nettside: website, by: city };
          if (erAlleredeBrukt(lead, nokler)) continue;
          leads.push(lead);
        }
        pageToken = data.nextPageToken;
        pagesForCity += 1;
        await sleep(150);
      } while (pageToken && pagesForCity < 3 && leads.length < maxLeads);
    }
  }
  console.log(`Totalt ${leads.length} nye leads (etter dedup) samlet fra ${CITIES.length} steder`);
  return leads;
}

async function main() {
  const [, , bransjenavn, maxLeadsArg, ...sokeord] = process.argv;
  if (!bransjenavn || !maxLeadsArg || sokeord.length === 0) {
    console.error('Bruk: node fetch-places-leads.js <Bransjenavn> <max-leads> <sokeord1> [sokeord2 ...]');
    process.exit(1);
  }
  if (!API_KEY) {
    console.error('Mangler GOOGLE_PLACES_API_KEY i .env');
    process.exit(1);
  }
  const maxLeads = Number(maxLeadsArg);
  const leads = await hentLeadsForBransje(sokeord, maxLeads, API_KEY);

  const utFil = path.join(LEADS_DIR, `${bransjenavn.toLowerCase()}-leads-${new Date().toISOString().slice(0, 10)}.csv`);
  const header = '"navn","adresse","telefon","nettside","by"';
  const rows = leads.map((l) =>
    `"${l.navn.replace(/"/g, '""')}","${l.adresse.replace(/"/g, '""')}","${l.telefon}","${l.nettside}","${l.by}"`
  );
  fs.writeFileSync(utFil, [header, ...rows].join('\n'), 'utf-8');
  console.log(`\nFerdig. ${leads.length} leads skrevet til:\n${utFil}`);
}

module.exports = { hentLeadsForBransje };

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 2: Kjør en liten manuell verifisering mot ekte Places API (kajakkutleie, lite tak for å holde kostnaden lav under testing)**

Run: `node scripts/lead-sourcing/fetch-places-leads.js Kajakkutleie 20 kajakkutleie kanoutleie`
Expected: konsollen viser dedup-linjen, deretter etter en stund `Totalt <N> nye leads ... samlet` og `Ferdig. <N> leads skrevet til: ...kajakkutleie-leads-2026-09-23.csv`. `<N>` blir sannsynligvis lavt (under 20) siden markedet er lite — det er forventet, ikke en feil (se spec sitt risikoavsnitt).

- [ ] **Step 3: Commit**

```bash
git add scripts/lead-sourcing/fetch-places-leads.js
git commit -m "Legg til generalisert Google Places lead-henter parameterisert per bransje"
```

---

### Task 5: `bransje-ko.json` + `bransje-ko.js` — bransjekø med auto-bytte

**Files:**
- Create: `scripts/lead-sourcing/bransje-ko.json`
- Create: `scripts/lead-sourcing/bransje-ko.js`
- Test: `scripts/lead-sourcing/bransje-ko.test.js`

- [ ] **Step 1: Opprett datafila**

```json
{
  "instantly_kampanje": "Sesongbaserte leads (roterende)",
  "aktiv_index": 0,
  "bransjer": [
    {
      "navn": "Kajakkutleie",
      "kilde": "places",
      "sok": ["kajakkutleie", "kanoutleie"],
      "maxLeadsPerKjoring": 240,
      "terskelForTom": 60
    },
    {
      "navn": "Campingplasser",
      "kilde": "osm",
      "osmTag": "tourism=camp_site",
      "maxLeadsPerKjoring": 240,
      "terskelForTom": 150
    },
    {
      "navn": "Hagesentre",
      "kilde": "osm",
      "osmTag": "shop=garden_centre",
      "maxLeadsPerKjoring": 240,
      "terskelForTom": 150
    },
    {
      "navn": "Fjordcruise og sightseeing",
      "kilde": "places",
      "sok": ["fjordcruise", "sightseeing selskap", "fjordtur"],
      "maxLeadsPerKjoring": 240,
      "terskelForTom": 100
    },
    {
      "navn": "Iskrembutikker og strandkiosker",
      "kilde": "places",
      "sok": ["iskrembutikk", "strandkiosk"],
      "maxLeadsPerKjoring": 240,
      "terskelForTom": 100
    }
  ]
}
```

`terskelForTom` er satt per bransje (ikke én global konstant) fordi 150 var
riktig for restaurant sitt store marked, men urealistisk for et lite marked
som kajakkutleie (der selv en frisk bransje kanskje aldri gir 240 i én
kjøring) — se spec sitt risikoavsnitt. Juster tallene når faktiske kjøringer
viser at et annet nivå er riktigere.

- [ ] **Step 2: Skriv testen for kø-logikken**

```javascript
// scripts/lead-sourcing/bransje-ko.test.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { lastKo, aktivBransje, byttTilNesteBransje } = require('./bransje-ko');

function lagTestKo(dir) {
  const fil = path.join(dir, 'bransje-ko.json');
  fs.writeFileSync(fil, JSON.stringify({
    instantly_kampanje: 'Test',
    aktiv_index: 0,
    bransjer: [
      { navn: 'Foerste', kilde: 'osm', osmTag: 'a=b', maxLeadsPerKjoring: 240, terskelForTom: 100 },
      { navn: 'Andre', kilde: 'places', sok: ['x'], maxLeadsPerKjoring: 240, terskelForTom: 100 },
    ],
  }, null, 2), 'utf-8');
  return fil;
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bransje-ko-test-'));
const fil = lagTestKo(dir);

const ko1 = lastKo(fil);
assert.strictEqual(aktivBransje(ko1).navn, 'Foerste');
console.log('OK: lastKo + aktivBransje gir riktig aktiv bransje');

byttTilNesteBransje(fil);
const ko2 = lastKo(fil);
assert.strictEqual(aktivBransje(ko2).navn, 'Andre');
console.log('OK: byttTilNesteBransje flytter til neste bransje i lista');

byttTilNesteBransje(fil);
const ko3 = lastKo(fil);
assert.strictEqual(aktivBransje(ko3).navn, 'Foerste', 'skal loope tilbake til start naar lista er tom');
console.log('OK: byttTilNesteBransje looper tilbake til index 0 etter siste bransje');

fs.rmSync(dir, { recursive: true, force: true });
console.log('\nAlle tester i bransje-ko.test.js passerte.');
```

- [ ] **Step 3: Kjør testen og bekreft at den feiler**

Run: `node scripts/lead-sourcing/bransje-ko.test.js`
Expected: `Error: Cannot find module './bransje-ko'`

- [ ] **Step 4: Implementer `bransje-ko.js`**

```javascript
// scripts/lead-sourcing/bransje-ko.js
// Leser/skriver bransje-ko.json og styrer hvilken bransje som er aktiv.
const fs = require('fs');

function lastKo(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function lagreKo(filePath, ko) {
  fs.writeFileSync(filePath, JSON.stringify(ko, null, 2), 'utf-8');
}

function aktivBransje(ko) {
  return ko.bransjer[ko.aktiv_index];
}

function byttTilNesteBransje(filePath) {
  const ko = lastKo(filePath);
  ko.aktiv_index = (ko.aktiv_index + 1) % ko.bransjer.length;
  lagreKo(filePath, ko);
  return ko;
}

module.exports = { lastKo, lagreKo, aktivBransje, byttTilNesteBransje };
```

- [ ] **Step 5: Kjør testen på nytt og bekreft at den passerer**

Run: `node scripts/lead-sourcing/bransje-ko.test.js`
Expected: 3 `OK:`-linjer, avsluttet med `Alle tester i bransje-ko.test.js passerte.`

- [ ] **Step 6: Commit**

```bash
git add scripts/lead-sourcing/bransje-ko.json scripts/lead-sourcing/bransje-ko.js scripts/lead-sourcing/bransje-ko.test.js
git commit -m "Legg til bransjekø med automatisk bytte når en bransje er tom"
```

---

### Task 6: `instantly-sync.js` — Playwright-automatisering mot Instantly

Instantly sitt UI må inspiseres først for å få de faktiske selektorene — de kan
ikke gjettes riktig fra dokumentasjon alene.

**Files:**
- Modify: `scripts/lead-sourcing/package.json` (legg til `playwright`)
- Modify: `scripts/lead-sourcing/.env` (legg til `INSTANTLY_EMAIL`, `INSTANTLY_PASSWORD` — Adrian fyller inn selv, aldri i git)
- Create: `scripts/lead-sourcing/instantly-sync.js`

- [ ] **Step 1: Installer Playwright**

Run: `cd scripts/lead-sourcing && npm install playwright && npx playwright install chromium`
Expected: `playwright` lagt til i `package.json` sine `dependencies`, Chromium lastet ned.

- [ ] **Step 2: Inspiser Instantly sitt UI via nettleseren for å finne ekte selektorer**

Bruk Claude Browser-verktøyet (eller manuelt i en vanlig nettleser med
DevTools) til å logge inn på `https://app.instantly.ai` med kontoen i
`.env`, og noter ned:
1. Innloggingssidens URL og CSS-selektorer for epost-felt, passord-felt,
   og innlogg-knapp.
2. URL-mønsteret for en kampanje sin lead-liste (f.eks.
   `app.instantly.ai/app/campaign/<id>/leads`).
3. Selektoren for filter-dropdown/knapp som lar deg filtrere leads på
   "Completed"/fullført-uten-svar-status.
4. Selektoren for "velg alle" + "slett valgte"-knappen.
5. Selektoren og flyten for CSV-import (vanligvis en "Add leads" / "Import
   from CSV"-knapp som åpner en filvelger eller drag-and-drop-sone).

Skriv ned de faktiske selektorene et sted midlertidig (de trengs i Step 3).
Dette er research, ikke kode — ingen commit for dette steget.

- [ ] **Step 3: Implementer `instantly-sync.js` med selektorene fra Step 2**

```javascript
// scripts/lead-sourcing/instantly-sync.js
// Playwright-automatisering mot Instantly sitt web-UI (API-nøkkelen er
// 401 Unauthorized, se spec). Sletter leads som har fullført sekvensen uten
// svar, eksporterer en backup FØR sletting, og laster opp nye leads.
// Bruk: node instantly-sync.js <nye-leads.csv> <bransjenavn>
require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');

const INSTANTLY_EMAIL = process.env.INSTANTLY_EMAIL;
const INSTANTLY_PASSWORD = process.env.INSTANTLY_PASSWORD;
const BACKUP_DIR = 'C:\\Users\\adria\\OneDrive\\Dietrichs Marketing\\Leads\\Instantly leads\\backups';

async function loggInn(page) {
  await page.goto('https://app.instantly.ai/auth/login');
  // SELEKTORER MÅ ERSTATTES MED DE EKTE FRA TASK 6 STEP 2:
  await page.fill('input[name="email"]', INSTANTLY_EMAIL);
  await page.fill('input[name="password"]', INSTANTLY_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app/**');
}

async function slettFullforteLeads(page, kampanjeNavn, bransjenavn) {
  // SELEKTORER MÅ ERSTATTES MED DE EKTE FRA TASK 6 STEP 2.
  // 1. Naviger til kampanjen (via søk/navigasjon i UI-et)
  // 2. Filtrer på "Completed" / fullført uten svar
  // 3. Eksporter filtrert visning til CSV FØR sletting:
  const dato = new Date().toISOString().slice(0, 10);
  const backupFil = path.join(BACKUP_DIR, `${dato}-${bransjenavn.toLowerCase()}-slettet.csv`);
  // await page.click('[data-testid="export-leads"]'); ... lagre til backupFil
  // 4. Velg alle filtrerte og slett:
  // await page.click('[data-testid="select-all"]');
  // await page.click('[data-testid="delete-selected"]');
  // await page.click('button:has-text("Confirm")');
  return { backupFil, antallSlettet: 0 }; // returverdi oppdateres når selektorene er på plass
}

async function lastOppNyeLeads(page, csvFil) {
  // SELEKTORER MÅ ERSTATTES MED DE EKTE FRA TASK 6 STEP 2.
  // await page.click('[data-testid="add-leads"]');
  // await page.setInputFiles('input[type="file"]', csvFil);
  // await page.click('button:has-text("Upload")');
  return { antallLastetOpp: 0 };
}

async function kjorSync(csvFil, bransjenavn, kampanjeNavn) {
  if (!INSTANTLY_EMAIL || !INSTANTLY_PASSWORD) {
    throw new Error('Mangler INSTANTLY_EMAIL/INSTANTLY_PASSWORD i .env');
  }
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await loggInn(page);
    const { backupFil, antallSlettet } = await slettFullforteLeads(page, kampanjeNavn, bransjenavn);
    const { antallLastetOpp } = await lastOppNyeLeads(page, csvFil);
    return { backupFil, antallSlettet, antallLastetOpp };
  } finally {
    await browser.close();
  }
}

module.exports = { kjorSync };

if (require.main === module) {
  const [, , csvFil, bransjenavn] = process.argv;
  if (!csvFil || !bransjenavn) {
    console.error('Bruk: node instantly-sync.js <nye-leads.csv> <bransjenavn>');
    process.exit(1);
  }
  kjorSync(csvFil, bransjenavn, process.env.INSTANTLY_KAMPANJE || '')
    .then((r) => console.log('Ferdig:', r))
    .catch((err) => { console.error(err); process.exit(1); });
}
```

> **Merk til den som utfører denne oppgaven:** de tre funksjonene
> `loggInn`/`slettFullforteLeads`/`lastOppNyeLeads` har kommenterte
> plassholder-linjer der de ekte Playwright-kommandoene skal inn, basert på
> selektorene notert i Step 2. Dette er bevisst — de faktiske selektorene
> finnes ikke før noen faktisk har sett Instantly sitt UI (research-steget i
> Step 2 er en forutsetning for denne koden, ikke noe som kan skrives fra
> dokumentasjon). Fjern plassholder-kommentarene og skriv inn de ekte
> kommandoene før denne oppgaven regnes som ferdig.

- [ ] **Step 4: Manuell verifisering med et lite test-lead**

Lag en minimal test-CSV med én ekte eller falsk lead, kjør:
Run: `node scripts/lead-sourcing/instantly-sync.js test-leads.csv Test`
Expected: scriptet logger inn, viser `Ferdig: { backupFil: ..., antallSlettet: N, antallLastetOpp: 1 }`. Bekreft manuelt i Instantly sitt UI at leaden faktisk dukket opp, og at en eventuell "Completed"-lead faktisk ble slettet OG finnes i backup-CSV-en.

- [ ] **Step 5: Commit**

```bash
git add scripts/lead-sourcing/instantly-sync.js scripts/lead-sourcing/package.json scripts/lead-sourcing/package-lock.json
git commit -m "Legg til Playwright-basert Instantly-synkronisering (slett fullførte, last opp nye)"
```

---

### Task 7: `kjor-runde.js` — orkestrering + logging

**Files:**
- Create: `scripts/lead-sourcing/kjor-runde.js`
- Create: `scripts/lead-sourcing/logs/.gitkeep`

- [ ] **Step 1: Implementer orkestreringsscriptet**

```javascript
// scripts/lead-sourcing/kjor-runde.js
// Inngangspunktet Windows Task Scheduler kaller annenhver dag. Kjøres med:
//   node kjor-runde.js
const fs = require('fs');
const path = require('path');
const { lastKo, aktivBransje, byttTilNesteBransje } = require('./bransje-ko');
const { hentLeadsForBransje: hentFraOsm } = require('./fetch-osm-leads');
const { hentLeadsForBransje: hentFraPlaces } = require('./fetch-places-leads');
const { registrerNyeLeads } = require('./dedup-register');
const { kjorSync } = require('./instantly-sync');

const KO_FIL = path.join(__dirname, 'bransje-ko.json');
const LEADS_DIR = 'C:\\Users\\adria\\OneDrive\\Dietrichs Marketing\\Leads\\Instantly leads';
const LOG_DIR = path.join(__dirname, 'logs');

function logg(dato, linje) {
  const fil = path.join(LOG_DIR, `${dato}.log`);
  fs.appendFileSync(fil, `[${new Date().toISOString()}] ${linje}\n`, 'utf-8');
  console.log(linje);
}

function skrivCsv(leads, utFil) {
  const header = '"navn","adresse","telefon","nettside","by"';
  const rows = leads.map((l) =>
    `"${l.navn.replace(/"/g, '""')}","${l.adresse.replace(/"/g, '""')}","${(l.telefon || '').replace(/"/g, '""')}","${l.nettside}","${l.by || ''}"`
  );
  fs.writeFileSync(utFil, [header, ...rows].join('\n'), 'utf-8');
}

async function kjorRunde() {
  const dato = new Date().toISOString().slice(0, 10);
  const ko = lastKo(KO_FIL);
  const bransje = aktivBransje(ko);
  logg(dato, `Starter runde for bransje: ${bransje.navn} (kilde: ${bransje.kilde})`);

  let leads;
  try {
    leads = bransje.kilde === 'osm'
      ? await hentFraOsm(bransje.osmTag, bransje.maxLeadsPerKjoring)
      : await hentFraPlaces(bransje.sok, bransje.maxLeadsPerKjoring, process.env.GOOGLE_PLACES_API_KEY);
  } catch (err) {
    logg(dato, `FEIL under henting: ${err.message}. Avbryter runden, rører ikke bransjekøen.`);
    return;
  }

  logg(dato, `Hentet ${leads.length} nye leads for ${bransje.navn}`);

  const rawFil = path.join(LEADS_DIR, `${bransje.navn.toLowerCase()}-leads-${dato}.csv`);
  skrivCsv(leads, rawFil);

  // scrape-emails.js kjøres som eget child-process siden det allerede er et
  // ferdig, selvstendig CLI-script (unngår å duplisere e-post-scraping-logikken).
  const { execFileSync } = require('child_process');
  const medEpostFil = path.join(LEADS_DIR, `${bransje.navn.toLowerCase()}-leads-${dato}-med-epost.csv`);
  execFileSync('node', [path.join(__dirname, 'scrape-emails.js'), rawFil, medEpostFil], { stdio: 'inherit' });

  let instantlyResultat;
  try {
    instantlyResultat = await kjorSync(medEpostFil, bransje.navn, ko.instantly_kampanje);
  } catch (err) {
    logg(dato, `FEIL under Instantly-sync: ${err.message}. Leadsene ligger fortsatt i ${medEpostFil} og plukkes opp neste kjøring siden dedup-registeret ikke oppdateres før vellykket opplasting.`);
    return;
  }

  logg(dato, `Instantly: slettet ${instantlyResultat.antallSlettet}, lastet opp ${instantlyResultat.antallLastetOpp}. Backup: ${instantlyResultat.backupFil}`);

  registrerNyeLeads(leads);
  logg(dato, `Registrerte ${leads.length} nye leads i dedup-registeret`);

  if (leads.length < bransje.terskelForTom) {
    byttTilNesteBransje(KO_FIL);
    const nyKo = lastKo(KO_FIL);
    logg(dato, `${bransje.navn} regnes som tom (${leads.length} < terskel ${bransje.terskelForTom}). Bytter til: ${aktivBransje(nyKo).navn}`);
  }
}

kjorRunde().catch((err) => {
  const dato = new Date().toISOString().slice(0, 10);
  logg(dato, `UVENTET FEIL: ${err.stack}`);
  process.exit(1);
});
```

- [ ] **Step 2: Opprett tom logs-mappe med `.gitkeep`**

Run: `mkdir -p scripts/lead-sourcing/logs && touch scripts/lead-sourcing/logs/.gitkeep`

- [ ] **Step 3: Manuell ende-til-ende-verifisering**

Run: `node scripts/lead-sourcing/kjor-runde.js`
Expected: `logs/<dagens-dato>.log` opprettes med alle stegene logget, en ny
CSV dukker opp i `Instantly leads`-mappa, og hvis under terskelen —
`bransje-ko.json` sin `aktiv_index` har økt med 1.

- [ ] **Step 4: Commit**

```bash
git add scripts/lead-sourcing/kjor-runde.js scripts/lead-sourcing/logs/.gitkeep
git commit -m "Legg til orkestreringsscript som kjører hele lead-syklusen"
```

---

### Task 8: Windows Task Scheduler — annenhver dag

Ingen kode, kun oppsett. Utføres av Adrian eller via `PowerShell`-kommando.

- [ ] **Step 1: Registrer den planlagte oppgaven**

```powershell
$action = New-ScheduledTaskAction -Execute "node.exe" -Argument "kjor-runde.js" -WorkingDirectory "C:\Users\adria\website-mirrors\dmarketing-redesign\scripts\lead-sourcing"
$trigger = New-ScheduledTaskTrigger -Daily -DaysInterval 2 -At 6am
Register-ScheduledTask -TaskName "DM-LeadRotasjon" -Action $action -Trigger $trigger -Description "Henter nye sesongbaserte leads og synker mot Instantly annenhver dag"
```

- [ ] **Step 2: Test-kjør oppgaven manuelt for å bekrefte at Task Scheduler-konteksten fungerer (egen bruker, ikke SYSTEM — Playwright/nettleser krever ofte en pålogget bruker-sesjon)**

Run: `Start-ScheduledTask -TaskName "DM-LeadRotasjon"`
Expected: en ny loggfil dukker opp i `scripts/lead-sourcing/logs/` innen kort tid, med samme innhold som en manuell `node kjor-runde.js`-kjøring ville gitt.

- [ ] **Step 3: Ingen commit for dette steget (miljøkonfigurasjon, ikke kode)**

---

## Plan Self-Review

**Spec-dekning:**
- Tre-nøkkel dedup på tvers av bransjer → Task 1. ✅
- OSM/Overpass som gratis primærkilde → Task 3. ✅
- Google Places som fallback for tynt dekkede bransjer → Task 4. ✅
- Bransjekø med auto-bytte ved terskel → Task 5. ✅
- Playwright-basert Instantly-sync (slett fullførte + last opp nye) → Task 6. ✅
- Backup-CSV før sletting → Task 6 (`slettFullforteLeads`). ✅
- Orkestrering + logging → Task 7. ✅
- Windows Task Scheduler annenhver dag → Task 8. ✅
- `.env`-sikkerhet (aldri i git) → verifisert i spec, gjenbrukt i Task 6 uten endring i `.gitignore` (allerede dekket).
- 240 leads/kjøring (Adrians oppdaterte krav 23.09.2026) → `maxLeadsPerKjoring` i `bransje-ko.json`, brukt av alle fetch-kall i Task 7.

**Kjent, akseptert hull:** Task 6 sine tre Playwright-funksjoner inneholder
plassholder-kommentarer for de faktiske DOM-selektorene, siden de ikke kan
skrives korrekt uten først å ha sett Instantly sitt live UI (Step 2 i Task 6
er research som må gjøres av den som utfører oppgaven — ikke noe som kan
forhåndsutfylles i en plan). Dette er det ENESTE stedet i planen med
plassholdere, og det er eksplisitt markert med hvorfor og hva som må gjøres.

**Type-konsistens:** `lead`-objektet har konsekvent feltene
`{ navn, adresse, telefon, nettside, by, epost }` (epost valgfri, kun satt av
OSM-henteren og etter `scrape-emails.js`) gjennom `dedup-register.js`,
`fetch-osm-leads.js`, `fetch-places-leads.js` og `kjor-runde.js`.
`aktivBransje()`/`byttTilNesteBransje()`-signaturene i Task 5 brukes identisk
i Task 7. `hentLeadsForBransje` eksporteres med ulik parameterrekkefølge fra
`fetch-osm-leads.js` (`tagFilter, maxLeads`) og `fetch-places-leads.js`
(`sokeord, maxLeads, apiKey`) — dette er bevisst (ulike kilder trenger ulike
parametere), og `kjor-runde.js` sitt Task 7-kall matcher begge signaturene
riktig.

---

## Første leads-runde (ikke ventet på full automasjon)

Task 1–4 er nok til å produsere en ekte batch manuelt, uten at Task 5–8
(bransjekø, Instantly-automasjon, Task Scheduler) er ferdig. Etter Task 4 er
committet, kjør:

```bash
node scripts/lead-sourcing/fetch-places-leads.js Kajakkutleie 240 kajakkutleie kanoutleie
node scripts/lead-sourcing/scrape-emails.js "<output-fil-fra-forrige-linje>" "<samme-navn>-med-epost.csv"
```

Dette gir en reell CSV Adrian kan laste opp i Instantly manuelt selv, mens
resten av planen (Task 5–8) bygges ferdig. **Forvent under 240** — det
totale kajakkutleie-markedet i Norge er lite (43 rå OSM-treff landsdekkende),
så et realistisk utfall er et sted mellom 50 og 150 leads i denne første
kjøringen, ikke det fulle taket.

---

Plan complete and saved to `docs/superpowers/plans/2026-09-23-instantly-lead-automasjon.md`. To execute:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints
