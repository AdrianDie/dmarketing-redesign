# Kontekst: Fase 3 — Konkurrentanalyse-scraper

Denne filen gir andre chatter / agenter full kontekst for å jobbe videre med
konkurrentanalyse-verktøyet som ble bygget i Fase 3 av SEO-prosjektet til
Dietrichs Marketing.

> **Eier:** Adrian Dietrichs (adrian.dietrichs@gmail.com)
> **Opprettet:** 2026-06-20
> **Verktøyets plassering:** `C:\Users\adria\OneDrive\Dietrichs Marketing\SEO\scraper.py`
> **Output-fil:** `C:\Users\adria\OneDrive\Dietrichs Marketing\SEO\competitor_analysis.json`

---

## 1. Hvorfor verktøyet finnes

Dietrichs Marketing posisjonerer seg som et AI-drevet alternativ til
tradisjonelle webbyråer. For å skrive treffsikker SEO- og salgskopi trenger vi
å vite **hva tradisjonelle webbyråer faktisk sier på nettsidene sine** —
spesielt:

- Hvilke priser og prismodeller de bruker
- Hvilke argumenter de bruker for at nettsider "må koste mye"
- Hvilke fordeler de fremhever (WordPress, manuelle oppdateringer, fleksibilitet, sikkerhet)

Disse argumentene blir motpunktene vi adresserer i vår egen markedsføring
(f.eks. på `ai-nettsider.html` og `google-ads.html`).

---

## 2. Hva verktøyet gjør

`scraper.py` tar en liste med URL-er til konkurrent-sider, kjører hver side
gjennom **ScrapeGraphAI's `SmartScraperGraph`**, og henter ut strukturert JSON
med fire felter per side:

| Felt | Innhold |
|------|---------|
| `h2` | Alle H2-overskrifter på siden |
| `h3` | Alle H3-overskrifter på siden |
| `priser` | Priser / prismodeller med kontekst (f.eks. "fra 25 000 kr") |
| `argumenter` | Hovedargumenter for hvorfor nettsider er dyre / hvorfor velge tradisjonell utvikling |

Resultatet skrives til `competitor_analysis.json` i samme mappe som scriptet.

---

## 3. Teknisk stack

- **Python 3.12** (`C:\Users\adria\AppData\Local\Programs\Python\Python312`)
- **scrapegraphai 2.1.3** — orkestrerer skraping + LLM-ekstraksjon
- **playwright 1.60.0** + Chromium headless — henter HTML (inkl. JS-rendret innhold)
- **LLM (valgbar leverandør):**
  - **Ollama (standard)** — lokal, gratis, krever `llama3` + `nomic-embed-text`
  - **OpenAI** — `gpt-4o-mini`, krever `OPENAI_API_KEY`
  - **Anthropic** — `claude-3-5-sonnet-20241022`, krever `ANTHROPIC_API_KEY`

Alle disse pakkene er **allerede installert** på Adrians maskin (gjort 2026-06-20).
Chromium-nettleseren er også installert via `playwright install chromium`.

---

## 4. Filstruktur

```
C:\Users\adria\OneDrive\Dietrichs Marketing\SEO\
├── scraper.py                  ← verktøyet
├── competitor_analysis.json    ← output (opprettes ved kjøring)
└── disruption_metrics.json     ← eksisterende fil fra tidligere fase
```

---

## 5. Hvordan kjøre verktøyet

### A) Med lokal Ollama (standard — gratis)

1. Installer Ollama fra https://ollama.com
2. Last ned modellene:
   ```powershell
   ollama pull llama3
   ollama pull nomic-embed-text
   ```
3. Pass på at Ollama-tjenesten kjører (sjekk systemtray eller `ollama serve`)
4. Åpne `scraper.py`, sett ekte URL-er i `TARGET_URLS`-listen
5. Kjør:
   ```powershell
   cd "C:\Users\adria\OneDrive\Dietrichs Marketing\SEO"
   python scraper.py
   ```

### B) Med OpenAI eller Anthropic API

1. I `scraper.py`, endre linje 30:
   ```python
   LLM_PROVIDER = "openai"     # eller "anthropic"
   ```
2. Sett nøkkel som miljøvariabel (anbefalt):
   ```powershell
   $env:OPENAI_API_KEY = "sk-..."
   # eller
   $env:ANTHROPIC_API_KEY = "sk-ant-..."
   ```
   Alternativt kan nøkkelen limes direkte inn i `build_graph_config()`.
3. Kjør som over.

---

## 6. Hvordan tilpasse verktøyet

### Bytte/legge til URL-er

Endre listen øverst i `scraper.py`:

```python
TARGET_URLS: list[str] = [
    "https://eksempelbyra.no/hva-koster-en-nettside",
    "https://annetbyra.no/priser",
    "https://wp-byraet.no/hvorfor-wordpress",
]
```

### Endre hva som hentes ut

Endre `EXTRACTION_PROMPT`-variabelen. Prompten ber LLM-en returnere JSON med
nøklene `h2`, `h3`, `priser`, `argumenter`. Hvis du legger til/fjerner felter,
oppdater både prompten og eventuell etterbehandling.

### Output-format

`competitor_analysis.json` har strukturen:

```json
{
  "provider": "ollama",
  "prompt": "...",
  "results": [
    {
      "url": "https://...",
      "status": "ok",
      "data": {
        "h2": [...],
        "h3": [...],
        "priser": [...],
        "argumenter": [...]
      }
    },
    {
      "url": "https://...",
      "status": "error",
      "error": "..."
    }
  ]
}
```

Feil på enkelt-URL-er stopper ikke kjøringen — de logges med `status: "error"`
i resultatfilen.

---

## 7. Kjente fallgruver

- **Ollama må kjøre lokalt** for standard-modusen. Hvis Ollama ikke er startet,
  får du `ConnectionError` mot `http://localhost:11434`.
- **Plassholder-URL-en `https://eksempelbyra.no/...` finnes ikke** — bytt den
  ut før kjøring, ellers feiler første URL med DNS-feil.
- **TensorFlow-advarsler ved import** (`oneDNN custom operations are on...`)
  er kosmetiske og kan ignoreres.
- **Dependency-konflikter ved install:** pip rapporterte konflikter med
  `chromadb`, `tensorflow-intel` (eldre versjoner). Disse påvirker ikke
  scraperen, men hvis andre verktøy i samme Python-miljø går i stykker er det
  her du bør starte feilsøking.

---

## 8. Neste steg / forslag til videre arbeid

1. **Legge inn faktiske konkurrent-URL-er.** Adrian har en liste over
   tradisjonelle webbyråer (Webflow-bygde sider for Dietrichs Marketing-kunder
   er en kilde — se `lead-pipeline`-skillen).
2. **Kjør verktøyet og lagre `competitor_analysis.json`.**
3. **Bruk resultatene i markedsføringskopi:**
   - SEO-tekster på `ai-nettsider.html`
   - Google Ads-overskrifter (jf. `google-ads-campaign-playbook`-skillen for
     kampanjen "Kutt nettsidekostnader")
   - Sales-copy som direkte motbeviser konkurrentenes priser/argumenter
4. **Vurder en `analyze.py`-oppfølger** som leser
   `competitor_analysis.json` og oppsummerer:
   - Median/spennvidde i priser
   - Mest brukte argumenter (frekvenstabell)
   - Sitater vi kan parafrasere i egen kopi

---

## 9. Relatert kontekst i resten av repoet

- `ai-nettsider.html` — siden som selger vårt AI-alternativ; konkurrent-data
  brukes til å skjerpe disse argumentene.
- `google-ads.html` — landingsside for Google Ads-kampanjen.
- `DASHBOARD-INTEGRASJON.md` — hvordan lead/dashboard-pipelinen henger sammen.
- Skillen `google-ads-campaign-playbook` — alt om kampanjen
  "Kutt nettsidekostnader" som denne konkurrentanalysen mater inn i.

---

## 10. Hurtigreferanse for en ny chat

> Du jobber med Adrians SEO-prosjekt for Dietrichs Marketing. Fase 3 er
> konkurrentanalyse av tradisjonelle webbyråer. Verktøyet ligger i
> `C:\Users\adria\OneDrive\Dietrichs Marketing\SEO\scraper.py` og bruker
> ScrapeGraphAI med Ollama/llama3 som standard. Pakker er installert.
> For å kjøre: bytt ut plassholder-URL-er, start Ollama, kjør
> `python scraper.py`, sjekk `competitor_analysis.json`.
