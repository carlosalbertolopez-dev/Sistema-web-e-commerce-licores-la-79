(function () {
  'use strict';
  // Mostrar/ocultar contraseña
  document.querySelectorAll('[data-pw]').forEach(function (b) {
    b.addEventListener('click', function () {
      var i = document.getElementById('passwordInput'), ic = b.querySelector('i'), show = i.type === 'password';
      i.type = show ? 'text' : 'password'; ic.classList.toggle('fa-eye', !show); ic.classList.toggle('fa-eye-slash', show);
    });
  });

  var DEST = { login: '/api/auth/login', registro: '/api/auth/registro', suscribir: '/api/suscribir' };
  document.querySelectorAll('form[data-api]').forEach(function (f) {
    var msg = document.createElement('div'); msg.className = 'form-msg'; msg.setAttribute('role', 'alert'); f.appendChild(msg);
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); msg.className = 'form-msg';
      var data = {}; new FormData(f).forEach(function (v, k) { data[k] = v; });
      fetch(DEST[f.dataset.api], {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: JSON.stringify(data)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (r) {
          if (!r.ok) { msg.textContent = r.j.error || 'Revisa los datos.'; msg.classList.add('error'); return; }
          if (f.dataset.api === 'suscribir') { msg.textContent = 'Gracias por suscribirte a Licores La 79'; msg.classList.add('ok'); f.reset(); return; }
          var next = new URLSearchParams(location.search).get('next');
          location.href = /^[A-Za-z]+\.html$/.test(next || '') ? next : 'index.html';   // evita redirecciones abiertas
        }).catch(function () { msg.textContent = 'Sin conexión con el servidor.'; msg.classList.add('error'); });
    });
  });

  // Si hay sesión, el ícono de usuario cierra sesión
  fetch('/api/auth/me', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (u) {
    if (!u) return;
    var a = document.querySelector('a[title="Ingresar"]'); if (!a) return;
    a.title = 'Cerrar sesión (' + u.nombre.split(' ')[0] + ')'; a.href = '#';
    a.addEventListener('click', function (e) {
      e.preventDefault();
      fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { 'X-Requested-With': 'fetch' } }).then(function () { location.href = 'index.html'; });
    });
  }).catch(function () {});
})();
