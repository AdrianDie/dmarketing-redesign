// Generalisert Google Places-henter (New, searchText) for bransjer uten god nok
// OSM-dekning til å bruke fetch-osm-leads.js. Bruk:
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
