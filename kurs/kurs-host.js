/* kurs-host.js — løsning-velger (GitHub Pages / Cloudflare Pages) */
(function () {
  var HOST_KEY = 'kurs_host';

  var css = `
    .host-toggle {
      background: #fff;
      border: 1.5px solid #E4E4E7;
      border-radius: 16px;
      padding: 20px 24px;
      margin: 1.5rem 0 2rem;
    }
    .host-toggle__intro {
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #71717A;
      margin-bottom: 14px;
    }
    .host-toggle__buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    @media (max-width: 480px) {
      .host-toggle__buttons { grid-template-columns: 1fr; }
    }
    .host-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 3px;
      padding: 14px 18px;
      border-radius: 12px;
      border: 2px solid #E4E4E7;
      background: #FAFAFA;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
    }
    .host-btn:hover { border-color: #A1A1AA; background: #fff; }
    .host-btn__name {
      font-family: 'Archivo', sans-serif;
      font-weight: 700;
      font-size: 0.975rem;
      color: #09090B;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .host-btn__sub {
      font-size: 0.8125rem;
      color: #71717A;
      line-height: 1.4;
    }
    /* Aktiv: GitHub Pages */
    .host-btn--active[data-host="github"] {
      border-color: #18181B;
      background: #F4F4F5;
    }
    .host-btn--active[data-host="github"] .host-btn__name { color: #09090B; }
    .host-btn--active[data-host="github"] .host-btn__sub  { color: #52525B; }
    /* Aktiv: Cloudflare Pages */
    .host-btn--active[data-host="cloudflare"] {
      border-color: #F38020;
      background: #FFF7ED;
    }
    .host-btn--active[data-host="cloudflare"] .host-btn__name { color: #9A3412; }
    .host-btn--active[data-host="cloudflare"] .host-btn__sub  { color: #C2410C; }

    /* Cloudflare-innhold skjult som utgangspunkt (vises når valgt / av JS) */
    .host-cloudflare { display: none; }
  `;

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function getHost() {
    return localStorage.getItem(HOST_KEY) || 'github';
  }

  function applyHost(h) {
    document.querySelectorAll('.host-github').forEach(function (el) {
      el.style.display = (h === 'github') ? 'block' : 'none';
    });
    document.querySelectorAll('.host-cloudflare').forEach(function (el) {
      el.style.display = (h === 'cloudflare') ? 'block' : 'none';
    });
    document.querySelectorAll('.host-btn').forEach(function (btn) {
      btn.classList.toggle('host-btn--active', btn.dataset.host === h);
    });
  }

  window.setHost = function (h) {
    localStorage.setItem(HOST_KEY, h);
    applyHost(h);
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyHost(getHost());
  });
})();
