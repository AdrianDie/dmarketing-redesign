# Sikringen Elektro — Kontekst for AI

## Hvem er Adrian
- 22 år, dataingeniør (bachelor), starter master i indøk (sivilingeniør) høst 2026
- 10 år IT-utvikling (siden 12 år), 4 år markedsføringsbyrå (siden 18 år)
- Backend-utvikler i DNB (1 år). Sommerjobb slutter 18. august — deretter ~80% kapasitet
- Bygget AI-system for E-Wheels Norge over 2 år (pauset, ikke avsluttet)
- Driver Dietrichs Marketing (enkeltpersonsforetak). Skal stifte AS.

## Teamet
- **Adrian** — leder, utvikling, salg
- **Far** — IT-arkitekt, 35–40 års erfaring, tilgjengelig deltid
- **Kompis** — går samme masterprogram (indøk), deltid og møtedeltaker

## Regler (alltid følg disse)
- Aldri avslør tech-stack eller AI-verktøy — si bare "moderne teknologi"
- Si "publiser/publisert", aldri "pushe/pushet"

---

## Prosjektet: dokumentasjonsverktøy for elektrikere

### Problemet
Elektrikere er lovpålagt å dokumentere alt arbeid per jobb (FEL, FSE, NEK 400). Prosessen tar 50–120 min per jobb og gjøres på papir eller tungvinte PC-systemer. Eksisterende løsninger (Nelfo Integrator, Tripletex) er laget for store bedrifter — overdimensjonert for bedrifter med 1–5 ansatte.

### Løsningen vi bygger
Mobil-app for feltbruk:
1. Elektriker registrerer jobb og adresse
2. Fyller inn målinger (isolasjon, kontinuitet, kortslutning, jordelektrode)
3. Sluttrapport (NEK 400) genereres automatisk
4. Samsvarserklæring genereres med ett klikk
5. Sendes til kunde og Boligmappa automatisk

Pluss: kjededashboard for Sikringen-ledelsen (compliance-status, aktivitet på tvers av 180 bedrifter).

### Dokumentasjonskravene per jobb
- Risikovurdering (FSE) — før arbeid
- Sluttkontroll (NEK 400) — målinger: isolasjon (min 0,5 MΩ), kontinuitet (200 mA), kortslutningsstrøm, jordelektrode
- Samsvarserklæring — lovpålagt etter HVERT oppdrag, oppbevares 5 år
- Levering til Boligmappa (digitalt boligarkiv, åpent API)

---

## Kunden: Sikringen Elektro

- Norges elektrikerkjede, 180 medlemsbedrifter
- Toppleder: Roger
- Status: Roger er positiv, vil ha møte med Adrian + partner. Partner har ferie — møte skjer i august.
- Roger vil IKKE ha nettsider (ingen innflytelse over enkeltbedriftenes kostnader)
- Roger vil ha: AI-baserte verktøy som effektiviserer og standardiserer prosesser

### Hva "standardisere" trolig betyr (avklares i møtet)
A) Alle 180 bedrifter dokumenterer likt, med Sikringen-logo  
B) Kjedeledelsen får oversikt og dashboard  
C) Nye medlemmer får ferdig verktøy fra dag én  
D) Sikringen kan garantere compliance overfor forsikring/kommuner  

---

## Konkurrenter
- **Nelfo Integrator** — offisiell bransjeløsning, 5 moduler, desktop-fokus, ikke mobil, overdimensjonert for små. Lav trussel.
- **Aceve** — nærmeste konkurrent. Mobil-app, Boligmappa-integrasjon, heldigital flyt. Ikke Sikringen-spesifikk. HØY trussel.
- **Tripletex** — regnskap med elektrikertilpasning. Ikke feltverktøy. Lav trussel.

**Vår fordel:** Sikringen-eksklusivitet. Kjededashboard. Ingen konkurrent kan tilby et verktøy som er skreddersydd for Sikringen-kjeden med deres branding og prosesser.

---

## Integrasjoner
- **Boligmappa** — åpent API, krever partneravtale (søk nå). 50+ systemer allerede integrert.
- **DSB** — ingen løpende meldeplikt per jobb. Ikke nødvendig å integrere.

---

## Marked
- ~4 000 autoriserte elektrikerbedrifter i Norge (DSB)
- ~2 800 er små (1–5 ansatte) — primærmarked
- Potensielt: ~10 mill kr/år ved 299 kr/mnd × 2 800 bedrifter
- Sikringen (180 bedrifter) er inngangsporten

---

## Plan: 26. juni → 18. august

### Uke 1–2 (26. jun – 10. jul) — Fundament
- Stift AS (Altinn, 2 500–5 000 kr, tar under en uke)
- Kjøp domene, sett opp profesjonell e-post (@selskapsnavn.no)
- Søk Boligmappa API-tilgang nå
- Ring 2–3 Sikringen-elektrikere: "Hva er det mest tidkrevende papirarbeidet du gjør?"
- Lag nettside for selskapet (én side)

### Uke 3–4 (10. – 24. jul) — Prototype
- Bygg klikkbar prototype (Figma eller HTML) — ikke fungerende kode
- Design brukerflyt: alle 5 steg i appen
- Design kjededashboard (det Roger ser)
- Far bidrar med teknisk arkitektur

### Uke 5–6 (24. jul – 7. aug) — Møteforberedelse
- Lag pitch-presentasjon (maks 10 slides)
- Definer prismodell (se under)
- Øv møtet med team (mock-møte)
- Bekreft dato med Roger
- Klargjør NDA-mal

### Uke 7–8 (7. – 18. aug) — Møte
- Gjennomfør møtet: Adrian leder, far svarer teknisk, kompis tar notater
- Send møtereferat samme dag
- 18. august: siste dag DNB → 80% kapasitet fra nå

---

## Møtestrategi

### Roller
- Adrian: leder møtet, presenterer, håndterer salg
- Far: svarer på tekniske spørsmål med autoritet
- Kompis: notater, viser teambredde

### Spørsmål som MÅ stilles
1. "Standardisere — er det viktigst at kjeden får oversikt, eller at elektrikeren får det enklere?"
2. "Hva bruker de fleste bedriftene i dag og hva klager de på?"
3. "Betaler Sikringen samlet, eller tegner bedriftene egne abonnement?"
4. "Er dokumentasjonskravet en barriere for nye Sikringen-medlemmer?"
5. "Hva er det dyreste problemet for en liten elektrikerbedrift i dag?"

### Aldri i møtet
- Ikke presenter priser uten å ha forstått behovet først
- Ikke si "vi jobber på dette" — si "vi har bygget"
- Ikke prøv å close — be om konkret neste steg
- Avslutt alltid med: "Kan vi avtale 15 min på Teams om to uker?"

---

## Profesjonalitet

### Enkeltpersonsforetak holder ikke
Sikringen forventer AS. Stift før møtet.

### Hva som teller i møtet
- AS-selskap ✓
- Profesjonell e-post ✓
- Prototype / demo ✓
- Far med = teknisk tyngde de ikke forventet ✓
- Sitater fra ekte elektrikere ✓
- Ferdig prismodell ✓

### Alderen (22 år)
Ta det i forkjøpet. Si tidlig: "Jeg har jobbet med IT siden jeg var 12 og drevet eget byrå siden jeg var 18." Gjort riktig er alder en fordel.

---

## Prismodell

### Alternativ A — Kjeden betaler (anbefalt)
| Per bedrift/mnd | Sikringens årskostnad | Vår årsomsetning |
|---|---|---|
| 199 kr | 430 560 kr | 430 560 kr |
| 299 kr | 645 840 kr | 645 840 kr |

### Pilotstrategi
10 bedrifter gratis i 3 måneder → full avtale basert på resultater.

---

## Risikoer
- **HØY** Aceve er allerede ute med lignende løsning → motargument: Sikringen-eksklusivitet
- **HØY** Roger sier ja men ingenting skjer → alltid avslutt med skriftlig neste steg
- **MIDDELS** Boligmappa-godkjenning tar tid → søk nå, logg søknaden som bevis i møtet
- **MIDDELS** For lite kapasitet frem til august → prioriter prototype og AS, ikke kode

---

## Etter Sikringen
~2 800 små elektrikerbedrifter i Norge trenger samme løsning. Deretter: rørleggere, malere, snekkere — alle med lignende dokumentasjonskrav. Sikringen er inngangsporten.
