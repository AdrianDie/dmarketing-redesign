# Modul 14: Varsler og oppfølging — design

Godkjent av Adrian 18.08.2026 i chat (ikke egen spec-revisjon, publisert direkte på hans instruks).

## Bakgrunn

Adrian ba om en ny AI-drift-modul om «Claude Routines». Perplexity-research (limt inn av Adrian) viste at Routines er navnet på tilsvarende funksjon i Claude Code (utvikler-verktøyet), ikke noe som finnes for Cowork-brukere. Kursets målgruppe (ikke-tekniske småbedriftseiere) bruker Claude Cowork / Scheduled Tasks, som allerede er dekket i modul 13. Gjennomgang av modul 09 og 13 viste at rapport-eksemplene i researchen (ukesrapport, morgenbriefing, fakturapurring) i stor grad allerede finnes i modul 13 sine fire «flow»-kort. Det som IKKE finnes, er varsler/alerts (reagere når noe endrer seg, ikke bare levere på fast tidspunkt).

## Beslutning

Bygg én ny modul (14) dedikert til varsler, plassert etter dagens modul 13. Modul 13 forblir mekanikk-modulen (hvordan Cowork/Scheduled Tasks fungerer), modul 14 bruker samme mekanikk til et nytt formål. Kapstone-avslutningen («Du er i mål», DFY-footnote, «siste modul»-teksten) flyttes fra 13 til 14, siden 14 nå er det faktiske sluttpunktet i kurset.

Alternativer vurdert og forkastet: (a) utvide modul 13 i stedet for ny modul — forkastet fordi Adrian ba spesifikt om en ny modul; (b) sette inn ny modul FØR 13 med full renummerering — forkastet fordi det krever unødvendig mekanisk arbeid (mappenavn, nav, moduler.js, inline-referanse i modul 09) uten pedagogisk vinning, siden varsler bygger på mekanikken i 13.

## Innhold i modul 14

**Slug:** `14-varsler-og-oppfolging`
**Tittel:** «Ingenting glipper, uten at du må sjekke selv»
**Kategori-badge:** Avansert (samme ambér-stil som modul 13, siden begge krever betalt Cowork-plan)

Fire flow-kort (gjenbruker `.flow`-CSS fra modul 13, ingen ny styling):
1. Ledig time fylles selv (avbestilling → sjekk venteliste/Notion → forslag i Gmail) — håndverker/klinikk
2. Ingen tom hylle overrasker deg (lav lagerstatus → bestillingsforslag) — butikk/e-handel
3. Stille kunder får en påminnelse før de er tapt (30+ dager uten kontakt) — konsulent/salg
4. Viktige ord fanges opp med en gang (klage/oppsigelse/stornordre i innboksen) — alle bransjer

Bonusnevnelser (kort liste, ikke fulle kort): nye Google-anmeldelser (lenke til modul 05), konkurrent-prissjekk via nettleser-connector (flagges som mer avansert oppsett).

Egen boks (samme mønster som modul 13 sin «Er du teknisk?»-boks): nevner at Claude Code har en tilsvarende funksjon kalt Routines for utviklere/tekniske team, utenfor scope her. Dette er stedet «Claude Routines» nevnes i kurset, korrekt plassert og navngitt.

Struktur ellers identisk med modul 09/13-malen: Hva det er → Hvorfor det lønner seg (regnestykke) → flow-kort → Slik gjør du det (4 steg) → to prompt-kort → bransjeeksempel (callout-ok) → callout-warn (falske positiver / sjekk at det fortsatt stemmer) → Hva du lærte-boks → finale-blokk («Du er i mål», flyttet fra 13) → DFY-footnote (flyttet fra 13).

## Mekaniske endringer

**dmarketing-kurs-premium (privat repo):**
- Ny fil `14-varsler-og-oppfolging/index.html`
- `13-koble-appene-sammen/index.html`: fjern finale-blokk, DFY-footnote, «Det var den siste modulen»-callout. Legg til kort bro-setning som peker til modul 14. Nav-lenke «Til oversikten» → «Modul 14: [tittel]».
- `index.html`: bump tre forekomster av «13 moduler» → «14 moduler». Fjern «Capstone: her binder vi alt sammen» fra modul 13 sitt kort. Legg til nytt kort for modul 14 med samme ambér/Avansert-stil.

**dmarketing-redesign (offentlig repo):**
- `kurs/ai-drift/moduler.js`: ny rad for modul 14.
- `kurs/index.html` linje ~500: «13 moduler nå» → «14 moduler nå» (AI-drift-reklameboksen på hovedkurset, IKKE de andre «12 moduler»-forekomstene som gjelder nettsidekurset selv).
- `kurs/ai-drift/las-opp/index.html` og `kurs/ai-drift/index.html`: ingen endring, regner modulantall dynamisk fra moduler.js.
- `KOMMER_SNART`-lista i las-opp: ingen endring, urelatert («kommer snart»-teasere for andre temaer).

Etter bygging: grep begge repoer for gjenværende «modul 13» som avslutning, «siste modul», og «13 moduler», for å unngå samme stale-referanse-bug som tidligere renummereringer (dokumentert i minnet `project-kurs-premium-ai-drift`).
