// Engangsscript: registrerer historiske restaurant-batcher (som ble sendt i
// Instantly manuelt FØR denne lead-automasjonen fantes) inn i oppbrukt-fila,
// slik at dedup-register.js sitt tre-nøkkel-register faktisk reflekterer hva
// som er sendt. Bekreftet av Adrian 23.09.2026: alle filene under ble sendt,
// UNNTATT 09-22 (ikke lastet opp ennå).
// Kjør: node ettergodkjenn-historiske-batcher.js
const fs = require('fs');
const path = require('path');
const {
  erAlleredeBrukt, registrerNyeLeads, parseCsvColumn,
  normalizePhone, normalizeWebsite, normalizeEmail,
} = require('./dedup-register');

// Merk: bruker IKKE dedup-register.js sin loadUsedKeys() her, fordi den også
// skanner alle "*-leads-*.csv"-filer (fallback-dekning for fetch-scriptene) -
// det ville inkludert nettopp filene vi prøver å slå sammen INN i oppbrukt,
// og fått alt til å se "allerede brukt" ut uten at det faktisk sto i selve
// oppbrukt-fila. Her leser vi KUN oppbrukt-fila sitt eget innhold som
// utgangspunkt, siden målet er å fylle akkurat den fila.
function lastOppbruktNokler(leadsDir) {
  const usedFile = path.join(leadsDir, 'leads-med-nettside-DISSE_ER_OPPBRUKT.csv');
  return {
    telefoner: new Set(parseCsvColumn(usedFile, 'telefon').map(normalizePhone).filter(Boolean)),
    nettsider: new Set(parseCsvColumn(usedFile, 'nettside').map(normalizeWebsite).filter(Boolean)),
    eposter: new Set(parseCsvColumn(usedFile, 'epost').map(normalizeEmail).filter(Boolean)),
  };
}

const LEADS_DIR = 'C:\\Users\\adria\\OneDrive\\Dietrichs Marketing\\Leads\\Instantly leads';
const BEKREFTET_SENDT = [
  'restaurant-leads-nye-2026-08-03-med-epost – Kopi.csv',
  'restaurant-leads-nye-2026-08-03-med-epost-del-1.csv',
  'restaurant-leads-nye-2026-08-23-med-epost.csv',
  'restaurant-leads-nye-2026-08-26-med-epost.csv',
  'restaurant-leads-nye-2026-08-31-med-epost.csv',
  'restaurant-leads-nye-2026-09-02-med-epost.csv',
  'restaurant-leads-nye-2026-09-04-med-epost.csv',
  'restaurant-leads-nye-2026-09-07-med-epost.csv',
  'restaurant-leads-nye-2026-09-12-med-epost.csv',
];

function lesRader(filePath) {
  const navn = parseCsvColumn(filePath, 'navn');
  const telefon = parseCsvColumn(filePath, 'telefon');
  const nettside = parseCsvColumn(filePath, 'nettside');
  const epost = parseCsvColumn(filePath, 'epost');
  // parseCsvColumn filtrerer bort tomme celler, så vi kan ikke stole på lik
  // lengde på tvers av kolonner - les radvis i stedet.
  const text = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split('","').map((h) => h.replace(/^"|"$/g, '').toLowerCase());
  const idx = (col) => header.indexOf(col);
  return lines.slice(1).map((line) => {
    const cols = line.split('","').map((c) => c.replace(/^"|"$/g, ''));
    return {
      navn: cols[idx('navn')] || '',
      telefon: cols[idx('telefon')] || '',
      nettside: cols[idx('nettside')] || '',
      epost: cols[idx('epost')] || '',
    };
  });
}

function main() {
  let nokler = lastOppbruktNokler(LEADS_DIR);
  console.log(`Startnøkler: ${nokler.telefoner.size} telefon, ${nokler.nettsider.size} nettside, ${nokler.eposter.size} epost`);

  let totaltNye = 0;
  for (const filnavn of BEKREFTET_SENDT) {
    const fil = path.join(LEADS_DIR, filnavn);
    if (!fs.existsSync(fil)) {
      console.log(`HOPPER OVER (finnes ikke): ${filnavn}`);
      continue;
    }
    const rader = lesRader(fil);
    const nyeRader = rader.filter((r) => !erAlleredeBrukt(r, nokler));
    if (nyeRader.length > 0) {
      registrerNyeLeads(nyeRader, LEADS_DIR);
      // Oppdater nøklene i minnet slik at duplikater MELLOM disse filene
      // (f.eks. samme restaurant i både 08-03-Kopi og 08-03-del-1) ikke
      // registreres to ganger.
      for (const r of nyeRader) {
        if (r.telefon) nokler.telefoner.add(normalizePhone(r.telefon));
        if (r.nettside) nokler.nettsider.add(normalizeWebsite(r.nettside));
        if (r.epost) nokler.eposter.add(normalizeEmail(r.epost));
      }
    }
    console.log(`${filnavn}: ${rader.length} rader totalt, ${nyeRader.length} nye registrert i oppbrukt`);
    totaltNye += nyeRader.length;
  }
  console.log(`\nFerdig. ${totaltNye} nye rader registrert i oppbrukt-fila totalt.`);
}

main();
