(function () {
  // ============================================================
  //  Kurs-autentisering — passordbasert (ingen Netlify Identity)
  //
  //  Passord endres i login.html (se PASS_HASH-kommentaren der).
  //  Kjør dette for å generere ny hash:
  //    node -e "require('crypto').createHash('sha256').update('DITTPASSORD').digest('hex')"
  // ============================================================

  var TOKEN_KEY   = 'kurs_auth_v2';
  var VALID_TOKEN = 'kurs_authed_2026';

  // Skjul siden umiddelbart — unngår glimt av ubeskyttet innhold
  document.documentElement.style.visibility = 'hidden';

  if (localStorage.getItem(TOKEN_KEY) !== VALID_TOKEN) {
    window.location.replace('/kurs/login.html');
    return;
  }

  // Innlogget — vis siden
  document.documentElement.style.visibility = '';

  var info = document.getElementById('kurs-user-info');
  if (info) {
    info.innerHTML =
      'Innlogget  &middot;  ' +
      '<button onclick="kursLogout()" ' +
      'style="text-decoration:underline;cursor:pointer;background:none;border:none;' +
      'color:inherit;font:inherit;padding:0;">Logg ut</button>';
  }

  window.kursLogout = function () {
    localStorage.removeItem(TOKEN_KEY);
    window.location.replace('/kurs/login.html');
  };
})();
