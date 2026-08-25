# Design: tidslinje-rename og "fra andre"-bookinger

**Dato:** 2026-08-25
**Mål:** to relaterte, men uavhengige endringer i selgerportalen (`/selger/`):
1. Gi kvitteringssløyfa på Min uke et generelt navn ("Tidslinje") i stedet for
   "Det som skjedde mens du ringte".
2. Gi Adrian et sted i portalen der han ser bookinger andre selgere sender
   inn, uten å måtte innom selger-administrasjonen.

---

## Bakgrunn (hvorfor Martes booking ikke vises i dag)

"Det som skjedde mens du ringte" (`selger/index.html:166-173`) er ikke en
felles logg. Backend (`workers/selger/index.js` `hentTall()`, linje 570-577)
henter `hendelser` med `WHERE selger = ?`, bundet til e-posten til den som er
innlogget. Den er bevisst bygget som en personlig kvitteringssløyfe — hver
selger følger SIN EGEN bookings reise, ikke lagets. Marte sin booking har
`selger = marte@...` og vil derfor aldri vises når Adrian er innlogget, uansett
status. Dette er ikke en bug og skal ikke endres — bare navnet er misvisende
for et snevert, personlig formål.

Admin-siden (`selger/admin/index.html`) har allerede en full liste over ALLE
bookinger fra ALLE selgere (`alle_bookinger`-handlingen → `alleBookinger()`),
med statusdropdown. Den beholdes UENDRET — dette designet dupliserer den ikke,
det legger til en lesevisning filtrert til "ikke mine egne", et annet sted i
menyen.

---

## Del 1: Rename (Min uke)

| Fil | Endring |
|---|---|
| `selger/index.html:168` | Tekst i `<h2 id="kvit-h">` endres fra "Det som skjedde mens du ringte" til **"Tidslinje"** |

Ingen andre filer refererer til denne strengen (verifisert med søk). Ren
tekstendring — `id`-er, kommentarer og JS som fyller `#kvit-liste` røres ikke.

---

## Del 2: Ny "Fra andre"-fane på Bookinger-siden

**Fil:** `selger/bookinger/index.html`

To faner øverst i `<main>`, under ingressen (linje ~75), før `#liste`:

- **"Mine"** — dagens innhold, default aktiv. Bruker eksisterende
  `API.mineBookinger()` og 5-stegs statusvisning, uendret.
- **"Fra andre"** — kun rendret/synlig når
  `window.SELGER.epost === 'adrian@dmarketing.no'`. Samme sjekk som allerede
  styrer `[data-admin-lenke]` i `selger/index.html:349` — gjenbruker
  eksisterende mønster, innfører ikke noe nytt gatingsystem.

H1 (linje 71, "Mine bookinger") bytter tekst med fanevalg: "Mine bookinger" /
"Bookinger fra andre".

**Kortinnhold i "Fra andre"** (per booking, read-only — ingen statusdropdown):
- Bedrift, kontaktperson
- **Hvem som booket den** (selgerens navn — nytt sammenlignet med "Mine",
  siden det her ikke er opplagt)
- Dato, e-post, nettside-lenke, Jira-lenke (samme felt `alleBookinger()`
  allerede returnerer)
- Samme 5-stegs statusvisning (farger/steg) som "Mine"-fanen, kun visning

Én lenke øverst i fanen: **"Endre status → Selgere"**, peker til
`/selger/admin/`. Begrunnelse for read-only: statusendring finnes allerede på
admin-siden; å bygge redigering to steder betyr å vedlikeholde
`BSTATUS`-lista to steder for null ekstra nytte.

**Tom-tilstand:** "Ingen bookinger fra andre selgere ennå." (samme visuelle
mønster som eksisterende `#tom`).

---

## Del 3: Backend (`workers/selger/index.js`)

1. **Utvid `alleBookinger()` (linje 251-264)** med valgfritt
   `unntattSelger`-parameter:
   ```js
   async function alleBookinger(env, unntattSelger) {
     const where = unntattSelger ? 'WHERE selger != ?' : '';
     const stmt = env.DB.prepare(
       `SELECT id, dato, selger, bedrift, kontakt, epost, telefon, nettside, notat, status, jira_key
          FROM bookinger ${where} ORDER BY id DESC`
     );
     const rows = (await (unntattSelger ? stmt.bind(unntattSelger) : stmt).all()).results;
     // resten uendret (navn-oppslag og map)
   }
   ```
   Eksisterende kallet `alleBookinger(env)` fra `alle_bookinger`-handlingen
   (admin-siden) er uendret i oppførsel.

2. **Ny handling `andre_bookinger`** i admin-lista (linje 61-62), samme
   admin-sperre (`erAdmin`) som resten av gruppa:
   ```js
   else if (h === 'andre_bookinger') ar = await alleBookinger(env, selger.epost);
   ```

Ingen endring i `schema.sql`, ingen migrering nødvendig — bruker eksisterende
kolonner.

---

## Del 4: Frontend-kobling

**`selger/api.js`**
- Ny metode `andreBookinger()` i admin-gruppa, samme mønster som
  `alleBookinger`:
  ```js
  andreBookinger: function () { return be({ handling: 'andre_bookinger' }); },
  ```
- Ny `DEMO.andreBookinger`-liste (2-3 påfunne bookinger med ulike selgernavn,
  én med `status: 'sendt'`, én lenger ute i løpet), slik at `?demo=1` gir
  meningsfullt innhold i "Fra andre"-fanen uten ekte innlogging.

---

## Avgrensning (YAGNI)

Bygges **ikke** nå:
- Statusredigering i "Fra andre"-fanen (bekreftet med Adrian — link til
  Selgere-siden er nok).
- "Ny siden sist"-merking / uleste-telling (Adrian valgte vanlig kronologisk
  liste).
- Endringer i admin-sidens eksisterende `alle_bookinger`-visning.
- Varsling (e-post/push) når en ny booking kommer inn fra en annen selger —
  kun en side han kan sjekke.
- Endring av nav-label ("Mine bookinger" / "Bookinger" i header) — fanene
  ligger inne på samme side/URL.

---

## Suksesskriterier

1. Min uke viser "Tidslinje" i stedet for "Det som skjedde mens du ringte",
   resten av modulen (innhold, skjult-til-første-booking-logikk) uendret.
2. På `/selger/bookinger/` ser en vanlig (ikke-admin) selger kun "Mine",
   ingen "Fra andre"-fane, ingen feil i konsollen.
3. Innlogget som `adrian@dmarketing.no`: "Fra andre" viser bookinger fra
   andre selgere (ikke Adrians egne, hvis han har noen), med selgernavn,
   status og read-only 5-stegsvisning.
4. `?demo=1` gir meningsfullt innhold i begge faner uten innlogging.
5. Admin-sidens "Bookinger"-seksjon fungerer akkurat som før (regresjonsfritt).
6. `npx wrangler deploy` kjørt fra `workers/selger/` for at backend-endringen
   skal være live.
