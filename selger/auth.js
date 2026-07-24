(function () {
  // ============================================================
  //  Selgerportal-autentisering, samme moenster som kurset
  // ============================================================

  var TOKEN_KEY = 'selger_auth_v1';
  var SESSION_MS = 12 * 60 * 60 * 1000; // 12 timer, en selger jobber gjennom dagen

  // ?demo=1 lar Adrian se flatene med paafunne tall foer worker-en staar.
  // Ingen ekte data naas i denne modusen, api.js svarer lokalt.
  if (/[?&]demo=1/.test(location.search)) {
    window.SELGER = { epost: 'demo@dmarketing.no', navn: 'Demo', token: 'demo', demo: true };
    document.addEventListener('DOMContentLoaded', function () {
      var info = document.getElementById('selger-user-info');
      if (info) info.textContent = 'Demovisning';
    });
    return;
  }

  document.documentElement.style.visibility = 'hidden';

  var session = null;
  try {
    session = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
  } catch (e) {}

  // tokenet lages av Adrian i Selgere-fanen, saa formatet er friere enn kursets
  var gyldigToken = session && typeof session.token === 'string' &&
                    session.token.length >= 20;
  var utloept = !session || !session.loginAt ||
                (Date.now() - session.loginAt > SESSION_MS);

  if (!gyldigToken || !session.epost || utloept) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.replace('/selger/login/');
    return;
  }

  document.documentElement.style.visibility = '';

  // gjoeres tilgjengelig for api.js og sidene
  window.SELGER = {
    epost: session.epost,
    navn: session.navn || session.epost.split('@')[0],
    token: session.token
  };

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var info = document.getElementById('selger-user-info');
    if (info) {
      info.innerHTML = escHtml(window.SELGER.navn) +
        '  &middot;  <button onclick="selgerLogout()" ' +
        'style="text-decoration:underline;cursor:pointer;background:none;border:none;' +
        'color:inherit;font:inherit;padding:0;">Logg ut</button>';
    }
  });

  window.selgerLogout = function () {
    localStorage.removeItem(TOKEN_KEY);
    window.location.replace('/selger/login/');
  };
})();
