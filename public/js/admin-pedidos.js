let pedidoActualId = null;
let nuevoEstado = null;
let graficaVentasDia = null;
let graficaVentasSemana = null;
let graficaVentasMes = null;

async function cargarDashboard(){

    try{

        const response =
            await fetch(
                '/api/admin/dashboard'
            );

        const data =
            await response.json();

        document.getElementById(
            'dashboardAdmin'
        ).innerHTML = `

            <div class="dashboard-card">

                <h3>
                    Total Pedidos
                </h3>

                <span>
                    ${data.pedidos}
                </span>

            </div>

            <div class="dashboard-card">

                <h3>
                    Pendientes
                </h3>

                <span>
                    ${data.pendientes}
                </span>

            </div>

            <div class="dashboard-card">

                <h3>
                    Enviados
                </h3>

                <span>
                    ${data.enviados}
                </span>

            </div>

            <div class="dashboard-card">

                <h3>
                    Entregados
                </h3>

                <span>
                    ${data.entregados}
                </span>

            </div>

            <div class="dashboard-card">

    <h3>
        Pagados
    </h3>

    <span>
        ${data.pagados}
    </span>

</div>

<div class="dashboard-card">

    <h3>
        Preparando
    </h3>

    <span>
        ${data.preparando}
    </span>

</div>

<div class="dashboard-card">

    <h3>
        Cancelados
    </h3>

    <span>
        ${data.cancelados}
    </span>

</div>

            <div class="dashboard-card">

                <h3>
                    Ventas COP
                </h3>

                <span>

                    $${Number(
                        data.ventas
                    ).toLocaleString(
                        'es-CO'
                    )}

                </span>

            </div>

        `;

    }catch(error){

        console.error(error);

    }

}

document.addEventListener('DOMContentLoaded', () => {

    iniciarPanel();

    const filtro =
        document.getElementById(
            'filtroEstado'
        );

    if (filtro) {
        filtro.addEventListener(
            'input',
            filtrarPedidos
        );
    }

    document
        .getElementById(
            'btnActualizar'
        )
        ?.addEventListener(
            'click',
            actualizarPanel
        );

});


async function iniciarPanel(){

    const esAdmin =
        await validarAdmin();

    if (!esAdmin) {
        return;
    }
    await cargarDashboard();
    await cargarPedidos();
    await cargarGraficaVentasDia();
    await cargarGraficaVentasSemana();
    await cargarGraficaVentasMes();
    await cargarStockBajo();
    await cargarTopProductos();

    actualizarHoraPanel();

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

                <div
    class="card-pedido"
    data-id="${pedido.id}"
    data-cliente="${pedido.nombre_completo}"
    data-email="${pedido.email}"
    data-estado="${pedido.estado}">

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

function filtrarPedidos() {
    const texto = document
        .getElementById('filtroEstado')
        .value
        .trim()
        .toLowerCase();

    document.querySelectorAll('.card-pedido').forEach(card => {

        const id = card.dataset.id?.toLowerCase() || '';
        const cliente = card.dataset.cliente?.toLowerCase() || '';
        const email = card.dataset.email?.toLowerCase() || '';
        const estado = card.dataset.estado?.toLowerCase() || '';

        const coincide =
            id.includes(texto) ||
            cliente.includes(texto) ||
            email.includes(texto) ||
            estado.includes(texto);

        card.style.display = coincide ? 'block' : 'none';
    });
}

function mostrarToast(idToast) {

    const toast =
        document.getElementById(idToast);

    toast.classList.add('mostrar');

    setTimeout(() => {
        toast.classList.remove('mostrar');
    }, 3000);

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

                document.activeElement.blur();

                await cargarDashboard();

                await cargarPedidos();

                actualizarHoraPanel();

                mostrarToast('toastExito');

            } catch (error) {

                console.error(error);

                document.activeElement.blur();

                mostrarToast('toastError');

            }

        }
    );

    function actualizarHoraPanel() {

        const ahora = new Date();
    
        document.getElementById(
            'ultimaActualizacion'
        ).textContent =
            ahora.toLocaleString('es-CO');
    }

    async function actualizarPanel() {

        const boton =
            document.getElementById(
                'btnActualizar'
            );
    
        boton.disabled = true;
        boton.textContent =
            'Actualizando...';
    
        await cargarDashboard();
        await cargarPedidos();
        await cargarGraficaVentasDia();
        await cargarGraficaVentasSemana();
        await cargarGraficaVentasMes();
        await cargarTopProductos();
        await cargarStockBajo();
    
        actualizarHoraPanel();
    
        boton.disabled = false;
        boton.textContent =
            '↻ Actualizar';
    }

    $('#modalEstado').on(
        'hidden.bs.modal',
        function () {
            document.activeElement.blur();
        }
    );
    
    $('#modalDetallePedido').on(
        'hidden.bs.modal',
        function () {
            document.activeElement.blur();
        }
    );

    async function cargarGraficaVentasDia() {

        try {
    
            const response =
    await fetch(
        '/api/admin/ventas-dia'
    );

if (!response.ok) {
    throw new Error(
        'No se pudo cargar ventas por día'
    );
}

const datos =
    await response.json();
    
                const labels = datos.map(item => {

                    const fecha = new Date(item.fecha);
                
                    return fecha.toLocaleDateString(
                        'es-CO',
                        {
                            day: '2-digit',
                            month: 'short'
                        }
                    );
                
                });
    
            const valores =
                datos.map(
                    item => Number(item.total)
                );
    
            const ctx =
                document
                    .getElementById(
                        'graficaVentasDia'
                    )
                    .getContext('2d');
    
            if (graficaVentasDia) {
                graficaVentasDia.destroy();
            }
    
            graficaVentasDia =
                new Chart(ctx, {
    
                    type:'line',
    
                    data:{
                        labels,
    
                        datasets:[{

                            label:'Ventas COP',
                        
                            data:valores,
                        
                            borderColor:'#FFD700',
                        
                            backgroundColor:
                                'rgba(255,215,0,.2)',
                        
                            pointBackgroundColor:'#FFD700',
                        
                            pointBorderColor:'#FFD700',
                        
                            pointRadius:6,
                        
                            pointHoverRadius:8,
                        
                            borderWidth:3,
                        
                            fill:true,
                        
                            tension:.3
                        
                        }]
    
                    },
    
                    options:{
    
                        responsive:true,
    
                        plugins:{
                            legend:{
                                labels:{
                                    color:'#ffffff'
                                }
                            }
                        },
    
                        scales: {

                            y: {
                                ticks: {
                        
                                    color:'#ffffff',
                        
                                    callback: function(value){
                        
                                        return '$' +
                                            value.toLocaleString('es-CO');
                        
                                    }
                        
                                }
                        
                            }
                        
                        }
    
                    }
    
                });
    
        } catch(error){
    
            console.error(error);
    
        }
    
    }

    async function cargarGraficaVentasSemana() {

        try {
    
            const response =
    await fetch(
        '/api/admin/ventas-semana'
    );

if (!response.ok) {
    throw new Error(
        'No se pudo cargar ventas por semana'
    );
}

const datos =
    await response.json();
    
            const labels =
                datos.map((item, index) =>
                    `Semana ${index + 1}`
                );
    
            const valores =
                datos.map(
                    item => Number(item.total)
                );
    
            const ctx =
                document
                    .getElementById(
                        'graficaVentasSemana'
                    )
                    .getContext('2d');
    
            if (graficaVentasSemana) {
                graficaVentasSemana.destroy();
            }
    
            graficaVentasSemana =
                new Chart(ctx, {
    
                    type: 'bar',
    
                    data: {
    
                        labels,
    
                        datasets: [{
    
                            label: 'Ventas COP',
    
                            data: valores,
    
                            backgroundColor:
                                'rgba(255,215,0,.7)',
    
                            borderColor:
                                '#FFD700',
    
                            borderWidth: 2
    
                        }]
    
                    },
    
                    options: {
    
                        responsive: true,
    
                        plugins: {
    
                            legend: {
    
                                labels: {
                                    color: '#ffffff'
                                }
    
                            }
    
                        },
    
                        scales: {
    
                            x: {
    
                                ticks: {
                                    color: '#ffffff'
                                }
    
                            },
    
                            y: {
    
                                ticks: {
    
                                    color: '#ffffff',
    
                                    callback: function(value) {
    
                                        return '$' +
                                            value.toLocaleString(
                                                'es-CO'
                                            );
    
                                    }
    
                                }
    
                            }
    
                        }
    
                    }
    
                });
    
        } catch (error) {
    
            console.error(error);
    
        }
    
    }

    async function cargarGraficaVentasMes() {

        try {
    
            const response =
                await fetch(
                    '/api/admin/ventas-mes'
                );
    
            if (!response.ok) {
                throw new Error(
                    'No se pudo cargar ventas por mes'
                );
            }
    
            const datos =
                await response.json();
    
            const labels =
                datos.map(item => {
    
                    const fecha =
                        new Date(item.mes);
    
                    return fecha.toLocaleDateString(
                        'es-CO',
                        {
                            month: 'long',
                            year: 'numeric'
                        }
                    );
    
                });
    
            const valores =
                datos.map(
                    item => Number(item.total)
                );
    
            const ctx =
                document
                    .getElementById(
                        'graficaVentasMes'
                    )
                    .getContext('2d');
    
            if (graficaVentasMes) {
                graficaVentasMes.destroy();
            }
    
            graficaVentasMes =
                new Chart(ctx, {
    
                    type: 'bar',
    
                    data: {
    
                        labels,
    
                        datasets: [{
    
                            label: 'Ventas COP',
    
                            data: valores,
    
                            backgroundColor:
                                'rgba(13,202,240,.5)',
    
                            borderColor:
                                '#0dcaf0',
    
                            borderWidth: 2
    
                        }]
    
                    },
    
                    options: {
    
                        responsive: true,
    
                        plugins: {
    
                            legend: {
    
                                labels: {
                                    color: '#ffffff'
                                }
    
                            }
    
                        },
    
                        scales: {
    
                            x: {
    
                                ticks: {
                                    color: '#ffffff'
                                }
    
                            },
    
                            y: {
    
                                ticks: {
    
                                    color: '#ffffff',
    
                                    callback: function(value) {
    
                                        return '$' +
                                            value.toLocaleString(
                                                'es-CO'
                                            );
    
                                    }
    
                                }
    
                            }
    
                        }
    
                    }
    
                });
    
        } catch (error) {
    
            console.error(error);
    
        }
    
    }
   

    async function cargarTopProductos() {

        try {
    
            const response =
                await fetch(
                    '/api/admin/top-productos'
                );
    
            if (!response.ok) {
                throw new Error(
                    'Error cargando top productos'
                );
            }
    
            const productos =
                await response.json();
    
            const contenedor =
                document.getElementById(
                    'topProductos'
                );
    
            contenedor.innerHTML = '';
    
            productos.forEach(
                (producto, index) => {
    
                    contenedor.innerHTML += `
                        <div class="producto-top">
                            <span>
                                <span class="posicion">
                                    #${index + 1}
                                </span>
                                ${escaparHTML(producto.nombre)}
                            </span>
    
                            <span class="cantidad-vendida">
                            ${Number(producto.vendidos)}
                                ventas
                            </span>
                        </div>
                    `;
    
                }
            );
    
        } catch(error){
    
            console.error(error);
    
        }
    
    }

    async function cargarStockBajo() {

        try {
    
            const response =
                await fetch(
                    '/api/admin/stock-bajo'
                );
    
            if (!response.ok) {
                throw new Error(
                    'No se pudo cargar stock bajo'
                );
            }
    
            const productos =
                await response.json();
    
            const contenedor =
                document.getElementById(
                    'stockBajo'
                );
    
            contenedor.innerHTML = '';
    
            if (!productos.length) {
    
                contenedor.innerHTML = `
                    <div class="text-success">
                         No hay productos con stock bajo
                    </div>
                `;
    
                return;
            }
    
            productos.forEach(producto => {
    
                contenedor.innerHTML += `
                    <div class="stock-item">
    
                        <span>
                        ${escaparHTML(producto.nombre)}
                        </span>
    
                        <span class="stock-numero">
                            Stock: ${Number(producto.stock)}
                        </span>
    
                    </div>
                `;
    
            });
    
        } catch (error) {
    
            console.error(error);
    
        }
    
    }
    