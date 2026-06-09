# Design: To-spors kurs med toggle

**Dato:** 2026-06-09
**Prosjekt:** dmarketing-redesign / kurs

---

## Bakgrunn

Kurset dekker nå én arbeidsflyt (implisitt Claude Code / automatisk GitHub). Kundene er ikke-tekniske småbedriftseiere som trenger å velge mellom to reelle spor:

- **Gratis · Mer manuelt** — claude.ai i nettleseren, manuell copy-paste mellom VS Code og Claude
- **Enklere · Claude Code** — betalt abonnement, Claude Code i VS Code-terminal gjør alt automatisk

---

## Verktøy begge spor

| Formål | Verktøy |
|--------|---------|
| Redigere filer | VS Code |
| Forhåndsvisning lokalt | Live Server (VS Code-utvidelse) |
| Git: commit + push | VS Code Source Control-panel |
| AI (gratis) | claude.ai (nettleser) |
| AI (betalt) | Claude Code (i VS Code-terminal) |

---

## Toggle-design

### Plassering
- Øverst i innholdsområdet på moduler som har spor-spesifikt innhold (04–11)
- Sticky mens man scroller
- Vises **ikke** på felles moduler (01–03, 08, 12–13)

### Utseende
```
┌─────────────────────────────────────────────────────┐
│  Velg hvordan du vil jobbe — du kan bytte når som helst  │
│  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │ 🟡 Gratis           │  │ 🔵 Enklere          │   │
│  │ Mer manuelt         │  │ Claude Code         │   │
│  │ claude.ai gratis    │  │ Betalt, automatisk  │   │
│  └─────────────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Farger på sporavhengige seksjoner
- **Gratis:** bakgrunn `#FFFBEB`, kantlinje `#FDE68A`, label-badge `#D97706`
- **Claude Code:** bakgrunn `#EFF6FF`, kantlinje `#BFDBFE`, label-badge `#2563EB`

### Teknisk
- `localStorage` key: `kurs_track`, verdier: `gratis` | `kode`
- Standard (første besøk): `gratis`
- Implementeres i ny fil: `kurs/kurs-track.js`
- CSS-klasser: `.spor-gratis`, `.spor-kode`
- JS toggles `display: none/block` på `.spor-gratis` og `.spor-kode`
- Første gang kunden åpner en modul med toggle → liten forklaringsboks vises én gang (lagres i `localStorage`)

---

## Moduloversikt — hva endres

| Modul | Status | Handling |
|-------|--------|----------|
| 01 Velkommen | Felles | Ingen endring |
| 02 Hvordan fungerer det | Felles | Legg til kort note om de to sporene |
| 03 Overgangen | Felles | Ingen endring |
| **04 Komme i gang** | **Full split** | Fullstendig omskriving — se under |
| **05 Oppdatere innhold** | **Split** | Doble «Slik gjør du det»-blokker |
| **06 Bytte bilder** | **Split** | Doble «Slik gjør du det»-blokker |
| **07 Ny side** | **Split** | Doble «Slik gjør du det»-blokker |
| 08 SEO | Felles | Ingen endring |
| 09 Prompts | Delvis split | Legg til Claude Code-spesifikke tips |
| **10 Publisere** | **Split** | Commit-seksjon splittes |
| **11 Feilsøking** | **Delvis split** | Spor-spesifikke feil |
| 12 Integrasjoner | Felles | Ingen endring |
| 13 Eierskap | Felles | Ingen endring |

---

## Modul 04 — fullstendig omskriving

### Felles seksjon (vises til alle)
1. Opprett GitHub-konto på github.com
2. Aksepter invitasjon fra Dietrichs til repoet ditt
3. Bekreft at du ser filene på github.com
4. Installer VS Code (code.visualstudio.com)
5. Installer Live Server-utvidelse i VS Code
6. Klon repoet: VS Code → «Clone Repository» → lim inn repo-URL
7. Prosjektmappen åpnes i VS Code
8. Høyreklikk `index.html` → «Open with Live Server» → nettstedet åpner i nettleseren
9. Du ser nettstedet lokalt — endringer vises med en gang du lagrer

### Gratis-spor (ny innhold)
10. Gå til claude.ai → «Sign Up» → gratis konto
11. Hva gratis-versjonen kan og ikke kan
12. Forklaring av arbeidsflyten: VS Code ↔ claude.ai ↔ VS Code → push
13. Første test: gjør en liten endring fra bunnen av

### Claude Code-spor (ny innhold)
10. Kjøp Claude Pro på anthropic.com ($20/mnd) — hva du får
11. Åpne terminal i VS Code (`Ctrl+Ø` / `` Ctrl+` ``)
12. Installer Claude Code: `npm install -g @anthropic-ai/claude-code`
13. Autentiser: `claude` → følg instruksjonene
14. Kjør `claude` i prosjektmappen
15. Claude leser `CLAUDE.md` (ferdigskrevet av Dietrichs — beskriver nettstedet)
16. Første test: beskriv en endring → se at Claude finner filen selv → godkjenn

---

## Arbeidsflyter i detalj

### Gratis-arbeidsflyt (modul 05–07, 10)
1. VS Code → finn filen i Explorer-panelet → åpne
2. `Ctrl+A` → `Ctrl+C` (kopier hele filen)
3. claude.ai → ny chat → lim inn + beskriv endringen
4. Claude svarer med ny, komplett fil → kopier svaret
5. VS Code → `Ctrl+A` → lim inn → `Ctrl+S` (lagre)
6. Live Server oppdaterer nettleseren automatisk → se endringen
7. Hvis bra: VS Code Source Control-panel → skriv commit-melding → «Commit & Push»
8. Vent 30–60 sek → live på nettstedet ✓

### Claude Code-arbeidsflyt (modul 05–07, 10)
1. VS Code terminal → `claude` (allerede i prosjektmappen)
2. Beskriv hva du vil endre på vanlig norsk
3. Claude leser relevante filer og finner riktig sted selv
4. Claude viser foreslått endring (diff) → du godkjenner med `y`
5. Live Server oppdaterer nettleseren → se endringen
6. Hvis bra: «Commit og push disse endringene»
7. Claude committer og pusher
8. Vent 30–60 sek → live ✓

---

## CLAUDE.md

Dietrichs leverer en ferdigskrevet `CLAUDE.md` i repoet til hver kunde. Den inneholder:
- Bedriftsnavn, bransje, tone-of-voice
- Hvilke filer som gjør hva (index.html = forside, etc.)
- Instruksjoner: alltid commit etter endringer, bruk norsk, ikke endre design uten å spørre

---

## Teknisk implementasjon

### Ny fil: `kurs/kurs-track.js`
```javascript
(function () {
  var TRACK_KEY = 'kurs_track';
  var track = localStorage.getItem(TRACK_KEY) || 'gratis';

  function applyTrack(t) {
    document.querySelectorAll('.spor-gratis').forEach(el => {
      el.style.display = t === 'gratis' ? '' : 'none';
    });
    document.querySelectorAll('.spor-kode').forEach(el => {
      el.style.display = t === 'kode' ? '' : 'none';
    });
    document.querySelectorAll('.track-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.track === t);
    });
  }

  window.setTrack = function (t) {
    localStorage.setItem(TRACK_KEY, t);
    track = t;
    applyTrack(t);
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyTrack(track);
  });
})();
```

### HTML-mønster for toggle
```html
<div class="track-toggle not-prose">
  <p class="track-intro">Velg hvordan du vil jobbe — du kan bytte når som helst</p>
  <div class="track-buttons">
    <button class="track-btn" data-track="gratis" onclick="setTrack('gratis')">
      <span class="track-icon">🟡</span>
      <span class="track-name">Gratis · Mer manuelt</span>
      <span class="track-sub">claude.ai i nettleseren</span>
    </button>
    <button class="track-btn" data-track="kode" onclick="setTrack('kode')">
      <span class="track-icon">🔵</span>
      <span class="track-name">Enklere · Claude Code</span>
      <span class="track-sub">Betalt — Claude gjør alt automatisk</span>
    </button>
  </div>
</div>
```

### HTML-mønster for spor-seksjon
```html
<div class="spor-gratis spor-block">
  <div class="spor-label">🟡 Gratis · Mer manuelt</div>
  <!-- Gratis-innhold her -->
</div>

<div class="spor-kode spor-block">
  <div class="spor-label">🔵 Enklere · Claude Code</div>
  <!-- Claude Code-innhold her -->
</div>
```

---

## Filer som opprettes / endres

**Ny:**
- `kurs/kurs-track.js`

**Fullstendig omskriving:**
- `kurs/04-komme-i-gang.html`

**Toggle + doble arbeidsflyt-blokker:**
- `kurs/05-oppdatere-innhold.html`
- `kurs/06-bytte-bilder.html`
- `kurs/07-ny-side.html`
- `kurs/10-publisere.html`

**Toggle + delvis split:**
- `kurs/09-prompts.html`
- `kurs/11-feilsoking.html`

**Mindre justering:**
- `kurs/02-hvordan-fungerer-det.html` (note om to spor)
- `kurs/index.html` (legg til `kurs-track.js`, info om to spor)

**Ny i hvert kunderepo (ikke i kurs-repoet):**
- `CLAUDE.md` (mal leveres som del av onboarding)
