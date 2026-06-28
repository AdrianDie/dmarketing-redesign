# Sikringen Elektro — Plan og analyse

*Konfidensielt — Dietrichs Marketing · Oppdatert juni 2026*

---

## Møtet — hva som skjedde

Første samtale med lederen i Sikringen — en kjede med **180 medlemsbedrifter**. Han er ikke interessert i nettsider fordi han ikke har innflytelse over, eller får fordeler av, at enkeltbedriftene sparer hostingkostnader.

Men: han spurte om vi kan **utvikle AI-baserte programvareverktøy** som kan effektivisere og standardisere prosesser i elektrobransjen. Han var veldig positiv og vil ha et møte med partneren sin.

| | |
|---|---|
| Kjeden | 180 medlemsbedrifter i Sikringen |
| Møte | Avtalt — leder + partner. Ta med Espen og Bjarte. |
| Fokus | Software — AI-verktøy, ikke nettsider |

---

## Muligheten

### Hva han etterspurte

Lederen nevnte tre konkrete problemområder han vil løse for sine 180 bedrifter:

| Problem | Dagens situasjon | Muligheten |
|---|---|---|
| Dokumentasjonsverktøy | Papirbasert eller tungvinte PC-systemer | Mobil-app for feltbruk |
| Overdimensjonerte systemer | Nelfo Integrator er laget for store bedrifter | Lett verktøy for 1–10 ansatte |
| Standardisering | Hver bedrift gjør ting ulikt | Felles prosesser, Sikringen-branding |

### Hva "standardisere prosesser" trolig betyr

Vi må avklare dette i møtet. Fire mulige tolkninger:

- **A** — At alle 180 bedrifter dokumenterer likt, med Sikringen-logo på alt
- **B** — At kjedeledelsen kan se status og aktivitet på tvers av bedriftene
- **C** — At nye medlemsbedrifter får et ferdig verktøy fra dag én
- **D** — At Sikringen kan garantere compliance for alle 180 overfor forsikring og kommuner

---

## Team

| Rolle | Person | Ansvar |
|---|---|---|
| Salg & prosjekt | Adrian | Kundekontakt, møteansvarlig, Dietrichs Marketing |
| Utvikler | Espen | Med i møtet med Sikringen |
| Utvikler | Bjarte | Med i møtet med Sikringen |

---

## Dokumentasjonsprosessen — hva elektrikeren gjør per jobb

Elektrikere er lovpålagt å dokumentere alt arbeid. Kravene kommer fra FEL, FSE, NEK 400 og Internkontrollforskriften. Slik ser en typisk jobb ut:

**Steg 1 — Risikovurdering (FSE) — 5–15 min**
Skal gjøres før arbeidet starter. Hva er spenningsnivå, er anlegget koblet fra, hvem er i nærheten? Gjøres i dag på papir eller i hodet — sjelden dokumentert digitalt.

**Steg 2 — Utførelse — noterer underveis**
Elektrikeren noterer kabeltype, sikringsstørrelser og kursnummer mens han jobber. Disse trenger han i neste steg.

**Steg 3 — Sluttkontroll (NEK 400) — 10–30 min målinger + 20–45 min registrering**
Den tyngste jobben. Krever fire typer målinger som alle skal registreres:

| Måling | Hva det sjekker | Krav |
|---|---|---|
| Kontinuitetsmåling | At beskyttelsesledere og jordledere ikke er brutt | 200 mA målestrøm, alle kurser |
| Isolasjonsmåling | Ingen kontakt mellom fase og jord | Min. 0,5 MΩ per kurs, 500 VDC |
| Kortslutningsstrøm | Vernet kobler ut ved feil | Måles i enden av hver kabel, må overstige I5-verdi |
| Jordelektrode | Overgangsmotstanden på jord | Måling, beregning eller tabellverdier |

**Steg 4 — Samsvarserklæring — 10–20 min**
Lovpålagt etter *hvert eneste oppdrag* — selv én stikkontakt. Må inneholde: bedriftsnavn, type arbeid, beskrivelse, bekreftelse på at krav er oppfylt, signatur fra faglig ansvarlig. Bedriften oppbevarer kopi i 5 år.

**Steg 5 — Levering til kunde og Boligmappa — 5–10 min**
Samsvarserklæringen skal til kunden, og helst lastes opp til Boligmappa (digital boligmappe). Gjøres i dag manuelt — ofte glemmes eller utsettes.

> **Tidstap i dag:** En elektriker som tar 3 jobber om dagen bruker **1–2 timer på papirarbeid** — etter at arbeidsdagen er ferdig. Det er ubetalt administrasjonstid som stjeler kvelden.

### Internkontroll — løpende (ikke per jobb)

Separat fra jobbdokumentasjonen. Bedriften må dokumentere HMS-rutiner, kompetanseoversikt, avviksbehandling og vernerunder. Dette er det Nelfo Integrator primært er bygget for — og det er her det er overdimensjonert for de minste.

---

## Konkurrenter og eksisterende løsninger

### Nelfo Integrator (NHO Elektro) — Lav trussel

Bransjens offisielle totalløsning. Fem moduler: NIK (internkontroll), IKK (internkontroll for kunde), KS (kvalitetssikring), PBL (plan og bygningsloven), FDV (forvaltning/drift/vedlikehold). Selges per bruker per år. Priser ikke publisert åpent — trolig 3 000–8 000 kr/år.

**Problemet:** laget for store bedrifter, ikke feltbruk på mobil. En soloelektriker trenger kanskje én modul men betaler for alle fem.

Tags: Komplekst · Desktop-fokus · Overkill for små · Per bruker/år

### Aceve — Høy trussel

Nyeste og nærmeste konkurrent. Heldigital løsning: tilbud → jobb → dokumentasjon → faktura i én flyt. Teknikeren registrerer alt på mobil i felten. Har bransjespesifikk internkontroll og Boligmappa-integrasjon. **Dette er det vi vil bygge — men de har kommet oss i forkjøpet.** Pris ikke publisert. Ikke Sikringen-spesifikk.

Tags: Mobil-app · Boligmappa-integrasjon · Heldigital flyt · Generisk — ikke kjede

### Tripletex — Lav trussel

Regnskapssystem som mange elektrikere bruker. Har elektrikertilpasninger, men dokumentasjon er en sidefunksjon — ikke kjernen. Har Boligmappa-integrasjon. **Konkurrerer ikke på dokumentasjon — konkurrerer på økonomi.**

Tags: Regnskap-fokus · Boligmappa-integrasjon · Ikke feltverktøy

### Vår fordel ingen kan kopiere

En løsning **eksklusivt for Sikringen-kjeden** — med Sikringen-branding, kjededashboard og integrasjon mot kjedens egne systemer — er noe verken Aceve, Tripletex eller Nelfo kan tilby. Det er den eneste posisjonen der vi vinner.

---

## Nøkkelintegrasjoner

### Boligmappa — åpent API

Boligmappa er der samsvarserklæringer skal lagres knyttet til boligadresse. Over 50 systemer er allerede integrert (Tripletex, Visma, Cordel m.fl.).

- **API er åpent** — tilgjengelig for partnere via søknad
- **Krever partneravtale** — etablert prosess, ikke teknisk barriere
- **Test- og produksjonsmiljø** — separate credentials
- **Automatisk utsending** — samsvarserklæring sendes til boligadresse med ett klikk

### DSB-rapportering

Elektrikere har **ikke løpende meldeplikt per jobb** til DSB. Bedriften må være registrert i Elvirksomhetsregisteret. DLE (Det lokale eltilsyn) kan komme på tilsyn og kreve dokumentasjon — men det er ikke noe vi trenger å automatisere. Ingen teknisk integrasjon nødvendig her.

### Elvirksomhetsregisteret

Nice-to-have: verktøyet kan sjekke at bedriften er autorisert ved opprettelse. Gir kjeden trygghet for at alle 180 bedrifter er lovlige.

---

## Markedsstørrelse

| Segment | Antall | Kommentar |
|---|---|---|
| Totalt i Norge | ~4 000 | Autoriserte elektrikerbedrifter (DSB) |
| Små bedrifter (1–5 ans.) | ~2 800 | Ca. 70% av totalmarkedet |
| Sikringen alene | 180 | Betalende medlemmer i kjeden |
| Potensielt marked | ~10 mill kr/år | 299 kr/mnd × 2 800 bedrifter |

---

## Hva vi bygger

Et verktøy som gjør tre ting og ingenting annet — mobil-først, ferdig utfylt på byggeplassen, ikke på kontoret etterpå.

**Flyten:**

1. Elektriker åpner app på mobil ute på jobb
2. Registrerer adresse og jobbtype — søker opp boligadresse fra Boligmappa
3. Fyller inn målinger — isolasjon, kontinuitet, kortslutning direkte i app
4. Sluttrapport genereres automatisk — NEK 400-kompatibel, med Sikringen-logo
5. Samsvarserklæring genereres med ett klikk — forhåndsutfylt fra jobdata
6. **Sendes til kunde og Boligmappa automatisk** — ferdig. 10 minutter. Ingen PC. Ingen papir.

### Moduler

| Modul | Hva det gjør | Prioritet |
|---|---|---|
| Jobboversikt | Opprett jobb, koble til adresse, legg til bilder, tidslinje | Må ha |
| Dokumentasjon | Fyll inn målinger, generer sluttrapport og samsvarserklæring automatisk | Må ha |
| Internkontroll | Enkel HMS-sjekkliste som oppfyller lovkravet — 10 minutter, ikke 10 timer | Må ha |
| Kjededashboard | Sikringen-ledelsen ser aktivitet, compliance og status på tvers av 180 bedrifter | Viktig |
| Boligmappa-integrasjon | Automatisk opplasting av samsvarserklæring | Må ha |

---

## Forretningsmodell

> **Det viktigste ubesvarte spørsmålet:** Betaler **Sikringen som kjede** for alle 180 bedrifter — eller betaler **hver enkelt bedrift** selv? Svaret avgjør alt: pris, salgsmodell og hvem vi selger til.

### Alternativ A — Kjeden betaler (anbefalt)

Sikringen kjøper én lisens som dekker alle 180 bedrifter. Verktøyet er en del av kjedemedlemskapet. Enklere å selge (én beslutning), men én stor kontrakt å forhandle.

| Pris til Sikringen | Per bedrift/mnd | Årlig inntekt |
|---|---|---|
| 180 × 199 kr/mnd | 199 kr | 430 560 kr |
| 180 × 299 kr/mnd | 299 kr | 645 840 kr |

### Alternativ B — Bedriftene betaler selv

Sikringen anbefaler verktøyet, men bedriftene tegner egne abonnement. Lavere enhetspris, men vi må selge til 180 enkeltbedrifter.

### Anbefaling

Start med **Alternativ A** — selg én avtale til Sikringen, lever til alle 180. Etter at verktøyet er etablert, åpne for andre kjeder og enkeltelektrikere utenfor Sikringen.

---

## Spørsmål til møtet

Still disse i rekkefølge. De tidlige spørsmålene avgjør om vi i det hele tatt bygger det riktige.

1. **"Når du sier standardisere prosesser — er det viktigst at dere som kjede får oversikt, eller at den enkelte elektriker får det enklere i hverdagen?"**
   *Avgjør om vi bygger nedenfra og opp (verktøy for elektrikeren) eller ovenfra og ned (dashboard for kjedeledelsen)*

2. **"Hvilken løsning bruker de fleste av de 180 bedriftene i dag — og hva klager de på?"**
   *Gir oss innsikt i faktisk smerte, ikke antatt smerte*

3. **"Ville Sikringen betale for et verktøy dere kan tilby alle 180 bedriftene, eller skal bedriftene betale individuelt?"**
   *Det viktigste kommersielle spørsmålet — avgjør hele forretningsmodellen*

4. **"Er dokumentasjonskravet en barriere for nye bedrifter som vil bli Sikringen-medlem?"**
   *Avdekker om verktøyet kan brukes som rekrutteringsverktøy for kjeden*

5. **"Hva er det dyreste problemet for en liten elektrikerbedrift i Sikringen i dag?"**
   *Åpent spørsmål — svaret kan avdekke muligheter vi ikke har tenkt på*

6. **"Har dere snakket med Aceve eller andre leverandører om lignende løsninger?"**
   *Avdekker om vi er i konkurranse allerede*

---

## Neste steg

1. **Bekreft møtetidspunkt med Sikringen-lederen** — Adrian kontakter ham og setter dato. Ta med Espen og Bjarte.

2. **Lag en enkel prototype / clickthrough** — Vis hvordan appen ser ut for elektrikeren i felten. Ikke fungerende kode — bare skjermbilde som viser flyten. Gjør møtet konkret.

3. **Søk om Boligmappa API-tilgang** — Registrer som integrasjonspartner nå — det tar tid å få godkjenning. Ikke vent til etter møtet.

4. **Forbered prismodell til møtet** — Ha to alternativer klart: kjeden betaler samlet, eller bedriftene betaler individuelt. Med tall.

5. **Snakk med 2–3 elektrikere før møtet** — Ring to Sikringen-elektrikere og spør: "Hva er det mest tidkrevende papirarbeidet du gjør?" Det er gull å ha direkte sitat fra elektrikerne når vi sitter i møtet med ledelsen.

---

> **Vår sterkeste posisjon:** Vi selger ikke et generisk verktøy. Vi selger **Sikringens eget dokumentasjonssystem** — med deres logo, deres prosesser, deres dashboard. Det er noe ingen andre kan gi dem.
