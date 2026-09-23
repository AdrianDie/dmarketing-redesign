// Leser/skriver bransje-ko.json og styrer hvilken bransje som er aktiv.
const fs = require('fs');

function lastKo(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function lagreKo(filePath, ko) {
  fs.writeFileSync(filePath, JSON.stringify(ko, null, 2), 'utf-8');
}

function aktivBransje(ko) {
  return ko.bransjer[ko.aktiv_index];
}

function byttTilNesteBransje(filePath) {
  const ko = lastKo(filePath);
  ko.aktiv_index = (ko.aktiv_index + 1) % ko.bransjer.length;
  lagreKo(filePath, ko);
  return ko;
}

module.exports = { lastKo, lagreKo, aktivBransje, byttTilNesteBransje };
