# Mal-prompt: speil og forbedre en kundes nettside

Kopier og fyll inn feltene under, send som ny melding.

---

Speil og forbedre nettside https://www.[DOMENE].no/. Bruk gjerne inspirasjon fra
C:\Users\adria\website-mirrors\dmarketing-redesign\maler\[NÆRMESTE BRANSJEMAL, f.eks. snekker/bilverksted/elektriker].
Aller først, husk å skrap hele nettsiden for info, og ha med alle sidene de hadde
opprinnelig på den eksisterende nettsiden.

---

## Ting jeg vet fungerte bra denne runden (skullerudflyttebyraa.no), gjør det samme:

1. **Speil med HTTrack i en fersk, tom mappe** i `C:\Users\adria\website-mirrors\<navn>\`.
   Filtrer på `+*.<domene>/*`. Hvis assets ligger på en ekstern CDN/S3 (ikke kundens
   eget domene), last de ned separat med `curl` etterpå, de kommer ikke med i HTTrack-filteret.

2. **Les ALLE sidene i speilet før du bygger noe.** Ikke bare forsiden, alle
   undersidene HTTrack fant. List `*.html`-filene i mirror-mappa først for å se
   hvor mange sider kunden faktisk har.

3. **Hent den ekte paletten** fra kundens egen CSS (`grep -oE '#[0-9a-fA-F]{3,6}'`)
   og fra logoen, ikke fra en generisk mal-farge. Bruk den uendret (fargelås).
   Last ned logoen i original oppløsning og sjekk at den faktisk er synlig
   (ikke hvit-på-hvit-transparent, det skjedde med NFF-logoen her).

4. **Hent ALLE eksterne lenker** fra speilet (fjernhjelp, sosiale medier, kart,
   tredjeparts skjema-lenker) og **verifiser at de fortsatt er live** med
   `curl -s -o /dev/null -w "%{http_code}"` før du bruker dem uendret. Gamle
   nettsider har ofte råtne lenker (Posten-lenken her var 404, måtte finne
   riktig ny URL via posten.no sin egen navigasjon, ikke gjette).

5. **Bygg redesignet i egen mappe** `...\<navn>-redesign\`, vanilla HTML/CSS/JS
   + Schibsted Grotesk + GSAP scroll-reveal, følg `adrian-web-style`. Behold
   **alle** originalsidene som egne HTML-filer med samme slugs.

6. **Verifiser i nettleser før du publiserer:**
   - DOM-inspeksjon (`javascript_tool`) for brutte bilder og horisontal overflow,
     på mobilbredde (375px) OG desktop, på **hver eneste side**, ikke bare forsiden.
   - Test mobilmenyen (åpne/lukke) faktisk fungerer, med litt ventetid mellom
     handlinger (transition-animasjoner trenger ~300-500ms, ellers ser det ut
     som en feil som egentlig ikke er en).
   - Skjermbilder som viser "utvasket"/gjennomsiktig innhold er som regel bare
     scroll-reveal-animasjon som ikke har trigget enda, ikke en faktisk feil,
     bekreft ved å scrolle og sjekke opacity på nytt før du konkluderer bug.
   - Sjekk at tekst/bildetekst faktisk stemmer med bildet som er brukt der
     (spesielt hvis du bytter ut et hero-bilde underveis).

7. **Publiser til GitHub Pages**, poll med curl til 200 + innholds-sjekk, gi
   Adrian URL-en, legg til i dashboardet automatisk med kundekortet.

## Ting å spørre om hvis usikker
- Hvis logo eller lenke fra originalsiden mangler/er ødelagt: spør Adrian eller
  bruk en trygg fallback (tlf/e-post/kontaktseksjon), aldri finn på en URL.
- Hvis hero-overskriften lener på en slitt klisjé ("stole på" e.l.): gi 3-4
  alternativer med AskUserQuestion.
