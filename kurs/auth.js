(function () {
  // Hide page immediately to prevent flash of unprotected content
  document.documentElement.style.visibility = 'hidden';

  netlifyIdentity.on('init', function (user) {
    if (!user) {
      window.location.replace('/kurs/login');
    } else {
      document.documentElement.style.visibility = '';
      var info = document.getElementById('kurs-user-info');
      if (info) {
        info.innerHTML =
          user.email +
          ' &nbsp;&middot;&nbsp; <button onclick="netlifyIdentity.logout()" ' +
          'style="text-decoration:underline;cursor:pointer;background:none;border:none;color:inherit;font:inherit;padding:0;">' +
          'Logg ut</button>';
      }
    }
  });

  netlifyIdentity.on('logout', function () {
    window.location.replace('/kurs/login');
  });
})();
