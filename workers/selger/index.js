/**
 * selger-worker
 *
 * Backend for selgerportalen. Cloudflare Worker + D1 (SQLite).
 * Samme rolle som kurs-auth-worker, men med leads, bunker, utfall og bookinger.
 *
 * Databasen dm-salg (binding DB) har tabellene selgere, leads, bookinger, innstillinger.
 * Se schema.sql.
 *
 * Secret:
 *   RESEND_API_KEY  — glemt-passord-e-post
 *
 * Alle svar er JSON. Ekte CORS, saa portalen kan sende application/json.
 */

const FROM_EMAIL = 'salg@post.dmarketing.no'; // verifisert Resend-domene
const SITE_URL = 'https://dmarketing.no';
const RESET_TTL_MS = 60 * 60 * 1000;

// permanente sikkerhets-admins, alltid admin uansett hva databasen sier,
// saa en uheldig endring aldri kan laase alle ute
const BOOTSTRAP_ADMINS = ['adrian@dmarketing.no'];

async function erAdmin(env, epost) {
  if (BOOTSTRAP_ADMINS.indexOf(epost) !== -1) return true;
  const r = await env.DB.prepare('SELECT admin FROM selgere WHERE lower(epost) = ?').bind(epost).first();
  return !!(r && r.admin === 1);
}

const ALLOWED = [
  'https://dmarketing.no',
  'https://www.dmarketing.no',
  'http://localhost:5053',
];

// statuser som betyr penger paa vei (alt utenom betalt og tapt)
const I_PIPELINE = ['sendt', 'utkast_laget', 'sendt_til_kunde', 'godtatt'];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return cors(null, 204, origin);
    if (request.method !== 'POST') return cors(j({ error: 'method' }), 405, origin);

    try {
      const body = await request.json();
      const h = body.handling;

      // uten innlogging
      if (h === 'login') return cors(j(await loggInn(env, body)), 200, origin);
      if (h === 'glemt') return cors(j(await beReset(env, body)), 200, origin);
      if (h === 'nullstill') return cors(j(await nullstill(env, body)), 200, origin);

      // krever gyldig token
      const selger = await finnSelger(env, body.token);
      if (!selger) return cors(j({ error: 'ikke_innlogget' }), 200, origin);

      // admin-handlinger, bare for administratorer
      if (['selgere', 'opprett_selger', 'sett_aktiv', 'sett_admin', 'oversikt'].indexOf(h) !== -1) {
        if (!(await erAdmin(env, selger.epost))) {
          return cors(j({ error: 'ikke_admin' }), 200, origin);
        }
        let ar;
        if (h === 'selgere') ar = await listSelgere(env);
        else if (h === 'oversikt') ar = await oversikt(env);
        else if (h === 'opprett_selger') ar = await opprettSelger(env, body);
        else if (h === 'sett_admin') ar = await settAdmin(env, selger, body);
        else ar = await settAktiv(env, selger, body);
        return cors(j(ar), 200, origin);
      }

      let res;
      switch (h) {
        case 'bunker':    res = await hentBunker(env, selger); break;
        case 'reserver':  res = await reserver(env, selger, body.bunke); break;
        case 'frigi':     res = await frigi(env, selger, body.bunke); break;
        case 'leads':     res = await hentLeads(env, body.bunke); break;
        case 'utfall':    res = await loggUtfall(env, selger, body); break;
        case 'booking':   res = await lagreBooking(env, selger, body); break;
        case 'tall':      res = await hentTall(env, selger); break;
        case 'bookinger': res = await hentBookinger(env, selger); break;
        default:          res = { error: 'ukjent_handling' };
      }
      return cors(j(res), 200, origin);
    } catch (err) {
      return cors(j({ error: 'serverfeil', melding: String(err && err.message) }), 500, origin);
    }
  },
};

/* ---------------------------------------------------------------- auth */

async function finnSelger(env, token) {
  if (!token) return null;
  const r = await env.DB.prepare(
    "SELECT epost, navn FROM selgere WHERE token = ? AND lower(aktiv) != 'nei'"
  ).bind(String(token)).first();
  return r || null;
}

async function loggInn(env, { epost, hash }) {
  epost = String(epost || '').toLowerCase().trim();
  hash = String(hash || '');
  if (!epost || !hash) return { error: 'mangler_felt' };

  const r = await env.DB.prepare(
    'SELECT epost, navn, passordhash, token, aktiv FROM selgere WHERE lower(epost) = ?'
  ).bind(epost).first();

  if (!r) return { error: 'ukjent_bruker', melding: 'Fant ingen med den e-posten.' };
  if (String(r.aktiv).toLowerCase() === 'nei') {
    return { error: 'sperret', melding: 'Kontoen er ikke aktiv. Ta kontakt med Adrian.' };
  }
  if (!r.passordhash) {
    return { error: 'feil_passord', melding: 'Passord ikke satt ennå. Bruk Glemt passord.' };
  }
  if (String(r.passordhash) !== hash) {
    return { error: 'feil_passord', melding: 'Feil passord.' };
  }
  return { ok: true, token: r.token, navn: r.navn, epost };
}

async function beReset(env, { epost }) {
  epost = String(epost || '').toLowerCase().trim();
  if (!epost) return { ok: true };

  const r = await env.DB.prepare(
    "SELECT epost, navn FROM selgere WHERE lower(epost) = ? AND lower(aktiv) != 'nei'"
  ).bind(epost).first();
  if (!r) return { ok: true }; // ikke avslor om e-posten finnes

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const utlop = Date.now() + RESET_TTL_MS;
  await env.DB.prepare(
    'UPDATE selgere SET resettoken = ?, resettoken_utlop = ? WHERE lower(epost) = ?'
  ).bind(token, utlop, epost).run();

  const lenke = `${SITE_URL}/selger/sett-passord/?token=${token}&epost=${encodeURIComponent(epost)}`;
  await sendReset(env, epost, r.navn, lenke);
  return { ok: true };
}

async function nullstill(env, { epost, token, hash }) {
  epost = String(epost || '').toLowerCase().trim();
  token = String(token || '');
  hash = String(hash || '');
  if (!epost || !token || !hash) return { error: 'mangler_felt' };

  const r = await env.DB.prepare(
    'SELECT epost, navn, token, resettoken, resettoken_utlop FROM selgere WHERE lower(epost) = ?'
  ).bind(epost).first();

  if (!r || String(r.resettoken) !== token || token.length < 20) {
    return { error: 'ugyldig_lenke', melding: 'Lenken er ugyldig. Be om en ny.' };
  }
  if (Date.now() > Number(r.resettoken_utlop || 0)) {
    return { error: 'utlopt', melding: 'Lenken er utløpt. Be om en ny.' };
  }

  await env.DB.prepare(
    'UPDATE selgere SET passordhash = ?, resettoken = NULL, resettoken_utlop = NULL WHERE lower(epost) = ?'
  ).bind(hash, epost).run();
  return { ok: true, token: r.token, navn: r.navn, epost };
}

/* -------------------------------------------------------------- admin */

async function listSelgere(env) {
  const rows = (await env.DB.prepare(
    `SELECT s.epost, s.navn, s.aktiv, s.admin,
       CASE WHEN s.passordhash IS NULL OR s.passordhash = '' THEN 0 ELSE 1 END AS harpassord,
       (SELECT COUNT(*) FROM bookinger b WHERE b.selger = s.epost) AS bookinger,
       (SELECT COUNT(*) FROM leads l WHERE l.selger = s.epost
          AND l.status IS NOT NULL AND l.status != '' AND l.status != 'ikke_ringt') AS ringt
     FROM selgere s ORDER BY s.navn`
  ).all()).results;
  return rows.map(r => ({
    epost: r.epost, navn: r.navn, aktiv: String(r.aktiv).toLowerCase() !== 'nei',
    harPassord: r.harpassord === 1, bookinger: r.bookinger, ringt: r.ringt,
    admin: r.admin === 1 || BOOTSTRAP_ADMINS.indexOf(r.epost) !== -1,
    // sikkerhets-admin kan ikke fjernes fra grensesnittet
    fastAdmin: BOOTSTRAP_ADMINS.indexOf(r.epost) !== -1,
  }));
}

// hvem jobber i hvilken bunke akkurat naa, med fremdrift
async function oversikt(env) {
  const rows = (await env.DB.prepare(
    `SELECT bunke, selger,
       COUNT(*) AS totalt,
       SUM(CASE WHEN status IS NOT NULL AND status != '' AND status != 'ikke_ringt' THEN 1 ELSE 0 END) AS ringt,
       SUM(CASE WHEN status IS NULL OR status IN ('','ikke_ringt','ring_igjen') THEN 1 ELSE 0 END) AS igjen,
       MAX(dato) AS sist
     FROM leads
     WHERE selger IS NOT NULL AND selger != ''
     GROUP BY bunke, selger
     ORDER BY (sist IS NULL), sist DESC, bunke`
  ).all()).results;

  const navn = {};
  (await env.DB.prepare('SELECT epost, navn FROM selgere').all()).results
    .forEach(s => { navn[s.epost] = s.navn; });

  return rows.map(r => ({
    bunke: r.bunke,
    selger: navn[r.selger] || r.selger,
    epost: r.selger,
    totalt: r.totalt,
    ringt: r.ringt,
    igjen: r.igjen,
    sist: r.sist || '',
  }));
}

async function settAdmin(env, kaller, { epost, admin }) {
  epost = String(epost || '').toLowerCase().trim();
  if (BOOTSTRAP_ADMINS.indexOf(epost) !== -1 && admin === false) {
    return { error: 'fast_admin', melding: 'Denne kontoen er fast administrator og kan ikke endres.' };
  }
  if (epost === kaller.epost && admin === false) {
    return { error: 'ikke_deg_selv', melding: 'Du kan ikke fjerne din egen admintilgang.' };
  }
  await env.DB.prepare('UPDATE selgere SET admin = ? WHERE lower(epost) = ?')
    .bind(admin ? 1 : 0, epost).run();
  return { ok: true };
}

async function opprettSelger(env, { epost, navn }) {
  epost = String(epost || '').toLowerCase().trim();
  navn = String(navn || '').trim();
  if (!epost || !navn) return { error: 'mangler_felt', melding: 'Fyll ut både navn og e-post.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(epost)) {
    return { error: 'ugyldig_epost', melding: 'Det ser ikke ut som en gyldig e-post.' };
  }

  const finnes = await env.DB.prepare('SELECT 1 FROM selgere WHERE lower(epost) = ?').bind(epost).first();
  if (finnes) return { error: 'finnes', melding: 'Den e-posten er allerede lagt til.' };

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  await env.DB.prepare(
    "INSERT INTO selgere (epost, navn, token, aktiv) VALUES (?, ?, ?, 'ja')"
  ).bind(epost, navn, token).run();

  // send dem en lenke der de setter sitt eget passord
  const rtoken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  await env.DB.prepare(
    'UPDATE selgere SET resettoken = ?, resettoken_utlop = ? WHERE lower(epost) = ?'
  ).bind(rtoken, Date.now() + 7 * 24 * 60 * 60 * 1000, epost).run(); // velkomstlenke varer en uke

  const lenke = `${SITE_URL}/selger/sett-passord/?token=${rtoken}&epost=${encodeURIComponent(epost)}`;
  await sendVelkomst(env, epost, navn, lenke);

  return { ok: true, epost, navn };
}

async function settAktiv(env, kaller, { epost, aktiv }) {
  epost = String(epost || '').toLowerCase().trim();
  if (epost === kaller.epost && aktiv === false) {
    return { error: 'ikke_deg_selv', melding: 'Du kan ikke stenge deg selv ute.' };
  }
  if (BOOTSTRAP_ADMINS.indexOf(epost) !== -1 && aktiv === false) {
    return { error: 'fast_admin', melding: 'Denne kontoen kan ikke stenges.' };
  }
  await env.DB.prepare('UPDATE selgere SET aktiv = ? WHERE lower(epost) = ?')
    .bind(aktiv ? 'ja' : 'nei', epost).run();
  return { ok: true };
}

/* ------------------------------------------------------------- bunker */

async function hentBunker(env, selger) {
  const rows = (await env.DB.prepare(
    `SELECT bunke,
       COUNT(*) AS totalt,
       SUM(CASE WHEN status IS NULL OR status IN ('','ikke_ringt','ring_igjen') THEN 1 ELSE 0 END) AS igjen,
       GROUP_CONCAT(DISTINCT CASE WHEN selger IS NOT NULL AND selger != '' THEN selger END) AS eiere
     FROM leads GROUP BY bunke`
  ).all()).results;

  return rows.filter(b => {
    const eiere = (b.eiere || '').split(',').filter(Boolean);
    return eiere.length === 0 || (eiere.length === 1 && eiere[0] === selger.epost);
  }).map(b => ({ navn: b.bunke, totalt: b.totalt, igjen: b.igjen }))
    .sort((a, b) => (a.igjen === 0) !== (b.igjen === 0)
      ? (a.igjen === 0 ? 1 : -1)
      : a.navn.localeCompare(b.navn, 'nb'));
}

async function reserver(env, selger, bunke) {
  bunke = String(bunke || '').trim();
  if (!bunke) return { ok: false, grunn: 'mangler_bunke' };

  // atomisk: krev bunken oppgir seg til ingen andre, ellers oppdateres 0 rader
  const res = await env.DB.prepare(
    `UPDATE leads SET selger = ?1
       WHERE bunke = ?2 AND (selger IS NULL OR selger = '')
       AND NOT EXISTS (
         SELECT 1 FROM leads WHERE bunke = ?2
           AND selger IS NOT NULL AND selger != '' AND selger != ?1)`
  ).bind(selger.epost, bunke).run();

  if (res.meta.changes > 0) return { ok: true };

  // 0 endringer: enten eid av en annen, eller alt allerede mitt
  const annen = await env.DB.prepare(
    "SELECT 1 FROM leads WHERE bunke = ? AND selger IS NOT NULL AND selger != '' AND selger != ? LIMIT 1"
  ).bind(bunke, selger.epost).first();
  return annen ? { ok: false, grunn: 'opptatt' } : { ok: true };
}

async function frigi(env, selger, bunke) {
  bunke = String(bunke || '').trim();
  if (!bunke) return { ok: true };
  await env.DB.prepare(
    `UPDATE leads SET selger = NULL
       WHERE bunke = ? AND selger = ? AND (status IS NULL OR status IN ('','ikke_ringt'))`
  ).bind(bunke, selger.epost).run();
  return { ok: true };
}

/* -------------------------------------------------------------- leads */

async function hentLeads(env, bunke) {
  const rows = (await env.DB.prepare(
    `SELECT id, bedrift, sted, telefon, nettside, bransje, nyetablert, status
       FROM leads WHERE bunke = ? ORDER BY sted, bedrift`
  ).bind(String(bunke || '').trim()).all()).results;

  return rows.map(r => ({
    id: r.id,
    bedrift: r.bedrift,
    sted: r.sted,
    telefon: String(r.telefon || ''),
    nettside: r.nettside,
    bransje: r.bransje,
    nyetablert: r.nyetablert === 1,
    status: r.status || 'ikke_ringt',
  }));
}

async function loggUtfall(env, selger, { lead_id, status, notat }) {
  const idag = iDag();
  await env.DB.prepare(
    'UPDATE leads SET status = ?, selger = ?, dato = ?, notat = ? WHERE id = ?'
  ).bind(status, selger.epost, idag, notat || '', lead_id).run();
  return { ok: true };
}

async function lagreBooking(env, selger, d) {
  await env.DB.prepare(
    `INSERT INTO bookinger (dato, selger, bedrift, telefon, nettside, kontakt, epost, notat, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sendt')`
  ).bind(iDag(), selger.epost, d.bedrift || '', String(d.telefon || ''),
         d.nettside || '', d.kontakt || '', d.epost || '', d.notat || '').run();

  if (d.lead_id) {
    await env.DB.prepare(
      'UPDATE leads SET status = ?, selger = ?, dato = ? WHERE id = ?'
    ).bind('interessert', selger.epost, iDag(), d.lead_id).run();
  }
  return { ok: true };
}

async function hentBookinger(env, selger) {
  const rows = (await env.DB.prepare(
    'SELECT dato, bedrift, kontakt, status, notat FROM bookinger WHERE selger = ? ORDER BY id DESC'
  ).bind(selger.epost).all()).results;
  return rows.map(r => ({
    dato: r.dato, bedrift: r.bedrift, kontakt: r.kontakt,
    status: r.status || 'sendt', notat: r.notat || '',
  }));
}

async function hentTall(env, selger) {
  const pris = Number((await env.DB.prepare(
    "SELECT verdi FROM innstillinger WHERE noekkel = 'pris'"
  ).first())?.verdi || 3900);

  const e = selger.epost;
  const idag = iDag(), mandag = mandagISO();

  const q = async (sql, ...b) => (await env.DB.prepare(sql).bind(...b).first());

  const ringtTotalt = (await q(
    "SELECT COUNT(*) n FROM leads WHERE selger = ? AND status IS NOT NULL AND status != '' AND status != 'ikke_ringt'", e)).n;
  const ringtIDag = (await q(
    "SELECT COUNT(*) n FROM leads WHERE selger = ? AND dato = ? AND status != 'ikke_ringt'", e, idag)).n;
  const ringIgjen = (await q(
    "SELECT COUNT(*) n FROM leads WHERE selger = ? AND status = 'ring_igjen'", e)).n;

  // aktiv bunke = den selgeren sist rorte
  const sisteBunke = (await q(
    "SELECT bunke FROM leads WHERE selger = ? AND dato IS NOT NULL AND dato != '' ORDER BY dato DESC, id DESC LIMIT 1", e));
  const aktivBunke = sisteBunke ? sisteBunke.bunke : '';
  const igjenIBunke = aktivBunke ? (await q(
    "SELECT COUNT(*) n FROM leads WHERE bunke = ? AND (status IS NULL OR status IN ('','ikke_ringt','ring_igjen'))", aktivBunke)).n : 0;

  const bookTotalt = (await q('SELECT COUNT(*) n FROM bookinger WHERE selger = ?', e)).n;
  const bookUke = (await q('SELECT COUNT(*) n FROM bookinger WHERE selger = ? AND dato >= ?', e, mandag)).n;
  const betalte = (await q("SELECT COUNT(*) n FROM bookinger WHERE selger = ? AND status = 'betalt'", e)).n;
  const pipeline = (await q(
    `SELECT COUNT(*) n FROM bookinger WHERE selger = ? AND status IN ('${I_PIPELINE.join("','")}')`, e)).n;

  const sats = betalte >= 30 ? 0.30 : betalte >= 15 ? 0.25 : betalte >= 5 ? 0.20 : 0.15;
  const tilNeste = betalte >= 30 ? 0 : betalte >= 15 ? 30 - betalte : betalte >= 5 ? 15 - betalte : 5 - betalte;

  return {
    ringt_i_dag: ringtIDag,
    ringt_totalt: ringtTotalt,
    igjen_i_bunke: igjenIBunke,
    ring_igjen: ringIgjen,
    bookinger_uke: bookUke,
    bookinger_totalt: bookTotalt,
    bookingrate: ringtTotalt ? bookTotalt / ringtTotalt : 0,
    betalte,
    opptjent: betalte * pris * sats,
    pipeline: pipeline * pris * sats,
    sats,
    til_neste: tilNeste,
    aktiv_bunke: aktivBunke,
  };
}

/* ------------------------------------------------------------- dato */

function iDag() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' }); // yyyy-mm-dd
}
function mandagISO() {
  const naa = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  const dag = (naa.getDay() + 6) % 7;
  naa.setDate(naa.getDate() - dag);
  return naa.toLocaleDateString('sv-SE');
}

/* ------------------------------------------------------------- e-post */

async function sendReset(env, epost, navn, lenke) {
  if (!env.RESEND_API_KEY) return; // ikke satt ennaa, hopp over stille
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `DM Selgerportal <${FROM_EMAIL}>`,
      to: [epost],
      subject: 'Nytt passord til selgerportalen',
      html: `<div style="font-family:Inter,sans-serif;max-width:480px;color:#09090B">
        <p>Hei ${navn},</p>
        <p>Trykk under for å velge et nytt passord. Lenken varer i én time.</p>
        <p><a href="${lenke}" style="display:inline-block;background:#0339f8;color:#fff;
           font-weight:600;padding:14px 28px;border-radius:10px;text-decoration:none">Velg nytt passord</a></p>
        <p style="font-size:13px;color:#71717A">Ba du ikke om dette, kan du se bort fra e-posten.</p>
      </div>`,
    }),
  });
}

async function sendVelkomst(env, epost, navn, lenke) {
  if (!env.RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `DM Selgerportal <${FROM_EMAIL}>`,
      to: [epost],
      subject: "Velkommen til DM Selgerportal",
      html: `<div style="font-family:Inter,sans-serif;max-width:480px;color:#09090B">
        <p>Hei ${navn},</p>
        <p>Du har fått tilgang til selgerportalen. Trykk under for å velge et passord og komme i gang.</p>
        <p><a href="${lenke}" style="display:inline-block;background:#0339f8;color:#fff;
           font-weight:600;padding:14px 28px;border-radius:10px;text-decoration:none">Velg passord og logg inn</a></p>
        <p style="font-size:13px;color:#71717A">Lenken varer i en uke. Etterpå kan du alltid bruke Glemt passord.</p>
      </div>`,
    }),
  });
}

/* ------------------------------------------------------------- helpers */

function j(o) { return JSON.stringify(o); }

function cors(body, status, origin) {
  const tillatt = ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return new Response(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': tillatt,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    },
  });
}
