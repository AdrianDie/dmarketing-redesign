// Henter restaurant-leads UTEN nettside fra Google Places API (Text Search, New).
// Krever et minimum antall anmeldelser + rating for å luke ut useriøse/nyoppstartede/
// nesten-ikke-eksisterende steder, i tillegg til vanlig kjede-filter.
// Kjør: node fetch-restaurant-leads-uten-nettside.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error('Mangler GOOGLE_PLACES_API_KEY i .env');
  process.exit(1);
}

const MAX_LEADS = 1500;
const MIN_REVIEWS = 15;
const MIN_RATING = 3.5;
const LEADS_DIR = 'C:\\Users\\adria\\OneDrive\\Dietrichs Marketing\\Leads\\Instantly leads';
const EXCLUDE_FILE = path.join(LEADS_DIR, 'restaurantkjeder-IKKE-BRUK.csv');
const USED_FILE = path.join(LEADS_DIR, 'leads-med-nettside-DISSE_ER_OPPBRUKT.csv');
const OUT_FILE = path.join(LEADS_DIR, `restaurant-leads-uten-nettside-${new Date().toISOString().slice(0, 10)}.csv`);

const CITIES = [
  'Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Bærum', 'Kristiansand', 'Fredrikstad',
  'Sandnes', 'Tromsø', 'Sarpsborg', 'Skien', 'Ålesund', 'Sandefjord', 'Haugesund',
  'Tønsberg', 'Moss', 'Porsgrunn', 'Bodø', 'Arendal', 'Hamar', 'Larvik', 'Halden',
  'Lillehammer', 'Molde', 'Harstad', 'Kongsberg', 'Gjøvik', 'Askøy', 'Ringerike',
  'Horten', 'Askim', 'Kongsvinger', 'Steinkjer', 'Narvik', 'Levanger', 'Elverum',
  'Jessheim', 'Lillestrøm', 'Drammen', 'Ski', 'Kristiansund', 'Mo i Rana',
  'Alta', 'Egersund', 'Grimstad', 'Mandal', 'Flekkefjord', 'Farsund', 'Notodden',
  'Rjukan', 'Voss', 'Førde', 'Florø', 'Stryn', 'Volda', 'Sogndal', 'Otta',
  'Lillesand', 'Risør', 'Kragerø', 'Bamble', 'Nøtterøy', 'Stokke', 'Hokksund',
  'Vennesla', 'Søgne', 'Eigersund', 'Bryne', 'Klepp', 'Jørpeland', 'Karmøy',
  'Kopervik', 'Odda', 'Vossevangen', 'Nesbyen', 'Gol', 'Hønefoss', 'Jevnaker',
  'Hurdal', 'Nannestad', 'Eidsvoll', 'Raufoss', 'Fagernes', 'Otta', 'Vinstra',
  'Tynset', 'Røros', 'Namsos', 'Grong', 'Brønnøysund', 'Sandnessjøen', 'Mosjøen',
  'Fauske', 'Sortland', 'Stokmarknes', 'Finnsnes', 'Hammerfest', 'Kirkenes',
  'Vadsø', 'Honningsvåg',
];

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
        'places.rating',
        'places.userRatingCount',
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

  console.log(`Ekskluderingsliste: ${excludeNames.length} kjedenavn`);
  console.log(`Krav: minst ${MIN_REVIEWS} anmeldelser og rating ${MIN_RATING}+`);

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
        const rating = place.rating || 0;
        const reviews = place.userRatingCount || 0;

        if (website) continue; // vi vil ha de UTEN nettside nå
        if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') continue;
        if (reviews < MIN_REVIEWS || rating < MIN_RATING) continue; // luk ut useriøse/ukjente

        const navnLower = navn.toLowerCase();
        if (excludeNames.some((chain) => navnLower.includes(chain))) continue;

        const normPhone = normalizePhone(phone);
        if (normPhone && usedPhones.has(normPhone)) continue;

        leads.push({
          navn,
          adresse: place.formattedAddress || '',
          telefon: phone,
          rating,
          antall_anmeldelser: reviews,
          by: city,
        });
      }

      pageToken = data.nextPageToken;
      pagesForCity += 1;
      await sleep(150);
    } while (pageToken && pagesForCity < 3 && leads.length < MAX_LEADS);

    console.log(`${city}: totalt ${leads.length} leads samlet så langt`);
  }

  const header = '"navn","adresse","telefon","rating","antall_anmeldelser","by"';
  const rows = leads.map((l) =>
    `"${l.navn.replace(/"/g, '""')}","${l.adresse.replace(/"/g, '""')}","${l.telefon}","${l.rating}","${l.antall_anmeldelser}","${l.by}"`
  );
  fs.writeFileSync(OUT_FILE, [header, ...rows].join('\n'), 'utf-8');
  console.log(`\nFerdig. ${leads.length} leads skrevet til:\n${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
