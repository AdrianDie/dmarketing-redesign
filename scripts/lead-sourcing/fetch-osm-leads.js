// Henter leads fra OpenStreetMap sin Overpass API (gratis, ingen nøkkel) for en
// gitt bransje-tag. Bruk: node fetch-osm-leads.js <Bransjenavn> <tag=verdi> [max-leads]
// Eksempel: node fetch-osm-leads.js Campingplasser tourism=camp_site 240
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
