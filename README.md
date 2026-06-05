# dmarketing-redesign

Arbeidskopi / redesign-utgangspunkt for **dmarketing.no** (Dietrichs Marketing).

Dette er en **frittstående duplikat** av et utvalg sider fra produksjons-repoet
`AdrianDie/Dmarketing`, isolert her slik at redesign-arbeidet ikke rører den
live nettsiden.

## Hva som er kopiert (snapshot 2026-06-05)

Kun kjerne-markedssidene Adrian valgte ut:

| Fil | Side | CSS-system |
|-----|------|-----------|
| `index.html` | Forside | Webflow |
| `tjenester.html` | Tjenester | Webflow |
| `google-ads.html` | Google Ads | Webflow |
| `about.html` | Om oss | Webflow |
| `kontakt.html` | Kontakt | Webflow |
| `webdesign.html` | Webdesign | Webflow |
| `ai-nettsider.html` | AI-nettsider | Tailwind (CDN) |

Avhengigheter: `css/` (normalize + webflow + dietrichsmarketing), `js/`
(webflow.js), `images/`, `documents/FAQ-icon.json`.

## Bevisst utelatt

- `kurs/`, `maler/` (kunde-templates som selges separat), `docs/`
  (Obsidian-vault), `admin/`, `agent-config/`, leads-verktøy, `node_modules/`.
- `CNAME` og `_redirects` — utelatt med vilje så denne kopien **ikke** kan
  kapre domenet `dmarketing.no` ved en evt. fremtidig deploy. Legges til
  bevisst når/hvis redesignen skal publiseres.

## Jobbe på flere PC-er

GitHub er sync-mekanismen (mappa ligger utenfor OneDrive). På en ny maskin:

```bash
git clone https://github.com/AdrianDie/dmarketing-redesign.git
```

## Kjente løse tråder (forventet)

Navet i Webflow-sidene lenker også til sider som IKKE er med i dette utvalget
(`works.html`, `artikler.html`, `/maler`, `/kurs`, blogg-artikler m.m.). Disse
lenkene gir 404 lokalt — det er forventet for et redesign-skjelett og ryddes
når strukturen for redesignen bestemmes.

## Kilde

Produksjon: `AdrianDie/Dmarketing` → https://dmarketing.no (Webflow-eksport).
Dette er en kopi, ikke en fork — historikk starter på nytt her.

## Neste steg

Redesign kommer. Hus-stil følger `adrian-web-style` (kobolt `#1B34FF` for
Dietrichs/Voltio). Plan utarbeides før omskriving.
