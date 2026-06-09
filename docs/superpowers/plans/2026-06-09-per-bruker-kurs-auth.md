# Per-bruker Kurs-autentisering med Cloudflare Worker

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shared password on dmarketing.no/kurs with per-user email+password login, managed via kundedashboardet, with automatic welcome emails sent via Resend.

**Architecture:** A Cloudflare Worker acts as the only backend — it handles invite creation and password-setting, writing to `kurs/users.json` in the GitHub repo via GitHub API. The course login page fetches `users.json` from GitHub raw content at login time and validates credentials using PBKDF2. The kundedashboard gets a new "Kurs" tab for managing users (add/remove/view status).

**Tech Stack:** Cloudflare Workers (free), Resend (free, 3 000 emails/month), GitHub API, Web Crypto API (PBKDF2), Vanilla JS, Tailwind CSS (CDN)

**Repos involved:**
- Course site: `C:\Users\adria\website-mirrors\dmarketing-redesign` → `github.com/AdrianDie/dmarketing-redesign`
- Dashboard: `C:\Users\adria\dmarketing-dashboard`
- Worker: new folder `C:\Users\adria\kurs-worker`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `kurs/users.json` | Create | Brukerdatabase (hashes + invites) |
| `kurs/login.html` | Modify | Email+passord login, henter users.json |
| `kurs/auth.js` | Modify | Sjekker per-bruker session i localStorage |
| `kurs/sett-passord.html` | Create | Kunde setter passord via invite-link |
| `C:\Users\adria\kurs-worker\worker.js` | Create | Cloudflare Worker: /invite + /set-password |
| `C:\Users\adria\kurs-worker\wrangler.toml` | Create | Cloudflare Worker konfigurasjon |
| `C:\Users\adria\dmarketing-dashboard\dashboard.html` | Modify | Ny Kurs-fane (kilde til StatiCrypt) |

---

## Data Format

**`kurs/users.json`:**
```json
{
  "users": [
    { "email": "kunde@firma.no", "hash": "a3f1..." }
  ],
  "invites": [
    { "token": "abc123xyz789", "email": "ny@firma.no", "expires": "2026-06-16T00:00:00Z" }
  ]
}
```

**localStorage (innlogget bruker):**
```json
{ "email": "kunde@firma.no", "token": "kurs_authed_2026" }
```

**Password hashing (PBKDF2, kjøres i nettleser):**
- Algoritme: PBKDF2-SHA256
- Salt: `TextEncoder().encode(email.toLowerCase())`
- Iterasjoner: 100 000
- Output: 32 bytes → hex-streng

---

## Forutsetninger (gjøres manuelt før oppstart)

- [ ] **Opprett Cloudflare-konto** på cloudflare.com (gratis)
- [ ] **Opprett Resend-konto** på resend.com (gratis), verifiser domenet `dmarketing.no`
- [ ] **Lag GitHub Personal Access Token:** github.com → Settings → Developer settings → Personal access tokens → Fine-grained token → kun repo `AdrianDie/dmarketing-redesign` → `Contents: Read and write`
- [ ] **Installer Node.js** hvis ikke installert (nodejs.org)
- [ ] **Dekrypter dashboard-kildefilen:**
  ```bash
  cd C:\Users\adria\dmarketing-dashboard
  npx staticrypt decrypt laast/dashboard.html --password DITTPASSORD
  ```
  Dette oppretter `dashboard.html` i rotkatalogen (kilde for redigering)

---

## Task 1: Opprett users.json i kurs-repoet

**Files:**
- Create: `kurs/users.json`

- [ ] **Opprett tom brukerdatabase:**

  Fil: `kurs/users.json`
  ```json
  {
    "users": [],
    "invites": []
  }
  ```

- [ ] **Commit:**
  ```bash
  cd C:\Users\adria\website-mirrors\dmarketing-redesign
  git add kurs/users.json
  git commit -m "feat: add empty users.json for per-user auth"
  git push
  ```

---

## Task 2: Cloudflare Worker — prosjektoppsett

**Files:**
- Create: `C:\Users\adria\kurs-worker\worker.js`
- Create: `C:\Users\adria\kurs-worker\wrangler.toml`
- Create: `C:\Users\adria\kurs-worker\package.json`

- [ ] **Installer Wrangler CLI:**
  ```bash
  npm install -g wrangler
  wrangler --version
  ```
  Forventet output: `wrangler 3.x.x`

- [ ] **Logg inn på Cloudflare:**
  ```bash
  wrangler login
  ```
  Åpner nettleser — godkjenn tilgang.

- [ ] **Opprett worker-mappe:**
  ```bash
  mkdir C:\Users\adria\kurs-worker
  cd C:\Users\adria\kurs-worker
  ```

- [ ] **Opprett `wrangler.toml`:**
  ```toml
  name = "kurs-auth-worker"
  main = "worker.js"
  compatibility_date = "2024-01-01"

  [vars]
  GITHUB_OWNER = "AdrianDie"
  GITHUB_REPO = "dmarketing-redesign"
  GITHUB_FILE_PATH = "kurs/users.json"
  GITHUB_BRANCH = "main"
  ALLOWED_ORIGIN = "https://www.dmarketing.no"
  INVITE_EXPIRY_DAYS = "7"
  FROM_EMAIL = "kurs@dmarketing.no"
  SITE_BASE_URL = "https://www.dmarketing.no"
  ```

- [ ] **Opprett `package.json`:**
  ```json
  {
    "name": "kurs-auth-worker",
    "version": "1.0.0",
    "private": true
  }
  ```

---

## Task 3: Cloudflare Worker — kjernelogikk

**Files:**
- Create: `C:\Users\adria\kurs-worker\worker.js`

- [ ] **Skriv `worker.js`:**

  ```js
  // kurs-auth-worker/worker.js
  // Endpoints:
  //   POST /invite       — lag invite-token, send velkomst-epost
  //   POST /set-password — valider token, lagre bruker, send bekreftelse-epost
  //   OPTIONS *          — CORS preflight

  export default {
    async fetch(request, env) {
      const origin = request.headers.get('Origin') || '';
      const corsHeaders = {
        'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Worker-Secret',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      const url = new URL(request.url);

      try {
        if (request.method === 'POST' && url.pathname === '/invite') {
          return await handleInvite(request, env, corsHeaders);
        }
        if (request.method === 'POST' && url.pathname === '/set-password') {
          return await handleSetPassword(request, env, corsHeaders);
        }
        return json({ error: 'Not found' }, 404, corsHeaders);
      } catch (err) {
        console.error(err);
        return json({ error: 'Internal server error' }, 500, corsHeaders);
      }
    }
  };

  // ─── /invite ──────────────────────────────────────────────────────────────
  async function handleInvite(request, env, corsHeaders) {
    // Krev worker-secret for å hindre uautorisert bruk
    const secret = request.headers.get('X-Worker-Secret');
    if (secret !== env.WORKER_SECRET) {
      return json({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const body = await request.json();
    const email = (body.email || '').toLowerCase().trim();
    if (!email || !email.includes('@')) {
      return json({ error: 'Ugyldig e-postadresse' }, 400, corsHeaders);
    }

    // Les nåværende users.json fra GitHub
    const db = await readUsersJson(env);

    // Sjekk om bruker allerede eksisterer
    if (db.users.some(u => u.email === email)) {
      return json({ error: 'Bruker finnes allerede' }, 409, corsHeaders);
    }

    // Generer invite-token (kryptografisk tilfeldig)
    const token = generateToken();
    const expires = new Date(Date.now() + parseInt(env.INVITE_EXPIRY_DAYS) * 86400000).toISOString();

    // Fjern evt. eksisterende invite for samme e-post
    db.invites = db.invites.filter(i => i.email !== email);
    db.invites.push({ token, email, expires });

    // Skriv til GitHub
    await writeUsersJson(env, db);

    // Send velkomst-epost via Resend
    const inviteUrl = `${env.SITE_BASE_URL}/kurs/sett-passord.html?token=${token}`;
    await sendEmail(env, {
      to: email,
      subject: 'Velkommen til AI-nettsider Kurset 🎉',
      html: welcomeEmailHtml(inviteUrl),
    });

    return json({ ok: true, message: `Invitasjon sendt til ${email}` }, 200, corsHeaders);
  }

  // ─── /set-password ────────────────────────────────────────────────────────
  async function handleSetPassword(request, env, corsHeaders) {
    const body = await request.json();
    const email = (body.email || '').toLowerCase().trim();
    const token = (body.token || '').trim();
    const hash  = (body.hash  || '').trim();   // PBKDF2 hex fra nettleseren

    if (!email || !token || !hash) {
      return json({ error: 'Manglende felt' }, 400, corsHeaders);
    }

    const db = await readUsersJson(env);

    // Finn invite
    const invite = db.invites.find(i => i.token === token && i.email === email);
    if (!invite) {
      return json({ error: 'Ugyldig eller utløpt invitasjonslenke' }, 400, corsHeaders);
    }
    if (new Date(invite.expires) < new Date()) {
      return json({ error: 'Invitasjonslenken har utløpt. Kontakt Dietrichs Marketing.' }, 400, corsHeaders);
    }

    // Lagre bruker, slett invite
    db.users = db.users.filter(u => u.email !== email);
    db.users.push({ email, hash });
    db.invites = db.invites.filter(i => i.token !== token);

    await writeUsersJson(env, db);

    // Send bekreftelse-epost
    await sendEmail(env, {
      to: email,
      subject: 'Du har nå tilgang til kurset ✅',
      html: confirmEmailHtml(email),
    });

    return json({ ok: true }, 200, corsHeaders);
  }

  // ─── GitHub helpers ───────────────────────────────────────────────────────
  async function readUsersJson(env) {
    const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${env.GITHUB_FILE_PATH}?ref=${env.GITHUB_BRANCH}`;
    const res = await ghFetch(url, env, 'GET');
    if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`);
    const data = await res.json();
    const content = atob(data.content.replace(/\n/g, ''));
    return { ...JSON.parse(content), _sha: data.sha };
  }

  async function writeUsersJson(env, db) {
    const sha = db._sha;
    const { _sha, ...clean } = db;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(clean, null, 2))));
    const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${env.GITHUB_FILE_PATH}`;
    const res = await ghFetch(url, env, 'PUT', {
      message: 'chore: update kurs users',
      content,
      sha,
      branch: env.GITHUB_BRANCH,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub write failed: ${res.status} ${err}`);
    }
  }

  async function ghFetch(url, env, method, body) {
    return fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'kurs-auth-worker',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  // ─── Resend helper ────────────────────────────────────────────────────────
  async function sendEmail(env, { to, subject, html }) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`Resend feil: ${err}`);
    }
  }

  // ─── Utilities ────────────────────────────────────────────────────────────
  function generateToken() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function json(data, status, headers) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  }

  // ─── E-post maler ─────────────────────────────────────────────────────────
  function welcomeEmailHtml(inviteUrl) {
    return `
  <!DOCTYPE html>
  <html><body style="font-family:Inter,sans-serif;background:#f9f9f9;padding:40px 0;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e5e7eb;">
    <h1 style="font-size:24px;font-weight:800;color:#09090B;margin:0 0 8px;">Velkommen til kurset! 🎉</h1>
    <p style="color:#52525b;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Du har fått tilgang til <strong>AI-nettsider Kurset</strong> fra Dietrichs Marketing.<br>
      Klikk knappen nedenfor for å velge passord og komme i gang.
    </p>
    <a href="${inviteUrl}" style="display:inline-block;background:#2563EB;color:#fff;font-weight:600;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
      Velg passord og start kurset →
    </a>
    <p style="color:#a1a1aa;font-size:12px;margin:24px 0 0;">
      Lenken er gyldig i 7 dager. Har du spørsmål? Svar på denne e-posten.
    </p>
  </div>
  </body></html>`;
  }

  function confirmEmailHtml(email) {
    return `
  <!DOCTYPE html>
  <html><body style="font-family:Inter,sans-serif;background:#f9f9f9;padding:40px 0;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e5e7eb;">
    <h1 style="font-size:24px;font-weight:800;color:#09090B;margin:0 0 8px;">Du har tilgang ✅</h1>
    <p style="color:#52525b;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Passordet ditt er satt. Du kan nå logge inn på kurset med e-posten <strong>${email}</strong>.
    </p>
    <a href="https://www.dmarketing.no/kurs/" style="display:inline-block;background:#2563EB;color:#fff;font-weight:600;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
      Gå til kurset →
    </a>
  </div>
  </body></html>`;
  }
  ```

- [ ] **Commit worker-filene:**
  ```bash
  cd C:\Users\adria\kurs-worker
  git init
  git add .
  git commit -m "feat: initial kurs-auth-worker"
  ```

---

## Task 4: Deploy Cloudflare Worker med secrets

- [ ] **Sett secrets (kjøres én gang — lagres kryptert i Cloudflare):**
  ```bash
  cd C:\Users\adria\kurs-worker
  wrangler secret put GITHUB_TOKEN
  # Lim inn GitHub Personal Access Token når du blir bedt om det

  wrangler secret put RESEND_API_KEY
  # Lim inn Resend API key

  wrangler secret put WORKER_SECRET
  # Skriv inn et tilfeldig passord, f.eks.: kurs-admin-2026-secret
  # (dette legges i dashboardet som autentisering mot workeren)
  ```

- [ ] **Deploy:**
  ```bash
  wrangler deploy
  ```
  Forventet output:
  ```
  Published kurs-auth-worker (xx sec)
  https://kurs-auth-worker.<ditt-subdomain>.workers.dev
  ```
  **Noter ned worker-URL-en** — brukes i dashboard og sett-passord.html.

- [ ] **Test at workeren svarer:**
  ```bash
  curl -X OPTIONS https://kurs-auth-worker.<subdomain>.workers.dev/invite
  ```
  Forventet: HTTP 204 med CORS-headere.

---

## Task 5: Oppdater `kurs/login.html` — email + passord

**Files:**
- Modify: `kurs/login.html`

Erstatt hele innholdet i `kurs/login.html` med:

- [ ] **Skriv ny `kurs/login.html`:**

  ```html
  <!DOCTYPE html>
  <html lang="no">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Logg inn — AI-nettsider Kurs</title>
    <meta name="robots" content="noindex, nofollow" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: { extend: {
          fontFamily: { display: ['Archivo', 'sans-serif'] },
          colors: { ink: '#09090B', brand: '#2563EB', navy: '#0B1F4A' }
        }}
      }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
    <link href="../images/favicon.png" rel="shortcut icon" type="image/x-icon" />
    <style>
      body { font-family: 'Inter', sans-serif; background: #FAFAFA; color: #09090B; }
      .font-display { font-family: 'Archivo', sans-serif; }
    </style>
  </head>
  <body class="min-h-screen flex flex-col items-center justify-center px-6 py-12">
    <div class="w-full max-w-sm">

      <div class="mb-8 text-center">
        <a href="/" class="text-sm font-medium text-zinc-500 hover:text-blue-600 transition-colors">
          ← Dietrichs Marketing
        </a>
      </div>

      <div class="mb-5 text-center">
        <span class="inline-flex items-center gap-2 bg-white border border-zinc-200 text-xs font-medium text-zinc-600 px-3 py-1.5 rounded-full shadow-sm">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
          AI-nettsider Kurs · 13 moduler
        </span>
      </div>

      <h1 class="font-display font-extrabold text-3xl tracking-[-0.03em] text-ink mb-3 text-center">
        Logg inn for å fortsette
      </h1>
      <p class="text-zinc-500 text-sm mb-8 leading-relaxed text-center">
        Kurset er kun tilgjengelig for kunder av Dietrichs Marketing.
      </p>

      <form id="loginForm" class="space-y-4">
        <div>
          <label for="epost" class="block text-sm font-medium text-zinc-700 mb-1.5">E-post</label>
          <input type="email" id="epost" autocomplete="email" placeholder="din@epost.no"
            class="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autofocus />
        </div>
        <div>
          <label for="passord" class="block text-sm font-medium text-zinc-700 mb-1.5">Passord</label>
          <input type="password" id="passord" autocomplete="current-password" placeholder="Ditt passord"
            class="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div id="errorMsg" style="display:none;" class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          Feil e-post eller passord. Prøv igjen.
        </div>

        <button type="submit" id="submitBtn"
          class="w-full bg-blue-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-blue-500 active:bg-blue-700 transition-colors text-sm">
          Logg inn
        </button>
      </form>

      <p class="mt-6 text-xs text-zinc-400 leading-relaxed text-center">
        Har du ikke fått tilgang?<br>
        Kontakt: <a href="mailto:adrian@dmarketing.no" class="underline hover:text-zinc-600">adrian@dmarketing.no</a>
      </p>
    </div>

    <script>
      var USERS_JSON_URL = 'https://raw.githubusercontent.com/AdrianDie/dmarketing-redesign/main/kurs/users.json';
      var TOKEN_KEY      = 'kurs_auth_v3';

      // Allerede innlogget?
      try {
        var stored = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
        if (stored && stored.token === 'kurs_authed_2026' && stored.email) {
          window.location.replace('/kurs/');
        }
      } catch(e) {}

      async function pbkdf2Hash(password, email) {
        var enc = new TextEncoder();
        var keyMaterial = await crypto.subtle.importKey(
          'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
        );
        var bits = await crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: enc.encode(email.toLowerCase()), iterations: 100000, hash: 'SHA-256' },
          keyMaterial, 256
        );
        return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2,'0')).join('');
      }

      document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        var btn    = document.getElementById('submitBtn');
        var errMsg = document.getElementById('errorMsg');
        var email  = document.getElementById('epost').value.toLowerCase().trim();
        var pw     = document.getElementById('passord').value;

        if (!email || !pw) return;

        btn.disabled = true;
        btn.textContent = 'Sjekker…';
        errMsg.style.display = 'none';

        try {
          var res  = await fetch(USERS_JSON_URL + '?t=' + Date.now());
          var db   = await res.json();
          var hash = await pbkdf2Hash(pw, email);
          var user = db.users.find(function(u) { return u.email === email && u.hash === hash; });

          if (user) {
            localStorage.setItem(TOKEN_KEY, JSON.stringify({ email: email, token: 'kurs_authed_2026' }));
            window.location.replace('/kurs/');
          } else {
            errMsg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Logg inn';
            document.getElementById('passord').value = '';
          }
        } catch(err) {
          errMsg.textContent = 'Noe gikk galt. Sjekk internettforbindelsen og prøv igjen.';
          errMsg.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Logg inn';
        }
      });
    </script>
  </body>
  </html>
  ```

- [ ] **Commit:**
  ```bash
  cd C:\Users\adria\website-mirrors\dmarketing-redesign
  git add kurs/login.html
  git commit -m "feat: update kurs login to email+password with PBKDF2"
  ```

---

## Task 6: Oppdater `kurs/auth.js` — per-bruker session

**Files:**
- Modify: `kurs/auth.js`

- [ ] **Erstatt hele `kurs/auth.js`:**

  ```js
  (function () {
    // ============================================================
    //  Kurs-autentisering v3 — per-bruker (email + PBKDF2)
    // ============================================================

    var TOKEN_KEY   = 'kurs_auth_v3';
    var VALID_TOKEN = 'kurs_authed_2026';

    // Skjul siden umiddelbart
    document.documentElement.style.visibility = 'hidden';

    var session = null;
    try {
      session = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    } catch(e) {}

    if (!session || session.token !== VALID_TOKEN || !session.email) {
      window.location.replace('/kurs/login.html');
      return;
    }

    // Innlogget — vis siden
    document.documentElement.style.visibility = '';

    var info = document.getElementById('kurs-user-info');
    if (info) {
      info.innerHTML =
        session.email + '  &middot;  ' +
        '<button onclick="kursLogout()" ' +
        'style="text-decoration:underline;cursor:pointer;background:none;border:none;' +
        'color:inherit;font:inherit;padding:0;">Logg ut</button>';
    }

    window.kursLogout = function () {
      localStorage.removeItem(TOKEN_KEY);
      window.location.replace('/kurs/login.html');
    };
  })();
  ```

- [ ] **Commit:**
  ```bash
  git add kurs/auth.js
  git commit -m "feat: update auth.js to per-user session (v3)"
  ```

---

## Task 7: Opprett `kurs/sett-passord.html`

**Files:**
- Create: `kurs/sett-passord.html`

- [ ] **Opprett `kurs/sett-passord.html`:**

  Erstatt `WORKER_URL` med din faktiske Cloudflare Worker-URL fra Task 4.

  ```html
  <!DOCTYPE html>
  <html lang="no">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Velg passord — AI-nettsider Kurs</title>
    <meta name="robots" content="noindex, nofollow" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: { extend: {
          fontFamily: { display: ['Archivo', 'sans-serif'] },
          colors: { ink: '#09090B', brand: '#2563EB' }
        }}
      }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
    <link href="../images/favicon.png" rel="shortcut icon" type="image/x-icon" />
    <style>body { font-family: 'Inter', sans-serif; background: #FAFAFA; color: #09090B; }</style>
  </head>
  <body class="min-h-screen flex flex-col items-center justify-center px-6 py-12">
    <div class="w-full max-w-sm">

      <div class="mb-8 text-center">
        <span class="inline-flex items-center gap-2 bg-white border border-zinc-200 text-xs font-medium text-zinc-600 px-3 py-1.5 rounded-full shadow-sm">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
          AI-nettsider Kurs · Dietrichs Marketing
        </span>
      </div>

      <div id="viewForm">
        <h1 class="font-display font-extrabold text-3xl tracking-[-0.03em] text-ink mb-3 text-center">
          Velg ditt passord
        </h1>
        <p class="text-zinc-500 text-sm mb-8 leading-relaxed text-center">
          Velg et passord for å få tilgang til kurset.
        </p>

        <form id="pwForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">E-post</label>
            <input type="email" id="epostVis" disabled
              class="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm bg-zinc-50 text-zinc-500" />
          </div>
          <div>
            <label for="pw1" class="block text-sm font-medium text-zinc-700 mb-1.5">Passord</label>
            <input type="password" id="pw1" autocomplete="new-password" placeholder="Minst 8 tegn"
              class="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" autofocus />
          </div>
          <div>
            <label for="pw2" class="block text-sm font-medium text-zinc-700 mb-1.5">Gjenta passord</label>
            <input type="password" id="pw2" autocomplete="new-password" placeholder="Gjenta passordet"
              class="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div id="errorMsg" style="display:none;" class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3"></div>

          <button type="submit" id="submitBtn"
            class="w-full bg-blue-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-blue-500 transition-colors text-sm">
            Sett passord og start kurset
          </button>
        </form>
      </div>

      <div id="viewSuccess" style="display:none;" class="text-center">
        <div class="text-5xl mb-4">✅</div>
        <h2 class="font-display font-bold text-2xl text-ink mb-2">Passord satt!</h2>
        <p class="text-zinc-500 text-sm mb-6">Du sendes videre til kurset…</p>
      </div>

      <div id="viewError" style="display:none;" class="text-center">
        <div class="text-5xl mb-4">⚠️</div>
        <h2 class="font-display font-bold text-2xl text-ink mb-2">Ugyldig lenke</h2>
        <p class="text-zinc-500 text-sm">Lenken er ugyldig eller utløpt.<br>
          Kontakt <a href="mailto:adrian@dmarketing.no" class="underline">adrian@dmarketing.no</a>.
        </p>
      </div>

    </div>

    <script>
      var WORKER_URL = 'https://kurs-auth-worker.DITT-SUBDOMAIN.workers.dev';

      var params = new URLSearchParams(window.location.search);
      var token  = params.get('token') || '';

      if (!token) {
        document.getElementById('viewForm').style.display = 'none';
        document.getElementById('viewError').style.display = 'block';
      }

      // Hent e-post fra users.json basert på token (viser i feltet)
      fetch('https://raw.githubusercontent.com/AdrianDie/dmarketing-redesign/main/kurs/users.json?t=' + Date.now())
        .then(function(r) { return r.json(); })
        .then(function(db) {
          var invite = db.invites.find(function(i) { return i.token === token; });
          if (!invite) {
            document.getElementById('viewForm').style.display = 'none';
            document.getElementById('viewError').style.display = 'block';
            return;
          }
          document.getElementById('epostVis').value = invite.email;
        })
        .catch(function() {
          document.getElementById('viewForm').style.display = 'none';
          document.getElementById('viewError').style.display = 'block';
        });

      async function pbkdf2Hash(password, email) {
        var enc = new TextEncoder();
        var keyMaterial = await crypto.subtle.importKey(
          'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
        );
        var bits = await crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: enc.encode(email.toLowerCase()), iterations: 100000, hash: 'SHA-256' },
          keyMaterial, 256
        );
        return Array.from(new Uint8Array(bits)).map(function(b) { return b.toString(16).padStart(2,'0'); }).join('');
      }

      document.getElementById('pwForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        var btn    = document.getElementById('submitBtn');
        var errMsg = document.getElementById('errorMsg');
        var email  = document.getElementById('epostVis').value.toLowerCase().trim();
        var pw1    = document.getElementById('pw1').value;
        var pw2    = document.getElementById('pw2').value;

        errMsg.style.display = 'none';

        if (pw1.length < 8) {
          errMsg.textContent = 'Passordet må være minst 8 tegn.';
          errMsg.style.display = 'block';
          return;
        }
        if (pw1 !== pw2) {
          errMsg.textContent = 'Passordene er ikke like.';
          errMsg.style.display = 'block';
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Setter passord…';

        try {
          var hash = await pbkdf2Hash(pw1, email);
          var res  = await fetch(WORKER_URL + '/set-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, token: token, hash: hash }),
          });
          var data = await res.json();

          if (res.ok && data.ok) {
            document.getElementById('viewForm').style.display = 'none';
            document.getElementById('viewSuccess').style.display = 'block';
            // Logg inn automatisk og send videre
            localStorage.setItem('kurs_auth_v3', JSON.stringify({ email: email, token: 'kurs_authed_2026' }));
            setTimeout(function() { window.location.replace('/kurs/'); }, 2000);
          } else {
            errMsg.textContent = data.error || 'Noe gikk galt. Prøv igjen.';
            errMsg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Sett passord og start kurset';
          }
        } catch(err) {
          errMsg.textContent = 'Noe gikk galt. Sjekk internettforbindelsen.';
          errMsg.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Sett passord og start kurset';
        }
      });
    </script>
  </body>
  </html>
  ```

- [ ] **Commit:**
  ```bash
  git add kurs/sett-passord.html
  git commit -m "feat: add password setup page for invite flow"
  ```

---

## Task 8: Legg til Kurs-fane i kundedashboardet

**Files:**
- Modify: `C:\Users\adria\dmarketing-dashboard\dashboard.html`

**Forutsetning:** `dashboard.html` (ukryptert) eksisterer i `C:\Users\adria\dmarketing-dashboard\` etter dekryptering i forutsetningene.

Legg til en ny "Kurs"-fane i dashboardet. Finn fanen-navlinjen (der "AI-nettsider", "Voltio", "Kalender" ligger) og legg til "Kurs"-fanen, og legg til tilhørende panel-innhold.

- [ ] **Finn fane-navlinjen** i `dashboard.html` — søk etter teksten `AI-nettsider` for å finne riktig sted.

- [ ] **Legg til "Kurs"-fane i nav** (etter eksisterende faner):
  ```html
  <button class="tab-btn px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          data-tab="kurs" onclick="switchTab('kurs')">
    Kurs
  </button>
  ```

- [ ] **Legg til Kurs-panelet** (etter siste eksisterende tab-panel, før avsluttende `</div>`):

  Erstatt `WORKER_URL` og `WORKER_SECRET` med faktiske verdier fra Task 4.

  ```html
  <!-- ═══════════════════════════════════════ KURS-PANEL ══ -->
  <div id="tab-kurs" class="tab-panel hidden">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-zinc-900">Kurstilgang</h2>
        <p class="text-sm text-zinc-500 mt-0.5">Administrer hvem som har tilgang til AI-nettsider Kurset</p>
      </div>
      <button onclick="kursVisLeggTil()" id="btnLeggTil"
        class="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-500 transition-colors">
        + Legg til bruker
      </button>
    </div>

    <!-- Legg til-skjema -->
    <div id="kursLeggTilForm" class="hidden mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
      <p class="text-sm font-medium text-blue-900 mb-3">Inviter ny bruker — velkomst-epost sendes automatisk</p>
      <div class="flex gap-2">
        <input type="email" id="kursNyEpost" placeholder="kunde@firma.no"
          class="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onclick="kursSendInvite()" id="btnSendInvite"
          class="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap">
          Send invitasjon
        </button>
        <button onclick="kursSkjulLeggTil()"
          class="text-sm text-zinc-500 px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors">
          Avbryt
        </button>
      </div>
      <div id="kursInviteMsg" class="mt-3 text-sm hidden"></div>
    </div>

    <!-- Brukerliste -->
    <div class="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      <div class="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center gap-4">
        <span class="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex-1">E-post</span>
        <span class="text-xs font-semibold text-zinc-500 uppercase tracking-wide w-24">Status</span>
        <span class="w-16"></span>
      </div>
      <div id="kursUserList" class="divide-y divide-zinc-100">
        <div class="px-4 py-8 text-center text-sm text-zinc-400">Laster…</div>
      </div>
    </div>

    <p class="text-xs text-zinc-400 mt-4">
      Brukerdatabasen ligger i <code>kurs/users.json</code> på GitHub.
      Laster automatisk ved åpning av fanen.
    </p>
  </div>
  ```

- [ ] **Legg til JavaScript for Kurs-fanen** — finn `<script>`-blokken i dashboardet og legg til følgende kode (erstatt verdiene):

  ```js
  // ─── Kurs-administrasjon ──────────────────────────────────────────────────
  var KURS_WORKER_URL    = 'https://kurs-auth-worker.DITT-SUBDOMAIN.workers.dev';
  var KURS_WORKER_SECRET = 'kurs-admin-2026-secret'; // samme som satt i Task 4
  var KURS_USERS_URL     = 'https://raw.githubusercontent.com/AdrianDie/dmarketing-redesign/main/kurs/users.json';

  var kursDb = null;

  async function kursLastBrukere() {
    var listEl = document.getElementById('kursUserList');
    try {
      var res = await fetch(KURS_USERS_URL + '?t=' + Date.now());
      kursDb  = await res.json();
      kursRenderBrukere();
    } catch(e) {
      listEl.innerHTML = '<div class="px-4 py-6 text-center text-sm text-red-500">Kunne ikke laste brukerlisten.</div>';
    }
  }

  function kursRenderBrukere() {
    var listEl = document.getElementById('kursUserList');
    if (!kursDb) return;
    var items = [];

    kursDb.users.forEach(function(u) {
      items.push({ email: u.email, status: 'Aktiv', statusClass: 'bg-green-100 text-green-700' });
    });
    kursDb.invites.forEach(function(i) {
      var expired = new Date(i.expires) < new Date();
      items.push({
        email: i.email,
        status: expired ? 'Utløpt' : 'Invitert',
        statusClass: expired ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
      });
    });

    if (items.length === 0) {
      listEl.innerHTML = '<div class="px-4 py-8 text-center text-sm text-zinc-400">Ingen brukere ennå.</div>';
      return;
    }

    listEl.innerHTML = items.map(function(item) {
      return '<div class="px-4 py-3 flex items-center gap-4">' +
        '<span class="flex-1 text-sm text-zinc-800 font-medium">' + escHtml(item.email) + '</span>' +
        '<span class="w-24"><span class="inline-block text-xs font-medium px-2 py-0.5 rounded-full ' + item.statusClass + '">' + item.status + '</span></span>' +
        '<div class="w-16 text-right">' +
          '<button onclick="kursFjernBruker(\'' + escHtml(item.email) + '\')" ' +
          'class="text-xs text-zinc-400 hover:text-red-500 transition-colors">Fjern</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function kursVisLeggTil() {
    document.getElementById('kursLeggTilForm').classList.remove('hidden');
    document.getElementById('btnLeggTil').classList.add('hidden');
    document.getElementById('kursNyEpost').focus();
  }

  function kursSkjulLeggTil() {
    document.getElementById('kursLeggTilForm').classList.add('hidden');
    document.getElementById('btnLeggTil').classList.remove('hidden');
    document.getElementById('kursNyEpost').value = '';
    document.getElementById('kursInviteMsg').classList.add('hidden');
  }

  async function kursSendInvite() {
    var email  = document.getElementById('kursNyEpost').value.toLowerCase().trim();
    var btn    = document.getElementById('btnSendInvite');
    var msgEl  = document.getElementById('kursInviteMsg');

    if (!email || !email.includes('@')) {
      msgEl.textContent = 'Skriv inn en gyldig e-postadresse.';
      msgEl.className   = 'mt-3 text-sm text-red-600';
      msgEl.classList.remove('hidden');
      return;
    }

    btn.disabled    = true;
    btn.textContent = 'Sender…';
    msgEl.classList.add('hidden');

    try {
      var res  = await fetch(KURS_WORKER_URL + '/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Worker-Secret': KURS_WORKER_SECRET,
        },
        body: JSON.stringify({ email: email }),
      });
      var data = await res.json();

      if (res.ok) {
        msgEl.textContent = '✅ Invitasjon sendt til ' + email;
        msgEl.className   = 'mt-3 text-sm text-green-700';
        msgEl.classList.remove('hidden');
        document.getElementById('kursNyEpost').value = '';
        await kursLastBrukere(); // oppdater lista
      } else {
        msgEl.textContent = '❌ ' + (data.error || 'Noe gikk galt.');
        msgEl.className   = 'mt-3 text-sm text-red-600';
        msgEl.classList.remove('hidden');
      }
    } catch(e) {
      msgEl.textContent = '❌ Nettverksfeil. Prøv igjen.';
      msgEl.className   = 'mt-3 text-sm text-red-600';
      msgEl.classList.remove('hidden');
    }

    btn.disabled    = false;
    btn.textContent = 'Send invitasjon';
  }

  async function kursFjernBruker(email) {
    if (!confirm('Fjerne tilgangen til ' + email + '?')) return;
    if (!kursDb) return;

    // Fjern lokalt og vis oppdatert liste optimistisk
    kursDb.users   = kursDb.users.filter(function(u) { return u.email !== email; });
    kursDb.invites = kursDb.invites.filter(function(i) { return i.email !== email; });
    kursRenderBrukere();

    // NB: Dette skriver IKKE til GitHub — for å slette permanent må du
    // redigere kurs/users.json direkte på GitHub eller utvide workeren med /remove-user.
    // TODO for v2: legg til /remove-user i Cloudflare Worker.
    alert('Bruker fjernet lokalt. For permanent fjerning: slett ' + email + ' fra kurs/users.json på GitHub.');
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Last brukere når Kurs-fanen åpnes
  var _origSwitchTab = typeof switchTab === 'function' ? switchTab : null;
  function switchTab(tab) {
    if (_origSwitchTab) _origSwitchTab(tab);
    if (tab === 'kurs' && !kursDb) kursLastBrukere();
  }
  ```

- [ ] **Re-krypter dashboardet** med StatiCrypt:
  ```bash
  cd C:\Users\adria\dmarketing-dashboard
  # Kjør bat-filen og skriv inn passordet ditt når du blir bedt
  "Lag passord-versjon.bat"
  ```

- [ ] **Test lokalt** — åpne `laast/dashboard.html` i nettleseren, logg inn, sjekk at "Kurs"-fanen vises.

---

## Task 9: Oppdater `sett-passord.html` med riktig worker-URL

**Files:**
- Modify: `kurs/sett-passord.html`

- [ ] **Erstatt `WORKER_URL`** i `kurs/sett-passord.html` med den faktiske worker-URL-en fra Task 4:
  ```
  var WORKER_URL = 'https://kurs-auth-worker.<ditt-subdomain>.workers.dev';
  ```

- [ ] **Commit og push alt:**
  ```bash
  cd C:\Users\adria\website-mirrors\dmarketing-redesign
  git add kurs/
  git commit -m "feat: complete per-user kurs auth system"
  git push
  ```

---

## Task 10: End-to-end test

- [ ] **Test invitasjonsflyt:**
  1. Åpne `laast/dashboard.html` → Kurs-fanen
  2. Legg til e-posten din (f.eks. `adrian.dietrichs@gmail.com`)
  3. Sjekk at du mottar velkomst-epost med invitasjonslenke

- [ ] **Test passord-oppsett:**
  1. Klikk lenken i e-posten
  2. Sjekk at e-posten din vises (pre-fylt)
  3. Sett et passord (min. 8 tegn)
  4. Sjekk at du sendes videre til `/kurs/`
  5. Sjekk at bekreftelse-epost ankommer

- [ ] **Test innlogging:**
  1. Logg ut (klikk "Logg ut" i kurs-menyen)
  2. Gå til `/kurs/login.html`
  3. Logg inn med e-post + passord
  4. Verifiser at du kommer inn

- [ ] **Test feil passord:**
  1. Prøv å logge inn med feil passord
  2. Verifiser at du får feilmelding og ikke kommer inn

- [ ] **Test ugyldig invite-lenke:**
  1. Gå til `/kurs/sett-passord.html?token=ugyldig`
  2. Verifiser at du ser "Ugyldig lenke"-skjermen

---

## Notater

**WORKER_SECRET** lagres to steder — hold dem i sync:
- Cloudflare Worker: `wrangler secret put WORKER_SECRET`
- Dashboard: `KURS_WORKER_SECRET`-variabelen i `dashboard.html`

**Fjerne bruker permanent (v1):** Gå til github.com/AdrianDie/dmarketing-redesign → `kurs/users.json` → rediger filen direkte og slett brukeren. En `/remove-user` endpoint i workeren kan legges til i v2.

**GitHub raw cache:** GitHub cacher raw-filer i 5 minutter. Nye brukere kan oppleve å måtte vente litt etter at passordet er satt. `?t=` cache-busting-parameteren i fetch-kallene reduserer dette.
