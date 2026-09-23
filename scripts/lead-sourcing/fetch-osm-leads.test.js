const assert = require('assert');
const { byggAdresse } = require('./fetch-osm-leads');

assert.strictEqual(
  byggAdresse({ 'addr:street': 'Storgata', 'addr:housenumber': '5', 'addr:postcode': '0155', 'addr:city': 'Oslo' }),
  'Storgata 5, 0155 Oslo'
);
console.log('OK: byggAdresse med full adresse');

assert.strictEqual(byggAdresse({ 'addr:city': 'Bergen' }), 'Bergen');
console.log('OK: byggAdresse med kun by');

assert.strictEqual(byggAdresse({}), '');
console.log('OK: byggAdresse uten adressefelt');

console.log('\nAlle tester i fetch-osm-leads.test.js passerte.');
