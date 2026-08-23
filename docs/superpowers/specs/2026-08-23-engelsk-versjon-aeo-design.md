# Engelsk versjon for AEO — design

**Bakgrunn:** AEO-rapport (aeochecker.ai, 23.08.2026) scoret dmarketing.no 35/100 og flagget "Add an English-language page version" (medium prioritet/effort, score 77). Målet er AI-crawlere/answer-engines (ChatGPT, Perplexity, Claude, Gemini), ikke å pivotere forretningen mot et engelsktalende marked.

**Status:** Godkjent av Adrian 23.08.2026, med korreksjon: `tjenester/` og `webdesign/` ble slettet fra siden (commit `e38693b`) mens denne spec-en var under utarbeidelse, så de er fjernet fra omfanget.

## Omfang — 6 sider

| Norsk | Engelsk |
|---|---|
| `/` | `/en/` |
| `/ai-nettsider/` | `/en/ai-websites/` |
| `/programvareutvikling/` | `/en/software-development/` |
| `/kontakt/` | `/en/contact/` |
| `/personvern/` | `/en/privacy-policy/` |
| `/vilkar/` | `/en/terms/` |

Utenfor omfang: de 44 artiklene, `kurs/`, `selger/`, `maler/`, `google-ads/` (interne/betalte/demo-prosjekter, ingen dm-chrome-komponent).

## Mekanisme

Flat statisk HTML, ingen bygg-steg (matcher eksisterende arkitektur: hver side er en selvstendig `index.html`, ingen templating). Engelsk side kopieres fra norsk kilde, all synlig tekst oversettes, CSS/JS/SVG/schema-struktur beholdes uendret.

## Teknisk

- **hreflang + canonical:** hvert NO/EN-par får gjensidige `hreflang="no"`/`hreflang="en"`/`hreflang="x-default"` (x-default → norsk). Hver side sin `canonical` peker på seg selv, aldri på tvers av språk.
- **Språkbytter:** enkel tekstlenke ("EN" / "NO") i hovednav og mobilmeny på begge språkversjoner, ingen flagg-ikoner.
- **Stier:** alle relative asset-/CSS-/JS-referanser gjøres absolutte (samme filer gjenbrukes, ingen duplisering av bilder/CSS/JS). Interne nav-lenker på engelske sider peker til engelske søsken-sider.
- **Kontaktskjemaer** (kontakt/ og programvareutvikling/): kun synlig label-/placeholder-tekst oversettes. `name=`-attributter på skjemafelt beholdes uendret (Supabase-tabell / formsubmit-mal er avhengig av dem).
- **sitemap.xml:** 6 nye `/en/...`-URL-er lagt til. I samme slag: bakfyller 3 mangler for norsk (`programvareutvikling/`, `personvern/`, `vilkar/` manglet allerede før denne endringen).
- **llms.txt:** kort "English version"-seksjon lagt til, hovedinnhold forblir norsk.
- **robots.txt:** ingen endring (dekker allerede `/en/` via `/`).

## Husregler som gjelder engelsk tekst også

Ingen em-streker, aldri avslør tech-stack, aldri oppdiktede tall/kunder/sitater, samme NOK-priser, samme kjerneverdi-ramme (engangskostnad / selvstendig / flere kunder) fremfor generisk "vi bygger nettsider".
