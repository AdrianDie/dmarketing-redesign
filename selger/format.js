/**
 * Rene hjelpefunksjoner delt av selgersidene. Ingen DOM, ingen nettverk,
 * saa de kan testes rett i node. Se tests/format.test.js.
 *
 * Provisjonstrappen ligger BEGGE steder: her (for visning) og i Apps Script
 * (for utregning av penger). Testene laaser at de to er enige.
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** Bare siffer, uten 47-prefiks. Tom streng hvis det ikke blir 8 siffer. */
  function normTlf(v) {
    var d = String(v == null ? '' : v).replace(/\D/g, '');
    if (d.indexOf('0047') === 0) d = d.slice(4);
    else if (d.length === 10 && d.indexOf('47') === 0) d = d.slice(2);
    return d.length === 8 ? d : '';
  }

  /** 12345678 -> "123 45 678". Ugyldige numre vises som de er. */
  function pentTlf(v) {
    var d = normTlf(v);
    return d ? d.slice(0, 3) + ' ' + d.slice(3, 5) + ' ' + d.slice(5) : String(v == null ? '' : v);
  }

  function telLenke(v) {
    return 'tel:+47' + String(v == null ? '' : v).replace(/\D/g, '');
  }

  /** "2026-07-24" -> "24. jul". Tom eller ugyldig gir tom/uendret. */
  function pentDato(d) {
    if (!d) return '';
    var deler = String(d).slice(0, 10).split('-');
    if (deler.length !== 3) return String(d);
    var mnd = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
    var m = Number(deler[1]);
    if (!(m >= 1 && m <= 12)) return String(d);
    return Number(deler[2]) + '. ' + mnd[m - 1];
  }

  function kr(n) {
    return new Intl.NumberFormat('nb-NO').format(Math.round(n || 0)) + ' kr';
  }

  // maanedlig trapp: 0-9 = 15 %, 10-19 = 20 %, 20-29 = 25 %, 30+ = 30 %
  var TRAPP = [
    { fra: 0, til: 10, sats: 0.15 },
    { fra: 10, til: 20, sats: 0.20 },
    { fra: 20, til: 30, sats: 0.25 },
    { fra: 30, til: null, sats: 0.30 }
  ];

  /** Alt om provisjon for et gitt antall betalte salg. */
  function provisjon(betalte) {
    var b = Math.max(0, Math.floor(Number(betalte) || 0));
    var trinn = TRAPP.filter(function (t) {
      return b >= t.fra && (t.til === null || b < t.til);
    })[0];
    return {
      sats: trinn.sats,
      tilNeste: trinn.til === null ? 0 : trinn.til - b,
      paaTopp: trinn.til === null,
      iTrinnet: b - trinn.fra,
      trinnStorrelse: trinn.til === null ? 0 : trinn.til - trinn.fra
    };
  }

  /**
   * Maalestokken: selgerens EGEN rytme. Hvor mange samtaler der han naadde fram
   * ligger det bak én booking, og hvor langt inne i den runden staar han naa.
   *
   * Bevisst ikke lagets snitt: ett felles tall blir en skjult rangering, der den
   * svakeste alltid ligger over det og den sterkeste alltid under.
   *
   * Nevneren er samtaler der han naadde noen, ikke oppringninger. Ingen svar er
   * flaks. Det gir et mindre og sannere tall, og en stolpe som beveger seg.
   *
   * Uten en eneste booking finnes det ingen rytme aa maale mot, og da sier vi
   * det heller enn aa dikte opp et tall (har = false).
   */
  function maalestokk(naaddTotalt, bookTotalt, sidenSist) {
    var r = Math.max(0, Math.floor(Number(naaddTotalt) || 0));
    var b = Math.max(0, Math.floor(Number(bookTotalt) || 0));
    var inne = Math.max(0, Math.floor(Number(sidenSist) || 0));
    if (b < 1 || r < 1) return { har: false, snitt: 0, igjen: 0, pst: 0, inne: inne };
    var snitt = Math.max(1, Math.round(r / b));
    return {
      har: true,
      snitt: snitt,
      igjen: Math.max(0, snitt - inne),
      pst: Math.max(0, Math.min(100, Math.round(inne / snitt * 100))),
      inne: inne
    };
  }

  /**
   * Én linje i kvitteringssloyfa: hva skjedde med bookingen etter at den ble sendt.
   * Tom streng betyr "ingen nyhet" (fersk booking eller ukjent status), og de
   * linjene skal ikke vises.
   */
  function hendelseTekst(status, bedrift) {
    var navn = String(bedrift == null ? '' : bedrift);
    switch (status) {
      case 'utkast_laget':    return 'Adrian lager utkastet til ' + navn;
      case 'sendt_til_kunde': return 'Adrian sendte utkastet til ' + navn;
      case 'godtatt':         return navn + ' takket ja';
      case 'betalt':          return navn + ' har betalt';
      case 'tapt':            return navn + ' ble det ikke noe av';
      default:                return '';
    }
  }

  var API = { esc: esc, normTlf: normTlf, pentTlf: pentTlf, telLenke: telLenke,
              pentDato: pentDato, kr: kr, provisjon: provisjon, TRAPP: TRAPP,
              maalestokk: maalestokk, hendelseTekst: hendelseTekst };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  global.Fmt = API;
})(typeof window !== 'undefined' ? window : this);
