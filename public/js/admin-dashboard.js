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
    

    function escaparHTML(texto) {

        const div = document.createElement('div');
    
        div.textContent = texto ?? '';
    
        return div.innerHTML;
    
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
            
                    let medalla = '';
            
                    if (index === 0) {
                        medalla = '🥇';
                    } else if (index === 1) {
                        medalla = '🥈';
                    } else if (index === 2) {
                        medalla = '🥉';
                    } else {
                        medalla = `#${index + 1}`;
                    }
            
                    contenedor.innerHTML += `
                        <div class="producto-top">
            
                            <span>
            
                                <span class="posicion">
                                    ${medalla}
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
    