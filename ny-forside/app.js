/* Dietrichs Marketing — forside-interaksjoner
   GSAP scroll-reveals, parallax, nav, mobilmeny, tellere. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Preloader (akkurat samme som ai-nettsider) ---------- */
  window.addEventListener('load', function () {
    var pre = document.getElementById('preloader');
    if (!pre) return;
    requestAnimationFrame(function () {
      setTimeout(function () { pre.classList.add('is-done'); }, 50);
    });
    setTimeout(function () { pre.style.display = 'none'; }, 2200);
  });

  /* ---------- NAV: skygge/blur ved scroll ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Fullskjerm-meny ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var overlay = document.getElementById('menuOverlay');
  if (menuBtn && overlay) {
    function setMenu(open) {
      document.body.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Lukk meny' : 'Åpne meny');
      overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
    }
    menuBtn.addEventListener('click', function () {
      setMenu(!document.body.classList.contains('menu-open'));
    });
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
    });
  }

  /* ---------- Kontaktskjema: Supabase-fetch + inline suksessmelding ---------- */
  (function () {
    var form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var btn = document.getElementById('contactSubmit');
      var errEl = document.getElementById('contactError');
      var successEl = document.getElementById('contactSuccess');
      var val = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };

      var epost = val('Epost');
      if (!epost) {
        if (errEl) { errEl.textContent = 'Epostadresse er påkrevd.'; errEl.style.display = ''; }
        return;
      }
      if (errEl) errEl.style.display = 'none';

      if (btn) { btn.disabled = true; btn.textContent = 'Sender…'; }

      var payload = {
        navn: val('Navn'), bedrift: val('Bedrift'), epost: epost,
        telefon: val('Telefon'), nettside: val('Nettside'), melding: val('Melding'),
        type: 'kontaktskjema', status: 'ny', kilde: 'kontakt.html'
      };

      var sb = window.DM_SUPABASE;
      var sendPromise = (sb && sb.url && sb.anonKey)
        ? fetch(sb.url.replace(/\/+$/, '') + '/rest/v1/' + (sb.table || 'leads'), {
            method: 'POST',
            headers: {
              'apikey': sb.anonKey,
              'Authorization': 'Bearer ' + sb.anonKey,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(payload)
          })
        : Promise.resolve({ ok: true });

      sendPromise.then(function (res) {
        if (res.ok || res.status === 201) {
          form.style.display = 'none';
          if (successEl) successEl.style.display = '';
        } else {
          throw new Error('status ' + res.status);
        }
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Send melding <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>'; }
        if (errEl) { errEl.textContent = 'Noe gikk galt. Prøv igjen eller send en e-post til post@dmarketing.no.'; errEl.style.display = ''; }
      });
    });
  })();

  /* ---------- Redusert bevegelse: vis alt, hopp over animasjon ---------- */
  if (reduce || typeof gsap === 'undefined') {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('revealed'); });
    runCounters(true);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Scroll-reveals (myk fade + y) ---------- */
  document.querySelectorAll('.reveal').forEach(function (el) {
    gsap.fromTo(el,
      { opacity: 0, y: 26 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onStart: function () { el.classList.add('revealed'); }
      }
    );
  });

  /* ---------- Stagger der flere kort står på rad ---------- */
  ['.steps', '.freedoms', '.mal-grid', '.price-grid', '.team-grid', '.stats-grid'].forEach(function (sel) {
    var group = document.querySelector(sel);
    if (!group) return;
    var kids = group.children;
    gsap.fromTo(kids,
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: group, start: 'top 82%', once: true }
      }
    );
  });

  /* ---------- Parallax på dekor-former ---------- */
  document.querySelectorAll('[data-parallax]').forEach(function (el) {
    var amt = parseFloat(el.getAttribute('data-parallax')) || 0.2;
    gsap.to(el, {
      yPercent: amt * 100,
      ease: 'none',
      scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- Tellere ---------- */
  runCounters(false);

  function runCounters(instant) {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (isNaN(target)) return;
      if (instant || typeof gsap === 'undefined') { el.textContent = format(target) + suffix; return; }
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: function () { el.textContent = format(obj.v) + suffix; },
        onComplete: function () { el.textContent = format(target) + suffix; }
      });
    });
  }
  function format(n) { return Math.round(n).toString(); }
})();
