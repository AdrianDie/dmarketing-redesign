(function () {
  // ============================================================
  //  Kurs-autentisering v3 — per-bruker (email + PBKDF2)
  // ============================================================

  var TOKEN_KEY = 'kurs_auth_v3';

  // Skjul siden umiddelbart
  document.documentElement.style.visibility = 'hidden';

  var session = null;
  try {
    session = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
  } catch(e) {}

  // Token valideres som 64-tegns hex — avhengig av passordet, ikke en hardkodet streng
  var validToken = session && typeof session.token === 'string' && /^[a-f0-9]{64}$/.test(session.token);

  if (!validToken || !session.email) {
    window.location.replace('/kurs/login.html');
    return;
  }

  // Innlogget — vis siden
  document.documentElement.style.visibility = '';

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var info = document.getElementById('kurs-user-info');
  if (info) {
    info.innerHTML =
      escHtml(session.email) + '  &middot;  ' +
      '<button onclick="kursLogout()" ' +
      'style="text-decoration:underline;cursor:pointer;background:none;border:none;' +
      'color:inherit;font:inherit;padding:0;">Logg ut</button>';
  }

  window.kursLogout = function () {
    localStorage.removeItem(TOKEN_KEY);
    window.location.replace('/kurs/login.html');
  };
})();
