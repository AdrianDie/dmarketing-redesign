# Design: "vi bygger systemer"-seksjon på programvareutvikling-siden

**Dato:** 2026-08-27
**Mål:** Legge til én ny seksjon på `/programvareutvikling/` (+ `/en/software-development/`)
som beviser, med et konkret allerede-bygget eksempel, at Dietrichs Marketing bygger
egne skreddersydde bedriftssystemer (CRM/bestilling/tilbud), ikke bare nettsider.

---

## Bakgrunn

Grunnlaget er et bestillings- og tilbudsverktøy bygget for en cateringbedrift, som
dekker hele reisen fra første henvendelse til gjennomført leveranse (statuser,
full sporing per bestilling, kundeoversikt, dashbord, offentlig bestillingsskjema
med spamvern, egen merkevare/fargeprofil, sikker pålogging).

**Avklart med Adrian (2026-08-27):**
- Kunden holdes generisk. Ingen firmanavn. Jeg dropper også by/sted («Kristiansand»),
  siden det ikke er bekreftet noe sted i repoet og generisk uten sted er tryggest.
- Det live verktøyet nevnes ikke og lenkes ikke til. Avtalen er for fersk.
- H2 skal ikke nevne «nettside» i det hele tatt (rettet etter første utkast).
- H2 skal nevne CRM-system eksplisitt (rettet etter andre utkast).
- Ingen animerte prikker mellom statusnodene i pipeline-illustrasjonen
  (fjernet etter publisering, statiske koblingslinjer beholdt). Hero sitt
  eget prog-visual er upåvirket, animerer fortsatt.
- Teksten korrigert ned etter publisering: lead fra to setninger til én,
  punktlisten fra fem til tre punkter. Se «Seksjonsstruktur» for gjeldende
  tekst, ikke historikken i denne lista.
- Cateringbedrift/allergier-referansene fjernet helt. Seksjonen ble for
  bransjespesifikk, generalisert til "statistikk og varsler" i stedet.
  Seksjonen er nå en generell kapabilitetsvisning, ikke lenger en konkret
  case-study forankret i én navngitt bransje (fortsatt ingen kundenavn).
  Mer margin lagt til mellom h2/lead/punktliste (`.systems__copy .lead`
  margin-top 1.2rem, `.systems__points` margin-top 2rem, gap 0.85rem).

---

## Plassering

Begge filer har allerede en tom seksjonsplass på **identisk linjenummer** (~440):

```html
<!-- ============ HVA VI BYGGER ============ -->

<!-- ============ EKSEMPEL ============ -->
<section class="section epost" id="eksempel"> ... E-Wheels ... </section>
```

Den nye seksjonen fyller denne tomme plassen, rett etter Funksjoner (bento) og
rett før Eksempel (E-Wheels AI-kundeservice). Rekkefølgen blir da: Funksjoner →
**dette har vi bygget** → enda et konkret eksempel (E-Wheels) → Pris. To konkrete
beviser på rad, rett før prisseksjonen.

`en/software-development/index.html` har ingen egen CSS/JS, den låner
`/programvareutvikling/style.css` og `/programvareutvikling/app.js`. All CSS
skrives derfor kun i `programvareutvikling/style.css`. HTML dupliseres (oversatt)
i begge filer, animasjonsscriptet dupliseres identisk (det er allerede sidens
egen konvensjon, se linje 662-696 i begge filer i dag).

Denne undersiden bruker **ikke** forsidens `dm-eyebrow`/`dm-h2`-mønster. Den har
sitt eget lokale system (`.h2` + `.lead`), og kun hero/kontaktkortet bruker en
`.kicker`-boble. De andre seksjonene (Problem, Steg, Funksjoner, Eksempel, Pris)
går rett til `.h2` uten eyebrow. Den nye seksjonen matcher **dette lokale
mønsteret**, ikke forsiden.

---

## Seksjonsstruktur

To-kolonne, samme grid-oppskrift som `.epost__grid` (tekst venstre, visual høyre).
Ny klasse `.systems__grid` (egen regel, kopi av epost sine verdier, følger
sidens eksisterende mønster med én grid-klasse per seksjon i stedet for delt
utility-klasse).

### Norsk

```html
<section class="section systems" id="systemer">
  <div class="wrap systems__grid">
    <div class="systems__copy" data-reveal>
      <h2 class="h2">Vi bygger CRM-systemet bedriften din faktisk trenger.</h2>
      <p class="lead">
        De fleste byråer stopper når nettsiden er ferdig. Vi bygger
        videre, med egne systemer bygget rundt hvordan bedriften din
        drives.
      </p>
      <ul class="systems__points">
        <li>Egen status for hver bestilling, fra forespørsel til
            gjennomført</li>
        <li>Statistikk og varsler, alt samlet på ett sted</li>
        <li>Skreddersydd i bedriftens egen merkevare, ikke en mal</li>
      </ul>
    </div>
    <div class="systems__visual" data-reveal>
      <!-- pipeline-SVG, se eget avsnitt -->
    </div>
  </div>
</section>
```

`.systems__points` = egen regel, kopi av `.epost__points` (samme sjekkmerke-styling).

### Engelsk

Samme struktur, `id="systems"`, oversatt copy:

- **H2:** "We build the CRM system your business actually needs."
- **Lead:** "Most agencies stop once the website is done. We keep going,
  with systems built around how your business actually runs."
- **Punkter:**
  1. "A status for every order, from inquiry to completed"
  2. "Statistics and alerts, everything in one place"
  3. "Tailored to the business's own brand, not a template"

---

## Illustrasjon: statuspipeline-SVG

Ny inline SVG (`viewBox="0 0 600 300"`), samme visuelle språk som hero sitt
`prog-visual` (kobolt-gradient-noder, hvite strek-ikoner, myk drop-shadow,
flytende prikk-animasjon langs linjene). Flyter fritt på siden uten kort/UI-ramme,
akkurat som hero-visualet, bevisst for å IKKE ligne et skjermbilde av det
faktiske verktøyet.

**4 hovednoder** (happy path, r=38, y=120, x=60/220/380/540), koblet med rette
linjer og flytende prikker:

1. **Ny forespørsel** (kobolt) — konvolutt-ikon
2. **Tilbud sendt** (kobolt) — pil/sendt-ikon
3. **Bekreftet** (kobolt) — hakemerke (samme path-form som sidens eksisterende
   sjekkmerke-ikon, gjenbrukt for konsistens)
4. **Gjennomført** (sidens eksisterende `--green: #2f6f5e`, IKKE CRM-ets egen
   grønnfarge, dette er samme grønnfarge som allerede brukes til «fullført»
   andre steder på siden, f.eks. `.mini-check`) — samme hakemerke, grønn

**Én nedtonet gren** fra node 2 (Tilbud sendt): liten node **Avslått** (r=22,
grå `--line`/`--line-2`-toner, X-ikon, stiplet kobling, ingen flyt-animasjon).
Viser at systemet håndterer avslag uten å overkomplisere visualet. Avlyst og
utløpt tilbud nevnes kun i teksten (feature-listen har ikke plass/behov for
alle 6 statusene visuelt).

**Ingen tall noe sted i illustrasjonen.** Kun stadienavn. Dette er bevisst for
å unngå «oppdiktet stat»-fellen fra hero-widgeten som ble fjernet tidligere
(se `[[project-programvareutvikling-hero-demo]]`-memoen).

Full SVG-skisse (koordinater verifisert, klar til bruk):

```html
<div class="pipeline-visual" aria-hidden="true">
  <svg viewBox="0 0 600 300" role="img" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="plNode" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#4C63FF"/><stop offset="100%" stop-color="#1B34FF"/>
      </linearGradient>
      <linearGradient id="plNodeDone" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#4C9B85"/><stop offset="100%" stop-color="#2f6f5e"/>
      </linearGradient>
      <filter id="plGlow" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
      <filter id="plNodeShadow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#1226CC" flood-opacity="0.22"/>
      </filter>
    </defs>

    <circle class="pl-glow" cx="540" cy="120" r="70" fill="#2f6f5e" opacity="0.14" filter="url(#plGlow)"/>

    <g fill="none" stroke="#1B34FF" stroke-opacity="0.3" stroke-width="1.8">
      <path class="pl-conn" d="M98 120 H182"/>
      <path class="pl-conn" d="M258 120 H342"/>
      <path class="pl-conn" d="M418 120 H502"/>
    </g>
    <g class="pl-flow-layer" fill="#1B34FF"></g>

    <path d="M220 158 V200" fill="none" stroke="#D8D5C8" stroke-width="1.6" stroke-dasharray="3 6"/>

    <!-- Node 1: Ny forespørsel -->
    <g filter="url(#plNodeShadow)"><circle cx="60" cy="120" r="38" fill="url(#plNode)"/></g>
    <rect x="46" y="110" width="28" height="20" rx="2" fill="none" stroke="#fff" stroke-width="2"/>
    <path d="M46 110 L60 123 L74 110" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="60" y="180" text-anchor="middle" font-family="'Schibsted Grotesk',sans-serif" font-size="14" font-weight="700" fill="#0E1116">Ny forespørsel</text>

    <!-- Node 2: Tilbud sendt -->
    <g filter="url(#plNodeShadow)"><circle cx="220" cy="120" r="38" fill="url(#plNode)"/></g>
    <g transform="translate(220,120) rotate(-45)">
      <path d="M-11 0 H11 M4 -7 L11 0 L4 7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <text x="220" y="180" text-anchor="middle" font-family="'Schibsted Grotesk',sans-serif" font-size="14" font-weight="700" fill="#0E1116">Tilbud sendt</text>

    <!-- Gren: Avslått (nedtonet) -->
    <circle cx="220" cy="222" r="22" fill="#E7E4D8" stroke="#D8D5C8" stroke-width="1.4"/>
    <path d="M212 214 L228 230 M228 214 L212 230" stroke="#9A9A93" stroke-width="2" stroke-linecap="round"/>
    <text x="220" y="262" text-anchor="middle" font-family="'Schibsted Grotesk',sans-serif" font-size="12" font-weight="600" fill="#9A9A93">Avslått</text>

    <!-- Node 3: Bekreftet -->
    <g filter="url(#plNodeShadow)"><circle cx="380" cy="120" r="38" fill="url(#plNode)"/></g>
    <path d="M371 121.3 L376 126.5 L389 113.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="380" y="180" text-anchor="middle" font-family="'Schibsted Grotesk',sans-serif" font-size="14" font-weight="700" fill="#0E1116">Bekreftet</text>

    <!-- Node 4: Gjennomført -->
    <g filter="url(#plNodeShadow)"><circle cx="540" cy="120" r="38" fill="url(#plNodeDone)"/></g>
    <path d="M531 121.3 L536 126.5 L549 113.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="540" y="180" text-anchor="middle" font-family="'Schibsted Grotesk',sans-serif" font-size="14" font-weight="700" fill="#0E1116">Gjennomført</text>
  </svg>
</div>
```

Engelsk versjon: identisk SVG, kun tekst-innholdet i de fem `<text>`-elementene
byttes til "New inquiry" / "Quote sent" / "Declined" / "Confirmed" / "Completed".

---

## CSS-endringer (`programvareutvikling/style.css`, delt av begge språk)

Nye regler (etter `.epost`-blokken, før `.proof`-blokken):

```css
.systems__grid { display: grid; grid-template-columns: 1fr 1.05fr; gap: clamp(2rem, 1rem + 4vw, 5rem); align-items: center; }
.systems__copy .lead { margin-top: 1.2rem; }
.systems__points { list-style: none; padding: 0; margin: 2rem 0 0; display: flex; flex-direction: column; gap: 0.85rem; }
.systems__points li { display: flex; gap: 0.6rem; align-items: flex-start; font-size: var(--fs-0); }
.systems__points li::before { content: ""; flex: none; width: 20px; height: 20px; border-radius: 50%; margin-top: 1px; background: var(--cobalt-tint) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231B34FF' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 13l4 4L19 7'/%3E%3C/svg%3E") center / 13px no-repeat; }

.pipeline-visual { position: relative; width: 100%; max-width: 560px; margin-inline: auto; }
.pipeline-visual svg { width: 100%; height: auto; display: block; overflow: visible; }
@media (prefers-reduced-motion: no-preference) {
  .pl-glow { animation: plPulse 6s ease-in-out infinite; transform-origin: 540px 120px; }
}
@keyframes plPulse { 0%,100% { opacity:.14; transform:scale(1); } 50% { opacity:.22; transform:scale(1.05); } }
```

(`.systems__points::before` er en 1:1-kopi av `.epost__points li::before`, ikke
en delt klasse, samme begrunnelse som grid-klassen: matcher sidens eksisterende
mønster med én regel per seksjon.)

**Ett nødvendig tillegg** i den eksisterende responsive media-queryen (linje ~534):

```css
@media (max-width: 1000px) {
  .hero__grid, .problem__grid, .pricing__grid, .faq__grid, .epost__grid,
  .finalcta__grid, .systems__grid { grid-template-columns: 1fr; }
  ...
}
```

---

## JS-endring (inline script nederst i begge `index.html`)

Dagens script (identisk i begge filer, linje 662-696) er hardkodet til å drive
kun `.prog-visual svg`. Generaliseres til å drive begge visualene, med egen
`live`-teller per SVG (lukket i en delt `animate()`-funksjon), i stedet for å
lime inn en nesten-duplikat andre IIFE:

```js
<script>
(function(){
  try{ if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; }catch(e){}
  var NS='http://www.w3.org/2000/svg';
  function rand(a,b){return a+Math.random()*(b-a);}
  function animate(svg, connSel, layerSel, color, max){
    var paths=[].slice.call(svg.querySelectorAll(connSel)); if(!paths.length) return;
    var layer=svg.querySelector(layerSel); if(!layer) return;
    var live=0;
    function spawn(){
      if(live>=max) return;
      var p=paths[(Math.random()*paths.length)|0];
      var len=p.getTotalLength();
      var rev=Math.random()<0.45, dur=rand(1600,3000);
      var dot=document.createElementNS(NS,'circle');
      dot.setAttribute('r',rand(2.3,3.8).toFixed(1));
      dot.setAttribute('fill',color);
      layer.appendChild(dot); live++;
      var t0=null;
      function frame(t){
        if(t0===null)t0=t;
        var k=(t-t0)/dur;
        if(k>=1){ layer.removeChild(dot); live--; return; }
        var pt=p.getPointAtLength((rev?(1-k):k)*len);
        dot.setAttribute('cx',pt.x.toFixed(1));
        dot.setAttribute('cy',pt.y.toFixed(1));
        dot.setAttribute('opacity',(k<0.15?k/0.15:(k>0.85?(1-k)/0.15:1)).toFixed(2));
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    function loop(){ spawn(); setTimeout(loop, rand(1100,2800)); }
    setTimeout(loop, rand(0,400));
  }
  var pv=document.querySelector('.prog-visual svg');
  if(pv) animate(pv, '.pv-conn', '.pv-flow-layer', '#1B34FF', 4);
  var pl=document.querySelector('.pipeline-visual svg');
  if(pl) animate(pl, '.pl-conn', '.pl-flow-layer', '#1B34FF', 3);
})();
</script>
```

Oppførsel for det eksisterende hero-visualet er uendret (samme selektorer,
samme farge, samme MAX). Denne samme oppdaterte scriptblokken limes inn i
begge `index.html`-filene (de er allerede identiske i dag).

---

## Ufravikelige regler

- Ingen kundenavn, ingen by/sted, ingen lenke til det live verktøyet.
- Ingen tall (hverken ekte eller illustrative) i illustrasjonen eller teksten.
- Ingen tech-stack nevnt.
- Ingen nevning av AI/Claude som byggeverktøy.
- H2 nevner ikke «nettside».
- Norsk bokmål, ingen em-streker.

---

## Avgrensning (YAGNI)

- Ingen kort-UI/browser-chrome rundt illustrasjonen (bevisst, for å unngå
  skjermbilde-følelsen).
- Ingen egen CTA-knapp i seksjonen. Siden har allerede én felles kontaktseksjon
  nederst, samme mønster som Problem/Steg/Funksjoner/Eksempel (ingen av dem har
  egen CTA).
- Ingen endring i `app.js` (kun det inline scriptet i `index.html` berøres).
- Rører ikke E-Wheels-eksempelet, FAQ eller noe annet eksisterende innhold.

---

## Suksesskriterier

1. Seksjonen vises identisk (struktur/verdier) på begge språk, kun tekst byttet.
2. Pipeline-SVG-en animerer (flytende prikker på hovedstien) uten å påvirke
   hero-visualets animasjon, og respekterer `prefers-reduced-motion`.
3. Ingen horisontal overflow 320-1440px på noen av de to sidene.
4. Ingen kundenavn, by, lenke, tall eller stack-detaljer noe sted i den nye
   seksjonen.
5. Verifisert i nettleser (DOM-inspeksjon + skjermbilde) på begge sider før
   ferdigmelding.
