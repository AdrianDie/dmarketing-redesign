/**
 * Ende-til-ende-test av provisjonslogikken mot den EKTE Worker-en og D1.
 *
 * Kjor fra workers/selger:  node tests/provisjon-e2e.mjs
 *
 * Lager en midlertidig testselger, setter inn bookinger med ulike betalt-datoer,
 * spor Worker-en om tallene, og sjekker at de stemmer. Rydder alltid opp til slutt,
 * ogsaa om en test feiler. Rorer ingen ekte selgere eller leads.
 */
import { execSync } from 'node:child_process';

const WORKER = 'https://selger-worker.dietrichs-mkt.workers.dev';
const EPOST = 'e2e-provisjon@test.no';
const TOKEN = 'e2eprovisjontoken1234567890';
const PRIS = 3120;

// datoer: i dag (denne mnd) og en dato i forrige maaned
const idag = new Date();
const denneMnd = idag.toISOString().slice(0, 10);
const forrige = new Date(idag.getFullYear(), idag.getMonth(), 0).toISOString().slice(0, 10); // siste dag forrige mnd

let feil = 0, kjort = 0;

function d1(sql) {
  execSync(`npx wrangler d1 execute dm-salg --remote --command "${sql.replace(/"/g, '\\"')}"`,
    { stdio: 'pipe' });
}

async function tall() {
  const r = await fetch(WORKER, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handling: 'tall', token: TOKEN }),
  });
  return r.json();
}

function sjekk(navn, faktisk, forventet) {
  kjort++;
  if (faktisk === forventet) {
    console.log(`  OK   ${navn}: ${faktisk}`);
  } else {
    feil++;
    console.log(`  FEIL ${navn}: fikk ${faktisk}, forventet ${forventet}`);
  }
}

// tomrom for bookinger mellom scenarioer
function nullstillBookinger() {
  d1(`DELETE FROM bookinger WHERE selger='${EPOST}'`);
}

// legg inn N betalte bookinger med gitt betalt-dato
function leggBetalte(antall, betaltDato) {
  const rader = Array.from({ length: antall }, (_, i) =>
    `('${betaltDato}','${EPOST}','B${i}','betalt','${betaltDato}')`).join(',');
  d1(`INSERT INTO bookinger (dato,selger,bedrift,status,betalt_dato) VALUES ${rader}`);
}

function leggVentende(antall) {
  const rader = Array.from({ length: antall }, (_, i) =>
    `('${denneMnd}','${EPOST}','V${i}','sendt_til_kunde',NULL)`).join(',');
  d1(`INSERT INTO bookinger (dato,selger,bedrift,status,betalt_dato) VALUES ${rader}`);
}

async function run() {
  console.log(`Denne maaned: ${denneMnd.slice(0, 7)} | forrige: ${forrige.slice(0, 7)}\n`);
  d1(`DELETE FROM selgere WHERE epost='${EPOST}'`);
  d1(`INSERT INTO selgere (epost,navn,token,aktiv) VALUES ('${EPOST}','E2E','${TOKEN}','ja')`);

  // 1. KRYSS MAANED: betalt forrige mnd teller ikke, betalt denne mnd teller,
  //    ventende teller som paa vei inn og forsvinner ikke
  console.log('1. Kryss maaned (Adrians scenario)');
  nullstillBookinger();
  leggBetalte(1, forrige);     // betalt forrige mnd
  leggBetalte(1, denneMnd);    // betalt denne mnd
  leggVentende(1);             // booket, ikke betalt
  let t = await tall();
  sjekk('betalte denne mnd', t.betalte, 1);
  sjekk('opptjent denne mnd', t.opptjent, 1 * PRIS * 0.15);
  sjekk('paa vei inn (alltid 15 %)', t.pipeline, 1 * PRIS * 0.15);
  sjekk('bookinger totalt (alt finnes fortsatt)', t.bookinger_totalt, 3);

  // 2. TRINNGRENSER denne maaneden
  console.log('2. Trinngrenser');
  for (const [ant, sats] of [[9, 0.15], [10, 0.20], [20, 0.25], [30, 0.30]]) {
    nullstillBookinger();
    leggBetalte(ant, denneMnd);
    t = await tall();
    sjekk(`${ant} betalte gir sats`, t.sats, sats);
  }

  // 3. PROGRESJON: 12 betalte = 9 a 15 % + 3 a 20 % (salg 10 er forste 20 %-salg)
  console.log('3. Progressiv opptjening');
  nullstillBookinger();
  leggBetalte(12, denneMnd);
  t = await tall();
  sjekk('opptjent ved 12', t.opptjent, 9 * PRIS * 0.15 + 3 * PRIS * 0.20);
  sjekk('til neste trinn fra 12', t.til_neste, 8);
  sjekk('neste sats fra 12', t.neste_sats, 0.25);

  // 4. TOMT: ingen betalte, ingen opptjent, men ventende paa vei inn
  console.log('4. Ny selger uten betalte');
  nullstillBookinger();
  leggVentende(3);
  t = await tall();
  sjekk('opptjent naar ingenting betalt', t.opptjent, 0);
  sjekk('sats i bunn', t.sats, 0.15);
  sjekk('paa vei inn for 3 ventende', t.pipeline, 3 * PRIS * 0.15);
}

run()
  .catch(e => { console.error('Testen krasjet:', e.message); feil++; })
  .finally(() => {
    // rydd ALLTID
    try {
      d1(`DELETE FROM bookinger WHERE selger='${EPOST}'`);
      d1(`DELETE FROM selgere WHERE epost='${EPOST}'`);
    } catch (e) { console.error('Opprydding feilet:', e.message); }
    console.log(`\n${kjort - feil}/${kjort} sjekker passerte.`);
    process.exit(feil ? 1 : 0);
  });
