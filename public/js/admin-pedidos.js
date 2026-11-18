let pedidoActualId = null;
let nuevoEstado = null;

document.addEventListener(
    'DOMContentLoaded',
    iniciarPanel
);

async function iniciarPanel() {

    await validarAdmin();

    cargarPedidos();

}

async function validarAdmin() {

    try {

        const response =
            await fetch('/api/auth/me');

        if (!response.ok) {

            window.location.href = '/';
            return;

        }

        const usuario =
            await response.json();

        if (usuario.rol !== 'admin') {

            window.location.href = '/';

        }

    } catch (error) {

        window.location.href = '/';

    }

}

function obtenerColorEstado(estado) {

    switch (estado) {

        case 'pendiente':
            return 'warning';

        case 'pagado':
            return 'info';

        case 'preparando':
            return 'primary';

        case 'enviado':
            return 'secondary';

        case 'entregado':
            return 'success';

        case 'cancelado':
            return 'danger';

        default:
            return 'light';

    }

}

async function cargarPedidos() {

    try {

        const response =
            await fetch('/api/admin/pedidos');

        const pedidos =
            await response.json();

        const contenedor =
            document.getElementById(
                'contenedorPedidos'
            );

        contenedor.innerHTML = '';

        if (!pedidos.length) {

            contenedor.innerHTML = `
                <div class="alert alert-warning">
                    No hay pedidos registrados.
                </div>
            `;

            return;

        }

        pedidos.forEach(pedido => {

            contenedor.innerHTML += `

                <div class="card-pedido">

                    <div class="titulo-pedido">

                        <h4 style="color:#FFD700">
                            Pedido #${pedido.id}
                        </h4>

                        <span
                            class="badge badge-${obtenerColorEstado(
                                pedido.estado
                            )}">

                            ${pedido.estado.toUpperCase()}

                        </span>

                    </div>

                    <div class="dato">
                        <strong>Cliente:</strong>
                        ${pedido.nombre_completo}
                    </div>

                    <div class="dato">
                        <strong>Email:</strong>
                        ${pedido.email}
                    </div>

                    <div class="dato">
                        <strong>Teléfono:</strong>
                        ${pedido.telefono || 'No registrado'}
                    </div>

                    <div class="dato">
                        <strong>Dirección:</strong>
                        ${pedido.direccion}
                    </div>

                    <div class="dato">
                        <strong>Método de pago:</strong>
                        ${pedido.metodo_pago}
                    </div>

                    <div class="dato">
                        <strong>Total:</strong>
                        $${Number(
                            pedido.total_cop
                        ).toLocaleString('es-CO')}
                    </div>

                    <div class="dato">
                        <strong>Fecha:</strong>
                        ${new Date(
                            pedido.creado_en
                        ).toLocaleString('es-CO')}
                    </div>

                    <div class="row mt-4">

                        <div class="col-12 col-md-4">

                            <select
                                id="estado-${pedido.id}"
                                class="form-control estado">

                                <option value="pendiente"
                                    ${pedido.estado === 'pendiente' ? 'selected' : ''}>
                                    Pendiente
                                </option>

                                <option value="pagado"
                                    ${pedido.estado === 'pagado' ? 'selected' : ''}>
                                    Pagado
                                </option>

                                <option value="preparando"
                                    ${pedido.estado === 'preparando' ? 'selected' : ''}>
                                    Preparando
                                </option>

                                <option value="enviado"
                                    ${pedido.estado === 'enviado' ? 'selected' : ''}>
                                    Enviado
                                </option>

                                <option value="entregado"
                                    ${pedido.estado === 'entregado' ? 'selected' : ''}>
                                    Entregado
                                </option>

                                <option value="cancelado"
                                    ${pedido.estado === 'cancelado' ? 'selected' : ''}>
                                    Cancelado
                                </option>

                            </select>

                        </div>

                        <div class="col-12 col-md-4 mt-3 mt-md-0">

                            <button
                                class="btn btn-info btn-detalle"
                                data-id="${pedido.id}">

                                Ver Detalle

                            </button>

                        </div>

                        <div class="col-12 col-md-4 mt-3 mt-md-0">

                            <button
                                class="btn btn-warning btn-guardar"
                                data-id="${pedido.id}">

                                Guardar Estado

                            </button>

                        </div>

                    </div>

                </div>

            `;

        });

        registrarEventos();

    } catch (error) {

        console.error(error);

    }

}

function registrarEventos() {

    document
        .querySelectorAll('.btn-guardar')
        .forEach(btn => {

            btn.addEventListener(
                'click',
                async () => {

                    pedidoActualId =
                        btn.dataset.id;

                    nuevoEstado =
                        document.getElementById(
                            `estado-${pedidoActualId}`
                        ).value;

                    document.getElementById(
                        'textoConfirmacion'
                    ).innerHTML = `
                        
                        <strong>Pedido #${pedidoActualId}</strong>

                        <br><br>

                        Nuevo estado:

                        <span class="text-warning">
                            ${nuevoEstado.toUpperCase()}
                        </span>

                        <br><br>

                        ¿Deseas guardar los cambios?

                    `;

                    $('#modalEstado')
                        .modal('show');

                }
            );

        });

    document
        .querySelectorAll('.btn-detalle')
        .forEach(btn => {

            btn.addEventListener(
                'click',
                async () => {

                    const id =
                        btn.dataset.id;

                    await mostrarDetallePedido(
                        id
                    );

                }
            );

        });

}

async function mostrarDetallePedido(id) {

    try {

        const response =
            await fetch(
                `/api/admin/pedidos/${id}`
            );

        const productos =
            await response.json();

        const contenedor =
            document.getElementById(
                'detallePedidoBody'
            );

        contenedor.innerHTML = '';

        if (!productos.length) {

            contenedor.innerHTML = `
                <tr>
                    <td colspan="4">
                        No hay productos
                    </td>
                </tr>
            `;

            $('#modalDetallePedido')
                .modal('show');

            return;

        }

        let total = 0;

        productos.forEach(item => {

            const subtotal =
                Number(item.cantidad) *
                Number(item.precio_unitario);

            total += subtotal;

            contenedor.innerHTML += `

                <tr>

                    <td>
                        ${item.nombre}
                    </td>

                    <td>
                        ${item.cantidad}
                    </td>

                    <td>
                        $${Number(
                            item.precio_unitario
                        ).toLocaleString('es-CO')}
                    </td>

                    <td>
                        $${subtotal.toLocaleString('es-CO')}
                    </td>

                </tr>

            `;

        });

        document.getElementById(
            'totalPedidoDetalle'
        ).textContent =
            '$' + total.toLocaleString('es-CO');

        $('#modalDetallePedido')
            .modal('show');

    } catch (error) {

        console.error(error);

    }

}

document
    .getElementById(
        'btnConfirmarEstado'
    )
    .addEventListener(
        'click',
        async () => {

            try {

                const response =
                    await fetch(
                        `/api/admin/pedidos/${pedidoActualId}/estado`,
                        {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-requested-with': 'fetch'
                            },
                            body: JSON.stringify({
                                estado: nuevoEstado
                            })
                        }
                    );

                if (!response.ok) {

                    throw new Error();

                }

                $('#modalEstado')
                    .modal('hide');

                const toast =
                    document.getElementById(
                        'toastExito'
                    );

                toast.style.display =
                    'block';

                setTimeout(() => {

                    toast.style.display =
                        'none';

                }, 3000);

                cargarPedidos();

            } catch (error) {

                const toast =
                    document.getElementById(
                        'toastError'
                    );

                toast.style.display =
                    'block';

                setTimeout(() => {

                    toast.style.display =
                        'none';

                }, 3000);

            }

        }
    );