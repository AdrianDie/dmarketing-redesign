(function () {
  // ============================================================
  //  Datalag. Cloudflare Worker + D1-database, samme opplegg som
  //  kurset. Worker-en svarer raskt (titalls millisekunder), saa
  //  sidene kan vente paa svaret uten at det foeles tregt.
  // ============================================================

  var ENDEPUNKT = 'https://selger-worker.dietrichs-mkt.workers.dev';

  var DEMO = {
    tall: {
      ringt_i_dag: 23, ringt_totalt: 147, igjen_i_bunke: 18, ring_igjen: 9,
      bookinger_uke: 4, bookinger_totalt: 11, bookingrate: 0.075, betalte: 3,
      opptjent: 1404, pipeline: 3744, sats: 0.15, til_neste: 7,
      neste_sats: 0.20, dager_igjen: 12,
      aktiv_bunke: 'Frisør - Oslo og Bærum',
      naadd_totalt: 55, naadd_siden_booking: 3,
      hendelser: [
        { bedrift: 'DE NADA FRISØR AS', status: 'sendt_til_kunde', dato: '2026-07-27' },
        { bedrift: 'ECO CULT AS', status: 'betalt', dato: '2026-07-25' },
        { bedrift: 'HEXAGON FRISØR AS', status: 'utkast_laget', dato: '2026-07-24' }
      ]
    },
    bunker: [
      { navn: 'Frisør - Vestland og Møre', igjen: 7, totalt: 13, reservert: true, minEgen: false, reservertAv: 'Kari' },
      { navn: 'Frisør - Stavanger m.fl.', igjen: 4, totalt: 16, reservert: true, minEgen: false, reservertAv: 'Ola' },
      { navn: 'Frisør - Oslo og Bærum', igjen: 18, totalt: 21, reservert: false, minEgen: false, reservertAv: null },
      { navn: 'Frisør - Rogaland', igjen: 11, totalt: 11, reservert: false, minEgen: false, reservertAv: null },
      { navn: 'Frisør - Trøndelag og Nord-Norge', igjen: 0, totalt: 14, reservert: false, minEgen: false, reservertAv: null }
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
   * Sender en handling til Worker-en med selgerens token. Worker-en svarer
   * med ekte CORS-headere, saa vanlig application/json gaar fint.
   */
  function be(data) {
    var token = (window.SELGER && window.SELGER.token) || '';
    return fetch(ENDEPUNKT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      if (svar && svar.error) {
        var feil = new Error(svar.error);
        feil.melding = svar.melding;
        feil.eier = svar.eier;
        throw feil;
      }
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
    },

    // admin, bare for Adrian
    selgere: function () { return be({ handling: 'selgere' }); },
    oversikt: function () { return be({ handling: 'oversikt' }); },
    alleBookinger: function () { return be({ handling: 'alle_bookinger' }); },
    settBookingStatus: function (id, status) {
      return be({ handling: 'sett_booking_status', id: id, status: status });
    },
    opprettSelger: function (epost, navn) {
      return be({ handling: 'opprett_selger', epost: epost, navn: navn });
    },
    settAktiv: function (epost, aktiv) {
      return be({ handling: 'sett_aktiv', epost: epost, aktiv: aktiv });
    },
    settAdmin: function (epost, admin) {
      return be({ handling: 'sett_admin', epost: epost, admin: admin });
    }
  };
})();
