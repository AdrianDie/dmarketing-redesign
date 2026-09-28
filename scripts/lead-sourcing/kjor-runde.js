// Inngangspunktet Windows Task Scheduler kaller annenhver dag. Kjøres med:
//   node kjor-runde.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { lastKo, aktivBransje, byttTilNesteBransje } = require('./bransje-ko');
const { hentLeadsForBransje: hentFraOsm } = require('./fetch-osm-leads');
const { hentLeadsForBransje: hentFraPlaces } = require('./fetch-places-leads');
const {
  registrerNyeLeads, normalizePhone, normalizeWebsite, normalizeEmail,
} = require('./dedup-register');
const { kjorSync, erKampanjeFerdigMedSending } = require('./instantly-sync');

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

// Sikkerhet mot uendelig løkke hvis en bransje reelt bare har noen få hundre
// bedrifter totalt (som kajakkutleie) - se Adrians krav 28.09.2026 om at
// hver kjøring skal gi 240 MED EPOST, ikke bare 240 raw-treff.
const MAKS_RUNDER = 6;
// Antatt epost-treffrate ved planlegging av hvor mange raw-leads en topp-opp-
// runde bør be om, basert på observerte 60-78% i tidligere runder. Konservativt
// lavt anslag (50%) gir heller for mange enn for få raw-treff per runde.
const ANTATT_EPOST_TREFFRATE = 0.5;

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

function lesMedEpostRader(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split('","').map((h) => h.replace(/^"|"$/g, ''));
  const idx = (col) => header.indexOf(col);
  return lines.slice(1).map((line) => {
    const cols = line.split('","').map((c) => c.replace(/^"|"$/g, ''));
    return {
      navn: cols[idx('navn')] || '',
      adresse: cols[idx('adresse')] || '',
      telefon: cols[idx('telefon')] || '',
      nettside: cols[idx('nettside')] || '',
      by: cols[idx('by')] || '',
      epost: cols[idx('epost')] || '',
    };
  });
}

function leggTilAkkumulertNokler(akkumulertNokler, leads) {
  for (const l of leads) {
    if (l.telefon) akkumulertNokler.telefoner.add(normalizePhone(l.telefon));
    if (l.nettside) akkumulertNokler.nettsider.add(normalizeWebsite(l.nettside));
    if (l.epost) akkumulertNokler.eposter.add(normalizeEmail(l.epost));
  }
}

// Henter i runder til enten målet (bransje.maxLeadsPerKjoring MED epost) er
// nådd, en runde ikke finner noe nytt i det hele tatt (reelt tom bransje),
// eller MAKS_RUNDER er brukt opp. Returnerer { medEpost, alleRaw, tomt }.
async function hentTilMaalNaadd(dato, bransje) {
  const akkumulertNokler = { telefoner: new Set(), nettsider: new Set(), eposter: new Set() };
  const alleRaw = [];
  const medEpost = [];
  let runde = 0;

  while (medEpost.length < bransje.maxLeadsPerKjoring && runde < MAKS_RUNDER) {
    runde += 1;
    const mangler = bransje.maxLeadsPerKjoring - medEpost.length;
    const rawMaal = Math.min(bransje.maxLeadsPerKjoring, Math.ceil(mangler / ANTATT_EPOST_TREFFRATE));

    let rundeLeads;
    try {
      rundeLeads = bransje.kilde === 'osm'
        ? await hentFraOsm(bransje.osmTag, rawMaal, akkumulertNokler)
        : await hentFraPlaces(bransje.sok, rawMaal, process.env.GOOGLE_PLACES_API_KEY, akkumulertNokler);
    } catch (err) {
      logg(dato, `FEIL under henting (runde ${runde}): ${err.message}. Beholder det som er funnet så langt (${medEpost.length} med epost).`);
      break;
    }

    logg(dato, `Runde ${runde}: hentet ${rundeLeads.length} nye raw-leads (ba om ${rawMaal})`);
    if (rundeLeads.length === 0) {
      return { medEpost, alleRaw, tomt: runde === 1 };
    }

    leggTilAkkumulertNokler(akkumulertNokler, rundeLeads);
    alleRaw.push(...rundeLeads);

    fs.mkdirSync(PENDING_DIR, { recursive: true });
    const rundeRawFil = path.join(PENDING_DIR, `${bransje.navn.toLowerCase()}-leads-${dato}-runde${runde}.csv`);
    skrivCsv(rundeLeads, rundeRawFil);
    const rundeMedEpostFil = path.join(PENDING_DIR, `${bransje.navn.toLowerCase()}-leads-${dato}-runde${runde}-med-epost.csv`);
    execFileSync('node', [path.join(__dirname, 'scrape-emails.js'), rundeRawFil, rundeMedEpostFil], { stdio: 'inherit' });

    const rundeMedEpostRader = lesMedEpostRader(rundeMedEpostFil).filter((r) => r.epost.trim());
    logg(dato, `Runde ${runde}: ${rundeMedEpostRader.length}/${rundeLeads.length} fikk epost`);
    leggTilAkkumulertNokler(akkumulertNokler, rundeMedEpostRader);
    medEpost.push(...rundeMedEpostRader);
  }

  return { medEpost, alleRaw, tomt: false };
}

async function kjorRunde() {
  const dato = new Date().toISOString().slice(0, 10);
  const ko = lastKo(KO_FIL);
  const bransje = aktivBransje(ko);

  // Adrians krav 28.09.2026: en batch (240 leads x 2 mailer over 2 dager)
  // skal fullføre sekvensen sin FØR neste batch lastes inn - ikke bare stole
  // på at Task Scheduler sitt 2-dagers-intervall alltid stemmer (en forsinket
  // eller feilet forrige kjøring kan gjøre at kampanjen ikke er ferdig ennå).
  // Sjekkes FØR noe hentes, for å unngå å bruke Places API-kall/OSM-tid på en
  // runde som uansett skal avbrytes.
  let ferdig;
  try {
    ferdig = await erKampanjeFerdigMedSending(ko.instantly_kampanje_url);
  } catch (err) {
    logg(dato, `FEIL under statussjekk mot Instantly: ${err.message}. Avbryter runden, rører ingenting.`);
    return;
  }
  if (!ferdig) {
    logg(dato, `Kampanjen har ikke fullført sending til gjeldende leads ennå ("Active", ikke "Completed") - venter til neste kjøring.`);
    return;
  }

  logg(dato, `Starter runde for bransje: ${bransje.navn} (kilde: ${bransje.kilde}, mål: ${bransje.maxLeadsPerKjoring} med epost)`);

  const { medEpost, alleRaw, tomt } = await hentTilMaalNaadd(dato, bransje);

  if (tomt) {
    logg(dato, `Ingen nye leads i det hele tatt for ${bransje.navn} - bytter til neste bransje uten å røre Instantly.`);
    byttTilNesteBransje(KO_FIL);
    return;
  }

  logg(dato, `Totalt hentet: ${alleRaw.length} raw, ${medEpost.length} med epost (mål: ${bransje.maxLeadsPerKjoring})`);

  // Sikkerhetssjekk (hendelsen 25.-27.09.2026, se feedback-instantly-slett-
  // riktig-filter i minnet): hvis nesten ingen fikk epost, er det sannsynligvis
  // et nettverksproblem i kjøremiljøet (ikke reelt 0% treff på ekte nettsider),
  // og Instantly vil uansett avvise fila ("No leads to upload"). Avbryt tidlig
  // i stedet for å bruke Instantly-tid på noe som garantert feiler.
  if (medEpost.length === 0) {
    logg(dato, `INGEN fikk epost - avbryter runden uten å røre Instantly eller bransjekøen. Sjekk nettverkstilgangen i kjøremiljøet (se Windows Task Scheduler-loggen).`);
    return;
  }

  const raderMedEpost = medEpost.slice(0, bransje.maxLeadsPerKjoring);

  const medEpostFilPending = path.join(PENDING_DIR, `${bransje.navn.toLowerCase()}-leads-${dato}-med-epost.csv`);
  const header = '"navn","adresse","telefon","nettside","by","epost"';
  const rows = raderMedEpost.map((l) =>
    `"${(l.navn || '').replace(/"/g, '""')}","${(l.adresse || '').replace(/"/g, '""')}","${(l.telefon || '').replace(/"/g, '""')}","${l.nettside || ''}","${(l.by || '').replace(/"/g, '""')}","${l.epost}"`
  );
  fs.writeFileSync(medEpostFilPending, [header, ...rows].join('\n'), 'utf-8');

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
