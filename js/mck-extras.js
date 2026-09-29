/* mck-extras.js - McKinsey-inspirerte tillegg: flytende kontakt-sirkel og CTA-bånd på forsiden. Ingen ny funksjonalitet, kun lenker til eksisterende kontaktside. */
(function () {
  var en = location.pathname.indexOf('/en/') === 0 || location.pathname === '/en';
  var contact = en ? '/en/contact/' : '/kontakt/';
  var label = en ? 'Get in touch' : 'Ta kontakt';
  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
  var chatIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>';

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    if (!document.querySelector('.mck-chip') && location.pathname.indexOf(contact) !== 0) {
      var a = document.createElement('a');
      a.className = 'mck-chip';
      a.href = contact;
      a.setAttribute('aria-label', label);
      a.innerHTML = chatIcon + '<span class="mck-chip-label">' + label + '</span>';
      document.body.appendChild(a);
    }
    var path = location.pathname.replace(/index\.html$/, '');
    var isHome = path === '/' || path === '/en/';
    var footer = document.querySelector('footer.dmc-footer-rich, .dmc-footer-rich');
    if (isHome && footer && !document.querySelector('.mck-cta')) {
      var s = document.createElement('section');
      s.className = 'mck-cta';
      s.innerHTML = '<div class="mck-cta-inner"><div><div class="mck-cta-kicker">' +
        (en ? 'Next step' : 'Neste steg') + '</div><h2>' +
        (en ? 'Ready to make your business more profitable?' : 'Klar for å gjøre bedriften mer lønnsom?') +
        '</h2></div><a class="mck-cta-btn" href="' + contact + '" aria-label="' + label + '">' + arrow + '</a></div>';
      footer.parentNode.insertBefore(s, footer);
    }
  });
})();
