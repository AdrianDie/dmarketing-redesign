---
name: AIN-forslagsmail
description: Skriv en norsk forslagsmail/salgsmail til en potensiell kunde som har fått en AI-nettside-redesign fra Dietrichs Marketing (ai-nettsider-produktet). Bruk denne skillen alltid når brukeren ber om å skrive, lage eller sende en forslagsmail, salgsmail eller tilbudsmail til en kunde/bedrift om en ny nettside, en nettside-redesign, eller nevner "AIN-forslagsmail" direkte — også når de bare limer inn en lenke til en redesignet demoside (typisk adriandie.github.io/<bedrift>-redesign) og sier noe sånt som "skriv en mail til denne kunden" eller "lag et tilbud til snekkeren/rørleggeren/etc". Skillen fyller inn en fast mal med kundens bransje, en forsiktig ROI-utregning (sparte driftskostnader + ekstra kunder), og riktig pris.
---

# AIN-forslagsmail

Skriv en ferdig, kopierbar forslagsmail til en bedrift som har fått en demo av sin nye AI-redigerbare nettside. E-posten har en fast struktur og tone (uformell, direkte, kort), men to deler er alltid skreddersydd:

1. Et **ROI-avsnitt** som viser at prisen er en no-brainer, basert på sparte driftskostnader + fortjeneste fra noen få ekstra kunder i året.
2. Riktig **pris** og **lenker** (demoside + kundens eget domene).

## Steg 1 — Finn ut hvem kunden er, og finn lenkene selv

Ikke be brukeren om lenker du kan finne selv — brukeren gir deg typisk bare bedriftsnavnet eller én av lenkene, og forventer at du fyller inn resten.

1. **Hvis du bare får bedriftsnavnet:** lag et slug av navnet (små bokstaver, mellomrom/spesialtegn fjernet eller erstattet med bindestrek, norske bokstaver til ascii — f.eks. "Erga Bygg AS" → `ergabygg`) og prøv demosiden `https://adriandie.github.io/<slug>-redesign/` med WebFetch. Demosidene i dette produktet følger alltid dette mønsteret.
2. **Hvis du får en lenke** (demoside eller kundens egen side), hent den med WebFetch og les innholdet for å finne bedriftsnavn, bransje og hvilke tjenester de tilbyr (dette gir deg grunnlag til å anslå ordreverdi i steg 2 hvis brukeren ikke vet det selv).
3. **Kundens eget domene** (brukes i siste avsnitt i mailen) er som regel bedriftsnavnet + `.no`, f.eks. `ergabygg.no`. Verifiser gjettet med WebFetch — sjekk at siden faktisk finnes og handler om samme bedrift (samme navn/bransje som demosiden). Hvis `.no`-varianten ikke finnes eller peker på noe annet, prøv åpenbare varianter (bindestrek, uten AS/mellomrom) før du gir opp.
4. Hvis du etter dette fortsatt er usikker på demolink eller kundens domene (WebFetch feiler, tvetydig treff, eller flere bedrifter med samme navn), spør brukeren direkte i stedet for å gjette feil i mailen — en feil lenke i en salgsmail er verre enn ett ekstra spørsmål.

Hvis brukeren allerede har fortalt deg bedriftsnavn/bransje/tjenester tidligere i samtalen, ikke spør eller søk på nytt — bruk det du allerede vet.

## Steg 2 — Hent inn ROI-tallene

Du trenger tre ting for å regne ut ROI-avsnittet. Spør brukeren om dem samlet (f.eks. med AskUserQuestion), men gi alltid et konservativt forslag som forvalg slik at brukeren raskt kan bekrefte i stedet for å måtte finne alt selv:

1. **Nåværende månedlig nettsidekostnad** — hva kunden trolig betaler i dag for hosting/vedlikehold. Konservativt forslag: 200–500 kr/mnd hvis brukeren ikke vet.
2. **Fortjeneste per ordre** — helst et direkte tall (kr fortjeneste per jobb), ikke bare ordreverdi. Hvis brukeren bare vet ordreverdien, be om en marginprosent (konservativt forslag: 20 %) og regn ut fortjeneste = ordreverdi × margin. Hvis brukeren ikke har noen anelse, bruk tjenestene du fant i steg 1 til å foreslå et forsiktig, bransjetilpasset anslag — vær tydelig på at det er en gjetning de bør justere.
3. **Antall ekstra kunder nettsiden bidrar til per år** — konservativt forslag: 4–6 i året (ca. 1 per kvartal til 1 annenhver måned). Er brukeren mer optimistisk (f.eks. "1 ekstra kunde i måneden" = 12 i året), si tydelig ifra at dette er vanskelig å forsvare siden nettsiden ofte har samme innhold som før, bare ny teknisk løsning — foreslå heller 4–6 og la brukeren velge selv om de likevel vil ha et mer offensivt tall.

Still også hvilken pakke/pris som gjelder, hvis det ikke er opplagt fra samtalen. Prisene er hentet fra `ai-nettsider/index.html` i dette repoet:

| Pakke | Pris |
|---|---|
| Gjør-det-selv | 1 900 kr |
| Digital Grunnmur | 3 900 kr |
| Autopilot Pro | 12 900–13 900 kr |
| Premium Skreddersøm | 24 900–39 000 kr |

## Steg 3 — Regn ut ROI-avsnittet

Bruk disse formlene:

- Årlig besparelse = månedlig kostnad × 12
- Nedbetalingstid (bare på besparelser) = pris ÷ månedlig kostnad (mnd) → oversett til "under X år" eller "ca. X måneder"
- Ekstra fortjeneste = antall ekstra kunder × fortjeneste per ordre
- Total gevinst år 1 = årlig besparelse + ekstra fortjeneste
- Avkastningsfaktor = total gevinst år 1 ÷ pris → fras som "betalt seg selv X ganger" eller "nesten X ganger" (rund ned til nærmeste hele tall for en litt konservativ formulering)

Vev disse tallene inn i ett kort avsnitt (2–3 setninger, ikke punktliste), og hedge tallene som er antagelser med en parentetisk "(kanskje X kr?)"-formulering — dette er anslag Adrian skal kunne justere med et blikk før han sender, ikke påstander presentert som fakta. Se eksempelet under for nøyaktig stil.

## Malen

Fyll inn de skreddersydde delene (uthevet med `[...]`), behold resten av teksten og strukturen ordrett — tonen er uformell og direkte, og punktlisten over fordeler skal alltid være med uendret:

```
Heisann,
Gøy å høre at du er interessert i denne nye kostnadsfrie nettsideløsningen. Her er nettsiden på ny løsning med samme innhold som dere har på eksisterende side.
[lenke til demoside]
Kort om hva som er forskjellen fra løsningen dere har i dag:

* Dere slipper løpende nettsidekostnader for godt. Vedlikehold er egentlig gratis. Det er bare mange bedrifter som tar betalt for det.
* Dere får full kontroll selv og blir uavhengige av meg eller andre aktører. Går vi konkurs, spiller det ingen rolle for dere.
* Endringer gjør du selv, når du vil. Du chatter bare med en AI som gjør jobben for deg på minutter.
* Du får tilgang til et kurs som gjør dere helt selvgående.

Det tar ca 14 minutter for kundene våre å flytte til ny løsning. Dere får alt av instrukser i kurset.
Dersom dere vil gjøre endringer, går det helt fint. Det kan vi gjøre for dere sånn at nettsiden blir slik dere ønsker fra begynnelsen.
Bare for å sette det litt i perspektiv: dere sparer nettsidekostnaden (kanskje [årlig besparelse] kr i året?), så siden er nedbetalt i besparelser alene på [nedbetalingstid]. I tillegg: skal vi være forsiktige og si nettsiden bidrar til [antall] ekstra kunder i året ([fortjeneste per ordre] kr i fortjeneste per ordre?), har den betalt seg selv [avkastningsfaktor] allerede første år.
For alt dette kan dere betale en engangssum og aldri mer. Den ligger på nå [pris] kr.
Hvis dere liker det dere ser, kan vi publisere den på deres egne domene ([kundens domene]) allerede i dag eller i morgen. Ingen forpliktelser bare for å ta en titt først, og vi kan ta en rask samtale hvis det er ønskelig.
```

## Eksempel (Ergabygg, snekker)

Input: 200 kr/mnd i dag, 20 000 kr snittordre × 20 % margin = 4 000 kr fortjeneste/ordre, 6 ekstra kunder/år, Digital Grunnmur (3 900 kr).

Utregning: årlig besparelse 2 400 kr → nedbetalt på under 2 år · ekstra fortjeneste 6 × 4 000 = 24 000 kr · total gevinst år 1 = 26 400 kr · avkastning 26 400 ÷ 3 900 ≈ 6,8 → "nesten 7 ganger".

Resulterende avsnitt:

> Bare for å sette det litt i perspektiv: dere sparer nettsidekostnaden (kanskje 2 400 kr i året?), så siden er nedbetalt i besparelser alene på under to år. I tillegg: skal vi være forsiktige og si nettsiden bidrar til 6 ekstra kunder i året (4 000 kr i fortjeneste per ordre?), har den betalt seg selv nesten 7 ganger allerede første år.

## Levering

Lever den ferdige mailen i en kodeblokk (klar til å kopieres rett inn i e-postklienten), på norsk. Ikke bruk en Artifact for dette — det er en enkel tekst brukeren skal lime inn et sted, ikke noe som trenger en side.
