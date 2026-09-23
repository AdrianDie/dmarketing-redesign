// Playwright-automatisering mot Instantly sitt web-UI (API-nøkkelen er
// 401 Unauthorized, se spec). Sletter leads som har fullført sekvensen uten
// svar, og laster opp nye leads. Ingen egen backup her, med vilje -
// leads-med-nettside-DISSE_ER_OPPBRUKT.csv ER registeret (Adrians valg
// 23.09.2026).
// Bruk: node instantly-sync.js <nye-leads.csv> <kampanje-url>
require('dotenv').config();
const { chromium } = require('playwright');

const INSTANTLY_EMAIL = process.env.INSTANTLY_EMAIL;
const INSTANTLY_PASSWORD = process.env.INSTANTLY_PASSWORD;

async function loggInn(page) {
  await page.goto('https://app.instantly.ai/auth/login');
  await page.fill('input[name="email"]', INSTANTLY_EMAIL);
  await page.fill('input[name="password"]', INSTANTLY_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app/**', { timeout: 30000 });
}

async function slettFullforteLeads(page, kampanjeUrl) {
  await page.goto(kampanjeUrl);
  await page.waitForSelector('text=Leads', { timeout: 30000 });

  const totalTekst = await page.locator('span').filter({ hasText: /^\d+$/ }).first().textContent();
  const totalFor = Number(totalTekst);

  await page.getByRole('button', { name: 'Filters' }).click();
  await page.getByRole('button', { name: 'All statuses' }).click();
  await page.getByRole('menuitem', { name: 'Completed, No reply' }).click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  const filtrertTekst = await page.locator('span').filter({ hasText: /^\d+$/ }).first().textContent();
  const antallFiltrert = Number(filtrertTekst);

  // KRITISK sikkerhetssjekk (se feedback-instantly-slett-riktig-filter i
  // minnet, hendelsen 23.09.2026): hvis filteret ikke faktisk har redusert
  // antallet leads (eller kampanjen er tom fra før), IKKE fortsett til
  // select-all+delete - det er akkurat denne situasjonen som førte til at
  // 586 leads (67 med svar) ble slettet uten filter forrige gang.
  if (totalFor > 0 && antallFiltrert >= totalFor) {
    throw new Error(
      `Filter "Completed, No reply" ga ingen reduksjon (${antallFiltrert}/${totalFor} leads). ` +
      'Avbryter i stedet for å risikere å slette leads som har svart. Sjekk filteret manuelt i Instantly-UI.'
    );
  }
  if (antallFiltrert === 0) {
    return { antallSlettet: 0 };
  }

  await page.getByRole('checkbox', { name: 'primary checkbox' }).click();
  const velgAlle = page.getByText(/Select all results \(\d+\)/);
  if (await velgAlle.count() > 0) {
    await velgAlle.click();
  }
  await page.getByRole('button', { name: /Row actions/ }).click();
  await page.getByRole('menuitem', { name: 'Delete selected' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await page.waitForSelector('text=Leads deleted', { timeout: 30000 });

  return { antallSlettet: antallFiltrert };
}

async function lastOppNyeLeads(page, csvFil) {
  const uploadKnapp = page.getByRole('button', { name: 'Upload CSV' });
  if (await uploadKnapp.count() === 0) {
    await page.getByRole('button', { name: 'Add Leads' }).click();
    await page.getByRole('button', { name: 'Upload CSV' }).click();
  } else {
    await uploadKnapp.click();
  }

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(csvFil);
  await page.waitForSelector('text=/Detected \\d+ data rows/', { timeout: 30000 });

  const antallMatch = (await page.locator('text=/Detected \\d+ data rows/').textContent()).match(/(\d+)/);
  const antallDetektert = antallMatch ? Number(antallMatch[1]) : 0;

  // Kolonnemapping - rekkefølgen matcher CSV-headeren fra kjor-runde.js
  // ("navn","adresse","telefon","nettside","by","epost"). Bruker synlig
  // kolonnenavn i UI-et for å velge riktig dropdown, ikke posisjon.
  const mapping = [
    ['navn', 'Company Name'],
    ['telefon', 'Phone'],
    ['nettside', 'Website'],
    ['by', 'Location'],
    ['epost', 'Email'],
  ];
  for (const [kolonne, type] of mapping) {
    const rad = page.locator('div', { hasText: new RegExp(`^${kolonne}$`) }).first();
    await rad.locator('..').getByRole('button', { name: 'Do not import' }).click();
    await page.getByRole('option', { name: type, exact: true }).click();
  }

  await page.getByRole('button', { name: 'UPLOAD ALL' }).click();
  await page.waitForSelector('text=Contacts uploaded!', { timeout: 30000 });

  return { antallLastetOpp: antallDetektert };
}

async function kjorSync(csvFil, kampanjeUrl) {
  if (!INSTANTLY_EMAIL || !INSTANTLY_PASSWORD) {
    throw new Error('Mangler INSTANTLY_EMAIL/INSTANTLY_PASSWORD i .env');
  }
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await loggInn(page);
    const { antallSlettet } = await slettFullforteLeads(page, kampanjeUrl);
    const { antallLastetOpp } = await lastOppNyeLeads(page, csvFil);
    return { antallSlettet, antallLastetOpp };
  } finally {
    await browser.close();
  }
}

module.exports = { kjorSync };

if (require.main === module) {
  const [, , csvFil, kampanjeUrl] = process.argv;
  if (!csvFil || !kampanjeUrl) {
    console.error('Bruk: node instantly-sync.js <nye-leads.csv> <kampanje-url>');
    process.exit(1);
  }
  kjorSync(csvFil, kampanjeUrl)
    .then((r) => console.log('Ferdig:', r))
    .catch((err) => { console.error(err); process.exit(1); });
}
