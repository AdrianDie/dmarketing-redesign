/* kurs-track.js — spor-velger (Gratis / Claude Code) */
(function () {
  var TRACK_KEY = 'kurs_track';
  var SEEN_KEY  = 'kurs_track_seen';

  var css = `
    .track-toggle {
      background: #fff;
      border: 1.5px solid #E4E4E7;
      border-radius: 16px;
      padding: 20px 24px;
      margin: 0 0 2rem 0;
    }
    .track-toggle__intro {
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #71717A;
      margin-bottom: 14px;
    }
    .track-toggle__buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    @media (max-width: 480px) {
      .track-toggle__buttons { grid-template-columns: 1fr; }
    }
    .track-btn {
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
    .track-btn:hover { border-color: #A1A1AA; background: #fff; }
    .track-btn__name {
      font-family: 'Archivo', sans-serif;
      font-weight: 700;
      font-size: 0.975rem;
      color: #09090B;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .track-btn__sub {
      font-size: 0.8125rem;
      color: #71717A;
      line-height: 1.4;
    }
    /* Aktiv: Gratis */
    .track-btn--active[data-track="gratis"] {
      border-color: #D97706;
      background: #FFFBEB;
    }
    .track-btn--active[data-track="gratis"] .track-btn__name { color: #92400E; }
    .track-btn--active[data-track="gratis"] .track-btn__sub  { color: #B45309; }
    /* Aktiv: Claude Code */
    .track-btn--active[data-track="kode"] {
      border-color: #2563EB;
      background: #EFF6FF;
    }
    .track-btn--active[data-track="kode"] .track-btn__name { color: #1E40AF; }
    .track-btn--active[data-track="kode"] .track-btn__sub  { color: #3B82F6; }

    /* Spor-blokker */
    .spor-block {
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1.25rem 0;
    }
    .spor-block--gratis {
      background: #FFFBEB;
      border: 1.5px solid #FDE68A;
    }
    .spor-block--kode {
      background: #EFF6FF;
      border: 1.5px solid #BFDBFE;
    }
    .spor-label {
      font-family: 'Archivo', sans-serif;
      font-weight: 700;
      font-size: 0.75rem;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .spor-block--gratis .spor-label { color: #92400E; }
    .spor-block--kode   .spor-label { color: #1E40AF; }

    /* Første-gang-forklaring */
    .track-firsttime {
      background: #F0FDF4;
      border: 1.5px solid #86EFAC;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 12px;
      font-size: 0.9rem;
      color: #14532D;
      line-height: 1.55;
    }
    .track-firsttime strong { color: #14532D; }

    /* Live Server details-boks */
    .live-server-box {
      border: 1.5px solid #E4E4E7;
      border-radius: 10px;
      margin: 1rem 0;
      overflow: hidden;
    }
    .live-server-box summary {
      padding: 12px 16px;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #3F3F46;
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #F4F4F5;
      user-select: none;
    }
    .live-server-box summary::-webkit-details-marker { display: none; }
    .live-server-box summary::before {
      content: '▶';
      font-size: 0.65rem;
      color: #71717A;
      transition: transform 0.15s;
    }
    .live-server-box[open] summary::before { transform: rotate(90deg); }
    .live-server-box__body {
      padding: 16px;
      font-size: 0.9375rem;
      line-height: 1.65;
      color: #3F3F46;
    }
    .live-server-box__body ol { padding-left: 1.25rem; margin: 0.5rem 0; }
    .live-server-box__body li { margin-bottom: 0.4rem; }
    .live-server-box__body code {
      background: #F4F4F5;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.875em;
    }
  `;

  /* Inject CSS */
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function getTrack() {
    return localStorage.getItem(TRACK_KEY) || 'gratis';
  }

  function applyTrack(t) {
    document.querySelectorAll('.spor-gratis').forEach(function (el) {
      el.style.display = (t === 'gratis') ? '' : 'none';
    });
    document.querySelectorAll('.spor-kode').forEach(function (el) {
      el.style.display = (t === 'kode') ? '' : 'none';
    });
    document.querySelectorAll('.track-btn').forEach(function (btn) {
      btn.classList.toggle('track-btn--active', btn.dataset.track === t);
    });
  }

  window.setTrack = function (t) {
    localStorage.setItem(TRACK_KEY, t);
    localStorage.setItem(SEEN_KEY, '1');
    var note = document.getElementById('track-first-time');
    if (note) note.style.display = 'none';
    applyTrack(t);
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyTrack(getTrack());
    var note = document.getElementById('track-first-time');
    if (note && !localStorage.getItem(SEEN_KEY)) {
      note.style.display = '';
    }
  });
})();
