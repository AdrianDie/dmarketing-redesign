// Inngangspunktet Windows Task Scheduler kaller annenhver dag. Kjøres med:
//   node kjor-runde.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { lastKo, aktivBransje, byttTilNesteBransje } = require('./bransje-ko');
const { hentLeadsForBransje: hentFraOsm } = require('./fetch-osm-leads');
const { hentLeadsForBransje: hentFraPlaces } = require('./fetch-places-leads');
const { registrerNyeLeads } = require('./dedup-register');
const { kjorSync } = require('./instantly-sync');

const KO_FIL = path.join(__dirname, 'bransje-ko.json');
const LEADS_DIR = 'C:\\Users\\adria\\OneDrive\\Dietrichs Marketing\\Leads\\Instantly leads';
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

  const rawFil = path.join(LEADS_DIR, `${bransje.navn.toLowerCase()}-leads-${dato}.csv`);
  skrivCsv(leads, rawFil);

  const medEpostFil = path.join(LEADS_DIR, `${bransje.navn.toLowerCase()}-leads-${dato}-med-epost.csv`);
  execFileSync('node', [path.join(__dirname, 'scrape-emails.js'), rawFil, medEpostFil], { stdio: 'inherit' });

  let instantlyResultat;
  try {
    instantlyResultat = await kjorSync(medEpostFil, ko.instantly_kampanje_url);
  } catch (err) {
    logg(dato, `FEIL under Instantly-sync: ${err.message}. Leadsene ligger fortsatt i ${medEpostFil} og plukkes opp neste kjøring siden dedup-registeret ikke oppdateres før vellykket opplasting.`);
    return;
  }

  logg(dato, `Instantly: slettet ${instantlyResultat.antallSlettet}, lastet opp ${instantlyResultat.antallLastetOpp}.`);

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
