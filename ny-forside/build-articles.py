"""Convert markdown article drafts into styled HTML pages for dmarketing site."""
import re, os, glob

SRC = r"C:\Users\adria\OneDrive\Dietrichs Marketing\SEO\content_drafts"
DST = r"C:\Users\adria\website-mirrors\dmarketing-redesign\ny-forside\artikkel"

CATEGORIES = {
    'den-gamle-webbyra-modellen-er-dod': 'Kostnader',
    'slik-kutter-du-kostnadene-pa-bedriftens-nye-nettside-2026': 'Kostnader',
    'hva-bor-en-nettside-koste-i-2026-prisguide-for-norske-bedrifter': 'Kostnader',
    'manedlige-byrakostnader-hva-betaler-du-egentlig-for': 'Kostnader',
    'hva-er-best-av-timepris-og-fastpris-nar-jeg-skal-ha-ny-nettside-til-bedriften': 'Kostnader',
    'brukervennlighet-og-hastighet-trumfer-fancy-design': 'Hastighet og ytelse',
    'hva-ser-google-etter-nar-de-rangerer-nettsider-i-2026-og-hvorfor-faller-jeg-i-so': 'Hastighet og ytelse',
    'hvorfor-er-det-viktigere-at-nettsiden-fungerer-pa-mobil-enn-pa-pc-for-norske-bed': 'Hastighet og ytelse',
}

DATE_MAP = {
    '2026-06-20': '20. juni 2026',
    '2026-06-21': '21. juni 2026',
}

def parse_frontmatter(text):
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.DOTALL)
    if not m:
        return {}, text
    fm = {}
    for line in m.group(1).split('\n'):
        k, _, v = line.partition(':')
        fm[k.strip()] = v.strip().strip('"')
    return fm, text[m.end():]

def md_to_html(md):
    lines = md.split('\n')
    html_parts = []
    in_table = False
    in_list = False

    for line in lines:
        stripped = line.strip()

        # Skip empty lines
        if not stripped:
            if in_list:
                html_parts.append('</ul>')
                in_list = False
            if in_table:
                html_parts.append('</tbody></table></div>')
                in_table = False
            continue

        # Table rows
        if stripped.startswith('|'):
            cells = [c.strip() for c in stripped.split('|')[1:-1]]
            if all(set(c) <= set('- ') for c in cells):
                continue  # separator row
            if not in_table:
                in_table = True
                html_parts.append('<div class="article-table"><table><thead><tr>')
                for c in cells:
                    html_parts.append(f'<th>{c}</th>')
                html_parts.append('</tr></thead><tbody>')
                continue
            html_parts.append('<tr>')
            for c in cells:
                html_parts.append(f'<td>{c}</td>')
            html_parts.append('</tr>')
            continue

        if in_table:
            html_parts.append('</tbody></table></div>')
            in_table = False

        # Headers
        if stripped.startswith('## '):
            if in_list:
                html_parts.append('</ul>')
                in_list = False
            html_parts.append(f'<h2>{stripped[3:]}</h2>')
            continue
        if stripped.startswith('### '):
            html_parts.append(f'<h3>{stripped[4:]}</h3>')
            continue
        if stripped.startswith('# '):
            continue  # skip H1 (used as page title)

        # List items
        if stripped.startswith('- ') or stripped.startswith('* '):
            if not in_list:
                in_list = True
                html_parts.append('<ul>')
            html_parts.append(f'<li>{stripped[2:]}</li>')
            continue

        if in_list:
            html_parts.append('</ul>')
            in_list = False

        # Bold/italic inline
        text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', stripped)
        text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)

        html_parts.append(f'<p>{text}</p>')

    if in_list:
        html_parts.append('</ul>')
    if in_table:
        html_parts.append('</tbody></table></div>')

    return '\n      '.join(html_parts)

def build_article_html(fm, body_html, category):
    title = fm.get('title', 'Artikkel')
    desc = fm.get('description', '')
    slug = fm.get('slug', '')
    date_raw = fm.get('date', '')
    date_display = DATE_MAP.get(date_raw, date_raw)

    return f'''<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} | Dietrichs Marketing</title>
  <meta name="description" content="{desc}" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:type" content="article" />
  <meta name="theme-color" content="#1B34FF" />
  <link rel="shortcut icon" href="../assets/favicon.png" type="image/png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Schibsted+Grotesk:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../style.css?v=19" />
  <style>
    .menu-wrap {{ background-color: #ffffff; padding: 16px 0; border-bottom: 1px solid #E4E4E7; position: fixed; top: 0; left: 0; right: 0; z-index: 101; }}
    .menu-wrap.scrolled {{ box-shadow: 0 1px 12px rgba(0,0,0,0.08); }}
    .navbar-2 {{ z-index: 101; justify-content: space-between; align-items: center; width: 90%; max-width: 1440px; height: 50px; margin: 0 auto; display: flex; position: relative; }}
    .logo-link-wrapper {{ flex-direction: column; justify-content: center; align-items: center; display: flex; text-decoration: none; }}
    .brand-3 {{ order: -1; }}
    .logo-text-container {{ order: 0; margin-top: 20px; display: flex; }}
    .heading-6 {{ color: #09090B; letter-spacing: 2px; text-transform: uppercase; margin: 0; font-family: Archivo, sans-serif; font-size: 12px; font-weight: 600; line-height: 12px; }}
    .heading-6.logo-1 {{ margin-left: 10px; font-size: 30px; line-height: 45px; }}
    .heading-6.logo-2 {{ color: transparent; -webkit-text-stroke: 0.5px #09090B; margin: 0 0 0 10px; font-size: 30px; line-height: 45px; }}
    .navigation__menu-btn {{ cursor: pointer; flex-direction: column; order: 1; justify-content: flex-start; align-items: center; height: 25px; overflow: hidden; display: flex; background: transparent; border: 0; padding: 0; outline: none; }}
    .open-wrap {{ align-items: center; height: 25px; display: flex; }}
    .navigation-text {{ color: #09090B; letter-spacing: 3px; text-transform: uppercase; font-family: Archivo, sans-serif; font-size: 12px; line-height: 12px; }}
    .hamburger {{ flex-direction: column; justify-content: space-between; align-items: flex-end; width: 25px; height: 10px; margin-left: 12.5px; display: flex; }}
    .hamburger-line {{ background-color: #09090B; width: 25px; height: 2.22px; }}
    .hamburger-line-4 {{ background-color: #09090B; width: 15px; height: 2.22px; }}
    body.menu-open .menu-wrap {{ background-color: #1a1a1f; border-bottom-color: rgba(255,255,255,0.1); }}
    body.menu-open .heading-6.logo-1 {{ color: whitesmoke; }}
    body.menu-open .heading-6.logo-2 {{ -webkit-text-stroke-color: whitesmoke; }}
    body.menu-open .navigation-text {{ color: #fff; }}
    body.menu-open .hamburger-line, body.menu-open .hamburger-line-4 {{ background-color: #fff; }}
    body.menu-open .close-btn::before, body.menu-open .close-btn::after {{ background: #fff; }}
    .menu-wrap, .heading-6, .navigation-text, .hamburger-line, .hamburger-line-4 {{ transition: background-color 0.25s ease, color 0.25s ease, -webkit-text-stroke-color 0.25s ease, border-color 0.25s ease; }}
    .close-wrap {{ flex-direction: row; justify-content: flex-end; align-items: center; height: 25px; display: flex; }}
    .close-btn {{ width: 18px; height: 18px; margin-left: 12.5px; position: relative; }}
    .close-btn::before, .close-btn::after {{ content: ""; position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: #fff; transform-origin: center; }}
    .close-btn::before {{ transform: translateY(-50%) rotate(45deg); }}
    .close-btn::after {{ transform: translateY(-50%) rotate(-45deg); }}
    .nav-container-2 {{ z-index: 97; background-color: #1a1a1f; flex-direction: column; justify-content: flex-start; align-items: center; min-height: 100vh; padding: 100px 0 80px; position: fixed; inset: 0; overflow-y: auto; transition: opacity 0.35s ease, visibility 0.35s ease; }}
    .nav__bg {{ z-index: -1; background-color: #1a1a1f; position: absolute; inset: 0; }}
    .container-4 {{ width: 92%; max-width: none; margin: 0 auto; }}
    .nav-items {{ z-index: 99; flex-flow: column; align-items: flex-start; width: 100%; max-width: 1200px; margin-top: 40px; display: flex; position: relative; overflow: hidden; }}
    .nav-item {{ align-items: center; text-decoration: none; display: flex; }}
    .nav-item-number {{ color: #fff; letter-spacing: 3px; margin-right: 20px; font-family: Archivo, sans-serif; font-size: 12px; line-height: 12px; transform: rotate(-90deg); }}
    .special-text-wrapper {{ height: clamp(56px, 11vw, 130px); overflow: hidden; }}
    .nav-item-text {{ color: transparent; -webkit-text-fill-color: transparent; -webkit-text-stroke: 0.8px #A5A3A6; text-transform: uppercase; font-family: Archivo, sans-serif; font-size: clamp(38px, 7.5vw, 90px); font-weight: 700; line-height: clamp(56px, 11vw, 130px); display: block; white-space: nowrap; }}
    .nav-item-text-full {{ color: #fff; text-transform: uppercase; font-family: Archivo, sans-serif; font-size: clamp(38px, 7.5vw, 90px); font-weight: 700; line-height: clamp(56px, 11vw, 130px); white-space: nowrap; }}
    .special-text-wrapper > div {{ transition: transform 0.55s cubic-bezier(0.65, 0, 0.35, 1); }}
    .nav-item:hover .nav-item-text, .nav-item:hover .nav-item-text-full {{ transform: translateY(calc(-1 * clamp(56px, 11vw, 130px))); }}
    .nav-container-2.hidden-menu {{ opacity: 0; visibility: hidden; pointer-events: none; }}
    .navigation__menu-btn.is-open .open-wrap {{ display: none; }}
    .navigation__menu-btn:not(.is-open) .close-wrap {{ display: none; }}
    @media screen and (max-width: 767px) {{
      .heading-6.logo-1 {{ font-size: 22px; line-height: 30px; }}
      .heading-6.logo-2 {{ font-size: 22px; line-height: 30px; margin-left: 6px; }}
    }}
    @media screen and (max-width: 479px) {{
      .navbar-2 {{ width: 100%; padding: 0 16px; }}
      .heading-6.logo-1 {{ font-size: 18px; line-height: 28px; margin-left: 0; }}
      .heading-6.logo-2 {{ font-size: 18px; line-height: 28px; margin-left: 5px; }}
    }}

    /* Article page styles */
    .article-hero {{ padding: clamp(130px, 18vh, 190px) 0 clamp(30px, 4vh, 50px); }}
    .article-hero .label {{ margin-bottom: 16px; }}
    .article-hero h1 {{
      font-size: clamp(1.8rem, 4.5vw, 3.2rem); font-weight: 800;
      line-height: 1.12; letter-spacing: -0.02em; max-width: 22ch;
      text-transform: none;
    }}
    .article-meta {{
      display: flex; flex-wrap: wrap; gap: 16px; margin-top: 20px;
      font-size: 0.85rem; color: var(--ink-faint);
    }}
    .article-meta span {{ display: inline-flex; align-items: center; gap: 6px; }}
    .article-body {{
      max-width: 740px; margin: 0 auto;
      padding: 0 var(--pad) clamp(60px, 9vh, 110px);
    }}
    .article-body h2 {{
      font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 700;
      margin: clamp(36px, 5vh, 56px) 0 16px; line-height: 1.2;
      letter-spacing: -0.01em; text-transform: none;
    }}
    .article-body h3 {{
      font-size: 1.2rem; font-weight: 700; margin: 28px 0 10px;
      text-transform: none;
    }}
    .article-body p {{
      margin: 14px 0; color: var(--ink-soft); font-size: 1.05rem; line-height: 1.75;
    }}
    .article-body ul {{
      margin: 14px 0; padding-left: 24px;
      color: var(--ink-soft); font-size: 1.02rem; line-height: 1.75;
    }}
    .article-body li {{ margin: 8px 0; }}
    .article-body strong {{ color: var(--ink); }}
    .article-table {{
      overflow-x: auto; margin: 24px 0; border-radius: var(--r-md);
      border: 1px solid var(--line);
    }}
    .article-table table {{ width: 100%; border-collapse: collapse; font-size: 0.92rem; }}
    .article-table th {{
      text-align: left; padding: 12px 16px; background: var(--paper-2);
      font-weight: 700; font-size: 0.82rem; text-transform: uppercase;
      letter-spacing: 0.04em; border-bottom: 1px solid var(--line);
    }}
    .article-table td {{ padding: 12px 16px; border-bottom: 1px solid var(--line); color: var(--ink-soft); }}
    .article-table tr:last-child td {{ border-bottom: none; }}
    .article-cta {{
      max-width: 740px; margin: 0 auto clamp(40px, 6vh, 70px);
      padding: clamp(28px, 4vw, 44px); background: var(--cobalt-050);
      border: 1px solid #d7dcff; border-radius: var(--r-lg); text-align: center;
    }}
    .article-cta h3 {{
      font-size: clamp(1.3rem, 2.5vw, 1.7rem); font-weight: 800;
      text-transform: none; letter-spacing: -0.02em;
    }}
    .article-cta p {{ margin: 12px 0 22px; color: var(--ink-soft); font-size: 0.96rem; }}
    .back-link {{
      display: inline-flex; align-items: center; gap: 8px;
      font-weight: 600; font-size: 0.88rem; color: var(--cobalt);
      margin-bottom: 20px;
    }}
    .back-link svg {{ width: 16px; height: 16px; transform: rotate(180deg); }}
  </style>
</head>
<body>

  <!-- NAV -->
  <section class="menu-wrap" id="nav">
    <div class="navbar-2">
      <a href="../index.html" class="logo-link-wrapper brand-3">
        <div class="logo-text-container">
          <div class="heading-6 logo-1">Dietrichs</div>
          <div class="heading-6 logo-2">marketing</div>
        </div>
      </a>
      <button type="button" id="menu-btn" class="navigation__menu-btn" aria-label="Apne meny">
        <div class="open-wrap">
          <div class="navigation-text">Meny</div>
          <div class="hamburger"><div class="hamburger-line"></div><div class="hamburger-line-4"></div></div>
        </div>
        <div class="close-wrap">
          <div class="navigation-text">Lukk</div>
          <div class="close-btn"></div>
        </div>
      </button>
    </div>
  </section>

  <div id="menu-overlay" class="nav-container-2 hidden-menu">
    <div class="nav__bg"></div>
    <div class="container-4">
      <div class="nav-items">
        <a href="../index.html" class="nav-item"><div class="nav-item-number">01</div><div class="special-text-wrapper"><div class="nav-item-text">Forside</div><div class="nav-item-text-full">Forside</div></div></a>
        <a href="../ai-nettsider.html" class="nav-item"><div class="nav-item-number">02</div><div class="special-text-wrapper"><div class="nav-item-text">AI-nettsider</div><div class="nav-item-text-full">AI-nettsider</div></div></a>
        <a href="../maler/" class="nav-item"><div class="nav-item-number">03</div><div class="special-text-wrapper"><div class="nav-item-text">Maler</div><div class="nav-item-text-full">Maler</div></div></a>
        <a href="../artikler.html" class="nav-item"><div class="nav-item-number">04</div><div class="special-text-wrapper"><div class="nav-item-text">Artikler</div><div class="nav-item-text-full">Artikler</div></div></a>
        <a href="../kontakt.html" class="nav-item"><div class="nav-item-number">05</div><div class="special-text-wrapper"><div class="nav-item-text">Kontakt</div><div class="nav-item-text-full">Kontakt</div></div></a>
      </div>
    </div>
  </div>

  <!-- ARTICLE -->
  <section class="article-hero">
    <div class="wrap">
      <a href="../artikler.html" class="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        Alle artikler
      </a>
      <span class="label"><span class="num">{category}</span></span>
      <h1>{title}</h1>
      <div class="article-meta">
        <span>{date_display}</span>
        <span>Dietrichs Marketing</span>
      </div>
    </div>
  </section>

  <article class="article-body">
      {body_html}
  </article>

  <div class="wrap">
    <div class="article-cta">
      <h3>Trenger du en ny nettside?</h3>
      <p>Vi bygger lynraske AI-nettsider du eier og oppdaterer selv. Null faste byrakostnader.</p>
      <a class="btn btn-primary" href="../index.html#priser">Se priser
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </a>
    </div>
  </div>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="wrap">
      <div class="f-top">
        <div>
          <a href="../index.html" class="brand"><b>Dietrichs</b><span>marketing</span></a>
          <p class="f-tag">AI-nettsider for norske bedrifter. Du eier alt, oppdaterer selv, og slipper faste byrakostnader.</p>
        </div>
        <div class="f-links">
          <div class="f-col">
            <h5>Nettsiden</h5>
            <a href="../index.html#hvordan">Hvordan funker det</a>
            <a href="../index.html#maler">Maler</a>
            <a href="../index.html#priser">Priser</a>
            <a href="../artikler.html">Artikler</a>
          </div>
          <div class="f-col">
            <h5>Kom i gang</h5>
            <a href="../ai-nettsider.html#demo-video">Se demo-video</a>
            <a href="../kontakt.html">Ta kontakt</a>
          </div>
        </div>
      </div>
      <div class="f-bottom">
        <div>&copy; 2026 Dietrichs Marketing</div>
        <div>Org.nr 932 612 583</div>
      </div>
    </div>
  </footer>

  <script>
  (function () {{
    var btn = document.getElementById('menu-btn');
    var overlay = document.getElementById('menu-overlay');
    if (!btn || !overlay) return;
    function setOpen(open) {{
      overlay.classList.toggle('hidden-menu', !open);
      btn.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }}
    btn.addEventListener('click', function () {{ setOpen(overlay.classList.contains('hidden-menu')); }});
    overlay.querySelectorAll('a').forEach(function (a) {{ a.addEventListener('click', function () {{ setOpen(false); }}); }});
    document.addEventListener('keydown', function (e) {{ if (e.key === 'Escape') setOpen(false); }});
  }})();
  window.addEventListener('scroll', function() {{
    var nav = document.getElementById('nav');
    if (window.scrollY > 10) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }}, {{ passive: true }});
  </script>
</body>
</html>'''

os.makedirs(DST, exist_ok=True)
count = 0

for path in sorted(glob.glob(os.path.join(SRC, '*.md'))):
    with open(path, encoding='utf-8') as f:
        raw = f.read()

    fm, body = parse_frontmatter(raw)
    slug = fm.get('slug', os.path.splitext(os.path.basename(path))[0])
    category = CATEGORIES.get(slug, 'Innsikt')
    body_html = md_to_html(body)
    html = build_article_html(fm, body_html, category)

    out = os.path.join(DST, f'{slug}.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    count += 1
    print(f'  {slug}.html')

print(f'\nGenerated {count} article pages in {DST}')
