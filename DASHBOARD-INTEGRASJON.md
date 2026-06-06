# Dynamisk nettside → dashboard (Supabase)

Mål: skjema-innsendinger på dmarketing.no havner automatisk som leads/kort i
kunde-dashboardet.

Hvorfor Supabase: dashboardet lagrer i `localStorage` (kun din maskin). En
offentlig nettside kan ikke skrive dit. Vi trenger en delt sky-database. Supabase
er gratis, rask, og har «Realtime» (nye leads dukker opp i dashboardet live).

## Status (hva er gjort på nettside-siden)
- Kontaktskjemaet (`ny-forside/kontakt.html`) har nå feltene: Navn, Epost*,
  Telefon, **Bedrift**, **Nåværende nettside**, Melding*.
- `app.js` sender en **ikke-blokkerende Supabase-insert** ved innsending — men
  KUN når `window.DM_SUPABASE` er fylt ut. Tomt = av (skjemaet sender til e-post
  via formsubmit som før). Den kaller aldri `preventDefault`, så e-postvarselet
  kommer alltid.
- Config ligger i `kontakt.html`:
  `<script>window.DM_SUPABASE = { url: "", anonKey: "", table: "leads" };</script>`

## DU gjør dette én gang (ca. 5 min)
1. Lag konto på https://supabase.com (logg inn med GitHub). Nytt prosjekt.
2. SQL Editor → kjør:
   ```sql
   create table public.leads (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz default now(),
     type text default 'ai-nettsider',   -- 'ai-nettsider' | 'voltio'
     status text default 'ny',            -- kanban-kolonne
     kilde text,                          -- f.eks. 'kontaktskjema'
     navn text, bedrift text, epost text, telefon text,
     nettside text, melding text, notater text
   );
   alter table public.leads enable row level security;
   -- Nettsiden (anon) kan SETTE INN, men ikke lese:
   create policy "anon insert" on public.leads
     for insert to anon with check (true);
   ```
3. Settings → API → kopier **Project URL** og **anon public key**.
4. Lim dem inn i `kontakt.html`-config:
   `window.DM_SUPABASE = { url: "https://xxxx.supabase.co", anonKey: "eyJ...", table: "leads" };`
   Deploy (se under). Nå flyter leads inn i Supabase-tabellen `leads`.

## Dashboard-siden (gjenstår — krever input fra deg)
Dashboardet må leses fra Supabase i stedet for/i tillegg til localStorage.
**Blokkering:** den ukrypterte dashboard-kilden ligger ikke i repoet
(`laast/dashboard.html` er StatiCrypt-kryptert). For å koble dashboardet trenger
jeg ETT av:
- den ukrypterte `dashboard.html`-kilden, eller
- StatiCrypt-passordet (så jeg kan dekryptere og redigere).

Når jeg har den:
- Legg til Supabase-klient i dashboardet. Bruk **Supabase Auth** (innlogging) i
  stedet for StatiCrypt for ekte kundedata, og en SELECT-policy for innloggede.
- Les `leads` (type='ai-nettsider' → AI-nettsider-fanen, 'voltio' → Voltio).
- Realtime-subscription så nye leads dukker opp som kort automatisk.
- Flytting av kort mellom kolonner → `update status` tilbake til Supabase.

## Deploy (nettside)
Fra `C:\Users\adria\website-mirrors\dmarketing-redesign`:
```
git add ny-forside && git commit -m "..." && git push origin add-ny-forside
SPLIT=$(git subtree split --prefix=ny-forside add-ny-forside | tail -1)
git push origin "$SPLIT:refs/heads/gh-pages"
```
CNAME-fila i `ny-forside/` MÅ være med (ellers nullstilles domenet).
