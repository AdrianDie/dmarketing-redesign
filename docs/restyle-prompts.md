# Restyling-prompts (header + stil + font på undersider og artikler)

Lim én prompt per ny Claude Code-sesjon. Begge er selvstendige.

================================================================
## PROMPT A — Undersider (header + stil + fonter)
================================================================

Du jobber i Dietrichs Marketing sitt nettside-repo: `C:\Users\adria\dmarketing-redesign`
(dette er produksjonsklonen, i synk med origin/main, publiserer til https://dmarketing.no
via GitHub Pages, repo AdrianDie/dmarketing-redesign). IKKE bruk kopiene under
`C:\Users\adria\website-mirrors\` — de er utdaterte.

Forsiden (`index.html`) er nettopp redesignet. Bruk den som fasit:
`C:\Users\adria\dmarketing-redesign\index.html` og live https://dmarketing.no/.

MÅL: Få de andre undersidene til å matche forsidens header, fonter og stil. Behold sidenes
faktiske INNHOLD/copy — bytt bare ut "chrome" (header, fonter, farger, spacing).

Undersider å gjøre (hver har sin egen index.html):
  /ai-nettsider/  /apputvikling/  /kontakt/  /tjenester/  /kurs/  /webdesign/
  /google-ads/  /personvern/  /vilkar/  /artikler-index/  (og malen /artikkel-mal/)
IKKE rør de enkelte artiklene under /artikler/ — en egen sesjon tar dem.

GJØR PER SIDE:
1. Finn sidens nåværende header/meny og ERSTATT den med header-komponenten nedenfor
   (fjern gammel meny-inkludering, f.eks. dietrichs-menu.js, hvis den gir dobbel header).
2. Legg font-lenkene nedenfor i <head>.
3. Sett brødtekst + overskrifter til Schibsted Grotesk, logo til Archivo (komponenten gjør
   dette for headeren; sørg for at resten av siden også bruker Schibsted Grotesk).
4. Match fargene: kobolt #1B34FF som aksent/CTA, ink #0E1116 tekst, varm hvit bakgrunn,
   avrundede kort, god luft. Sammenlign mot forsiden.

--- FONT-LENKER (legg i <head>) ---
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Archivo:wght@600;700;800&display=swap" rel="stylesheet">

--- SELVSTENDIG HEADER-KOMPONENT (lim inn, virker uten ocean-Tailwind) ---
<style id="dm-header-style">
.dm-header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.9);backdrop-filter:saturate(160%) blur(12px);-webkit-backdrop-filter:saturate(160%) blur(12px);border-bottom:1px solid #ECEAE0;font-family:'Schibsted Grotesk',system-ui,sans-serif;}
.dm-header .dm-nav{max-width:1440px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:0 clamp(16px,4vw,40px);height:74px;}
.dm-header .dm-logo{display:flex;align-items:center;gap:9px;text-decoration:none;flex-shrink:0;}
.dm-header .dm-logo .mark{width:34px;height:34px;border-radius:9px;background:#1B34FF;color:#fff;display:flex;align-items:center;justify-content:center;font-family:Archivo,sans-serif;font-weight:800;font-size:18px;}
.dm-header .dm-logo .word{font-family:Archivo,sans-serif;font-weight:700;font-size:20px;letter-spacing:0.01em;text-transform:uppercase;color:#0E1116;white-space:nowrap;}
.dm-header .dm-logo .word b{color:#1B34FF;font-weight:700;}
.dm-header .dm-right{display:flex;align-items:center;gap:28px;}
.dm-header .dm-links{display:flex;align-items:center;gap:26px;list-style:none;margin:0;padding:0;}
.dm-header .dm-links a{font-size:0.95rem;font-weight:500;color:#3F4452;text-decoration:none;transition:color .15s ease;}
.dm-header .dm-links a:hover{color:#0E1116;}
.dm-header .dm-cta{display:inline-flex;align-items:center;justify-content:center;height:40px;padding:0 18px;border-radius:10px;background:#1B34FF;color:#fff;font-size:0.9rem;font-weight:600;text-decoration:none;white-space:nowrap;transition:background .15s ease;}
.dm-header .dm-cta:hover{background:#1226C9;}
.dm-header .dm-burger{display:none;background:none;border:0;cursor:pointer;padding:8px;}
.dm-header .dm-burger span{display:block;width:24px;height:2px;background:#0E1116;border-radius:2px;margin:5px 0;}
@media(max-width:820px){.dm-header .dm-links{display:none;}.dm-header .dm-burger{display:block;}}
</style>
<header class="dm-header"><nav class="dm-nav">
  <a class="dm-logo" href="/"><span class="mark">D</span><span class="word">Dietrichs <b>marketing</b></span></a>
  <div class="dm-right">
    <ul class="dm-links">
      <li><a href="/apputvikling/">Programvareutvikling</a></li>
      <li><a href="/ai-nettsider/">AI-nettsider</a></li>
      <li><a href="/kontakt/">Kontakt</a></li>
    </ul>
    <a class="dm-cta" href="/kontakt/">Ta kontakt</a>
    <button class="dm-burger" aria-label="Meny"><span></span><span></span><span></span></button>
  </div>
</nav></header>

--- FARGE-TOKENS ---
kobolt #1B34FF | kobolt-hover #1226C9 | ink #0E1116 | ink-soft #5F6169
linje #E7E4D8 | papir/varm-hvit #FCFBF7 | hvit #fff

--- KRITISKE TEKNISKE REGLER (følg nøye) ---
- Rediger HTML med Python: open(p, encoding='utf-8') ... open(p,'w',encoding='utf-8',newline='').
  IKKE bruk PowerShell Get-Content/Set-Content — det dobbel-koder norske tegn (ø -> Ã¸).
  Sjekk etter hver lagring at filen IKKE inneholder byte-sekvensen b'\xc3\x83'.
- Forsiden laster ocean.io sin purgede Tailwind-CSS, så NYE Tailwind-utility-klasser virker
  ikke. Bruk scoped <style>-blokker (med id) eller inline-stil for ny styling. (Header-
  komponenten over er allerede scoped og trygg.)
- Undersidene deler en rot-`style.css` og `app.js` (via ../style.css). Ikke knekk deres
  eksisterende styling — legg header/fonter oppå, eller scope din CSS. Vil du sette fonten
  globalt for alle undersider, kan du oppdatere font-family i den delte style.css ÉN gang
  (men da gjelder det alle sider — koordiner).
- file:// er blokkert i Playwright her. Forhåndsvis med: `python -m http.server 8080` i
  repo-roten, åpne http://127.0.0.1:8080/<side>/. Sammenlign side ved side med dmarketing.no.
- FØR push: `git fetch origin` så `git rebase origin/main` (parallelle sesjoner pusher
  samtidig), deretter `git push origin main`. Commit per side eller logisk bunt med tydelig
  norsk melding. Verifiser live etter ~1-2 min på https://dmarketing.no/<side>/.

Start med /ai-nettsider/ og /apputvikling/ (viktigst), verifiser, og fortsett nedover lista.


================================================================
## PROMPT B — De tre AI-artiklene (stil, header, font)
================================================================

Du jobber i Dietrichs Marketing sitt nettside-repo: `C:\Users\adria\dmarketing-redesign`
(produksjonsklonen, i synk med origin/main, publiserer til https://dmarketing.no via GitHub
Pages, repo AdrianDie/dmarketing-redesign). IKKE bruk kopiene under
`C:\Users\adria\website-mirrors\`.

Fasit for stil/header/font er forsiden: `C:\Users\adria\dmarketing-redesign\index.html`
og live https://dmarketing.no/.

MÅL: Endre stil, header og font på de TRE AI-artiklene som forhåndsvises på forsiden, slik
at de matcher den nye forsiden. Behold selve artikkelteksten/innholdet — bytt header, fonter
og styling, og gjør lesefelten ren (god linjelengde, tydelig overskriftshierarki).

Filene:
  artikler/hva-bor-du-aldri-la-en-ai-gjore-i-bedriften.html
  artikler/hvordan-kan-ai-kunne-alt-om-bedriften-uten-a-finne-pa-svar.html
  artikler/forskjell-ai-som-prater-og-ai-som-gjor-jobben.html

GJØR PER ARTIKKEL:
1. Erstatt nåværende header/meny med header-komponenten nedenfor (fjern gammel meny hvis
   dobbel). Lenkene er absolutte (/apputvikling/ osv.), så de virker fra /artikler/-dybden.
2. Legg font-lenkene i <head>. Sett brødtekst + overskrifter til Schibsted Grotesk.
3. Match forsidens farger (kobolt #1B34FF aksent, ink #0E1116 tekst, varm hvit bakgrunn).
   Artikkelinnhold: maks ~70ch linjelengde, luftig, tydelige H2/H3 i Schibsted Grotesk,
   kobolt-lenker.

--- FONT-LENKER, HEADER-KOMPONENT, FARGE-TOKENS og TEKNISKE REGLER ---
(IDENTISK med Prompt A over — bruk samme font-lenker, samme selvstendige .dm-header-
komponent, samme fargetokens, og de samme kritiske tekniske reglene: Python-redigering /
ingen PowerShell Set-Content, scoped CSS pga purget Tailwind, delt style.css/app.js,
python -m http.server for forhåndsvisning, git fetch+rebase før push.)

Verifiser hver artikkel live på https://dmarketing.no/artikler/<fil>.html etter deploy.
Når de tre er gode: de samme 40 andre artiklene under /artikler/ kan tas i en oppfølging.
