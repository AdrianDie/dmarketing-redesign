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

  /* ── Module pages ─────────────────────────────────────────── */
  function initModulePage() {
    var moduleId = getModuleId();
    if (!moduleId || moduleId === 'index') return;

    var nav = document.querySelector('nav.border-t');
    if (!nav) return;

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align:center;padding:14px 24px;background:#FAFAFA;border-top:1px solid #F4F4F5;';

    var btn = document.createElement('button');
    btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;font-size:13px;font-family:Inter,sans-serif;font-weight:600;padding:8px 18px;border-radius:8px;border:1.5px solid;cursor:pointer;transition:all 0.15s;';

    function render() {
      var done = getCompleted().indexOf(moduleId) !== -1;
      if (done) {
        btn.innerHTML = checkSVG('currentColor') + ' Fullført!';
        btn.style.cssText += 'background:#F0FDF4;border-color:#86EFAC;color:#15803D;';
        btn.title = 'Klikk for å fjerne fullført-markering';
      } else {
        btn.innerHTML = circleSVG() + ' Marker modul som fullført';
        btn.style.background = 'white';
        btn.style.borderColor = '#E4E4E7';
        btn.style.color = '#71717A';
        btn.title = '';
      }
    }

    btn.onclick = function () { toggleComplete(moduleId); render(); };
    render();
    wrapper.appendChild(btn);
    nav.parentNode.insertBefore(wrapper, nav);
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

    /* progress bar + count */
    var total = cards.length;
    var done = completed.filter(function (id) {
      return !!document.querySelector('a.module-card[href="' + id + '"]');
    }).length;

    if (total === 0) return;
    var pct = Math.round(done / total * 100);

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
      container.insertBefore(bar, ordlisteBanner);
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
