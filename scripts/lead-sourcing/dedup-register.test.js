const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  normalizePhone, normalizeWebsite, normalizeEmail,
  loadUsedKeys, erAlleredeBrukt, registrerNyeLeads,
} = require('./dedup-register');

function lagTestMappe() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dedup-test-'));
  fs.writeFileSync(
    path.join(dir, 'leads-med-nettside-DISSE_ER_OPPBRUKT.csv'),
    '"epost","navn","telefon","nettside"\n"gammel@eksempel.no","Gammel AS","12345678","eksempel.no"\n',
    'utf-8'
  );
  fs.writeFileSync(
    path.join(dir, 'restaurant-leads-nye-2026-08-03.csv'),
    '"navn","adresse","telefon","nettside","by"\n"Annen Restaurant","Gate 1","87654321","annenrest.no","Oslo"\n',
    'utf-8'
  );
  return dir;
}

assert.strictEqual(normalizePhone('+47 123 45 678'), '12345678');
assert.strictEqual(normalizePhone('123-45-678'), '12345678');
console.log('OK: normalizePhone');

assert.strictEqual(normalizeWebsite('https://www.Eksempel.no/'), 'eksempel.no');
console.log('OK: normalizeWebsite');

assert.strictEqual(normalizeEmail(' Info@Eksempel.NO '), 'info@eksempel.no');
console.log('OK: normalizeEmail');

const dir = lagTestMappe();
const nokler = loadUsedKeys(dir);
assert.ok(nokler.telefoner.has('12345678'), 'skal finne telefon fra oppbrukt-fila');
assert.ok(nokler.nettsider.has('eksempel.no'), 'skal finne nettside fra oppbrukt-fila');
assert.ok(nokler.eposter.has('gammel@eksempel.no'), 'skal finne epost fra oppbrukt-fila');
assert.ok(nokler.telefoner.has('87654321'), 'skal ogsaa finne telefon fra tidligere bransje-CSV');
console.log('OK: loadUsedKeys leser flere kilder');

assert.strictEqual(erAlleredeBrukt({ telefon: '12345678', nettside: 'ny.no', epost: 'ny@ny.no' }, nokler), true);
assert.strictEqual(erAlleredeBrukt({ telefon: '99999999', nettside: 'annenrest.no', epost: 'ny@ny.no' }, nokler), true);
assert.strictEqual(erAlleredeBrukt({ telefon: '11111111', nettside: 'helt-ny.no', epost: 'helt-ny@ny.no' }, nokler), false);
console.log('OK: erAlleredeBrukt sjekker alle tre nøkler');

registrerNyeLeads([{ epost: 'ny@ny.no', navn: 'Ny AS', telefon: '11111111', nettside: 'helt-ny.no' }], dir);
const nyeNokler = loadUsedKeys(dir);
assert.ok(nyeNokler.eposter.has('ny@ny.no'), 'ny lead skal vaere registrert etter registrerNyeLeads');
console.log('OK: registrerNyeLeads');

fs.rmSync(dir, { recursive: true, force: true });
console.log('\nAlle tester i dedup-register.test.js passerte.');
