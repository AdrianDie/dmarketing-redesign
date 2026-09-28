// ÉN GANG, kjøres av Adrian selv (ikke av automasjonen): åpner en synlig
// nettleser der HAN logger inn på Instantly med "Log in with Google"
// (dietrichs.mkt@gmail.com) manuelt. Lagrer den innloggede økten til
// instantly-session.json, som instantly-sync.js gjenbruker for alle
// fremtidige automatiske kjøringer - ingen passord lagres noe sted, siden
// kontoen kun bruker Google-innlogging (ikke epost+passord).
//
// Kjør: node login-setup.js
// Deretter: logg inn manuelt i vinduet som åpner seg, vent til du ser
// leads-siden for en kampanje, og trykk Enter i terminalen.
const { chromium } = require('playwright');
const path = require('path');
const readline = require('readline');

const SESSION_FIL = path.join(__dirname, 'instantly-session.json');

function ventPaaEnter(melding) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(melding, () => { rl.close(); resolve(); });
  });
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://app.instantly.ai/auth/login');

  console.log('\nEt nettleservindu er åpnet. Logg inn med "Log in with Google"');
  console.log('(dietrichs.mkt@gmail.com) manuelt i det vinduet.');
  await ventPaaEnter('Trykk Enter her i terminalen når du er ferdig innlogget og ser Instantly-dashbordet...\n');

  await context.storageState({ path: SESSION_FIL });
  console.log(`Økt lagret til: ${SESSION_FIL}`);
  console.log('Fremtidige automatiske kjøringer bruker nå denne økten - ingen ny innlogging nødvendig før den utløper.');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
