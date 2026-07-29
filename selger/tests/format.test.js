/**
 * Tester for de rene hjelpefunksjonene i selger/format.js.
 * Kjor:  node selger/tests/format.test.js
 * Ingen avhengigheter, ingen npm install.
 */
var assert = require('assert');
var Fmt = require('../format.js');

var antall = 0, feil = 0;
function test(navn, fn) {
  antall++;
  try { fn(); }
  catch (e) { feil++; console.log('  FEIL: ' + navn + '\n        ' + e.message); }
}

/* ---------------------------------------------------------------- normTlf */
test('normTlf: rent 8-sifret staar', function () {
  assert.strictEqual(Fmt.normTlf('97262222'), '97262222');
});
test('normTlf: fjerner mellomrom', function () {
  assert.strictEqual(Fmt.normTlf('972 62 222'), '97262222');
});
test('normTlf: fjerner +47', function () {
  assert.strictEqual(Fmt.normTlf('+4797262222'), '97262222');
});
test('normTlf: fjerner 0047', function () {
  assert.strictEqual(Fmt.normTlf('004797262222'), '97262222');
});
test('normTlf: for kort gir tom', function () {
  assert.strictEqual(Fmt.normTlf('1234'), '');
});
test('normTlf: for langt uten prefiks gir tom', function () {
  assert.strictEqual(Fmt.normTlf('123456789012'), '');
});
test('normTlf: null gir tom', function () {
  assert.strictEqual(Fmt.normTlf(null), '');
});

/* ---------------------------------------------------------------- pentTlf */
test('pentTlf: grupperer 3-2-3', function () {
  assert.strictEqual(Fmt.pentTlf('97262222'), '972 62 222');
});
test('pentTlf: normaliserer foerst', function () {
  assert.strictEqual(Fmt.pentTlf('+47 972 62 222'), '972 62 222');
});

/* -------------------------------------------------------------- telLenke */
test('telLenke: bygger tel-url med +47', function () {
  assert.strictEqual(Fmt.telLenke('972 62 222'), 'tel:+4797262222');
});

/* -------------------------------------------------------------- pentDato */
test('pentDato: iso til norsk kort', function () {
  assert.strictEqual(Fmt.pentDato('2026-07-24'), '24. jul');
});
test('pentDato: januar', function () {
  assert.strictEqual(Fmt.pentDato('2026-01-05'), '5. jan');
});
test('pentDato: tom gir tom', function () {
  assert.strictEqual(Fmt.pentDato(''), '');
});
test('pentDato: soppel gir uendret', function () {
  assert.strictEqual(Fmt.pentDato('i gaar'), 'i gaar');
});

/* -------------------------------------------------------------------- esc */
test('esc: skjermer html', function () {
  assert.strictEqual(Fmt.esc('<b>&"'), '&lt;b&gt;&amp;&quot;');
});
test('esc: null gir tom', function () {
  assert.strictEqual(Fmt.esc(null), '');
});

/* --------------------------------------------------------------- provisjon */
test('provisjon: 0 salg gir 15 prosent', function () {
  assert.strictEqual(Fmt.provisjon(0).sats, 0.15);
});
test('provisjon: 9 salg gir fortsatt 15', function () {
  assert.strictEqual(Fmt.provisjon(9).sats, 0.15);
});
test('provisjon: 10 salg gir 20', function () {
  assert.strictEqual(Fmt.provisjon(10).sats, 0.20);
});
test('provisjon: 20 salg gir 25', function () {
  assert.strictEqual(Fmt.provisjon(20).sats, 0.25);
});
test('provisjon: 30 salg gir 30', function () {
  assert.strictEqual(Fmt.provisjon(30).sats, 0.30);
});
test('provisjon: 100 salg gir fortsatt 30', function () {
  assert.strictEqual(Fmt.provisjon(100).sats, 0.30);
});
test('provisjon: til neste fra 3 er 7', function () {
  assert.strictEqual(Fmt.provisjon(3).tilNeste, 7);
});
test('provisjon: til neste fra 10 er 10', function () {
  assert.strictEqual(Fmt.provisjon(10).tilNeste, 10);
});
test('provisjon: paa topp har tilNeste 0', function () {
  assert.strictEqual(Fmt.provisjon(30).tilNeste, 0);
  assert.strictEqual(Fmt.provisjon(30).paaTopp, true);
});
test('provisjon: fremdrift i trinnet', function () {
  var p = Fmt.provisjon(3);
  assert.strictEqual(p.iTrinnet, 3);
  assert.strictEqual(p.trinnStorrelse, 10);
});
test('provisjon: negativt behandles som 0', function () {
  assert.strictEqual(Fmt.provisjon(-4).sats, 0.15);
});

/* --------------------------------------------- paritet med Worker */
// Kopi av formelen i workerens hentTall(). Testen faller hvis de to trappene
// drifter fra hverandre, saa pengene selgeren ser alltid stemmer med visningen.
function gasSats(b) {
  return b >= 30 ? 0.30 : b >= 20 ? 0.25 : b >= 10 ? 0.20 : 0.15;
}
function gasTilNeste(b) {
  return b >= 30 ? 0 : b >= 20 ? 30 - b : b >= 10 ? 20 - b : 10 - b;
}
test('Apps Script og visning er enige om sats og tilNeste', function () {
  for (var b = 0; b <= 35; b++) {
    var p = Fmt.provisjon(b);
    assert.strictEqual(p.sats, gasSats(b), 'sats ved ' + b);
    assert.strictEqual(p.tilNeste, gasTilNeste(b), 'tilNeste ved ' + b);
  }
});

/* ------------------------------------------------------------- maalestokk */
test('maalestokk: uten bookinger finnes ingen maalestokk', function () {
  var m = Fmt.maalestokk(40, 0, 40);
  assert.strictEqual(m.har, false);
  assert.strictEqual(m.snitt, 0);
});
test('maalestokk: uten samtaler finnes ingen maalestokk', function () {
  assert.strictEqual(Fmt.maalestokk(0, 0, 0).har, false);
});
test('maalestokk: snitt er samtaler delt paa bookinger', function () {
  var m = Fmt.maalestokk(68, 2, 0);
  assert.strictEqual(m.snitt, 34);
});
test('maalestokk: snitt rundes til naermeste hele', function () {
  assert.strictEqual(Fmt.maalestokk(100, 3, 0).snitt, 33);
});
test('maalestokk: snitt blir aldri null', function () {
  assert.strictEqual(Fmt.maalestokk(1, 5, 0).snitt, 1);
});
test('maalestokk: igjen teller nedover fra snittet', function () {
  var m = Fmt.maalestokk(68, 2, 19);
  assert.strictEqual(m.igjen, 15);
  assert.strictEqual(m.pst, 56);
});
test('maalestokk: passert snittet gir null igjen, ikke negativt', function () {
  var m = Fmt.maalestokk(68, 2, 50);
  assert.strictEqual(m.igjen, 0);
  assert.strictEqual(m.pst, 100);
});
test('maalestokk: taaler soppel inn', function () {
  var m = Fmt.maalestokk(null, undefined, 'tull');
  assert.strictEqual(m.har, false);
  assert.strictEqual(m.inne, 0);
});

/* ----------------------------------------------------------- hendelseTekst */
test('hendelseTekst: fersk booking er ingen nyhet', function () {
  assert.strictEqual(Fmt.hendelseTekst('sendt', 'Blomsterbua'), '');
});
test('hendelseTekst: ukjent status gir tom', function () {
  assert.strictEqual(Fmt.hendelseTekst('noe_rart', 'Blomsterbua'), '');
});
test('hendelseTekst: utkast sendt nevner Adrian', function () {
  assert.strictEqual(Fmt.hendelseTekst('sendt_til_kunde', 'Blomsterbua'),
    'Adrian sendte utkastet til Blomsterbua');
});
test('hendelseTekst: ja fra kunden', function () {
  assert.strictEqual(Fmt.hendelseTekst('godtatt', 'Kyrre Profil'), 'Kyrre Profil takket ja');
});
test('hendelseTekst: betalt', function () {
  assert.strictEqual(Fmt.hendelseTekst('betalt', 'Kyrre Profil'), 'Kyrre Profil har betalt');
});
test('hendelseTekst: tapt sies noytralt', function () {
  assert.strictEqual(Fmt.hendelseTekst('tapt', 'Kyrre Profil'), 'Kyrre Profil ble det ikke noe av');
});

/* -------------------------------------------------------------------- sum */
console.log('\n' + (antall - feil) + '/' + antall + ' tester passerte.');
process.exit(feil ? 1 : 0);
