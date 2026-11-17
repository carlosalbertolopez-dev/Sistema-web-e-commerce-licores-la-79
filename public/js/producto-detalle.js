document.addEventListener('DOMContentLoaded', async () => {

    try {

        const params = new URLSearchParams(window.location.search);
        const sku = params.get('sku');

        if (!sku) {
            alert('Producto no encontrado');
            window.location.href = 'index.html';
            return;
        }

        const response = await fetch(`/api/productos/${sku}`);

        if (!response.ok) {
            throw new Error('Producto no encontrado');
        }

        const producto = await response.json();
        cargarRelacionados(
            producto.categoria,
            producto.sku
        );
        const elNombre = document.getElementById('prodNombre');
        const elBreadcrumb = document.getElementById('breadcrumbNombre');
        const elPrecio = document.getElementById('prodPrecio');
        const elImg = document.getElementById('prodImg');
        const elDescripcion = document.getElementById('details');

        if (elNombre) {
            elNombre.textContent = producto.nombre;
        }

        if (elBreadcrumb) {
            elBreadcrumb.textContent = producto.nombre;
        }

        if (elImg) {
            elImg.src = producto.imagen;
            elImg.alt = producto.nombre;
        }

        if (elDescripcion) {
            elDescripcion.textContent =
                producto.descripcion ||
                'Información no disponible para este producto.';
        }

        let qty = 1;

        const qtyInput = document.getElementById('prodQty');
        const btnPlus = document.getElementById('btnPlus');
        const btnMinus = document.getElementById('btnMinus');

        function actualizarPrecio() {

            const total =
                producto.precio_cop * qty;

            elPrecio.textContent =
                '$ ' + total.toLocaleString('es-CO');
        }

        actualizarPrecio();

        btnPlus?.addEventListener('click', () => {

            if (qty < 20) {
                qty++;

                qtyInput.value = qty;

                actualizarPrecio();
            }
        });

        btnMinus?.addEventListener('click', () => {

            if (qty > 1) {

                qty--;

                qtyInput.value = qty;

                actualizarPrecio();
            }
        });

        const btnAdd = document.getElementById('btnAddDetail');

        btnAdd?.addEventListener('click', () => {

            let cart =
                JSON.parse(
                    localStorage.getItem('l79_cart')
                ) || [];

            const existing =
                cart.find(
                    item => item.sku === producto.sku
                );

            if (existing) {

                existing.qty =
                    Math.min(
                        20,
                        existing.qty + qty
                    );

            } else {

                cart.push({
                    sku: producto.sku,
                    nombre: producto.nombre,
                    precio: producto.precio_cop,
                    img: producto.imagen,
                    qty
                });
            }

            localStorage.setItem(
                'l79_cart',
                JSON.stringify(cart)
            );

            if (typeof badge === 'function') {
                badge();
            }

            openDrawer();
        });

        const btnContinuar =
    document.getElementById(
        'btnContinuarComprando'
    );

if (btnContinuar) {

    btnContinuar.addEventListener(
        'click',
        closeDrawer
    );

}

    } catch (error) {

        console.error(error);

        alert('No fue posible cargar el producto');

        window.location.href = 'index.html';
    }
});

const closeBtn = document.getElementById('closeDrawer');
const overlayBtn = document.getElementById('drawerOverlay');

if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer);
}

if (overlayBtn) {
    overlayBtn.addEventListener('click', closeDrawer);
}

function openDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('drawerOverlay');

    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');

    renderDrawerItems();
}

function closeDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('drawerOverlay');

    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}

function renderDrawerItems() {
    let cart =
        JSON.parse(
            localStorage.getItem('l79_cart')
        ) || [];
    const box =
        document.getElementById('drawerItems');
    const totalBox =
        document.getElementById('drawerTotal');
    if (!box) return;
    box.innerHTML = '';
    let total = 0;
    if (cart.length === 0) {
        box.innerHTML = `
            <p class="text-center text-muted my-4">
                Tu carrito está vacío
            </p>
        `;
    } else {
        cart.forEach((it, idx) => {
            total += it.precio * it.qty;
            const itemDiv =
                document.createElement('div');
            itemDiv.className =
                'mb-3 p-3 border-bottom border-secondary';
            itemDiv.innerHTML = `
                <div class="d-flex align-items-start">
                    <img
                        src="${it.img}"
                        alt="${it.nombre}"
                        class="mr-3"
                        style="
                            width:70px;
                            height:70px;
                            object-fit:contain;
                            background:#fff;
                            border-radius:6px;
                            padding:4px;
                        ">
                    <div class="flex-grow-1">
                        <h6
                            class="text-white mb-2"
                            style="
                                font-size:0.9rem;
                                line-height:1.3;">
                            ${it.nombre}
                        </h6>
                        <div class="d-flex align-items-center">
                            <button
                                class="btn btn-sm btn-outline-light btn-minus"
                                data-index="${idx}">
                                -
                            </button>

                            <span
                                class="mx-3 text-white">
                                ${it.qty}
                            </span>

                            <button
                                class="btn btn-sm btn-outline-light btn-plus"
                                data-index="${idx}">
                                +
                            </button>

                            <span
                                class="ml-3"
                                style="
                                    color:#FFD700;
                                    font-weight:bold;
                                ">
                                $ ${it.precio.toLocaleString('es-CO')}
                            </span>
                        </div>
                    </div>
                    <button
                        class="btn btn-sm text-danger btn-delete"
                        data-index="${idx}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            box.appendChild(itemDiv);
        });
    }
    if (totalBox) {
        totalBox.textContent =
            '$ ' + total.toLocaleString('es-CO');
    }
    document
        .querySelectorAll('.btn-plus')
        .forEach(btn => {
            btn.addEventListener('click', () => {
                increaseQty(
                    Number(btn.dataset.index)
                );
            });
        });
    document
        .querySelectorAll('.btn-minus')
        .forEach(btn => {
            btn.addEventListener('click', () => {
                decreaseQty(
                    Number(btn.dataset.index)
                );
            });
        });
    document
        .querySelectorAll('.btn-delete')
        .forEach(btn => {
            btn.addEventListener('click', () => {
                removeItem(
                    Number(btn.dataset.index)
                );
            });
        });
}

function increaseQty(index) {
    let cart =
        JSON.parse(
            localStorage.getItem('l79_cart')
        ) || [];
    if (cart[index].qty < 20) {
        cart[index].qty++;
    }
    localStorage.setItem(
        'l79_cart',
        JSON.stringify(cart)
    );
    renderDrawerItems();
}

function decreaseQty(index) {
    let cart =
        JSON.parse(
            localStorage.getItem('l79_cart')
        ) || [];
    if (cart[index].qty > 1) {
        cart[index].qty--;
    }
    localStorage.setItem(
        'l79_cart',
        JSON.stringify(cart)
    );
    renderDrawerItems();
}

function removeItem(index) {
    let cart =
        JSON.parse(
            localStorage.getItem('l79_cart')
        ) || [];
    cart.splice(index, 1);
    localStorage.setItem(
        'l79_cart',
        JSON.stringify(cart)
    );
    renderDrawerItems();
}

async function cargarRelacionados(
    categoria,
    sku
)
{
    try{
        const response =
            await fetch(
                `/api/productos-relacionados/${categoria}/${sku}`
            );
        const productos =
            await response.json();
        const contenedor =
            document.getElementById(
                'productosRelacionados'
            );

        if(!contenedor) return;
        contenedor.innerHTML = '';
        productos.forEach(p => {
            contenedor.innerHTML += `
            <div class="col-md-3 col-6 mb-4">
                <div class="card producto h-100">
                    <a href="producto.html?sku=${p.sku}">
                        <img
                            src="${p.imagen}"
                            class="card-img-top"
                            style="
                                height:220px;
                                object-fit:contain;
                                background:#fff;
                            ">
                    </a>
                    <div class="card-body">
                        <h6 class="text-white">
                            ${p.nombre}
                        </h6>
                        <span
                            style="
                                color:#FFD700;
                                font-weight:bold;
                            ">
                            $
                            ${Number(
                                p.precio_cop
                            ).toLocaleString('es-CO')}
                        </span>
                    </div>
                </div>
            </div>
            `;
        });
    }catch(error){
        console.error(error);
    }
}

async function filtrarSubcategoria(subcategoria) {

    try {

        const response =
            await fetch(`/api/subcategoria/${encodeURIComponent(subcategoria)}`);

        const productos =
            await response.json();

        const contenedor =
            document.getElementById('contenedorProductos');

        if (!contenedor) return;

        contenedor.innerHTML = '';

        productos.forEach(producto => {

            contenedor.innerHTML += `
                <div class="col-md-3 col-6 mb-4">
                    ...
                </div>
            `;

        });

        document
            .getElementById('contenedorProductos')
            .scrollIntoView({
                behavior: 'smooth'
            });

    } catch (error) {

        console.error(error);

    }

}