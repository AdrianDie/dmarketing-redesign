(function () {
  // ============================================================
  //  Kurs-autentisering v3 — per-bruker (email + PBKDF2)
  // ============================================================

  var TOKEN_KEY   = 'kurs_auth_v3';
  var VALID_TOKEN = 'kurs_authed_2026';

  // Skjul siden umiddelbart
  document.documentElement.style.visibility = 'hidden';

  var session = null;
  try {
    session = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
  } catch(e) {}

  if (!session || session.token !== VALID_TOKEN || !session.email) {
    window.location.replace('/kurs/login.html');
    return;
  }

  // Innlogget — vis siden
  document.documentElement.style.visibility = '';

  var info = document.getElementById('kurs-user-info');
  if (info) {
    info.innerHTML =
      session.email + '  &middot;  ' +
      '<button onclick="kursLogout()" ' +
      'style="text-decoration:underline;cursor:pointer;background:none;border:none;' +
      'color:inherit;font:inherit;padding:0;">Logg ut</button>';
  }

  window.kursLogout = function () {
    localStorage.removeItem(TOKEN_KEY);
    window.location.replace('/kurs/login.html');
  };
})();
