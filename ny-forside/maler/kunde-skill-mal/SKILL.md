---
name: nettside-stil
description: Bruk denne hver gang du lager en ny side eller seksjon på [BEDRIFTSNAVN] sin nettside, eller endrer hvordan noe ser ut. Den holder alt i samme stil som resten av nettstedet — farger, fonter, knapper, kort og avstander — så nye ting ser ut som om de alltid har vært der.
---

# Hus-stil for [BEDRIFTSNAVN] sin nettside

Dette er den faste stilen til nettsiden til [BEDRIFTSNAVN]. Følg den når du
bygger eller endrer noe, så ser resultatet ut som om det alltid har vært en del
av nettstedet. **Stil-konsistens er viktigere enn å være kreativ.**

## Gylden regel: kopier en eksisterende side

Før du bygger noe nytt — åpne en ferdig side av samme type (en tjeneste-side som
mal for en ny tjeneste-side osv.) og gjenbruk dens meny, footer, seksjons-oppbygging
og komponent-stil. Bytt bare innholdet, ikke design-rammeverket. En ny side som
«stikker seg ut» er en feil, ikke et pluss.

## Design-tokens (bruk kun disse)

| Rolle | Verdi |
|---|---|
| Merkefarge | `[BRAND_HEX]` — knapper, lenker, aksenter |
| Bakgrunn | `#FAFAFA` / `#FFFFFF` |
| Tekst | `#09090B` (overskrifter + brødtekst) |
| Dempet tekst | `#71717A` |
| Kantlinjer | `#E4E4E7` |
| Mørk (footer/CTA) | `#0B1F4A` navy |

- Overskrifter: `[DISPLAY_FONT]`, tung vekt, stram bokstavavstand på store titler.
- Brødtekst: Inter, vekt 400, linjehøyde ~1.7.
- Maks 3 font-vekter per side. Ingen nye farger eller fonter uten at det blir bedt om.
- Seksjoner: mye luft (ca. 96px topp/bunn). Aldri to mørke seksjoner på rad. Footer alltid navy.

## Komponenter (gjenbruk, ikke gjenoppfinn)

- **Knapper** — Primær: fylt med `[BRAND_HEX]`, hvit tekst, avrundet, lite løft/glød på hover. Sekundær: hvit med tynn kantlinje som mørkner på hover.
- **Kort** — hvit bakgrunn, tynn kantlinje (`#E4E4E7`), `rounded-2xl`, romslig padding. Hover: lite løft + myk skygge. Aldri harde svarte skygger.
- **Seksjoner** — alterner hvit og veldig lys grå bakgrunn.

## Slik ser «ferdig» ut — det viktigste

Det som skiller en proff side fra en amatørmessig er disse detaljene. Ha med minst
ett av dem på hver nye side/seksjon:

- **Bilder er alltid stylet** — avrundet, med en subtil ramme, skygge eller overlay. Aldri en helt rå `<img>`.
- **Flytende detaljer** — en liten stat-pille eller en anmeldelse-pille som ligger over et bilde.
- **Mikro-interaksjoner** — kort/knapper løfter seg litt og får mykere skygge når man holder musa over (gjerne en svak glød i merkefargen).
- **Mykt inn-fade når man scroller** — innhold glir litt opp og toner inn (`opacity 0→1`, `translateY ~24px→0`); forskyv (stagger) kortene i en rad litt.
- **Ekte innhold** — konkrete tall, navn og scenarier. Aldri «lorem ipsum» eller tomt fyll.
- **Subtil bakgrunns-tekstur** der det passer — et lett prikk-rutenett, ikke bare flat hvit.
- **Bransje-relevante ikoner** (bransje: [BRANSJE]) — ikke tilfeldige standard-ikoner.

## Slik ser «uferdig» ut — unngå

- Bare sentrert overskrift + et par knapper + en rad med hakemerker, uten noe visuelt.
- Rå, ustylet bilder.
- Tomt fyll-innhold i stedet for ekte tekst.
- En kopi av en annen sides struktur med akkurat samme klasser og avstander.

## Bilder

- Alltid `object-fit: cover` og et fast størrelsesforhold (så layouten ikke hopper).
- Legg en `onerror`-reserve på hvert bilde, slik at et midlertidig bilde vises hvis det egentlige mangler.
- Alltid beskrivende alt-tekst (bra for blinde og for Google).

## Språk og tone

Norsk, direkte og varm. «du» og «vi», ikke «kunden»/«selskapet». Ingen byråkrati,
ingen unødvendig engelsk, ikke for mye emoji. Bransje: [BRANSJE].

## Sjekkliste før du publiserer en ny side

- [ ] Samme meny og footer som resten av nettstedet.
- [ ] Kun fargene og fontene over.
- [ ] Én stor H1 øverst, deretter H2/H3.
- [ ] Minst ett «ferdig»-signal (stylet bilde / flytende detalj / hover-effekt).
- [ ] Ekte innhold — ingen fyll-tekst.
- [ ] Siden er lagt til i menyen og i sitemap.

Hvis noen ber om noe som bryter med dette (helt ny farge, ny font, et helt annet
uttrykk): gjør det de ber om, men si kort fra at det vil avvike fra resten av
nettstedet, så de tar et bevisst valg.
