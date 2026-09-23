// Delt dedup-logikk for alle fetch-scriptene: tre nøkler (telefon, nettside, epost),
// delt paa tvers av ALLE bransjer via samme "oppbrukt"-fil + alle tidligere
// bransje-CSV-er i samme mappe. Se docs/superpowers/specs/2026-09-23-instantly-lead-automasjon-design.md.
const fs = require('fs');
const path = require('path');

const LEADS_DIR = 'C:\\Users\\adria\\OneDrive\\Dietrichs Marketing\\Leads\\Instantly leads';
const USED_FILENAME = 'leads-med-nettside-DISSE_ER_OPPBRUKT.csv';

function normalizePhone(p) {
  return (p || '').replace(/[^\d]/g, '').replace(/^47/, '');
}

function normalizeWebsite(w) {
  return (w || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function normalizeEmail(e) {
  return (e || '').trim().toLowerCase();
}

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

function loadUsedKeys(leadsDir = LEADS_DIR) {
  const usedFile = path.join(leadsDir, USED_FILENAME);
  const telefoner = new Set(parseCsvColumn(usedFile, 'telefon').map(normalizePhone).filter(Boolean));
  const nettsider = new Set(parseCsvColumn(usedFile, 'nettside').map(normalizeWebsite).filter(Boolean));
  const eposter = new Set(parseCsvColumn(usedFile, 'epost').map(normalizeEmail).filter(Boolean));

  const previousFiles = fs.readdirSync(leadsDir)
    .filter((f) => /-leads-.*\.csv$/i.test(f) && f !== USED_FILENAME)
    .map((f) => path.join(leadsDir, f));

  for (const file of previousFiles) {
    parseCsvColumn(file, 'telefon').map(normalizePhone).forEach((v) => v && telefoner.add(v));
    parseCsvColumn(file, 'nettside').map(normalizeWebsite).forEach((v) => v && nettsider.add(v));
    parseCsvColumn(file, 'epost').map(normalizeEmail).forEach((v) => v && eposter.add(v));
  }

  return { telefoner, nettsider, eposter };
}

function erAlleredeBrukt(lead, nokler) {
  const tlf = normalizePhone(lead.telefon);
  const web = normalizeWebsite(lead.nettside);
  const epost = normalizeEmail(lead.epost);
  if (tlf && nokler.telefoner.has(tlf)) return true;
  if (web && nokler.nettsider.has(web)) return true;
  if (epost && nokler.eposter.has(epost)) return true;
  return false;
}

function registrerNyeLeads(leads, leadsDir = LEADS_DIR) {
  const usedFile = path.join(leadsDir, USED_FILENAME);
  const exists = fs.existsSync(usedFile);
  const header = '"epost","navn","telefon","nettside"';
  const rows = leads.map((l) =>
    `"${(l.epost || '').replace(/"/g, '""')}","${(l.navn || '').replace(/"/g, '""')}","${(l.telefon || '').replace(/"/g, '""')}","${(l.nettside || '').replace(/"/g, '""')}"`
  );
  const content = exists ? '\n' + rows.join('\n') : [header, ...rows].join('\n');
  fs.appendFileSync(usedFile, content, 'utf-8');
}

module.exports = {
  normalizePhone, normalizeWebsite, normalizeEmail,
  loadUsedKeys, erAlleredeBrukt, registrerNyeLeads, parseCsvColumn,
};
