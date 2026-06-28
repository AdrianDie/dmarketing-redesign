# Compliance — Dietrichs Marketing

Notater om personvern, cookies og vilkår for dmarketing.no / voltio.no.
Bakgrunn: gjennomgang av en (amerikansk) video om app-jus, oversatt til norsk/EU-rett.

> **Viktig:** Videoen var amerikansk (FTC, CCPA, App Store, DMCA). Prinsippene gjelder,
> men mekanismene er andre her. **Ikke** legg inn en amerikansk voldgiftsklausul — tvungne
> voldgiftsklausuler mot forbrukere er i praksis ugyldige i EU/Norge. Vi bruker i stedet
> ansvarsbegrensning + norsk verneting (se `vilkar/`).

## Hva som er på plass

| Tiltak | Hvor | Status |
|--------|------|--------|
| Cookie-samtykke (Google Consent Mode v2) | inline i alle 48 sider med Google-tag | ✅ |
| Oppdatert personvernerklæring (Supabase, samtykke-cookies, «endre samtykke») | `personvern/index.html` | ✅ |
| Vilkår og betingelser (utkast) | `vilkar/index.html` | ⚠️ utkast — se under |

## Slik virker cookie-samtykket

- Snutten ligger **inline** rett etter `function gtag(){dataLayer.push(arguments);}` i hver side.
  Den må ligge der fordi `consent default = denied` må kjøre **før** `gtag('config', …)`,
  ellers settes analyse-/annonsekapsler før samtykke.
- Standard: alle signaler (`ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`)
  settes til `denied`. Banner vises. Først ved «Godta alle» sendes `consent update = granted`.
- Valget lagres i `localStorage['dm-cookie-consent']` (`granted`/`denied`). Avslag = ingen mas ved retur.
- Brukeren kan ombestemme seg via «Endre cookie-samtykke»-knappen nederst i personvernerklæringen.

**Endre banneret senere:** snutten er duplisert i hver side. For å endre tekst/design,
oppdater `scratchpad/inject_consent.py` og kjør på nytt (den hopper over allerede dekkede sider),
eller gjør et søk-og-erstatt på `id='dm-cc'`-blokken.

## Gjenstår — for Adrian / jurist

1. **Supabase:** bekreft datalagringsregion (EU vs. USA) og signér databehandleravtale.
   Hvis data lagres utenfor EØS må overføringsgrunnlag (EUs standardklausuler) inn i
   personvernerklæringen pkt. 5 (det ligger en HTML-kommentar der).
2. **Vilkår (`vilkar/`):** la en advokat gå over teksten før den brukes i kundeforhold —
   særlig ansvarsbegrensning (pkt. 7) og databehandleravtale for Voltio (pkt. 10).
3. **Voltio-widgeten:** selve chat-widgeten må fortelle sluttbrukeren at den snakker med
   en AI («Du chatter med en AI-assistent»). Krav etter EU AI Act art. 50 (gjelder fra aug. 2026).
   Widgeten ligger i Voltio-plattformen, ikke i dette repoet.
4. **Maler / kundesider:** malene i `maler/` har i dag **ingen** Google-tag, og dermed ingen
   cookies som krever samtykke. **Hvis** du legger Google Analytics/Ads på en kundeside,
   må du også legge inn samtykke-snutten på den siden.
5. **Brukeropplastet innhold (UGC):** ikke aktuelt i dag (ingen sider tar imot opplasting).
   Når en app lar sluttbrukere laste opp innhold, legg inn varsel-/fjern-rutine (notice-and-takedown)
   og ansvarsklausul fra start.
6. **Footer-lenker:** vurder å lenke `personvern/` og `vilkar/` fra footeren på hovedsidene.

## Sikkerhet (dmarketing-dashboard)

- `.gitignore` er strammet til `*.env` slik at `ikke-slett.env` (med Cloudflare-/Resend-tokens)
  ikke kan havne i git ved en `git add -A`. Filen var ikke sporet fra før.
- **Anbefalt:** rullér de to tokenene som lå i klartekst i `ikke-slett.env` for god skikk.
