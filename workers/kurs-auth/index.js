/**
 * kurs-auth-worker
 *
 * Endpoints:
 *   POST /set-password    — verify invite/reset token, update hash in users.json
 *   POST /request-reset   — generate reset token, add to invites, send email
 *
 * Required secrets (wrangler secret put):
 *   GITHUB_TOKEN   — fine-grained PAT with Contents:write on dmarketing-redesign
 *   RESEND_API_KEY — Resend API key for sending email
 */

const OWNER    = 'AdrianDie';
const REPO     = 'dmarketing-redesign';
const FILE     = 'kurs/users.json';
const BRANCH   = 'main';
const FROM_EMAIL = 'kurs@dmarketing.no';
const SITE_URL   = 'https://dmarketing.no';

const ALLOWED_ORIGINS = [
  'https://dmarketing.no',
  'https://www.dmarketing.no',
];

// Reset tokens expire after 1 hour
const RESET_TTL_MS = 60 * 60 * 1000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204, origin);
    }

    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ ok: false, error: 'Method not allowed' }), 405, origin);
    }

    const url = new URL(request.url);

    if (url.pathname === '/set-password') {
      return handleSetPassword(request, env, origin);
    }

    if (url.pathname === '/request-reset') {
      return handleRequestReset(request, env, origin);
    }

    return corsResponse(JSON.stringify({ ok: false, error: 'Not found' }), 404, origin);
  },
};

// ─── /set-password ───────────────────────────────────────────────────────────

async function handleSetPassword(request, env, origin) {
  let body;
  try { body = await request.json(); } catch {
    return corsResponse(JSON.stringify({ ok: false, error: 'Ugyldig JSON' }), 400, origin);
  }

  const { email, token, hash } = body;

  if (!email || !token || !hash) {
    return corsResponse(JSON.stringify({ ok: false, error: 'Mangler påkrevde felter' }), 400, origin);
  }

  if (!/^[a-f0-9]{64}$/.test(hash)) {
    return corsResponse(JSON.stringify({ ok: false, error: 'Ugyldig hash-format' }), 400, origin);
  }

  const { db, sha } = await fetchUsersJson(env);

  const invite = db.invites.find(i => i.token === token && i.email === email.toLowerCase());
  if (!invite) {
    return corsResponse(JSON.stringify({ ok: false, error: 'Ugyldig eller utløpt lenke' }), 403, origin);
  }

  // Check expiry if present (reset tokens have expires, invite tokens do not)
  if (invite.expires && Date.now() > invite.expires) {
    return corsResponse(JSON.stringify({ ok: false, error: 'Lenken er utløpt. Be om en ny.' }), 403, origin);
  }

  const normalEmail = email.toLowerCase();
  const existingUser = db.users.find(u => u.email === normalEmail);

  if (existingUser) {
    existingUser.hash = hash;
  } else {
    db.users.push({ email: normalEmail, hash });
  }

  // Remove used token
  db.invites = db.invites.filter(i => i.token !== token);

  await updateUsersJson(env, db, sha, `Kurs: oppdater hash for ${normalEmail}`);

  return corsResponse(JSON.stringify({ ok: true }), 200, origin);
}

// ─── /request-reset ──────────────────────────────────────────────────────────

async function handleRequestReset(request, env, origin) {
  let body;
  try { body = await request.json(); } catch {
    return corsResponse(JSON.stringify({ ok: false, error: 'Ugyldig JSON' }), 400, origin);
  }

  const { email } = body;

  if (!email || typeof email !== 'string') {
    return corsResponse(JSON.stringify({ ok: false, error: 'Mangler e-post' }), 400, origin);
  }

  const normalEmail = email.toLowerCase().trim();

  // Always return ok to prevent email enumeration
  const { db, sha } = await fetchUsersJson(env);

  const userExists = db.users.some(u => u.email === normalEmail);
  if (!userExists) {
    // Pretend success — don't reveal whether email is registered
    return corsResponse(JSON.stringify({ ok: true }), 200, origin);
  }

  // Remove any existing reset tokens for this email (only one active at a time)
  db.invites = db.invites.filter(i => i.email !== normalEmail || !i.expires);

  const token   = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expires = Date.now() + RESET_TTL_MS;

  db.invites.push({ email: normalEmail, token, expires });

  await updateUsersJson(env, db, sha, `Kurs: legg til reset-token for ${normalEmail}`);

  const resetLink = `${SITE_URL}/kurs/sett-passord.html?token=${token}&reset=1`;

  await sendResetEmail(env, normalEmail, resetLink);

  return corsResponse(JSON.stringify({ ok: true }), 200, origin);
}

// ─── GitHub helpers ───────────────────────────────────────────────────────────

async function fetchUsersJson(env) {
  const ghHeaders = githubHeaders(env);
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}?ref=${BRANCH}`,
    { headers: ghHeaders }
  );
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);
  const data = await res.json();
  const db   = JSON.parse(atob(data.content.replace(/\n/g, '')));
  return { db, sha: data.sha };
}

async function updateUsersJson(env, db, sha, message) {
  const ghHeaders = githubHeaders(env);
  const content   = btoa(JSON.stringify(db, null, 2) + '\n');
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`,
    {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content, sha, branch: BRANCH }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub update failed: ${res.status} — ${err}`);
  }
}

function githubHeaders(env) {
  return {
    'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'kurs-auth-worker/1.0',
  };
}

// ─── Email via Resend ─────────────────────────────────────────────────────────

async function sendResetEmail(env, toEmail, resetLink) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Dietrichs Marketing <${FROM_EMAIL}>`,
      to: [toEmail],
      subject: 'Tilbakestill passordet ditt — AI-nettsider Kurs',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;color:#09090B;">
          <p style="font-size:15px;margin-bottom:16px;">Hei,</p>
          <p style="font-size:15px;margin-bottom:24px;">
            Vi mottok en forespørsel om å tilbakestille passordet ditt for AI-nettsider Kurset.
          </p>
          <a href="${resetLink}"
             style="display:inline-block;background:#2563EB;color:#fff;font-weight:600;
                    padding:14px 28px;border-radius:10px;text-decoration:none;font-size:14px;">
            Tilbakestill passord
          </a>
          <p style="font-size:13px;color:#71717A;margin-top:24px;">
            Lenken er gyldig i <strong>1 time</strong>. Hvis du ikke ba om dette, kan du ignorere denne e-posten.
          </p>
          <hr style="border:none;border-top:1px solid #E4E4E7;margin:32px 0;" />
          <p style="font-size:12px;color:#A1A1AA;">Dietrichs Marketing · dmarketing.no</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend failed: ${res.status} — ${err}`);
  }
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

function corsResponse(body, status, origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const headers = {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  return new Response(body, { status, headers });
}
