# gemma_coder

Lokal agentic AI-kodingsassistent drevet av Ollama/Gemma. Kan lese hele prosjektet, søke i kodebasen, redigere filer presist, kjøre terminalbefaler, utføre git-operasjoner og huske samtalen — helt gratis og offline.

---

## Hva den kan

| Funksjon | Status |
|----------|--------|
| Lese hele prosjektet automatisk | ✓ |
| Søke i kodebasen (grep/glob) | ✓ |
| Kjøre terminalbefaler | ✓ |
| Redigere presist (bare endre én linje) | ✓ |
| Huske samtalen (historikk) | ✓ |
| Forstå feilmeldinger og iterere | ✓ |
| Git-operasjoner | ✓ |
| Prosjektregler (REGLER.md) | ✓ |
| Kontekst om deg/prosjektene (KONTEKST.md) | ✓ |
| Vedvarende minne på tvers av samtaler (minne/) | ✓ |
| Lagre nye minner selv (save_memory) | ✓ |
| Kontekstvindu på 200k tokens | ✗ (Gemma: ~8k) |

---

## 1. Installer Ollama

1. Last ned fra [ollama.com](https://ollama.com)
2. Kjør i terminal:
   ```
   ollama pull codegemma
   ```

---

## 2. Sett opp (én gang)

```bat
cd gemma_coder
setup.bat
```

Eller manuelt:
```bat
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## 3. Bruk

### Aktiver miljøet
```bat
venv\Scripts\activate
```

### Enkel kommando
```
python agent.py run "Hva gjør index.html?"
```

### Interaktiv modus (anbefalt)
```
python agent.py run
```
Skriver du bare `run` uten instruksjon starter du en interaktiv samtale med historikk. Skriv `avslutt` for å avslutte.

### Med annet prosjekt
```
python agent.py run -r C:\Users\adria\mitt-prosjekt
```

### Godkjenn alt automatisk (forsiktig!)
```
python agent.py run -y "Fiks alle TypeScript-feil"
```

---

## Kommandooversikt

| Kommando | Beskrivelse |
|----------|-------------|
| `run` | Interaktiv modus med historikk |
| `run "instruksjon"` | Enkelt spørsmål |
| `run -r /sti` | Angi prosjektmappe |
| `run -y` | Ikke spør om bekreftelse |
| `run -m gemma2` | Bruk annen modell |
| `files` | List alle filer agenten ser |
| `history` | Vis samtalehistorikk |
| `clear-history` | Slett historikk |
| `memory` | Vis alt agenten husker |
| `models` | List Ollama-modeller |
| `status` | Sjekk tilkobling, kontekst og minne |

---

## Slik blir den «som Claude Code»

Agenten leser tre lag med kontekst ved hver oppstart — akkurat som Claude Code:

### 1. `KONTEKST.md` — hvem du er og hva prosjektene er
Inneholder bakgrunn om deg (Adrian / Dietrichs Marketing), de aktive prosjektene
(dmarketing-redesign, Voltio, dashboard, leads), hva du har jobbet med nylig, og
de viktigste reglene. Generert fra dine siste 5 chatter + minnet ditt. Rediger fritt.

### 2. `minne/` — vedvarende minne på tvers av samtaler
Samme mønster som Claude Code sitt memory: `MINNE.md` er indeksen, og hver fil er
ett faktum. Agenten leser hele minnet ved oppstart og kan **lagre nye minner selv**
med `save_memory` når den lærer noe varig viktig. Seedet med:
- Voltio-prismodellen
- «Aldri avslør stack»-regelen
- «push = publiser»-språkregelen
- Artikkelreglene (SEO/AEO)

Se hva den husker: `python agent.py memory`

### 3. `REGLER.md` — prosjektspesifikke regler (som CLAUDE.md)
Agenten laster også CLAUDE.md / AGENTS.md / GEMINI.md automatisk hvis de finnes i prosjektmappen.

---

## Eksempler

```
python agent.py run "Finn alle steder vi bruker console.log og fjern dem"
python agent.py run "Skriv en test for kalkuler-funksjonen i utils.py"
python agent.py run "Hva er git-statusen og er det ucommittede endringer?"
python agent.py run "Refaktorer CSS-filen til å bruke variabler for farger"
python agent.py run "Kjør testene og fiks eventuelle feil"
```

---

## Kontekstbegrensning

Gemma har ~8 000 tokens kontekstvindu (vs. Claude sine 200 000). Tips:
- Vær spesifikk i instruksjonen så agenten vet hvilke filer den trenger
- Store prosjekter: agenten lister filene og leser bare de relevante
- Bruk `codegemma` (best på kode) fremfor `gemma2`
