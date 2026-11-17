document.addEventListener('DOMContentLoaded', cargarProductos);

async function cargarProductos() {

    try {

        const response =
            await fetch('/api/mas-vendidos');

        const productos =
            await response.json();

        const contenedor =
            document.getElementById('contenedorProductos');

        if (!contenedor) return;

        contenedor.innerHTML = '';

        productos.forEach(producto => {

            contenedor.innerHTML += `

                <div class="col-md-3 col-6 mb-4">

                   <div
    class="card producto h-100"
    style="
        background:#0f0f0f;
        border:1px solid #FFD700;
        border-radius:6px;
    ">

                        <div class="position-relative">

                            <a href="producto.html?sku=${producto.sku}">

                                <img
    src="${producto.imagen}"
    class="card-img-top"
    alt="${producto.nombre}"
    style="
        height:220px;
        width:100%;
        object-fit:contain;
        background:#ffffff;
        padding:10px;
    "
>

                            </a>

                            <span
                                class="badge"
                                style="
                                    background:#222;
                                    color:#FFD700;
                                    position:absolute;
                                    top:10px;
                                    left:10px;
                                ">

                                ${producto.categoria === 'Otros Licores' ||
                    producto.categoria === 'Bebidas y Alimentos'
                    ? producto.subcategoria
                    : producto.categoria
                }

                            </span>

                        </div>

                       <div
    class="card-body p-3 d-flex flex-column">

                            <h6
    class="text-white mb-2"
    style="
        min-height:48px;
        font-size:.95rem;
        line-height:1.3;
    ">
    ${producto.nombre}
</h6>

                            <div
                                class="d-flex justify-content-between align-items-center">

                                <span
                                    style="
                                        color:#FFD700;
                                        font-weight:bold;
                                    ">

                                    $ ${Number(producto.precio_cop)
                    .toLocaleString('es-CO')}

                                </span>

                                <a
                                    href="#"
                                    data-add
                                    data-sku="${producto.sku}"
                                    data-nombre="${producto.nombre}"
                                    data-precio="${producto.precio_cop}"
                                    data-img="${producto.imagen}"
                                    class="text-decoration-none">

                                    <i
                                        class="fas fa-cart-plus"
                                        style="color:#FFD700;">
                                    </i>

                                </a>

                            </div>

                        </div>

                    </div>

                </div>

            `;

        });

    } catch (error) {

        console.error(
            'Error cargando productos:',
            error
        );

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

                    <div
                        class="card producto h-100"
                        style="
                            background:#0f0f0f;
                            border:1px solid #FFD700;
                            border-radius:6px;
                        ">

                        <div class="position-relative">

                            <a href="producto.html?sku=${producto.sku}">
                                <img
                                    src="${producto.imagen}"
                                    class="card-img-top"
                                    alt="${producto.nombre}"
                                    style="
                                        height:220px;
                                        width:100%;
                                        object-fit:contain;
                                        background:#ffffff;
                                        padding:10px;
                                    ">
                            </a>

                            <span
                                class="badge"
                                style="
                                    background:#222;
                                    color:#FFD700;
                                    position:absolute;
                                    top:10px;
                                    left:10px;
                                ">

                                ${producto.categoria === 'Otros Licores' ||
                    producto.categoria === 'Bebidas y Alimentos'
                    ? producto.subcategoria
                    : producto.categoria
                }

                            </span>

                        </div>

                        <div class="card-body p-3 d-flex flex-column">

                            <h6
                                class="text-white mb-2"
                                style="
                                    min-height:48px;
                                    font-size:.95rem;
                                    line-height:1.3;
                                ">
                                ${producto.nombre}
                            </h6>

                            <div
                                class="d-flex justify-content-between align-items-center">

                                <span
                                    style="
                                        color:#FFD700;
                                        font-weight:bold;
                                    ">
                                    $ ${Number(producto.precio_cop)
                    .toLocaleString('es-CO')}
                                </span>

                                <a
                                    href="#"
                                    data-add
                                    data-sku="${producto.sku}"
                                    data-nombre="${producto.nombre}"
                                    data-precio="${producto.precio_cop}"
                                    data-img="${producto.imagen}"
                                    class="text-decoration-none">

                                    <i
                                        class="fas fa-cart-plus"
                                        style="color:#FFD700;">
                                    </i>

                                </a>

                            </div>

                        </div>

                    </div>

                </div>
            `;

        });

        document
            .getElementById('contenedorProductos')
            .scrollIntoView({
                behavior: 'smooth'
            });

    } catch (error) {

        console.error(
            'Error filtrando productos:',
            error
        );

    }

}

document.addEventListener('click', (e) => {

    const item = e.target.closest('[data-subcategoria]');

    if (!item) return;

    e.preventDefault();

    filtrarSubcategoria(
        item.dataset.subcategoria
    );

});