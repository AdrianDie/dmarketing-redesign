(function () {
  'use strict';
  var STORAGE_KEY = 'kurs_completed_v1';

  function getCompleted() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function saveCompleted(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function toggleComplete(id) {
    var arr = getCompleted();
    var idx = arr.indexOf(id);
    if (idx === -1) arr.push(id);
    else arr.splice(idx, 1);
    saveCompleted(arr);
    return arr.indexOf(id) !== -1;
  }

  function getModuleId() {
    var seg = window.location.pathname.split('/').filter(Boolean).pop() || '';
    return seg.replace('.html', '');
  }

  /* ── Read-time lookup ────────────────────────────────────── */
  var READ_TIMES = {
    '01-velkommen': '4 min', '02-hvordan-fungerer-det': '8 min',
    '03-overgangen': '6 min', '04-komme-i-gang': '8 min',
    '05-oppdatere-innhold': '6 min', '06-bytte-bilder': '7 min',
    '07-ny-side': '8 min', '08-seo': '7 min',
    '09-prompts': '6 min', '10-publisere': '5 min',
    '11-feilsoking': '7 min', '12-integrasjoner': '8 min',
    '13-eierskap': '5 min'
  };

  /* ── Module pages ─────────────────────────────────────────── */
  function initModulePage() {
    var moduleId = getModuleId();
    if (!moduleId || moduleId === 'index') return;

    /* Read time in breadcrumb */
    var readTime = READ_TIMES[moduleId];
    if (readTime) {
      var breadcrumb = document.querySelector('header .flex.items-center.gap-3');
      if (breadcrumb) {
        var rtSpan = document.createElement('span');
        rtSpan.style.cssText = 'margin-left:auto;display:inline-flex;align-items:center;gap:4px;' +
          'font-size:11px;color:#71717A;font-family:Inter,sans-serif;';
        rtSpan.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' + readTime;
        breadcrumb.appendChild(rtSpan);
      }
    }

    /* "Already completed" banner at top of content */
    if (getCompleted().indexOf(moduleId) !== -1) {
      var contentDiv = document.querySelector('article .max-w-3xl');
      if (contentDiv) {
        var banner = document.createElement('div');
        banner.style.cssText = 'display:inline-flex;align-items:center;gap:8px;background:#F0FDF4;' +
          'border:1px solid #86EFAC;border-radius:8px;padding:8px 14px;margin-bottom:24px;' +
          'font-family:Inter,sans-serif;font-size:13px;font-weight:600;color:#15803D;';
        banner.innerHTML = checkSVG('#16A34A') + ' Du har fullført denne modulen';
        contentDiv.insertBefore(banner, contentDiv.firstChild);
      }
    }

    var nav = document.querySelector('nav.border-t');
    if (!nav) return;

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align:center;padding:14px 24px;background:#FAFAFA;border-top:1px solid #F4F4F5;';

    var BTN_BASE = 'display:inline-flex;align-items:center;gap:6px;font-size:13px;font-family:Inter,sans-serif;font-weight:600;padding:8px 18px;border-radius:8px;border:1.5px solid;cursor:pointer;transition:all 0.15s;';

    var btn = document.createElement('button');

    function render() {
      var done = getCompleted().indexOf(moduleId) !== -1;
      if (done) {
        btn.innerHTML = checkSVG('currentColor') + ' Fullført!';
        btn.style.cssText = BTN_BASE + 'background:#F0FDF4;border-color:#86EFAC;color:#15803D;';
        btn.title = 'Klikk for å fjerne fullført-markering';
      } else {
        btn.innerHTML = circleSVG() + ' Marker modul som fullført';
        btn.style.cssText = BTN_BASE + 'background:white;border-color:#E4E4E7;color:#71717A;';
        btn.title = '';
      }
    }

    btn.onclick = function () {
      var nowDone = toggleComplete(moduleId);
      render();
      if (nowDone) showToast('✓ Modul fullført! Bra jobba.');
    };
    render();

    var refLink = document.createElement('a');
    refLink.href = '/kurs/hurtigreferanse';
    refLink.textContent = 'Prompt-hurtigreferanse →';
    refLink.style.cssText = 'font-size:12px;font-family:Inter,sans-serif;font-weight:500;' +
      'color:#7C3AED;text-decoration:none;margin-left:16px;';
    refLink.onmouseover = function () { refLink.style.textDecoration = 'underline'; };
    refLink.onmouseout  = function () { refLink.style.textDecoration = 'none'; };

    var checkLink = document.createElement('a');
    checkLink.href = '/kurs/sjekkliste';
    checkLink.textContent = 'Sjekkliste →';
    checkLink.style.cssText = 'font-size:12px;font-family:Inter,sans-serif;font-weight:500;' +
      'color:#16A34A;text-decoration:none;margin-left:14px;';
    checkLink.onmouseover = function () { checkLink.style.textDecoration = 'underline'; };
    checkLink.onmouseout  = function () { checkLink.style.textDecoration = 'none'; };

    wrapper.appendChild(btn);
    wrapper.appendChild(refLink);
    wrapper.appendChild(checkLink);
    nav.parentNode.insertBefore(wrapper, nav);
  }

  /* ── Toast notification ───────────────────────────────────── */
  function showToast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);' +
      'background:#09090B;color:#fff;font-family:Inter,sans-serif;font-size:13px;font-weight:600;' +
      'padding:10px 20px;border-radius:10px;opacity:0;transition:opacity 0.25s,transform 0.25s;' +
      'pointer-events:none;z-index:9999;white-space:nowrap;';
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(function () {
        t.style.opacity = '0';
        t.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(function () { t.parentNode && t.parentNode.removeChild(t); }, 300);
      }, 2200);
    });
  }

  /* ── Index page ───────────────────────────────────────────── */
  function initIndexPage() {
    var cards = document.querySelectorAll('a.module-card');
    if (!cards.length) return;

    var completed = getCompleted();

    /* checkmarks on each card */
    cards.forEach(function (card) {
      var href = (card.getAttribute('href') || '').split('/').pop().replace('.html', '');
      if (completed.indexOf(href) !== -1) {
        var badge = document.createElement('span');
        badge.setAttribute('aria-label', 'Fullført');
        badge.style.cssText = 'position:absolute;top:12px;right:12px;width:22px;height:22px;background:#16A34A;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
        badge.innerHTML = checkSVG('white');
        card.style.position = 'relative';
        card.appendChild(badge);
      }
    });

    /* highlight first uncompleted card as "next up" */
    var firstIncomplete = null;
    cards.forEach(function (card) {
      var href = (card.getAttribute('href') || '').split('/').pop().replace('.html', '');
      if (!firstIncomplete && completed.indexOf(href) === -1) firstIncomplete = card;
    });
    if (firstIncomplete && completed.length > 0) {
      firstIncomplete.style.outline = '2.5px solid #2563EB';
      firstIncomplete.style.outlineOffset = '2px';
      var nextBadge = document.createElement('span');
      nextBadge.textContent = 'Fortsett her';
      nextBadge.style.cssText = 'position:absolute;top:10px;left:12px;background:#2563EB;color:white;' +
        'font-family:Inter,sans-serif;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;' +
        'text-transform:uppercase;letter-spacing:0.05em;';
      firstIncomplete.style.position = 'relative';
      firstIncomplete.appendChild(nextBadge);
    }

    /* progress bar + count */
    var total = cards.length;
    var done = completed.filter(function (id) {
      return !!document.querySelector('a.module-card[href="' + id + '"]');
    }).length;

    if (total === 0) return;
    var pct = Math.round(done / total * 100);

    /* 🎉 Course completion banner */
    if (done === total) {
      var hero = document.querySelector('header');
      if (hero) {
        var celebration = document.createElement('div');
        celebration.style.cssText = 'background:linear-gradient(135deg,#1D4ED8 0%,#16A34A 100%);' +
          'color:white;text-align:center;padding:20px 24px;';
        celebration.innerHTML =
          '<p style="font-family:Archivo,sans-serif;font-size:1.1rem;font-weight:800;margin:0 0 4px;">' +
          '🎉 Gratulerer — du har fullført alle 13 moduler!</p>' +
          '<p style="font-size:13px;opacity:0.85;margin:0 0 12px;font-family:Inter,sans-serif;">' +
          'Du kan nå oppdatere, bygge og drifte nettsiden din helt på egenhånd.</p>' +
          '<a href="/kurs/sjekkliste" style="display:inline-flex;align-items:center;gap:6px;background:white;color:#15803D;' +
          'font-family:Inter,sans-serif;font-size:13px;font-weight:700;padding:8px 18px;border-radius:8px;text-decoration:none;">' +
          '<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' +
          'Bruk lanserings-sjekklisten →</a>';
        hero.parentNode.insertBefore(celebration, hero);
      }
    }

    var bar = document.createElement('div');
    bar.innerHTML =
      '<p style="font-size:13px;font-family:Inter,sans-serif;color:#52525B;margin:0 0 8px;">' +
      '<strong style="color:#09090B;">' + done + ' av ' + total + ' moduler fullført</strong>' +
      ' <span style="color:#94A3B8;">(' + pct + '%)</span></p>' +
      '<div style="height:6px;background:#E4E4E7;border-radius:3px;overflow:hidden;max-width:320px;margin:0 auto;">' +
      '<div style="height:100%;width:' + pct + '%;background:#2563EB;border-radius:3px;transition:width 0.5s;"></div>' +
      '</div>';
    bar.style.cssText = 'text-align:center;margin-bottom:24px;';

    var container = document.querySelector('section .max-w-5xl');
    var ordlisteBanner = container && container.querySelector('a[href="ordliste"]');
    if (ordlisteBanner) {
      /* Walk up until we find a direct child of container */
      var insertBefore = ordlisteBanner;
      while (insertBefore && insertBefore.parentNode !== container) {
        insertBefore = insertBefore.parentNode;
      }
      if (insertBefore) container.insertBefore(bar, insertBefore);
    }
  }

  /* ── SVG helpers ──────────────────────────────────────────── */
  function checkSVG(color) {
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
  }
  function circleSVG() {
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
  }

  /* ── Keyboard nav (module pages only) ────────────────────── */
  function initKeyboardNav() {
    if (document.querySelector('a.module-card')) return; // skip index
    var nav = document.querySelector('nav.border-t .max-w-3xl');
    if (!nav) return;
    var links = nav.querySelectorAll('a');
    var prev = links[0] || null;
    var next = links[links.length - 1] || null;
    document.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowLeft' && prev) prev.click();
      if (e.key === 'ArrowRight' && next && next !== prev) next.click();
    });
  }

  /* ── Boot ─────────────────────────────────────────────────── */
  function init() {
    if (document.querySelector('a.module-card')) {
      initIndexPage();
    } else {
      initModulePage();
      initKeyboardNav();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
