---
name: Dietrichs Marketing
description: AI-nettsider for norske småbedrifter, engangssum i stedet for byrå-abonnement
colors:
  dietrichs-kobolt: "#1B34FF"
  kobolt-hover: "#1226C9"
  kobolt-tint: "#ECEEFF"
  kobolt-border: "#C7CEFF"
  varm-papir: "#FCFBF7"
  sniktitt-beige: "#F5F3EA"
  dyp-marine: "#0B1F4A"
  marine-mork: "#060B2E"
  blekk: "#0E1116"
  tekst-dempet: "#5F6169"
  tekst-svak: "#9A9A93"
  kant-varm: "#E7E4D8"
  kant-header: "#ECEAE0"
  suksess-gronn: "#16A34A"
typography:
  display:
    fontFamily: "neue-haas-grotesk-display, Archivo, sans-serif"
    fontSize: "clamp(2rem, 5vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.03
    letterSpacing: "-0.03em"
  body:
    fontFamily: "neue-haas-grotesk-text, 'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Geist Mono', ui-monospace, monospace"
    fontSize: "0.72rem"
    fontWeight: 600
    letterSpacing: "0.22em"
rounded:
  sm: "10px"
  md: "18px"
  lg: "26px"
  pill: "999px"
spacing:
  section-y: "clamp(84px, 12vh, 168px)"
  card-gap: "16px"
components:
  button-primary:
    backgroundColor: "{colors.dietrichs-kobolt}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "15px 26px"
  button-primary-hover:
    backgroundColor: "{colors.kobolt-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.blekk}"
    rounded: "{rounded.pill}"
    padding: "15px 26px"
---

# Design System: Dietrichs Marketing

## 1. Overview

**Creative North Star: "Det ærlige regnestykket"**

Dette er ikke et polert SaaS-produkt som selger seg selv på vibe. Det er én dataingeniørs argument mot webbyrå-modellen, lagt frem som et regnestykke en håndverker kan sjekke selv: hva du betaler i dag, hva du betaler én gang hos oss, og hva som blir null for godt. Systemet er varmt og rolig der konkurrentene er kalde og "corporate", men det tillater seg selv å være skarpt og selvsikkert i påstandene, fordi hver påstand skal tåle etterprøving.

Eksplisitt IKKE: en generisk AI-startup-side med gradient-hero-metrics og stock-ikoner. Eksplisitt IKKE: en tung, distansert byrå-side med jury-ord som "synergier" og "helhetlige løsninger". Varmen kommer fra ekte innhold (Adrians eget bilde og manifest, ekte kundeutsagn), ikke fra dekor.

**Key Characteristics:**
- Kobolt (#1B34FF) er signaturfargen og bæres tungt: knapper, aksentord, aktive tilstander, mørke kontrastseksjoner
- Varm papirbakgrunn, aldri kaldhvit eller grå
- Display-typografi i Neue Haas Grotesk Display, stram sporing, fet vekt
- Ekthet slår polish: ekte skjermbilder, ekte tall, ekte navn

## 2. Colors

Én dominerende aksentfarge (kobolt) på varmt, nesten-hvitt papir, med én mørk marineblå kontrastsone for de tyngste CTA-seksjonene. Committed-strategi, ikke restrained: kobolt skal synes, ikke gjemmes som et diskré ikon-fyll.

### Primary
- **Dietrichs Kobolt** (#1B34FF): Primærknapper, aksentord i overskrifter, aktive lenker, tall og ikoner som skal trekke øyet. Dette ER merkefargen, brukes friere enn en typisk "10 %-aksent".

### Secondary
- **Dyp Marine** (#0B1F4A / mørkere variant #060B2E): Kontrastseksjoner der siden vil senke tempoet og virke "closing", som siste-sjanse-CTA og den mest populære prispakken. Hvit tekst på marine, kobolt som lys-aksent oppå.

### Neutral
- **Varm Papir** (#FCFBF7): Hovedbakgrunn overalt. Aldri rått hvitt.
- **Sniktitt Beige** (#F5F3EA): Sekundær seksjonsbakgrunn for å bryte opp lange sider av varm papir uten å innføre en ny farge.
- **Blekk** (#0E1116): All brødtekst og overskrifter. Aldri rent svart.
- **Tekst Dempet** (#5F6169): Brødtekst i beskrivelser, sekundær vekt.
- **Tekst Svak** (#9A9A93): Labels, metadata, tidsstempler.
- **Kant Varm** (#E7E4D8): Delelinjer og kortkanter på varm bakgrunn.

### Named Rules
**Kobolt-tyngde-regelen.** Kobolt er ikke en ≤10 %-detalj her. Den bærer knapper, aksentord og hele kontrastseksjoner. Fortynn den aldri til et diskré ikon-fyll; det er poenget med et "committed" merke.

## 3. Typography

**Display Font:** Neue Haas Grotesk Display (Typekit), med Archivo og Schibsted Grotesk som fallback
**Body Font:** Neue Haas Grotesk Text (Typekit), med Schibsted Grotesk og system-ui som fallback
**Label/Mono Font:** Geist Mono

**Character:** Sveitsisk-nøytral grotesk som display-font gir presisjon og selvtillit uten å bli kald, fordi den varme papirbakgrunnen og den brede letter-spacingen på labels holder den menneskelig.

### Hierarchy
- **Display** (800, clamp(2rem–4rem), line-height 1.03, tracking -0.03em): Hero-overskrifter og seksjonstitler. Ofte med ett ord som outline-tekst (kontur, ikke fylt) som aksent.
- **Headline** (700–800, 1.5–2.25rem): Kortoverskrifter i verdiforslag og manifest.
- **Body** (400, 1rem–1.125rem, line-height 1.6–1.75): Brødtekst, maks ca. 64ch linjelengde i FAQ og manifest.
- **Label** (600, 0.72rem, tracking 0.22em, uppercase, Geist Mono): Seksjons-kickere ("002 SNIKTITT"), badge-tekst.

### Named Rules
**Outline-aksent-regelen.** Ett ord per hero/seksjonstittel kan få kontur-stil (`-webkit-text-stroke`, transparent fyll) i stedet for solid kobolt, som variasjon på "aksentuer med farge". Bruk høyst ett per overskrift, aldri hele setninger.

## 4. Elevation

Systemet er stort sett flatt: kort skiller seg med 1px varm kant (#E7E4D8), ikke skygge. Skygge brukes kun som respons på interaksjon (hover), aldri som hviletilstand-dekor, og er alltid tonet mot kobolt/marine i stedet for nøytralt svart.

### Shadow Vocabulary
- **hover-lift** (`0 12px 40px rgba(0,0,0,0.10)`): Kort som løftes 2px på hover (verdiforslag, priskort).
- **kobolt-glow** (`0 12px 36px rgba(27,52,255,0.30)`): Primærknapper i hvile, forsterkes på hover.
- **video-frame** (`0 24px 60px -12px rgba(9,9,11,0.18), 0 0 0 1px rgba(9,9,11,0.04)`): Den ene store demo-video-rammen, brukt sparsomt til noe som faktisk fortjener å "sveve".

### Named Rules
**Flat-i-hvile-regelen.** Kort og seksjoner er flate til de får en grunn (hover, aktiv tilstand). Skygge som permanent dekor på et priskort er ikke tillatt.

## 5. Components

### Buttons
- **Shape:** Pill (999px radius)
- **Primary:** Kobolt bakgrunn, hvit tekst, kobolt-glow-skygge, løft + mørkere kobolt på hover
- **Ghost:** Transparent bakgrunn, blekk tekst, tynn kant, kant og tekst blir kobolt på hover
- **Bruk:** Én primary + én ghost per CTA-gruppe, aldri to primary-knapper side om side

### Cards (verdiforslag, priser, maler)
- **Corner Style:** 16-24px radius
- **Background:** Hvit på varm-papir-seksjoner, marine på "mest populær"-kortet
- **Shadow Strategy:** Flat i hvile, `hover-lift` på hover (se Elevation)
- **Border:** 1px `kant-varm`, kobolt-tint på hover for klikkbare kort
- **Internal Padding:** 20-28px

### Chat-mockup (signatur-komponent)
Den ene komponenten som er unik for denne siden: en falsk nettleser-topplinje (tre prikker + "claude.ai") over ekte chat-bobler som viser en konkret AI-endring og resultatet. Dette ER produktbeviset, ikke dekor, hold den konkret og spesifikk (ekte bransje-eksempel), aldri generisk "Hei, hvordan kan jeg hjelpe?".

### Navigation
`dm-header`: sticky, hvit/90 % med blur, 74px høyde, kobolt CTA-knapp til høyre. Fullskjerm kobolt mobilmeny med store lenker og pil-ikon, ikke en liten dropdown.

### FAQ-accordion
Flat liste med delelinjer (`kant-varm`), ikke enkeltstående kort per spørsmål. Pluss-ikon roterer til strek ved åpning.

## 6. Do's and Don'ts

### Do:
- **Do** la kobolt bære 30-60 % av enhver seksjon den opptrer i (knapper, aksentord, kontrastbakgrunn), ikke en diskré 10 %-detalj
- **Do** vis ekte bevis (chat-mockup med konkret bransjeeksempel, ekte kundebilde og -navn, ekte tallsvar på "hva koster det")
- **Do** hold én tydelig CTA-gruppe (primary + ghost) per seksjon
- **Do** bruk `Engangssum` konsekvent i all prisrelatert copy. Aldri "månedspris" eller "abonnement" om selve nettsidekjøpet

### Don't:
- **Don't** bruk gradient-tekst eller side-stripe-borders (impeccables generelle forbud, matcher ikke denne sidens flate kort-stil uansett)
- **Don't** gjenta samme tre-kort ikon+overskrift+tekst-mønster i flere seksjoner på rad, det er malen "generisk AI-SaaS-landingsside" som er eksplisitt anti-referanse i PRODUCT.md
- **Don't** legg en liten uppercase-tracket kicker-label over hver eneste seksjon som fast grammatikk. Ett par kickere er stemme, kicker-over-alt er AI-stillas
- **Don't** skriv om produktet som et abonnement noe sted, siden selger en engangssum og selvstendighet, ikke en løpende avtale
- **Don't** finn opp en ny farge eller font per seksjon. Kobolt, varm papir, marine og Neue Haas/Archivo er hele paletten
