// Besøker nettsiden til hver lead og prøver å finne en kontakt-epost
// (mailto-lenke først, ellers regex i HTML på forsiden og evt. kontaktside).
// Gratis, ingen API-krediter — treffraten er lavere enn en betalt enrichment-tjeneste.
// Kjør: node scrape-emails.js <input.csv> <output.csv>
const fs = require('fs');

const [, , inFile, outFile] = process.argv;
if (!inFile || !outFile) {
  console.error('Bruk: node scrape-emails.js <input.csv> <output.csv>');
  process.exit(1);
}

const CONCURRENCY = 15;
const TIMEOUT_MS = 8000;
const CONTACT_PATHS = ['/kontakt', '/kontakt-oss', '/contact', '/om-oss', '/about'];

const GENERIC_EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const JUNK_PATTERNS = [
  /sentry/i, /wixpress/i, /example\.com/i, /\.png$/i, /\.jpg$/i, /schema\.org/i,
  /godaddy/i, /w3\.org/i, /@2x/i, /placeholder/i, /noreply/i, /no-reply/i,
  /user@domain\.com/i, /@domain\.com/i, /@restaurantly\.com/i, /@yourdomain/i,
  /@dinbedrift/i, /@bookingapp/i, /@simplybook/i, /@opentable\.com/i,
];

function siteDomain(website) {
  try {
    const host = new URL(/^https?:\/\//i.test(website) ? website : 'https://' + website).hostname;
    return host.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function parseCsv(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const header = lines[0].split('","').map((h) => h.replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const cols = line.split('","').map((c) => c.replace(/^"|"$/g, ''));
    const row = {};
    header.forEach((h, i) => { row[h] = cols[i] || ''; });
    return row;
  });
  return { header, rows };
}

function extractEmail(html, domain) {
  const candidates = [];

  const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (mailtoMatch) candidates.push(mailtoMatch[1]);

  const matches = html.match(GENERIC_EMAIL_RE) || [];
  candidates.push(...matches);

  const clean = candidates.filter((m) => !JUNK_PATTERNS.some((re) => re.test(m)));
  if (!clean.length) return '';

  const onDomain = domain ? clean.find((m) => m.toLowerCase().endsWith('@' + domain)) : null;
  return onDomain || clean[0];
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadResearchBot/1.0)' },
    });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

async function findEmailForSite(website) {
  let url = website.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  const domain = siteDomain(website);

  const homeHtml = await fetchWithTimeout(url);
  let email = homeHtml ? extractEmail(homeHtml, domain) : '';
  if (email) return email;

  const base = url.replace(/\/$/, '');
  for (const p of CONTACT_PATHS) {
    const html = await fetchWithTimeout(base + p);
    if (!html) continue;
    email = extractEmail(html, domain);
    if (email) return email;
  }
  return '';
}

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, runner));
  return results;
}

async function main() {
  const { rows } = parseCsv(fs.readFileSync(inFile, 'utf-8'));
  console.log(`Leser ${rows.length} leads fra ${inFile}`);

  let done = 0;
  let found = 0;
  const emails = await runPool(rows, async (row) => {
    const email = row.nettside ? await findEmailForSite(row.nettside) : '';
    done += 1;
    if (email) found += 1;
    if (done % 50 === 0) console.log(`${done}/${rows.length} behandlet, ${found} epost funnet`);
    return email;
  }, CONCURRENCY);

  const header = '"navn","adresse","telefon","nettside","by","epost"';
  const outRows = rows.map((row, i) =>
    `"${(row.navn || '').replace(/"/g, '""')}","${(row.adresse || '').replace(/"/g, '""')}","${row.telefon || ''}","${row.nettside || ''}","${row.by || ''}","${emails[i]}"`
  );
  fs.writeFileSync(outFile, [header, ...outRows].join('\n'), 'utf-8');
  console.log(`\nFerdig. ${found}/${rows.length} fikk epost. Skrevet til:\n${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
