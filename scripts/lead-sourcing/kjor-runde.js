// Inngangspunktet Windows Task Scheduler kaller annenhver dag. Kjøres med:
//   node kjor-runde.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { lastKo, aktivBransje, byttTilNesteBransje } = require('./bransje-ko');
const { hentLeadsForBransje: hentFraOsm } = require('./fetch-osm-leads');
const { hentLeadsForBransje: hentFraPlaces } = require('./fetch-places-leads');
const { registrerNyeLeads } = require('./dedup-register');

function lesMedEpostRader(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8').replace(/^﻿/, '');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split('","').map((h) => h.replace(/^"|"$/g, ''));
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
const { kjorSync } = require('./instantly-sync');

const KO_FIL = path.join(__dirname, 'bransje-ko.json');
const LEADS_DIR = 'C:\\Users\\adria\\OneDrive\\Dietrichs Marketing\\Leads\\Instantly leads';
// Mellomlagring FØR Instantly-opplasting lykkes. dedup-register.js sin
// loadUsedKeys() skanner kun *filer direkte i* LEADS_DIR (readdirSync er ikke
// rekursiv), så en underkatalog her blir ALDRI telt som "allerede brukt" -
// bevisst, se feilen 25.-27.09.2026 i minnet (project-instantly-lead-automasjon):
// leads som ble hentet men aldri sendt pga manglende INSTANTLY-credentials
// blokkerte seg selv for alltid fordi CSV-en lå direkte i LEADS_DIR.
const PENDING_DIR = path.join(LEADS_DIR, 'pending-ikke-sendt-enna');
const LOG_DIR = path.join(__dirname, 'logs');

function logg(dato, linje) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const fil = path.join(LOG_DIR, `${dato}.log`);
  fs.appendFileSync(fil, `[${new Date().toISOString()}] ${linje}\n`, 'utf-8');
  console.log(linje);
}

function skrivCsv(leads, utFil) {
  const header = '"navn","adresse","telefon","nettside","by"';
  const rows = leads.map((l) =>
    `"${l.navn.replace(/"/g, '""')}","${(l.adresse || '').replace(/"/g, '""')}","${(l.telefon || '').replace(/"/g, '""')}","${l.nettside}","${l.by || ''}"`
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

  if (leads.length === 0) {
    logg(dato, `Ingen nye leads funnet for ${bransje.navn} - bytter til neste bransje uten å røre Instantly.`);
    byttTilNesteBransje(KO_FIL);
    return;
  }

  fs.mkdirSync(PENDING_DIR, { recursive: true });
  const rawFilPending = path.join(PENDING_DIR, `${bransje.navn.toLowerCase()}-leads-${dato}.csv`);
  skrivCsv(leads, rawFilPending);

  const medEpostFilPending = path.join(PENDING_DIR, `${bransje.navn.toLowerCase()}-leads-${dato}-med-epost.csv`);
  execFileSync('node', [path.join(__dirname, 'scrape-emails.js'), rawFilPending, medEpostFilPending], { stdio: 'inherit' });

  const medEpostRader = lesMedEpostRader(medEpostFilPending);
  const raderMedEpost = medEpostRader.filter((r) => r.epost.trim());
  logg(dato, `E-post-scraping: ${raderMedEpost.length}/${medEpostRader.length} fikk epost`);

  // Sikkerhetssjekk (hendelsen 25.-27.09.2026, se feedback-instantly-slett-
  // riktig-filter i minnet): hvis nesten ingen fikk epost, er det sannsynligvis
  // et nettverksproblem i kjøremiljøet (ikke reelt 0% treff på ekte nettsider),
  // og Instantly vil uansett avvise fila ("No leads to upload"). Avbryt tidlig
  // i stedet for å bruke Instantly-tid på noe som garantert feiler - fila blir
  // liggende i PENDING_DIR og plukkes opp på nytt neste kjøring.
  if (raderMedEpost.length === 0) {
    logg(dato, `INGEN fikk epost - avbryter runden uten å røre Instantly eller bransjekøen. Sjekk nettverkstilgangen i kjøremiljøet (se Windows Task Scheduler-loggen).`);
    return;
  }

  let instantlyResultat;
  try {
    instantlyResultat = await kjorSync(medEpostFilPending, ko.instantly_kampanje_url);
  } catch (err) {
    logg(dato, `FEIL under Instantly-sync: ${err.message}. Leadsene ligger fortsatt i ${medEpostFilPending} (mellomlager, telles IKKE som brukt) og plukkes opp på nytt neste kjøring.`);
    return;
  }

  logg(dato, `Instantly: slettet ${instantlyResultat.antallSlettet}, lastet opp ${instantlyResultat.antallLastetOpp}.`);

  // Flytt til LEADS_DIR (der dedup-register.js faktisk ser filer) FØRST etter
  // vellykket opplasting - dette er selve fiksen for feilen 25.-27.09.2026.
  fs.renameSync(medEpostFilPending, path.join(LEADS_DIR, `${bransje.navn.toLowerCase()}-leads-${dato}-med-epost.csv`));
  fs.renameSync(rawFilPending, path.join(LEADS_DIR, `${bransje.navn.toLowerCase()}-leads-${dato}.csv`));

  registrerNyeLeads(raderMedEpost);
  logg(dato, `Registrerte ${raderMedEpost.length} nye leads (med epost) i dedup-registeret`);

  if (raderMedEpost.length < bransje.terskelForTom) {
    byttTilNesteBransje(KO_FIL);
    const nyKo = lastKo(KO_FIL);
    logg(dato, `${bransje.navn} regnes som tom (${raderMedEpost.length} med epost < terskel ${bransje.terskelForTom}). Bytter til: ${aktivBransje(nyKo).navn}`);
  }
}

kjorRunde().catch((err) => {
  const dato = new Date().toISOString().slice(0, 10);
  logg(dato, `UVENTET FEIL: ${err.stack}`);
  process.exit(1);
});
