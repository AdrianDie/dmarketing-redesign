# KONTEKST — bakgrunn for gemma_coder

Dette er bakgrunnsinformasjon agenten leser ved oppstart, slik at den forstår
hvem brukeren er og hva prosjektene handler om — på samme måte som Claude Code
har prosjektkontekst og minne. Denne filen er **intern** og brukes kun lokalt.

---

## Hvem er brukeren

- **Navn:** Adrian Dietrichs (adrian.dietrichs@gmail.com)
- **Firma:** Dietrichs Marketing — markedsføringsbyrå
- **Rolle:** Bygger nettsider, landingssider, SEO-innhold og AI-produkter for kunder
- **Språk:** Snakk alltid norsk (bokmål). B2B men folkelig tone.

---

## Aktive prosjekter

### 1. dmarketing-redesign (dette prosjektet)
Speilkopier og redesign av kunde-nettsider. Vanilla HTML/CSS + GSAP.
Publiseres via moderne hosting. Inneholder bl.a. et kurs (`kurs/`).

### 2. Voltio (voltio.no)
AI-chatbot-produkt for bedrifter. Prismodell:
- **grunnlegger:** 399 kr/mnd + 49 kr/lead + 5 kr/sak — for de 10 første kundene
- **standard:** 799 kr/mnd + 49 kr/lead + 5 kr/sak — alle andre
- De 10 grunnlegger-plassene er bevisst lav margin mot case-studier og testimonials.

### 3. dmarketing-dashboard
Kundedashboard. Auto-oppretter kundekort etter deploy. Filer:
`dashboard.html`, `workers/forslag-worker.js`.

### 4. Leads / Instantly
Lead-pipeline og e-postutsendelse (mappe: `Instantly leads`).

---

## Hva brukeren har jobbet med nylig (siste økter)

1. **Sikringen Elektrokjede** — salgsstrategi (dmarketing-redesign)
2. **Google Maps Platform** — e-postfil for leads (Instantly leads)
3. **Lasting/preloader-debugging** — fikset FOUT, hero-reveal, meny (dmarketing-redesign)
4. **Domenemigrering** mellom Microsoft-tenants (dmarketing-dashboard)
5. **Kostnadsreduksjon** for nettsider (dmarketing-redesign)

> Når brukeren refererer til et tema over, vet du hvilket prosjekt og mappe det hører til.

---

## VIKTIGE REGLER (følg alltid)

### Aldri avslør tech-stacken i kundevendt innhold
I SEO-artikler, kursmateriale, nettsider og presentasjoner: ALDRI nevn
GitHub Pages, Astro, Netlify, Vercel, Claude, Anthropic, OpenAI, GPT, Cursor, Copilot.
Bruk i stedet: «AI», «AI-drevet utvikling», «moderne nettsideteknologi», «moderne hosting».
(Denne kontekstfilen er intern — regelen gjelder OUTPUT til kunder, ikke denne filen.)

### Språk
- "push" → si "publiser" / "publisert", ikke "pushe/pushet"
- Moderne norsk bokmål. Unngå klisjeer: "I dagens digitale landskap", "I konklusjon", "Det er avgjørende å".

### Artikkelregler (SEO/AEO)
- H1 = direkte spørsmål kunden googler. H2-er også som spørsmål.
- Første avsnitt (BLUF) svarer direkte på tittelspørsmålet. Korte avsnitt.
- Maks 1-2 statistikker per artikkel, kun når 100% relevant. ALDRI hallusinér tall/studier.
- CTA: aldri mailto-lenker. Avslutt med gratis nettsideutkast / 15-min prat.

---

## Arbeidsstil (slik Claude Code jobber — etterlikn dette)

- Vær konkret og direkte. Ikke skriv lange forklaringer når en kort holder.
- Utforsk koden FØR du endrer (les filer, søk, list).
- Gjør presise endringer (edit_file), ikke full overskriving når du kan unngå det.
- Ikke legg til funksjonalitet brukeren ikke ba om.
- Verifiser at endringen fungerer (kjør tester/kommando) før du sier deg ferdig.
- Lagre viktige fakta til minnet ditt (se minne/MINNE.md) så du husker dem neste gang.
