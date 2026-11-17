document.addEventListener('DOMContentLoaded', function() {
    renderFullCart();
});

/* ==========================================
   RENDERIZAR EL CARRITO DE COMPRAS
   ========================================== */
function renderFullCart() {
    let cart = JSON.parse(localStorage.getItem('l79_cart')) || [];
    let container = document.getElementById('cartItemsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-card text-center py-5">
                <i class="fas fa-shopping-basket fa-3x mb-3" style="color: #444;"></i>
                <h5 class="text-muted">Tu carrito está vacío</h5>
                <a href="index.html" class="btn btn-warning mt-3 font-weight-bold">Ir a comprar</a>
            </div>`;
        const cartTotalElem = document.getElementById('cartTotal');
        if (cartTotalElem) cartTotalElem.textContent = '$ 0';
        return;
    }

    cart.forEach((it, idx) => {
        let itemSubtotal = it.precio * it.qty;
        total += itemSubtotal;

        let card = document.createElement('div');
        card.className = 'cart-card d-flex align-items-center justify-content-between flex-wrap mb-3 p-3 bg-dark rounded border border-secondary';
        card.innerHTML = `
            <div class="d-flex align-items-center mb-2 mb-sm-0">
                <img src="${it.img}" alt="${it.nombre}" style="width: 70px; height: 70px; object-fit: contain; background: #fff; border-radius: 8px; padding: 5px;" class="mr-3">
                <div>
                    <h5 class="m-0 text-white"
    style="
        font-size:1.1rem;
        line-height:1.2;
    ">${it.nombre}</h5>
                    <small style="color: #FFD700;">$ ${it.precio.toLocaleString('es-CO')} c/u</small>
                </div>
            </div>

            <div class="d-flex align-items-center mb-2 mb-sm-0">
                <div class="input-group" style="width: 110px;">
                    <div class="input-group-prepend">
                        <button class="btn btn-outline-secondary btn-sm text-white btn-minus">-</button>
                    </div>
                    <input type="text" class="form-control form-control-sm text-center bg-dark text-white border-secondary" value="${it.qty}" readonly>
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary btn-sm text-white btn-plus">+</button>
                    </div>
                </div>
            </div>

            <div class="d-flex align-items-center justify-content-end"
    style="
        min-width:260px;
        gap:15px;
    ">
                <span class="font-weight-bold mr-3" style="color: #FFD700; font-size: 1.1rem;">$ ${itemSubtotal.toLocaleString('es-CO')}</span>
                <button class="btn btn-sm btn-outline-danger btn-delete"><i class="fas fa-trash"></i></button>
            </div>
        `;

        card.querySelector('.btn-plus').onclick = function() {
            if (it.qty < 20) {
                it.qty++;
                saveAndRefresh(cart);
            }
        };

        card.querySelector('.btn-minus').onclick = function() {
            if (it.qty > 1) {
                it.qty--;
                saveAndRefresh(cart);
            }
        };

        card.querySelector('.btn-delete').onclick = function() {
            cart.splice(idx, 1);
            saveAndRefresh(cart);
        };

        container.appendChild(card);
    });

    const cartTotalElem = document.getElementById('cartTotal');
    if (cartTotalElem) {
        cartTotalElem.textContent = '$ ' + total.toLocaleString('es-CO');
    }
}

function saveAndRefresh(cart) {

    localStorage.setItem(
        'l79_cart',
        JSON.stringify(cart)
    );

    renderFullCart();

    if (typeof window.badge === 'function') {
        window.badge();
    }
}

/* =====================================================
   ENVÍO, BARRIO, REFERENCIA Y PASARELA DE PAGO
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const inputDireccionManual = document.getElementById('inputDireccionManual'); 
    const inputBarrio = document.getElementById('inputBarrio');               
    const listaBarrios = document.getElementById('listaBarriosSugerencias');    
    const referenciaEntrega = document.getElementById('referenciaEntrega');     
    const btnConfirmarDireccion = document.getElementById('btnConfirmarDireccion');      
    const btnContinuarAlPago = document.getElementById('btnContinuarAlPago');
    const seccionMetodoPago = document.getElementById('seccionMetodoPago');
    const btnPagarAhora = document.getElementById('btnPagarAhora');

    const errorDireccion = document.getElementById('errorDireccion');
    const errorBarrio = document.getElementById('errorBarrio');

    let debounceBarrio;

    // Autocompletado dinámico de Barrios (Gratis vía OSM)
    if (inputBarrio && listaBarrios) {
        inputBarrio.addEventListener('input', function () {
            const query = this.value.trim();
            clearTimeout(debounceBarrio);

            if (errorBarrio) errorBarrio.style.display = 'none';
            inputBarrio.classList.remove('is-invalid');

            if (query.length < 2) {
                listaBarrios.innerHTML = '';
                listaBarrios.style.display = 'none';
                return;
            }

            debounceBarrio = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/buscar-barrios?q=${encodeURIComponent(query)}`);
                    const barrios = await response.json();

                    listaBarrios.innerHTML = '';

                    if (!Array.isArray(barrios) || barrios.length === 0) {
                        listaBarrios.style.display = 'none';
                        return;
                    }

                    barrios.forEach(nombreBarrio => {
                        const item = document.createElement('button');
                        item.type = 'button';
                        item.className = 'list-group-item list-group-item-action py-2 px-3 text-left border-0';
                        item.innerHTML = `<i class="fas fa-map-marker-alt text-danger mr-2"></i><strong>${nombreBarrio}</strong>`;

                        item.addEventListener('click', function () {
                            inputBarrio.value = nombreBarrio;
                            listaBarrios.innerHTML = '';
                            listaBarrios.style.display = 'none';
                            inputBarrio.classList.remove('is-invalid');
                            if (errorBarrio) errorBarrio.style.display = 'none';
                        });

                        listaBarrios.appendChild(item);
                    });

                    listaBarrios.style.display = 'block';
                } catch (e) {
                    console.error('Error consultando barrios:', e);
                }
            }, 300);
        });
    }

    if (inputDireccionManual) {
        inputDireccionManual.addEventListener('input', function () {
            if (errorDireccion) errorDireccion.style.display = 'none';
            inputDireccionManual.classList.remove('is-invalid');
        });
    }

    // Validación de campos obligatorios
    function validarFormulario() {
        let esValido = true;

        const dir = inputDireccionManual ? inputDireccionManual.value.trim() : '';
        const bar = inputBarrio ? inputBarrio.value.trim() : '';

        if (dir.length < 5) {
            if (inputDireccionManual) inputDireccionManual.classList.add('is-invalid');
            if (errorDireccion) errorDireccion.style.display = 'block';
            esValido = false;
        } else {
            if (inputDireccionManual) inputDireccionManual.classList.remove('is-invalid');
            if (errorDireccion) errorDireccion.style.display = 'none';
        }

        if (bar.length < 2) {
            if (inputBarrio) inputBarrio.classList.add('is-invalid');
            if (errorBarrio) errorBarrio.style.display = 'block';
            esValido = false;
        } else {
            if (inputBarrio) inputBarrio.classList.remove('is-invalid');
            if (errorBarrio) errorBarrio.style.display = 'none';
        }

        return esValido;
    }

    // Único botón: Confirmar dirección (Guarda silenciosamente sin alertas molestas)
    if (btnConfirmarDireccion) {
        btnConfirmarDireccion.addEventListener('click', function () {
            if (!validarFormulario()) return;

            const direccion = inputDireccionManual.value.trim();
            const barrio = inputBarrio.value.trim();
            const referencia = referenciaEntrega ? referenciaEntrega.value.trim() : '';

            let direccionCompleta = `${direccion}, Barrio ${barrio}, Cali`;
            if (referencia) {
                direccionCompleta += ` (Ref: ${referencia})`;
            }

            localStorage.setItem('direccion_entrega', direccionCompleta);
            localStorage.setItem('barrio_entrega', barrio);
            localStorage.setItem('referencia_entrega', referencia);

            // Oculta modal si estuviera dentro de uno, o da retroalimentación visual discreta si deseas
            $('#modalDireccionEnvio').modal('hide');
        });
    }

    // Botón Continuar al pago (Valida y despliega las opciones de pago)
    if (btnContinuarAlPago) {
        btnContinuarAlPago.addEventListener('click', function (e) {
            e.preventDefault();

            if (!validarFormulario()) {
                if (inputDireccionManual && inputDireccionManual.value.trim().length < 5) {
                    inputDireccionManual.focus();
                } else if (inputBarrio) {
                    inputBarrio.focus();
                }
                return;
            }

            const direccion = inputDireccionManual.value.trim();
            const barrio = inputBarrio.value.trim();
            const referencia = referenciaEntrega ? referenciaEntrega.value.trim() : '';

            let direccionCompleta = `${direccion}, Barrio ${barrio}, Cali`;
            if (referencia) {
                direccionCompleta += ` (Ref: ${referencia})`;
            }

            localStorage.setItem('direccion_entrega', direccionCompleta);

            if (seccionMetodoPago) {
                seccionMetodoPago.style.display = 'block';
                seccionMetodoPago.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    /* ==========================================
       ENTREGA PROGRAMADA (MODAL)
       ========================================== */
    const btnAbrirModalFecha = document.getElementById('btnAbrirModalFecha');
    const btnGuardarFecha = document.getElementById('btnGuardarFecha');
    const textoProg = document.getElementById('textoProgramacion');

    if (btnAbrirModalFecha) {
        btnAbrirModalFecha.addEventListener('click', function (e) {
            e.preventDefault();
            const hoy = new Date().toISOString().split('T')[0];
            const inputFecha = document.getElementById('inputFechaEntrega');
            if (inputFecha) {
                inputFecha.value = hoy;
                inputFecha.min = hoy;
            }
            $('#modalEntregaProgramada').modal('show');
        });
    }

    if (btnGuardarFecha) {
        btnGuardarFecha.addEventListener('click', function () {
            const fecha = document.getElementById('inputFechaEntrega').value;
            const hora = document.getElementById('selectHoraEntrega').value;

            if (fecha && hora) {
                if (textoProg) {
                    textoProg.textContent = `Programado para el ${fecha} a las ${hora}`;
                    textoProg.style.color = '#FFD700';
                }
            }
            $('#modalEntregaProgramada').modal('hide');
        });
    }

    // Botón final Pagar ahora (Envía el pedido al backend)
    if (btnPagarAhora) {
        btnPagarAhora.addEventListener('click', async function () {
            const metodoSeleccionadoInput = document.querySelector('input[name="metodoPago"]:checked');
            if (!metodoSeleccionadoInput) {
                alert('Por favor selecciona un método de pago.');
                return;
            }

            const metodoSeleccionado = metodoSeleccionadoInput.value;
            const cart = JSON.parse(localStorage.getItem('l79_cart')) || [];
            const direccionCompleta = localStorage.getItem('direccion_entrega') || '';

            if (cart.length === 0) {
                alert('Tu carrito está vacío.');
                return;
            }

            const datosPedido = {
                items: cart.map(i => ({ sku: i.sku, cantidad: i.qty })),
                direccion: direccionCompleta,
                metodo_pago: metodoSeleccionado,
                mayor_edad: true
            };

            try {
                btnPagarAhora.disabled = true;
                btnPagarAhora.textContent = 'Procesando pedido...';

                const response = await fetch('/api/pedidos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-requested-with': 'fetch'
                    },
                    body: JSON.stringify(datosPedido)
                });

                const resultado = await response.json();

                if (!response.ok) {
                    throw new Error(resultado.error || 'No se pudo procesar el pedido.');
                }

                localStorage.removeItem('l79_cart');
                alert(`¡Pedido creado con éxito! Tu número de orden es #${resultado.pedido_id}`);
                window.location.href = 'index.html';

            } catch (error) {
                console.error('Error al pagar:', error);
                alert('Error: ' + error.message);
                btnPagarAhora.disabled = false;
                btnPagarAhora.textContent = 'Pagar ahora';
            }
        });
    }
});