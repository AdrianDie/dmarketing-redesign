# Tidslinje-rename og "fra andre"-bookinger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename "Det som skjedde mens du ringte" til "Tidslinje" på Min uke, og gi Adrian en read-only "Fra andre"-fane på Bookinger-siden som viser bookinger andre selgere har sendt inn (ekskludert hans egne).

**Architecture:** Ren frontend-tekstendring (Task 1). Backend-utvidelse av eksisterende `alleBookinger()` i Cloudflare Worker med valgfritt ekskluderingsfilter, bak samme admin-sperre som i dag (Task 2, med e2e-test mot ekte D1). Ny fane i `selger/bookinger/index.html` som gjenbruker eksisterende kortmønster og 5-stegs statusvisning (Task 3-4). Admin-siden (`selger/admin/index.html`) og dens `alle_bookinger`-visning røres ikke.

**Tech Stack:** Vanilla HTML/CSS/JS (Tailwind CDN), Cloudflare Worker + D1 (SQLite), `wrangler` CLI. Ingen build-steg.

**Spec:** `docs/superpowers/specs/2026-08-25-tidslinje-og-andre-bookinger-design.md`

---

### Task 1: Rename tidslinje-overskriften

**Files:**
- Modify: `selger/index.html:168`

- [ ] **Step 1: Endre overskriftsteksten**

I `selger/index.html`, finn:
```html
    <h2 id="kvit-h" class="font-display font-bold text-[13px] uppercase tracking-[0.1em] text-mute mb-3">
      Det som skjedde mens du ringte
    </h2>
```
Endre til:
```html
    <h2 id="kvit-h" class="font-display font-bold text-[13px] uppercase tracking-[0.1em] text-mute mb-3">
      Tidslinje
    </h2>
```
(Kun teksten mellom tag-ene endres. `id="kvit-h"`, `<section id="kvittering">` og `#kvit-liste` beholdes uendret — de er interne kroker, ikke synlig tekst.)

- [ ] **Step 2: Verifiser**

Run: `grep -rn "Det som skjedde mens du ringte" selger/`
Expected: ingen treff.

Run: `grep -n "Tidslinje" selger/index.html`
Expected: `168:      Tidslinje`

- [ ] **Step 3: Commit**

```bash
git add selger/index.html
git commit -m "Gi tidslinje-seksjonen på Min uke et generelt navn"
```

---

### Task 2: Backend — `andre_bookinger`-handling + e2e-test

**Files:**
- Modify: `workers/selger/index.js:61-62` (admin-lista), `:66-73` (dispatch), `:251-264` (`alleBookinger`)
- Create: `workers/selger/tests/andre-bookinger-e2e.mjs`

- [ ] **Step 1: Skriv den feilende e2e-testen**

Create `workers/selger/tests/andre-bookinger-e2e.mjs`:
```js
/**
 * Ende-til-ende-test av "andre_bookinger"-handlingen mot den EKTE Worker-en og D1.
 *
 * Kjor fra workers/selger:  node tests/andre-bookinger-e2e.mjs
 *
 * Lager to midlertidige testselgere (en admin som "ringer inn", en "annen"),
 * setter inn en booking pa hver, og sjekker at andre_bookinger kun viser den
 * andre selgerens booking mens alle_bookinger fortsatt viser begge. Rydder
 * alltid opp til slutt, ogsaa om en test feiler. Rorer ingen ekte selgere.
 */
import { execSync } from 'node:child_process';

const WORKER = 'https://selger-worker.dietrichs-mkt.workers.dev';
const CALLER_EPOST = 'e2e-andre-caller@test.no';
const CALLER_TOKEN = 'e2eandrecallertoken1234567890';
const ANNEN_EPOST = 'e2e-andre-other@test.no';
const ANNEN_TOKEN = 'e2eandreothertoken1234567890';
const ANNEN_NAVN = 'E2E Annen';

let feil = 0, kjort = 0;

function d1(sql) {
  execSync(`npx wrangler d1 execute dm-salg --remote --command "${sql.replace(/"/g, '\\"')}"`,
    { stdio: 'pipe' });
}

async function kall(handling, token) {
  const r = await fetch(WORKER, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handling, token }),
  });
  return r.json();
}

function sjekk(navn, faktisk, forventet) {
  kjort++;
  const ok = JSON.stringify(faktisk) === JSON.stringify(forventet);
  if (ok) {
    console.log(`  OK   ${navn}: ${JSON.stringify(faktisk)}`);
  } else {
    feil++;
    console.log(`  FEIL ${navn}: fikk ${JSON.stringify(faktisk)}, forventet ${JSON.stringify(forventet)}`);
  }
}

function rydd() {
  d1(`DELETE FROM bookinger WHERE selger IN ('${CALLER_EPOST}','${ANNEN_EPOST}')`);
  d1(`DELETE FROM selgere WHERE epost IN ('${CALLER_EPOST}','${ANNEN_EPOST}')`);
}

async function run() {
  rydd();
  d1(`INSERT INTO selgere (epost,navn,token,aktiv,admin) VALUES ('${CALLER_EPOST}','E2E Caller','${CALLER_TOKEN}','ja',1)`);
  d1(`INSERT INTO selgere (epost,navn,token,aktiv) VALUES ('${ANNEN_EPOST}','${ANNEN_NAVN}','${ANNEN_TOKEN}','ja')`);
  d1(`INSERT INTO bookinger (dato,selger,bedrift,status) VALUES ('2026-08-25','${CALLER_EPOST}','CALLER FIRMA AS','sendt')`);
  d1(`INSERT INTO bookinger (dato,selger,bedrift,status) VALUES ('2026-08-25','${ANNEN_EPOST}','ANNEN FIRMA AS','sendt')`);

  console.log('1. andre_bookinger ekskluderer egne bookinger');
  const andre = await kall('andre_bookinger', CALLER_TOKEN);
  const andreNavn = (andre || []).map(r => r.bedrift).sort();
  sjekk('inneholder kun den andre selgerens booking', andreNavn, ['ANNEN FIRMA AS']);
  const rad = (andre || [])[0] || {};
  sjekk('selgernavn er mappet til visningsnavn', rad.selger, ANNEN_NAVN);

  console.log('2. alle_bookinger viser fortsatt begge (regresjon)');
  const alle = await kall('alle_bookinger', CALLER_TOKEN);
  const alleNavn = (alle || []).map(r => r.bedrift).sort();
  sjekk('inneholder begge bookingene', alleNavn, ['ANNEN FIRMA AS', 'CALLER FIRMA AS']);

  console.log('3. ikke-admin faar avvist andre_bookinger');
  const avvist = await kall('andre_bookinger', ANNEN_TOKEN);
  sjekk('ikke_admin-feil', avvist.error, 'ikke_admin');
}

run()
  .catch(e => { console.error('Testen krasjet:', e.message); feil++; })
  .finally(() => {
    try { rydd(); } catch (e) { console.error('Opprydding feilet:', e.message); }
    console.log(`\n${kjort - feil}/${kjort} sjekker passerte.`);
    process.exit(feil ? 1 : 0);
  });
```

- [ ] **Step 2: Kjør testen mot i dag deployet kode, verifiser at den feiler**

Run: `cd workers/selger && node tests/andre-bookinger-e2e.mjs`
Expected: krasjer med noe sånt som `Testen krasjet: andre.map is not a function` (eller `Cannot read properties of undefined`) — fordi `andre_bookinger` ikke finnes ennå, så `kall()` returnerer `{error:'ukjent_handling'}` i stedet for en liste. Dette bekrefter at testen faktisk tester noe som ikke er bygget ennå.

- [ ] **Step 3: Implementer backend-endringen**

I `workers/selger/index.js`, endre admin-lista (linje 61-62) fra:
```js
      if (['selgere', 'opprett_selger', 'sett_aktiv', 'sett_admin', 'oversikt',
           'alle_bookinger', 'sett_booking_status'].indexOf(h) !== -1) {
```
til:
```js
      if (['selgere', 'opprett_selger', 'sett_aktiv', 'sett_admin', 'oversikt',
           'alle_bookinger', 'andre_bookinger', 'sett_booking_status'].indexOf(h) !== -1) {
```

Legg til dispatch-linje (etter `else if (h === 'alle_bookinger') ar = await alleBookinger(env);` på linje 69):
```js
        else if (h === 'alle_bookinger') ar = await alleBookinger(env);
        else if (h === 'andre_bookinger') ar = await alleBookinger(env, selger.epost);
```

Endre `alleBookinger()` (linje 251-264) fra:
```js
async function alleBookinger(env) {
  const rows = (await env.DB.prepare(
    'SELECT id, dato, selger, bedrift, kontakt, epost, telefon, nettside, notat, status, jira_key FROM bookinger ORDER BY id DESC'
  ).all()).results;
  const navn = {};
  (await env.DB.prepare('SELECT epost, navn FROM selgere').all()).results
    .forEach(s => { navn[s.epost] = s.navn; });
  return rows.map(r => ({
    id: r.id, dato: r.dato, selger: navn[r.selger] || r.selger,
    bedrift: r.bedrift, kontakt: r.kontakt, epost: r.epost, telefon: String(r.telefon || ''),
    nettside: r.nettside, notat: r.notat || '', status: r.status || 'sendt',
    jira_key: r.jira_key || null,
  }));
}
```
til:
```js
async function alleBookinger(env, unntattSelger) {
  const where = unntattSelger ? 'WHERE selger != ?' : '';
  const stmt = env.DB.prepare(
    `SELECT id, dato, selger, bedrift, kontakt, epost, telefon, nettside, notat, status, jira_key
       FROM bookinger ${where} ORDER BY id DESC`
  );
  const rows = (await (unntattSelger ? stmt.bind(unntattSelger) : stmt).all()).results;
  const navn = {};
  (await env.DB.prepare('SELECT epost, navn FROM selgere').all()).results
    .forEach(s => { navn[s.epost] = s.navn; });
  return rows.map(r => ({
    id: r.id, dato: r.dato, selger: navn[r.selger] || r.selger,
    bedrift: r.bedrift, kontakt: r.kontakt, epost: r.epost, telefon: String(r.telefon || ''),
    nettside: r.nettside, notat: r.notat || '', status: r.status || 'sendt',
    jira_key: r.jira_key || null,
  }));
}
```

- [ ] **Step 4: Deploy**

Run: `cd workers/selger && npx wrangler deploy`
Expected: `Deployed selger-worker triggers ... https://selger-worker.dietrichs-mkt.workers.dev`

- [ ] **Step 5: Kjør testen igjen, verifiser at den passerer**

Run: `cd workers/selger && node tests/andre-bookinger-e2e.mjs`
Expected: `4/4 sjekker passerte.`, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add workers/selger/index.js workers/selger/tests/andre-bookinger-e2e.mjs
git commit -m "Legg til andre_bookinger-handling i selger-worker"
```

---

### Task 3: `api.js` — ny metode og demo-data

**Files:**
- Modify: `selger/api.js:44-49` (DEMO), `:127` (window.API)

- [ ] **Step 1: Legg til demo-data og API-metode**

I `selger/api.js`, i `DEMO`-objektet, legg til `andreBookinger` som ny nøkkel etter `bookinger` (linje 44-49):
```js
    bookinger: [
      { dato: '2026-07-22', bedrift: 'DE NADA FRISØR AS', kontakt: 'Kari',
        status: 'sendt_til_kunde', notat: '' },
      { dato: '2026-07-20', bedrift: 'ECO CULT AS', kontakt: 'Mats',
        status: 'betalt', notat: 'Ville ha ny side før høsten.' }
    ],
    andreBookinger: [
      { id: 101, dato: '2026-08-24', selger: 'Marte', bedrift: 'NORDLYS FRISØR AS', kontakt: 'Silje',
        epost: 'silje@nordlysfrisor.no', telefon: '91234567', nettside: 'nordlysfrisor.no',
        notat: '', status: 'sendt', jira_key: null },
      { id: 98, dato: '2026-08-20', selger: 'Kari', bedrift: 'SALT BARBER AS', kontakt: 'Jonas',
        epost: 'jonas@saltbarber.no', telefon: '90112233', nettside: 'saltbarber.no',
        notat: 'Ville ha ny side før høsten.', status: 'utkast_laget', jira_key: 'AN-1620' }
    ]
```
(Merk komma etter `bookinger`-arrayen sin avsluttende `]` siden det nå kommer et felt til.)

I `window.API`-objektet, legg til rett etter `alleBookinger` (linje 127):
```js
    alleBookinger: function () { return be({ handling: 'alle_bookinger' }); },
    andreBookinger: function () {
      return erDemo() ? demo('andreBookinger') : be({ handling: 'andre_bookinger' });
    },
```

- [ ] **Step 2: Verifiser syntaks**

Run: `node --check selger/api.js`
Expected: ingen output (exit code 0).

- [ ] **Step 3: Commit**

```bash
git add selger/api.js
git commit -m "Legg til API.andreBookinger med demo-data"
```

---

### Task 4: Ny "Fra andre"-fane på Bookinger-siden

**Files:**
- Modify: `selger/bookinger/index.html:69-94` (main), `:103-161` (script)

- [ ] **Step 1: Bytt ut `<main>`-blokken**

I `selger/bookinger/index.html`, erstatt hele blokken fra `<main class="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">` (linje 69) til `</main>` (linje 94) med:
```html
<main class="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">

  <h1 id="tittel" class="font-display font-extrabold text-3xl tracking-[-0.03em] mb-1.5">Mine bookinger</h1>
  <p class="text-mute text-[15px] mb-7 max-w-xl leading-relaxed">
    Hver av disse er noen du fikk til å si ja. Adrian oppdaterer statusen etter hvert
    som han bygger og sender. Du får provisjon når det står Betalt.
  </p>

  <div id="faner" class="hidden mb-6 border-b border-line" role="tablist" aria-label="Bookingvisning">
    <button id="fane-mine" role="tab" aria-selected="true"
      class="px-4 h-11 text-sm font-semibold border-b-2 border-ink -mb-px">Mine</button>
    <button id="fane-andre" role="tab" aria-selected="false"
      class="px-4 h-11 text-sm font-semibold text-mute border-b-2 border-transparent -mb-px hover:text-ink">Fra andre</button>
  </div>

  <div id="visning-mine">
    <div id="liste" class="space-y-2.5">
      <div class="skjelett h-[88px]"></div>
      <div class="skjelett h-[88px]"></div>
    </div>

    <div id="tom" class="hidden text-center py-16 px-6">
      <p class="font-display font-bold text-xl mb-2">Ingen bookinger ennå</p>
      <p class="text-mute mb-7 max-w-sm mx-auto leading-relaxed">
        Den første kommer. Alle som har gjort dette har hatt en liste som så
        akkurat sånn ut i starten.
      </p>
      <a href="/selger/ringeliste/"
         class="inline-flex items-center justify-center bg-brand text-white font-semibold px-6 min-h-[48px] rounded-xl hover:bg-blue-700 transition-colors">
        Åpne ringelista
      </a>
    </div>
  </div>

  <div id="visning-andre" class="hidden">
    <p class="text-sm text-mute mb-4">
      <a href="/selger/admin/" class="text-brand hover:underline">Endre status → Selgere</a>
    </p>
    <div id="liste-andre" class="space-y-2.5">
      <div class="skjelett h-[88px]"></div>
    </div>
    <div id="tom-andre" class="hidden text-center py-16 px-6">
      <p class="font-display font-bold text-xl mb-2">Ingen bookinger fra andre ennå</p>
      <p class="text-mute max-w-sm mx-auto leading-relaxed">
        De dukker opp her når en annen selger booker noen.
      </p>
    </div>
  </div>

</main>
```

- [ ] **Step 2: Bytt ut `<script>`-blokken**

Erstatt hele `<script>...</script>`-blokken (linje 103-161) med:
```html
<script>
  var STEG = [
    { kode: 'sendt',           navn: 'Sendt til Adrian',  farge: 'bg-zinc-100 text-zinc-700' },
    { kode: 'utkast_laget',    navn: 'Utkast laget',      farge: 'bg-blue-50 text-blue-800' },
    { kode: 'sendt_til_kunde', navn: 'Sendt til kunde',   farge: 'bg-blue-50 text-blue-800' },
    { kode: 'godtatt',         navn: 'Godtatt',           farge: 'bg-amber-50 text-amber-800' },
    { kode: 'betalt',          navn: 'Betalt',            farge: 'bg-green-50 text-green-800' },
    { kode: 'tapt',            navn: 'Ble ikke noe av',   farge: 'bg-zinc-100 text-zinc-500' }
  ];

  var esc = Fmt.esc, pentDato = Fmt.pentDato;

  function finnSteg(status) {
    var steg = STEG.filter(function (s) { return s.kode === status; })[0] || STEG[0];
    return { steg: steg, indeks: STEG.map(function (s) { return s.kode; }).indexOf(steg.kode) };
  }

  function stegBarHtml(indeks, ferdig, tapt) {
    if (tapt) return '';
    return '<div class="flex items-center gap-1" role="img" aria-label="Steg ' +
      (indeks + 1) + ' av 5: ' + esc(STEG[indeks].navn) + '">' +
      STEG.slice(0, 5).map(function (s, j) {
        return '<span class="h-1.5 flex-1 rounded-full ' +
          (j <= indeks ? (ferdig ? 'bg-green-600' : 'bg-brand') : 'bg-zinc-200') +
          '"></span>';
      }).join('') +
      '</div>';
  }

  function lastMine() {
    API.mineBookinger().then(function (b) {
      if (!b || !b.length) {
        document.getElementById('liste').innerHTML = '';
        document.getElementById('tom').classList.remove('hidden');
        return;
      }

      document.getElementById('liste').innerHTML = b.map(function (r, i) {
        var fs = finnSteg(r.status);
        var ferdig = fs.steg.kode === 'betalt';
        var tapt = fs.steg.kode === 'tapt';

        return '<article class="inn rounded-2xl border border-line bg-white p-5" ' +
          'style="animation-delay:' + Math.min(i * 40, 320) + 'ms">' +
          '<div class="flex flex-wrap items-start justify-between gap-3 mb-3">' +
            '<div class="min-w-0">' +
              '<h2 class="font-display font-bold text-[17px] tracking-[-0.01em] leading-snug">' +
                esc(r.bedrift) + '</h2>' +
              '<p class="text-sm text-mute mt-0.5">' +
                (r.kontakt ? esc(r.kontakt) + ' <span aria-hidden="true">·</span> ' : '') +
                '<span class="tall">' + pentDato(r.dato) + '</span></p>' +
            '</div>' +
            '<span class="shrink-0 text-[13px] font-medium px-3 py-1.5 rounded-lg ' + fs.steg.farge + '">' +
              esc(fs.steg.navn) + '</span>' +
          '</div>' +
          stegBarHtml(fs.indeks, ferdig, tapt) +
          (r.notat ? '<p class="text-sm text-mute mt-3 leading-relaxed">' + esc(r.notat) + '</p>' : '') +
        '</article>';
      }).join('');
    }).catch(function () {
      document.getElementById('liste').innerHTML =
        '<p class="text-mute">Fikk ikke kontakt med serveren. Last siden på nytt.</p>';
    });
  }

  var andreLastet = false;
  function lastAndre() {
    if (andreLastet) return;
    andreLastet = true;
    API.andreBookinger().then(function (b) {
      if (!b || !b.length) {
        document.getElementById('liste-andre').innerHTML = '';
        document.getElementById('tom-andre').classList.remove('hidden');
        return;
      }

      document.getElementById('liste-andre').innerHTML = b.map(function (r, i) {
        var fs = finnSteg(r.status);
        var ferdig = fs.steg.kode === 'betalt';
        var tapt = fs.steg.kode === 'tapt';

        return '<article class="inn rounded-2xl border border-line bg-white p-5" ' +
          'style="animation-delay:' + Math.min(i * 40, 320) + 'ms">' +
          '<div class="flex flex-wrap items-start justify-between gap-3 mb-3">' +
            '<div class="min-w-0">' +
              '<h2 class="font-display font-bold text-[17px] tracking-[-0.01em] leading-snug">' +
                esc(r.bedrift) + '</h2>' +
              '<p class="text-sm text-mute mt-0.5">' +
                esc(r.selger) + ' <span aria-hidden="true">·</span> ' +
                (r.kontakt ? esc(r.kontakt) + ' <span aria-hidden="true">·</span> ' : '') +
                '<span class="tall">' + pentDato(r.dato) + '</span></p>' +
              (r.epost ? '<p class="text-[13px] text-mute truncate">' + esc(r.epost) + '</p>' : '') +
              (r.nettside ? '<p class="text-[13px] truncate"><a href="https://' + esc(r.nettside) +
                '" target="_blank" rel="noopener noreferrer" class="text-brand hover:underline">' +
                esc(r.nettside) + '</a></p>' : '') +
              (r.jira_key ? '<p class="text-[13px]"><a href="https://dietrichs-marketing.atlassian.net/browse/' +
                esc(r.jira_key) + '" target="_blank" rel="noopener noreferrer" class="text-mute hover:text-brand hover:underline">Jira: ' +
                esc(r.jira_key) + '</a></p>' : '') +
            '</div>' +
            '<span class="shrink-0 text-[13px] font-medium px-3 py-1.5 rounded-lg ' + fs.steg.farge + '">' +
              esc(fs.steg.navn) + '</span>' +
          '</div>' +
          stegBarHtml(fs.indeks, ferdig, tapt) +
          (r.notat ? '<p class="text-sm text-mute mt-3 leading-relaxed">' + esc(r.notat) + '</p>' : '') +
        '</article>';
      }).join('');
    }).catch(function () {
      document.getElementById('liste-andre').innerHTML =
        '<p class="text-mute">Fikk ikke kontakt med serveren. Last siden på nytt.</p>';
    });
  }

  function velgFane(fane) {
    var mine = fane === 'mine';
    document.getElementById('visning-mine').classList.toggle('hidden', !mine);
    document.getElementById('visning-andre').classList.toggle('hidden', mine);
    document.getElementById('tittel').textContent = mine ? 'Mine bookinger' : 'Bookinger fra andre';

    document.getElementById('fane-mine').setAttribute('aria-selected', String(mine));
    document.getElementById('fane-mine').classList.toggle('border-ink', mine);
    document.getElementById('fane-mine').classList.toggle('text-mute', !mine);
    document.getElementById('fane-mine').classList.toggle('border-transparent', !mine);

    document.getElementById('fane-andre').setAttribute('aria-selected', String(!mine));
    document.getElementById('fane-andre').classList.toggle('border-ink', !mine);
    document.getElementById('fane-andre').classList.toggle('text-mute', mine);
    document.getElementById('fane-andre').classList.toggle('border-transparent', mine);

    if (!mine) lastAndre();
  }

  document.addEventListener('DOMContentLoaded', function () {
    lastMine();

    if (window.SELGER && window.SELGER.epost === 'adrian@dmarketing.no') {
      var faner = document.getElementById('faner');
      faner.classList.remove('hidden');
      faner.classList.add('flex');
      document.getElementById('fane-mine').addEventListener('click', function () { velgFane('mine'); });
      document.getElementById('fane-andre').addEventListener('click', function () { velgFane('andre'); });
    }
  });
</script>
```

- [ ] **Step 3: Verifiser syntaks**

Åpne filen og sjekk at den er velformet HTML (matchende tags). Det finnes ikke noe HTML-lint-verktøy i repoet, så dette er en visuell sjekk — gjøres grundig i Task 5 sin nettleserverifisering.

- [ ] **Step 4: Commit**

```bash
git add selger/bookinger/index.html
git commit -m "Legg til read-only 'Fra andre'-fane på Bookinger-siden"
```

---

### Task 5: Full verifisering i nettleser (demo-modus)

**Files:** ingen — kun verifisering av Task 1-4 sitt resultat.

- [ ] **Step 1: Åpne Bookinger-siden i demo-modus uten admin**

Bruk `preview_start` mot repoets rotmappe (statisk filserver, f.eks. `npx serve .` på port 5053 — se `ALLOWED`-lista i `workers/selger/index.js:35` som allerede har `http://localhost:5053` whitelistet for CORS), naviger til `http://localhost:5053/selger/bookinger/?demo=1`.

Sjekk med `read_page`:
- H1 viser "Mine bookinger".
- `#faner` (fanebaren) er IKKE synlig — fordi demo-modus ikke setter `window.SELGER.epost` til `adrian@dmarketing.no`.
- Kortene fra `DEMO.bookinger` vises (DE NADA FRISØR AS, ECO CULT AS).

Dette bekrefter at en vanlig selger aldri ser "Fra andre"-fanen.

- [ ] **Step 2: Simuler admin og sjekk "Fra andre"-fanen**

Siden demo-modus alltid logger inn som en vanlig selger, bruk `javascript_tool` til å manuelt sette Adrians e-post og avsløre fanebaren akkurat slik `DOMContentLoaded`-handleren ville gjort det for en ekte admin-innlogging:
```js
window.SELGER.epost = 'adrian@dmarketing.no';
document.getElementById('faner').classList.remove('hidden');
document.getElementById('faner').classList.add('flex');
document.getElementById('fane-andre').click();
```
Sjekk med `read_page` etter klikket:
- H1 endres til "Bookinger fra andre".
- Kortene fra `DEMO.andreBookinger` vises (NORDLYS FRISØR AS, SALT BARBER AS), med selgernavn (Marte/Kari) synlig på hvert kort.
- Lenken "Endre status → Selgere" er synlig og peker til `/selger/admin/`.
- Ingen statusdropdown finnes i disse kortene (kun den fargede status-pillen og stegbaren, read-only).

- [ ] **Step 3: Ta skjermbilde og sjekk konsollen**

Run: `computer` med `action: "screenshot"` for å dokumentere resultatet.
Run: `read_console_messages` med `onlyErrors: true`.
Expected: ingen feilmeldinger.

- [ ] **Step 4: Sjekk Min uke-siden**

Naviger til `http://localhost:5053/selger/?demo=1`. Sjekk med `read_page` at seksjonen som før het "Det som skjedde mens du ringte" nå viser "Tidslinje", og at kvitteringslisten (DEMO.tall.hendelser) fortsatt rendres under den.

- [ ] **Step 5: Bekreft admin-siden er uendret**

Les `selger/admin/index.html` og bekreft at ingen linjer i den filen er rørt av Task 1-4 (git diff bør ikke inneholde denne filen i det hele tatt).

Run: `git diff --stat HEAD~4` (de fire commitene fra Task 1, 2, 3 og 4)
Expected: kun `selger/index.html`, `selger/bookinger/index.html`, `selger/api.js`, `workers/selger/index.js`, `workers/selger/tests/andre-bookinger-e2e.mjs` er endret. `selger/admin/index.html` er IKKE i lista.

---

## Merk: deploy til dmarketing.no

Alle commits over er lokale. Å gjøre endringene live på `dmarketing.no/selger` krever i tillegg push til remote (samme flyt som resten av repoet) — det er en egen, bevisst beslutning og ikke en del av denne planen. Backend-endringen (Task 2) er allerede live via `wrangler deploy` uavhengig av dette, siden Workeren ikke deployes fra git push.
