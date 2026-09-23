// Henter restaurant-leads fra Google Places API (Text Search, New), filtrerer bort
// store kjeder og allerede brukte leads, og skriver resultatet til CSV.
// Kjør: node fetch-restaurant-leads.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error('Mangler GOOGLE_PLACES_API_KEY i .env');
  process.exit(1);
}

// argv[2]: valgfritt filnavn for OUT_FILE (default: dagens dato). argv[3]: valgfri MAX_LEADS-override.
// Brukes for å kunne kjøre en ekstra topp-opp-runde samme dag uten å overskrive den første.
const MAX_LEADS = Number(process.argv[3]) || 1500;
const LEADS_DIR = 'C:\\Users\\adria\\OneDrive\\Dietrichs Marketing\\Leads\\Instantly leads';
const EXCLUDE_FILE = path.join(LEADS_DIR, 'restaurantkjeder-IKKE-BRUK.csv');
const USED_FILE = path.join(LEADS_DIR, 'leads-med-nettside-DISSE_ER_OPPBRUKT.csv');
const OUT_FILE = path.join(LEADS_DIR, process.argv[2] || `restaurant-leads-nye-${new Date().toISOString().slice(0, 10)}.csv`);

const { CITIES } = require('./steder-norge');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

function normalizePhone(p) {
  return (p || '').replace(/[^\d]/g, '').replace(/^47/, '');
}

async function searchText(query, pageToken) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.nationalPhoneNumber',
        'places.internationalPhoneNumber',
        'places.websiteUri',
        'places.businessStatus',
        'nextPageToken',
      ].join(','),
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'no',
      pageSize: 20,
      ...(pageToken ? { pageToken } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API-feil (${res.status}): ${body}`);
  }
  return res.json();
}

async function main() {
  const excludeNames = parseCsvColumn(EXCLUDE_FILE, 'navn').map((n) => n.toLowerCase());
  const usedPhones = new Set(parseCsvColumn(USED_FILE, 'telefon').map(normalizePhone));
  const usedWebsites = new Set(
    parseCsvColumn(USED_FILE, 'nettside').map((w) => w.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))
  );

  // USED_FILE er en delt "brukt opp"-liste for hele lead-driften og reflekterer ikke
  // nødvendigvis restaurant-batchene spesifikt (den kan f.eks. holde en annen bransje
  // for øyeblikket). Derfor dedupes det her i tillegg mot alle tidligere
  // restaurant-leads-*.csv-eksporter i mappen, slik at "nye" faktisk betyr nye.
  const previousFiles = fs.readdirSync(LEADS_DIR)
    .filter((f) => f.startsWith('restaurant-leads-') && f.endsWith('.csv'))
    .map((f) => path.join(LEADS_DIR, f));
  for (const file of previousFiles) {
    parseCsvColumn(file, 'telefon').map(normalizePhone).forEach((p) => p && usedPhones.add(p));
    parseCsvColumn(file, 'nettside')
      .map((w) => w.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))
      .forEach((w) => w && usedWebsites.add(w));
  }

  console.log(`Ekskluderingsliste: ${excludeNames.length} kjedenavn`);
  console.log(`Tidligere restaurant-batcher slått sammen: ${previousFiles.length} filer`);
  console.log(`Allerede brukt/hentet: ${usedPhones.size} telefonnumre, ${usedWebsites.size} nettsider`);

  const seenIds = new Set();
  const leads = [];

  for (const city of CITIES) {
    if (leads.length >= MAX_LEADS) break;
    let pageToken;
    let pagesForCity = 0;

    do {
      let data;
      try {
        data = await searchText(`restauranter i ${city}`, pageToken);
      } catch (err) {
        console.error(`Feil for ${city}: ${err.message}`);
        break;
      }

      for (const place of data.places || []) {
        if (leads.length >= MAX_LEADS) break;
        if (seenIds.has(place.id)) continue;
        seenIds.add(place.id);

        const navn = place.displayName?.text || '';
        const website = place.websiteUri || '';
        const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || '';
        if (!website) continue; // vi vil ha de som allerede har nettside
        if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') continue;

        const navnLower = navn.toLowerCase();
        if (excludeNames.some((chain) => navnLower.includes(chain))) continue;

        const normPhone = normalizePhone(phone);
        const normWebsite = website.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
        if (normPhone && usedPhones.has(normPhone)) continue;
        if (usedWebsites.has(normWebsite)) continue;

        leads.push({
          navn,
          adresse: place.formattedAddress || '',
          telefon: phone,
          nettside: website,
          by: city,
        });
      }

      pageToken = data.nextPageToken;
      pagesForCity += 1;
      await sleep(150);
    } while (pageToken && pagesForCity < 3 && leads.length < MAX_LEADS);

    console.log(`${city}: totalt ${leads.length} leads samlet så langt`);
  }

  const header = '"navn","adresse","telefon","nettside","by"';
  const rows = leads.map((l) =>
    `"${l.navn.replace(/"/g, '""')}","${l.adresse.replace(/"/g, '""')}","${l.telefon}","${l.nettside}","${l.by}"`
  );
  fs.writeFileSync(OUT_FILE, [header, ...rows].join('\n'), 'utf-8');
  console.log(`\nFerdig. ${leads.length} leads skrevet til:\n${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
