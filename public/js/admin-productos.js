function escaparHTML(texto) {

    const div = document.createElement('div');

    div.textContent = texto ?? '';

    return div.innerHTML;

}

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        const esAdmin =
        await validarAdmin();

    if (!esAdmin) {
        return;
    }

        await cargarProductos();

        document
            .getElementById(
                'buscarProducto'
            )
            ?.addEventListener(
                'input',
                filtrarProductos
            );

    }
);

async function validarAdmin() {

    try {

        const response =
            await fetch(
                '/api/auth/me',
                {
                    credentials: 'include'
                }
            );

        if (!response.ok) {

            window.location.replace('/');

            return false;

        }

        const usuario =
            await response.json();

        if (
            !usuario ||
            usuario.rol !== 'admin'
        ) {

            window.location.replace('/');

            return false;

        }

        return true;

    } catch (error) {

        console.error(
            'Error validando administrador:',
            error
        );

        window.location.replace('/');

        return false;

    }

}

async function cargarProductos() {

    try {

        const response =
            await fetch(
                '/api/admin/productos'
            );

        if (!response.ok) {

            throw new Error(
                'No se pudieron cargar los productos'
            );

        }

        const productos =
            await response.json();

        pintarProductos(
            productos
        );

    } catch (error) {

        console.error(error);

        document.getElementById(
            'tablaProductos'
        ).innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    Error cargando productos
                </td>
            </tr>
        `;

    }

}

function pintarProductos(productos) {

    const tabla =
        document.getElementById(
            'tablaProductos'
        );

    let html = '';

    if (!productos.length) {

        tabla.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    No hay productos registrados
                </td>
            </tr>
        `;

        return;

    }

    productos.forEach(
        producto => {

            html += `
                <tr>

                    <td>

                        <img
                            src="${producto.imagen}"
                            alt="${escaparHTML(producto.nombre)}"
                            style="
                                width:60px;
                                height:60px;
                                object-fit:contain;
                                background:#fff;
                                border-radius:6px;
                            ">

                    </td>

                    <td>
                        ${escaparHTML(producto.nombre)}
                    </td>

                    <td>
                        ${escaparHTML(producto.sku)}
                    </td>

                    <td>
                        ${escaparHTML(
                            producto.categoria || ''
                        )}
                    </td>

                    <td>
                        ${Number(
                            producto.stock
                        )}
                    </td>

                    <td>

                        $
                        ${Number(
                            producto.precio_cop
                        ).toLocaleString(
                            'es-CO'
                        )}

                    </td>

                    <td>

                        <span class="
                            badge
                            ${producto.activo
                                ? 'badge-success'
                                : 'badge-danger'
                            }
                        ">

                            ${producto.activo
                                ? 'Activo'
                                : 'Inactivo'
                            }

                        </span>

                    </td>

                    <td>

                        <button
                            class="btn btn-sm btn-warning">

                            Editar

                        </button>

                    </td>

                </tr>
            `;

        }
    );

    tabla.innerHTML = html;

}

function filtrarProductos() {

    const texto =
        document
            .getElementById(
                'buscarProducto'
            )
            .value
            .trim()
            .toLowerCase();

    const filas =
        document.querySelectorAll(
            '#tablaProductos tr'
        );

    filas.forEach(
        fila => {

            const contenido =
                fila.textContent.toLowerCase();

            fila.style.display =
                contenido.includes(texto)
                    ? ''
                    : 'none';

        }
    );

}