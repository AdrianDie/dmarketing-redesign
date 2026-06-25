/* Dietrichs Marketing — forside-interaksjoner
   GSAP scroll-reveals, parallax, nav, mobilmeny, tellere. */
(function () {
  'use strict';

  /* ---------- DEBUG LOGGING (fjern etter feilsøking) ---------- */
  var _t0 = performance.now();
  function _log(msg) {
    console.log('[DM ' + (performance.now() - _t0).toFixed(1) + 'ms] ' + msg);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasPreloader = !document.documentElement.classList.contains('no-preloader');
  var pre = document.getElementById('preloader');

  _log('init — preloader=' + !!pre + ', hasPreloader=' + hasPreloader + ', reduce=' + reduce);

  /* ---------- Hero-reveals (ren CSS, ingen GSAP) ---------- */
  function revealHero() {
    _log('revealHero()');
    document.querySelectorAll('.reveal-hero').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  if (!hasPreloader || !pre) {
    _log('no preloader — revealing hero immediately');
    revealHero();
  }

  /* ---------- Preloader ---------- */
  if (pre && hasPreloader) {
    var fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    var pageLoaded = new Promise(function (resolve) {
      if (document.readyState === 'complete') { resolve(); }
      else { window.addEventListener('load', resolve); }
    });

    Promise.all([fontsReady, pageLoaded]).then(function () {
      _log('fonts + page loaded — dismissing preloader');

      requestAnimationFrame(function () {
        pre.classList.add('is-done');
        _log('preloader is-done added');

        // Reveal hero when preloader starts sliding open (1.1s CSS delay)
        setTimeout(function () {
          _log('preloader slide started — revealing hero');
          revealHero();
        }, 1050);

        // Remove preloader from DOM after animation completes
        setTimeout(function () {
          pre.style.display = 'none';
          _log('preloader hidden');
        }, 2000);
      });
    });
  }

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
  }

  /* ---------- Lead -> Supabase (config-styrt, ikke-blokkerende) ---------- */
  (function () {
    var form = document.querySelector('.contact-form');
    var sb = window.DM_SUPABASE;
    if (!form || !sb || !sb.url || !sb.anonKey) return;
    form.addEventListener('submit', function () {
      try {
        var val = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
        var payload = {
          navn: val('Navn'), bedrift: val('Bedrift'), epost: val('Epost'),
          telefon: val('Telefon'), nettside: val('Nettside'), melding: val('Melding'),
          type: 'ai-nettsider', status: 'ny', kilde: 'kontaktskjema'
        };
        fetch(sb.url.replace(/\/+$/, '') + '/rest/v1/' + (sb.table || 'leads'), {
          method: 'POST', keepalive: true,
          headers: {
            'apikey': sb.anonKey,
            'Authorization': 'Bearer ' + sb.anonKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload)
        }).catch(function () {});
      } catch (e) {}
    });
  })();

  /* ---------- Redusert bevegelse: vis alt, hopp over animasjon ---------- */
  if (reduce || typeof gsap === 'undefined') {
    _log('reduced motion or no GSAP — skipping animations');
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('revealed'); });
    revealHero();
    runCounters(true);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Scroll-reveals (myk fade + y) — kun below-fold ---------- */
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
