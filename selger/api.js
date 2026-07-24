(function () {
  // ============================================================
  //  Datalag. Regnearket er databasen, Apps Script er API-et.
  //
  //  Hvorfor Sheets og ikke en egen database: Adrian skal kunne
  //  aapne leadsene, rette en telefon og sette en booking til Betalt
  //  uten aa spoerre noen. Data eies der han allerede jobber.
  //
  //  Apps Script bruker gjerne 1 til 2 sekunder per kall. Derfor
  //  oppdaterer sidene skjermen med én gang og sender i bakgrunnen.
  //  Feiler kallet, rulles endringen tilbake i grensesnittet.
  // ============================================================

  var ENDEPUNKT = 'ERSTATT_MED_WEB_APP_URL';

  var DEMO = {
    tall: {
      ringt_i_dag: 23, ringt_totalt: 147, igjen_i_bunke: 18, ring_igjen: 9,
      bookinger_uke: 4, bookinger_totalt: 11, bookingrate: 0.075, betalte: 3,
      opptjent: 1755, pipeline: 4680, sats: 0.15, til_neste: 2,
      aktiv_bunke: 'Frisør - Oslo og Bærum'
    },
    bunker: [
      { navn: 'Frisør - Oslo og Bærum', igjen: 18, totalt: 21 },
      { navn: 'Frisør - Rogaland', igjen: 11, totalt: 11 },
      { navn: 'Frisør - Vestland og Møre', igjen: 13, totalt: 13 },
      { navn: 'Frisør - Trøndelag og Nord-Norge', igjen: 0, totalt: 14 }
    ],
    leads: [
      { id: 1, bedrift: 'BEAUTY VIBES AS', sted: 'Oslo', bransje: 'Frisering og barbering',
        telefon: '97262222', nettside: 'beautyvibes.no', status: 'ikke_ringt' },
      { id: 2, bedrift: 'DE NADA FRISØR AS', sted: 'Oslo', bransje: 'Frisering og barbering',
        telefon: '98129816', nettside: 'denadafrisor.no', nyetablert: true, status: 'ikke_ringt' },
      { id: 3, bedrift: 'HAAR OSLO', sted: 'Oslo', bransje: 'Frisering og barbering',
        telefon: '90778781', nettside: '', status: 'ikke_ringt' },
      { id: 4, bedrift: 'HEXAGON FRISØR AS', sted: 'Oslo', bransje: 'Frisering og barbering',
        telefon: '92462676', nettside: 'hexagonfrisor.no', status: 'ingen_svar' },
      { id: 5, bedrift: 'ARTISTINA STUDIO', sted: 'Fornebu', bransje: 'Frisering og barbering',
        telefon: '92011481', nettside: 'artistina-studio.no', status: 'ikke_ringt' }
    ],
    bookinger: [
      { dato: '2026-07-22', bedrift: 'DE NADA FRISØR AS', kontakt: 'Kari',
        status: 'sendt_til_kunde', notat: '' },
      { dato: '2026-07-20', bedrift: 'ECO CULT AS', kontakt: 'Mats',
        status: 'betalt', notat: 'Ville ha ny side før høsten.' }
    ]
  };

  function erDemo() { return window.SELGER && window.SELGER.demo; }

  function demo(navn) {
    return new Promise(function (ok) {
      setTimeout(function () { ok(navn ? DEMO[navn] : { ok: true }); }, 260);
    });
  }

  /**
   * Apps Script svarer ikke paa CORS-preflight. Derfor sendes alt som
   * text/plain, som er en "enkel" foresporsel nettleseren slipper gjennom
   * uten preflight. Innholdet er fortsatt JSON.
   */
  function be(data) {
    var token = (window.SELGER && window.SELGER.token) || '';
    return fetch(ENDEPUNKT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ token: token }, data))
    }).then(function (r) {
      if (!r.ok) throw new Error('Serverfeil ' + r.status);
      return r.json();
    }).then(function (svar) {
      if (svar && svar.error === 'ikke_innlogget') {
        localStorage.removeItem('selger_auth_v1');
        window.location.replace('/selger/login/');
        throw new Error('Ikke innlogget');
      }
      if (svar && svar.error) throw new Error(svar.error);
      return svar;
    });
  }

  window.API = {
    bunker: function () {
      return erDemo() ? demo('bunker') : be({ handling: 'bunker' });
    },

    reserver: function (bunke) {
      return erDemo() ? Promise.resolve({ ok: true }) : be({ handling: 'reserver', bunke: bunke });
    },

    frigi: function (bunke) {
      return erDemo() ? Promise.resolve({ ok: true }) : be({ handling: 'frigi', bunke: bunke });
    },

    leads: function (bunke) {
      return erDemo() ? demo('leads') : be({ handling: 'leads', bunke: bunke });
    },

    loggUtfall: function (leadId, status, notat) {
      return erDemo() ? demo(null)
        : be({ handling: 'utfall', lead_id: leadId, status: status, notat: notat || '' });
    },

    booking: function (data) {
      return erDemo() ? demo(null)
        : be(Object.assign({ handling: 'booking' }, data));
    },

    tall: function () {
      return erDemo() ? demo('tall') : be({ handling: 'tall' });
    },

    mineBookinger: function () {
      return erDemo() ? demo('bookinger') : be({ handling: 'bookinger' });
    }
  };
})();
