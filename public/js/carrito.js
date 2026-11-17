(function () {
  'use strict';
  var KEY = 'l79_cart';
  var fmt = function (n) { return '$ ' + Number(n).toLocaleString('es-CO'); };
  function read() { try { var c = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(c) ? c : []; } catch (e) { return []; } }
  function write(c) { localStorage.setItem(KEY, JSON.stringify(c)); badge(); }
  
  // FUNCIÓN ACTUALIZADA: Controla el badge del menú y el botón flotante
  function badge() {
    var n = read().reduce(function (a, i) { return a + (i.qty || 0); }, 0);
    
    // 1. Actualizar insignias del Navbar
    document.querySelectorAll('.badge-carrito').forEach(function (b) { 
      b.textContent = n; 
      b.hidden = !n; 
    });

    // 2. Actualizar insignia del Botón Flotante
    var floatingCount = document.getElementById('floatingCartCount');
    if (floatingCount) {
      floatingCount.textContent = n;
      floatingCount.hidden = n === 0;
    }
  }

  function toast(t){

    var d = document.createElement('div');

    d.className = 'toast-l79';

    d.innerHTML =
        '<i class="fas fa-check-circle mr-2"></i>' +
        t;

    document.body.appendChild(d);

    setTimeout(() => {

        d.classList.add('show');

    }, 50);

    setTimeout(() => {

        d.classList.remove('show');

        setTimeout(() => {

            d.remove();

        }, 400);

    }, 2200);

}
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  // Agregar desde cualquier botón con data-add
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-add]'); if (!a) return;
    ev.preventDefault();
    var d = a.dataset, c = read(), f = c.find(function (i) { return i.sku === d.sku; });
    if (f) f.qty = Math.min(f.qty + 1, 20);
    else c.push({ sku: d.sku, nombre: d.nombre, precio: Number(d.precio), img: d.img, qty: 1 });
    write(c); toast('' + d.nombre + ' agregado al carrito');
    /* Abrir gaveta si existe en la página */
var drawer = document.getElementById('cartDrawer');
var overlay = document.getElementById('drawerOverlay');

if (drawer && overlay) {

  drawer.classList.add('open');

  overlay.classList.add('open');

  renderDrawer();

}
  });

  // Página del carrito
  function render() {
    var box = document.getElementById('cartItems'); if (!box) return;
    var c = read(); box.textContent = '';
    var emptyElem = document.getElementById('cartEmpty');
    if (emptyElem) emptyElem.hidden = c.length > 0;
    var total = 0;
    c.forEach(function (it) {
      total += it.precio * it.qty;
      var row = el('div', 'cart-row'), img = el('img'); img.src = it.img; img.alt = it.nombre;
      var mid = el('div'); mid.appendChild(el('div', 'nombre', it.nombre)); mid.appendChild(el('div', 'precio', fmt(it.precio)));
      var q = el('div', 'qty'), minus = el('button', null, '−'), plus = el('button', null, '+');
      minus.setAttribute('aria-label', 'Quitar una unidad'); plus.setAttribute('aria-label', 'Agregar una unidad');
      minus.type = plus.type = 'button';
      minus.onclick = function () { it.qty = Math.max(1, it.qty - 1); write(c); render(); };
      plus.onclick = function () { it.qty = Math.min(20, it.qty + 1); write(c); render(); };
      q.append(minus, el('span', null, it.qty), plus); mid.appendChild(q);
      var end = el('div'), del = el('button', 'quitar', 'Quitar'); del.type = 'button';
      del.onclick = function () { write(c.filter(function (x) { return x !== it; })); render(); };
      end.append(el('div', 'precio', fmt(it.precio * it.qty)), del);
      row.append(img, mid, end); box.appendChild(row);
    });
    var totalElem = document.getElementById('cartTotal');
    if (totalElem) totalElem.textContent = fmt(total);
  }

  function renderDrawer() {

    var box = document.getElementById('drawerItems');
    if (!box) return;
  
    var c = read();
  
    box.innerHTML = '';
  
    var total = 0;
  
    c.forEach(function(it) {
  
      total += it.precio * it.qty;
  
      box.innerHTML += `
        <div class="d-flex align-items-center mb-3 border-bottom border-secondary pb-2">
  
          <img
            src="${it.img}"
            style="
              width:60px;
              height:60px;
              object-fit:contain;
              background:#fff;
              border-radius:4px;
            "
            class="mr-3">
  
          <div class="flex-grow-1">
  
            <div class="text-white">
              ${it.nombre}
            </div>
  
            <small style="color:#FFD700;">
              ${fmt(it.precio)}
            </small>
  
            <div class="text-muted">
              Cantidad: ${it.qty}
            </div>
  
          </div>
  
        </div>
      `;
    });
  
    var totalBox =
      document.getElementById('drawerTotal');
  
    if(totalBox){
      totalBox.textContent = fmt(total);
    }
  
  }  

  // El total mostrado es informativo: el servidor recalcula precios desde la base de datos.
  function sync() {
    fetch('/api/productos').then(function (r) { return r.json(); }).then(function (ps) {
      var m = {}; ps.forEach(function (p) { m[p.sku] = p; });
      var c = read().filter(function (i) { return m[i.sku]; });
      c.forEach(function (i) { i.precio = m[i.sku].precio_cop; });
      write(c); render();
    }).catch(function () {});
  }

  var form = document.getElementById('checkoutForm');
  if (form) form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var msg = document.getElementById('checkoutMsg'), c = read();
    msg.className = 'form-msg';
    if (!c.length) { msg.textContent = 'Tu carrito está vacío.'; msg.classList.add('error'); return; }
    if (!form.reportValidity()) return;
    fetch('/api/pedidos', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
      body: JSON.stringify({
        items: c.map(function (i) { return { sku: i.sku, cantidad: i.qty }; }),
        direccion: form.direccion.value, metodo_pago: form.metodo_pago.value, mayor_edad: document.getElementById('mayor').checked
      })
    }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
      .then(function (r) {
        if (r.s === 401) { location.href = 'FormTest.html?next=Carrito.html'; return; }
        if (r.s >= 400) { msg.textContent = r.j.error || 'No se pudo crear el pedido.'; msg.classList.add('error'); return; }
        write([]); render(); msg.textContent = 'Pedido #' + r.j.pedido_id + ' confirmado. Total ' + fmt(r.j.total) + '.'; msg.classList.add('ok');
        form.reset();
      }).catch(function () { msg.textContent = 'Sin conexión con el servidor.'; msg.classList.add('error'); });
  });

  window.badge = badge;

badge();

render();

if (document.getElementById('cartItems')) {
    sync();
}

})();

document.addEventListener('click', function(ev){

  if(ev.target.closest('#closeDrawer')){

      document
      .getElementById('cartDrawer')
      ?.classList.remove('open');

      document
      .getElementById('drawerOverlay')
      ?.classList.remove('open');

  }

  if(ev.target.id === 'drawerOverlay'){

      document
      .getElementById('cartDrawer')
      ?.classList.remove('open');

      document
      .getElementById('drawerOverlay')
      ?.classList.remove('open');

  }

});

document.addEventListener('click', function(ev){

  if(ev.target.id === 'btnContinuarComprando'){

      document
      .getElementById('cartDrawer')
      ?.classList.remove('open');

      document
      .getElementById('drawerOverlay')
      ?.classList.remove('open');

  }

});
