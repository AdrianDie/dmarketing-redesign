# Claude-oppsett: læringer og fasit

Strukturerte læringer fra videoen «10 Claude-tips» (YouTube, consulting.com), koblet
mot hvordan du faktisk jobber i Dietrichs Marketing.

> Én-linjes minne: **videoen er nybegynner-innhold. Du har allerede 7 av 10 tips på
> plass. De tre som faktisk betyr noe for deg er modelldisiplin, planlagte oppgaver
> og skill-hygiene.**

Tre lag i dette dokumentet:

1. **Hva videoen sier** (alle 10 tips, komplett)
2. **Hva som stemmer / må verifiseres** (kildekritikk)
3. **Hva det er verdt for deg** (prioritert handling)

---

## Lag 1: De 10 tipsene

Videoen deler dem i nybegynner, middels og avansert.

### Nivå 1: Nybegynner

#### Tips 1: E-postvalg

| | |
|---|---|
| **Påstand** | E-posten du registrerer Claude-kontoen med kan ikke byttes senere. |
| **Konsekvens** | Bruker du jobbmail og slutter i jobben, mister du kontoen og all opparbeidet memory. Måneder eller år med kontekst forsvinner over natten. |
| **Råd** | Registrer på en e-post du eier personlig og beholder for alltid. |

Poenget bak rådet er det viktige: **memory er den faktiske verdien i kontoen**, ikke
abonnementet. Abonnementet kan kjøpes på nytt. Kontekst kan ikke.

#### Tips 2: Memory-oppsett

To trinn:

**a) Import fra annen AI.** Innstillinger → Capabilities → import memory. Claude gir
deg en prompt du kjører i den gamle plattformen (ChatGPT o.l.), kopierer svaret og
limer inn i Claude.

**b) La Claude intervjue deg.** Importen overvekter jobb og undervekter det personlige.
Be Claude stille deg spørsmål om ulike livsområder: privatliv, arbeid, mål, og
viktigst: **hvordan du vil at den skal jobbe med deg**.

Praktisk tips fra videoen: bruk stemme i stedet for å skrive. Intervjuet er langt, og
diktering (Claude sin egen stemmefunksjon eller Whisper Flow for høyere presisjon)
tar det fra timer til minutter.

Han kjører det samme intervjuet på nyansatte som onboardes på Claude.

#### Tips 3: Forstå modellene

Kjernepoenget: **høyere modell = dypere tenking = flere tokens = raskere mot taket.**

| Modell | Bruk til |
|---|---|
| **Haiku** | Mye frem-og-tilbake, lite tenking. Selve memory-intervjuet er skoleeksempelet. |
| **Sonnet** | Daglig arbeidshest. Andrelags tenking, analyse av ideer og konsepter. |
| **Opus** | Dataanalyse, sammensatte workflows, alt med mange lag. Her merkes taket raskest. |
| **Fable** | Toppen. |

Analogien: du setter ikke den mest seniore i selskapet til å svare på generiske
e-poster. Det er sløsing med kompetanse og penger. Han får det ingen andre kan gjøre.
Resten går til teamet.

**Research mode** er ikke en modell, det er en bryter du slår på inni modellen. Den
skanner nettet, henter så mange kilder som mulig og bygger en strukturert rapport.
Svært nyttig, men spiser usage raskere enn nesten noe annet. Vær ekstremt spesifikk
om hva som skal dekkes, ellers brenner du taket på noe du ikke trengte.

**Regel som gjelder både Opus og research mode:** jo dyrere verktøy, jo mer presis
må prompten være.

#### Tips 4: Skills

Skillet mellom de to begrepene:

- **Memory** = Claude lærer deg over tid, gradvis, i bakgrunnen.
- **Skill** = fast instruks for én bestemt jobb, bygget én gang, kjører identisk hver gang.

Hva som kvalifiserer til skill: alt som er monotont og repeteres. Ukesrapport med samme
struktur. LinkedIn-innlegg med samme oppbygning. Møtenotater som blir til oppgaver.

Sitat-poenget hans: ingen har noensinne blitt forfremmet for å formatere samme regneark
på samme måte niende uke på rad.

Bygging: lås prosessen først, si så «gjør dette om til en skill». Det er hele jobben.

Alternativt: last ned ferdige skills fra fellesskapet (han nevner SkillMP), last dem
opp i innstillingene. Kode-review-skills, litteraturgjennomgang-skills og tusenvis andre.

Effekten kommer av **skill-stabling**: mange små, kjedelige oppgaver som forsvinner
samtidig.

#### Tips 5: Unngå Projects

Dette går mot det de fleste anbefaler. Begrunnelsen:

**Et prosjekt har sin egen, separate memory.** Det du bygger inni et prosjekt er
forseglet fra resten. Nailer du merkevareidentitet, tone, posisjonering og målgruppe i
en vanlig chat, ser prosjektet ingenting av det. Det er som om Claude aldri har møtt deg.
Og motsatt: det du bygger i ett prosjekt følger ikke med til et annet, eller til
vanlige chatter. Resultatet er at du enten kopierer manuelt eller forklarer deg på nytt.

Hans maksimale inndeling: ett prosjekt for jobb, ett for privat. Ikke finere enn det.

Chatter kan flyttes inn og ut av prosjekter når som helst, så feilen er reversibel.

---

### Nivå 2: Middels

#### Tips 6: Koble apper (connectors)

Under connector-oppsett i innstillingene. De fleste er ikke verdt tiden, men to er det:

**Gmail.** Claude går gjennom innboksen og skriver utkast til svar. I stedet for en time
hver morgen, er alt forhåndsbehandlet når du setter deg. Den leser kun når du ber om
det, ikke i bakgrunnen. Den kan **ikke sende**, kun skrive utkast. Videoen mener det er
bra: AI tar fortsatt feil, så du korrekturleser og sender selv.

**Kalender.** Fungerer bare hvis kalenderen faktisk er komplett. Er det bare noen få
møter der, blir svarene ubrukelige. Er den fylt riktig, kan Claude finne lukene: hvor
arbeidsblokka passer, når det gir mening å trene, når du faktisk kan ta fri.

Rammen han bruker: dette er 80 prosent av en personlig assistent til en brøkdel av
prisen, fram til du har råd til en ekte.

#### Tips 7: Chrome-utvidelsen

Last ned fra Chrome Store, installer, logg inn. Claude jobber da inni siden du har åpen:
leser den, klikker, fyller ut felter, bytter mellom faner.

Mental modell: en nyansatt. Du er senior. Du gir fra deg det kjedelige og jobber videre
med det som faktisk krever deg. Den nyansatte kommer tilbake og sjekker med deg før den
gjør noe som endrer noe.

Ikke autonom, og det er poenget. Alt som endrer noe på siden stopper og spør.

To praktiske sikkerhetsråd fra videoen:

- **Lukk alt du ikke vil den i nærheten av** før du starter: nettbank, privat.
- **Test på noe lavrisiko først** til du får følelsen.

---

### Nivå 3: Avansert

#### Tips 8: Cowork

Samme nyansatte, men etter seks måneder. Tilliten er opparbeidet. Du sier hva som skal
gjøres, den kommer tilbake med hvordan, du gir klarsignal, den kjører hele veien.

Forskjellen fra Chrome-utvidelsen: **hele maskinen, ikke bare nettleseren.** Du bestemmer
hvilke mapper den har tilgang til. Der kan den lese, redigere, opprette filer og gjøre
det som trengs.

Eksempel fra videoen: nedlastingsmappa. Skjermbilder fra to år tilbake, PDF-er åpnet én
gang, seks kopier av samme bilde, filer som heter «final final final v3». Pek på mappa,
be den rydde, godkjenn planen, ferdig på minutter.

**Planlagte oppgaver** er den andre halvdelen, og den viktigste. Cowork kan bruke alt det
foregående: memory, skills, koblede apper. Hans morgenrutine kjører automatisk:

1. Oppsummering av gårsdagen og hvor alt ble stående
2. Innboksen som kom inn, ferdig kategorisert
3. Dagens oppgaver

Alt ferdig før han setter seg med kaffen, uten at han rørte noe.

Rammen: Jarvis satt ikke og ventet på at Tony skulle spørre. Han kjørte huset før Tony
var våken. Setter du opp dette riktig, jobber Claude mens du sover.

**Dispatch:** par telefonen med maskinen via QR-kode, send deretter oppgaver til Cowork
fra mobilen. Nyttig når du er halvveis til et møte og husker noe som må gjøres på PC-en.

#### Tips 9: Claude Code

Navnet skremmer folk vekk. Videoens poeng: det er ikke et utviklerverktøy.

Du beskriver hva du vil ha på vanlig norsk. Den skriver programvaren, tester den, og
fikser den når noe knekker. Oppsett: last ned Claude Desktop, det ligger en Code-fane
der. Ingen terminal, intet utviklermiljø nødvendig. Vil du den veien, er den åpen.

Eksempel: produktsjefen deres er maratonløper. I stedet for å bruke en eksisterende
løpeapp, bygde han sin egen. Den følger distanse, vet hva han trener mot, gir
treningsplaner ut fra der han er nå. Null linjer kode skrevet selv.

Poenget: du slipper å finne appen som er «nær nok» og leve med det som irriterer deg.

#### Tips 10: Claude Design

Nyere funksjon. Til **mockups, landingssider og nettsider**, altså ting med fast
struktur og layout.

Viktig avgrensning fra videoen: **ikke bildegenerering.** Der mener han Claude er blant
de svakeste, og anbefaler Higgsfield, Nano Banana eller til og med ChatGPT.

Styrken: når den bygger en nettside, bygger den den faktisk. Ikke et bilde av en
nettside, men en ekte side med knapper som virker og klikk som fungerer. Det som tok
teamet hans dager eller uker, tar minutter.

---

## Lag 2: Kildekritikk

Videoen er laget for å konvertere, ikke for å være presis. MacBook-giveaway,
«kommenter hvilket tips du likte best», og en avslutning som peker videre til
«andre spesialiserte verktøy som faktisk gir penger». Det siste er en teaser for hans
eget selskap. Les den deretter.

**Påstander du bør verifisere selv før du handler på dem:**

| Påstand | Status |
|---|---|
| E-post på kontoen kan aldri byttes | Usikkert, kan ha endret seg. Rådet er uansett riktig: bruk en e-post du eier. |
| Prosjekter har fullstendig isolert memory | Var riktig i en periode. Memory-oppførsel har endret seg flere ganger. Sjekk i din egen konto før du reorganiserer noe. |
| Historien om Anthropic og amerikanske myndigheter som forklaring på Fable | Videoens egen framstilling, ikke bekreftet. Behandle som pynt, ikke som grunnlag. |
| Claude kan ikke sende e-post, kun skrive utkast | Riktig som standard, og du bør beholde det slik uansett hva verktøyet tillater. |

**Det videoen hopper over, og som er viktigere enn halvparten av tipsene:**

En skill er instruksjoner Claude følger. Laster du ned en fremmed skill fra et
marketplace, laster du ned instruksjoner du ikke har lest, inn i et verktøy som har
tilgang til mappene dine, e-posten din og nettleseren din. Videoen anbefaler dette uten
et eneste forbehold.

**Regel: les hver linje i en tredjeparts-skill før du legger den inn.** Særlig i ditt
oppsett, der Claude har tilgang til Outlook, Jira, Google Ads og GitHub-kontoen din.

---

## Lag 3: Hva dette er verdt for deg

Ærlig status: du har allerede gjort det meste av dette. Under er hvert tips holdt opp
mot ditt faktiske oppsett.

| # | Tips | Din status | Verdi |
|---|---|---|---|
| 1 | E-postvalg | ✅ Personlig Gmail | Ferdig |
| 2 | Memory-oppsett | ✅ `MEMORY.md` + 20+ memory-filer | Ferdig, godt over videoens nivå |
| 3 | Modellvalg | ⚠️ **Svakest punkt** | **Høy** |
| 4 | Skills | ✅ 60+ skills, men rotete | **Middels, ryddejobb** |
| 5 | Unngå projects | n/a i Claude Code | Ikke relevant |
| 6 | Koble apper | ✅ Outlook, Jira, Google Ads, Higgsfield | Ferdig |
| 7 | Chrome-utvidelse | ✅ Tilgjengelig | Ferdig |
| 8 | Cowork + planlagte oppgaver | ⚠️ **Verktøyet finnes, brukes ikke systematisk** | **Høy** |
| 9 | Claude Code | ✅ Daglig driver | Ferdig |
| 10 | Claude Design | ✅ Egen `adrian-web-style`-skill | Ferdig, bedre enn generisk bruk |

### De tre reelle gapene

**Gap 1: Modelldisiplin (tips 3)**

Dette er ikke teori for deg. `kundesvar-utkast-verktoy` er allerede notert som blokkert
av Claude-limit. Det er nøyaktig problemet videoen beskriver.

Kjører du Opus på speiling, filflytting, HTTrack-kjøring og dashboard-oppdatering,
brenner du taket på arbeid som Haiku eller Sonnet gjør like godt. Når taket ryker midt i
en lead-pipeline, stopper produksjonen av kundeforslag. **Taket ditt er direkte koblet
til hvor mange kundeforslag du får ut i uka.**

Konkret fordeling for din pipeline:

| Steg i lead-pipeline | Modell |
|---|---|
| Speiling, filhåndtering, deploy, dashboard-innlegging | Haiku |
| Copy-skriving, redesign-beslutninger, kundesvar-utkast | Sonnet |
| Ny arkitektur, prising, strategi, forretningsrådgiver | Opus |

**Gap 2: Planlagte oppgaver (tips 8)**

Du har `scheduled-tasks`-MCP og cron-verktøy tilgjengelig og bruker dem ikke som
morgenrutine. Videoens beste idé, og den du har minst av.

Din versjon av morgenrutinen ville vært:

1. Nye leads fra Brønnøysund, dedupet, klare i Jira
2. Innboks kategorisert med utkast klare til godkjenning
3. Status på hvilke kundeforslag som er sendt, åpnet og ubesvart
4. Dagens oppgaver

Det er ikke bekvemmelighet. Det er lead-volum, som er den eneste variabelen som faktisk
avgjør om selskapet vokser.

**Gap 3: Skill-hygiene (tips 4)**

Du har over 60 skills, mange fra tredjepart, med tydelig overlapp:
`taste-skill`, `gpt-tasteskill`, `soft-skill`, `minimalist-skill`, `brutalist-skill`,
`redesign-skill`, `impeccable`, `ui-ux-pro-max`, `stitch-skill`, `image-to-code-skill`.

Ti skills som gjør omtrent det samme betyr at Claude velger feil, eller velger tregt.
Videoen sier «last ned flere». Riktig råd for deg er det motsatte: **behold de du faktisk
har brukt siste måned, arkiver resten.**

Dine egne skills (`lead-pipeline`, `speil-og-forbedre-nettside`, `adrian-web-style`,
`forretningsradgiver`, `google-ads-campaign-playbook`) er verdt mer enn alle
tredjeparts-skillene til sammen, fordi de koder din faktiske prosess.

---

## Den ubehagelige konklusjonen

Videoen sier det selv helt til slutt, og går fort videre: **Claude er ikke en
pengemaskin.** Den er en assistent. Alle ti tipsene sparer tid. Ingen av dem skaper
omsetning.

For Dietrichs Marketing finnes det bare to variabler som avgjør om du blir et stort
selskap:

1. **Hvor mange kvalifiserte leads du når per uke**
2. **Hvor mye av omsetningen som er gjentakende, ikke engangs**

2 900 kr per nettside er engangssalg. Det skalerer med arbeidstimer, ikke med systemer.
Automatiserer du hele produksjonen perfekt, har du fortsatt et selskap som må selge en
ny nettside hver eneste måned for å stå stille.

Alt i dette dokumentet gjør deg raskere på variabel 1. Ingenting her rører variabel 2.
Det er den samtalen som faktisk avgjør størrelsen på selskapet, og den bør du ta med
`/forretningsradgiver`, ikke med en YouTube-video.

---

## Handlingsplan

Rekkefølge etter effekt per innsats.

| Prioritet | Handling | Tid |
|---|---|---|
| 1 | Legg modellvalg-tabellen (Gap 1) inn i `lead-pipeline`-skillen, så hvert steg sier hvilken modell det skal kjøre på | 30 min |
| 2 | Sett opp morgenrutine som planlagt oppgave: leads, innboks, forslagsstatus, dagens oppgaver | 1 t |
| 3 | Rydd i skills: behold brukt siste måned, arkiver resten | 45 min |
| 4 | Les gjennom hver tredjeparts-skill du beholder, før neste gang den kjører med Outlook- og GitHub-tilgang | 1 t |
| 5 | Ta gjentakende omsetning som egen sak med `/forretningsradgiver` | Egen økt |

De fire første er opprydding. Den femte er den som betyr noe.
