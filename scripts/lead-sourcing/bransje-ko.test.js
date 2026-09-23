const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { lastKo, aktivBransje, byttTilNesteBransje } = require('./bransje-ko');

function lagTestKo(dir) {
  const fil = path.join(dir, 'bransje-ko.json');
  fs.writeFileSync(fil, JSON.stringify({
    instantly_kampanje_url: 'https://app.instantly.ai/app/campaign/test/leads',
    aktiv_index: 0,
    bransjer: [
      { navn: 'Foerste', kilde: 'osm', osmTag: 'a=b', maxLeadsPerKjoring: 240, terskelForTom: 100 },
      { navn: 'Andre', kilde: 'places', sok: ['x'], maxLeadsPerKjoring: 240, terskelForTom: 100 },
    ],
  }, null, 2), 'utf-8');
  return fil;
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bransje-ko-test-'));
const fil = lagTestKo(dir);

const ko1 = lastKo(fil);
assert.strictEqual(aktivBransje(ko1).navn, 'Foerste');
console.log('OK: lastKo + aktivBransje gir riktig aktiv bransje');

byttTilNesteBransje(fil);
const ko2 = lastKo(fil);
assert.strictEqual(aktivBransje(ko2).navn, 'Andre');
console.log('OK: byttTilNesteBransje flytter til neste bransje i lista');

byttTilNesteBransje(fil);
const ko3 = lastKo(fil);
assert.strictEqual(aktivBransje(ko3).navn, 'Foerste', 'skal loope tilbake til start naar lista er tom');
console.log('OK: byttTilNesteBransje looper tilbake til index 0 etter siste bransje');

fs.rmSync(dir, { recursive: true, force: true });
console.log('\nAlle tester i bransje-ko.test.js passerte.');
