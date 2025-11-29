// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBBT7jka7a-7v3vY19BlSajamiedLrBTN0",
    authDomain: "pasteleriamilsaborestresleches.web.app",
    projectId: "pasteleriamilsaborestresleches",
};

// Inicializar Firebase solo si no está inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Variable global para almacenar los datos de la compra actual
let compraActual = null;

// Inicializar página de éxito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarPaginaExito();
    configurarEventosExito();
});

/**
 * Inicializa la página de éxito con los datos de la compra
 */
async function inicializarPaginaExito() {
    const urlParams = new URLSearchParams(window.location.search);
    const compraId = urlParams.get('compraId');

    if (!compraId) {
        // Redirigir al carrito si no hay ID de compra
        window.location.href = 'carrito.html';
        return;
    }

    try {
        // Obtener datos de la compra desde Firestore
        const compraDoc = await db.collection('compras').doc(compraId).get();

        if (!compraDoc.exists) {
            console.error('Compra no encontrada');
            window.location.href = 'carrito.html';
            return;
        }

        compraActual = compraDoc.data();

        // Mostrar datos de la compra
        mostrarDatosCompra(compraActual);
        renderizarProductosExito(compraActual.productos);
        actualizarTotalExito(compraActual.total);

    } catch (error) {
        console.error('Error al cargar la compra:', error);
        window.location.href = 'carrito.html';
    }
}

/**
 * Muestra los datos de la compra en los formularios
 */
function mostrarDatosCompra(compra) {
    // Actualizar ID de compra y fecha
    document.getElementById('codigoOrden').textContent = compra.idCompra;
    document.getElementById('fechaCompra').textContent = new Date(compra.fechaCompra).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Datos del cliente
    document.getElementById('exitoNombre').textContent = compra.nombre || 'No especificado';
    document.getElementById('exitoCorreo').textContent = compra.correo;
    document.getElementById('exitoTelefono').textContent = compra.telefono || 'No especificado';

    // Datos de dirección
    document.getElementById('exitoCalle').textContent = compra.direccion || 'No especificado';
    document.getElementById('exitoCiudad').textContent = compra.comuna || 'No especificado';
    document.getElementById('exitoRegion').textContent = 'Chile'; // Asumiendo que es Chile
    document.getElementById('exitoCodigoPostal').textContent = 'N/A'; // No hay código postal en la nueva estructura
}

/**
 * Renderiza los productos en la tabla de éxito
 */
function renderizarProductosExito(productos) {
    const tbody = document.getElementById('tablaExitoBody');

    tbody.innerHTML = productos.map(producto => `
        <tr>
            <td>${producto.nombre}</td>
            <td>$${producto.precio.toLocaleString('es-CL')}</td>
            <td>${producto.cantidad}</td>
            <td>$${((producto.precio || 0) * (producto.cantidad || 1)).toLocaleString('es-CL')}</td>
        </tr>
    `).join('');
}

/**
 * Actualiza el total en la página de éxito
 */
function actualizarTotalExito(total) {
    document.getElementById('totalPagado').textContent = total.toLocaleString('es-CL');
}

/**
 * Actualiza el header del carrito (vacío después de compra exitosa)
 */
function actualizarCarritoHeader() {
    const carritoTotalElement = document.querySelector('.carrito-total');
    if (carritoTotalElement) {
        carritoTotalElement.textContent = '0';
    }
}

/**
 * Genera e imprime la boleta en PDF
 */
function imprimirBoletaPDF() {
    try {
        if (!compraActual) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se encontraron datos de la compra. Por favor, recarga la página.',
                confirmButtonText: 'Aceptar'
            });
            return;
        }

        // Crear contenido HTML para la boleta
        const fecha = new Date(compraActual.fechaCompra).toLocaleDateString('es-CL');

        const contenidoBoleta = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Boleta de Compra - Orden ${compraActual.idCompra}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .info-cliente { margin-bottom: 20px; }
                    .tabla-productos { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .tabla-productos th, .tabla-productos td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .tabla-productos th { background-color: #f2f2f2; }
                    .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>BOLETA ELECTRÓNICA</h1>
                    <p>Orden: ${compraActual.idCompra} | Fecha: ${fecha}</p>
                </div>

                <div class="info-cliente">
                    <h3>Datos del Cliente</h3>
                    <p><strong>Nombre:</strong> ${compraActual.nombre || 'No especificado'}</p>
                    <p><strong>Email:</strong> ${compraActual.correo}</p>
                    <p><strong>Teléfono:</strong> ${compraActual.telefono || 'No especificado'}</p>
                    <p><strong>Dirección:</strong> ${compraActual.direccion || 'No especificado'}, ${compraActual.comuna || 'No especificado'}</p>
                    <p><strong>Región:</strong> Chile</p>
                </div>

                <table class="tabla-productos">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Precio</th>
                            <th>Cantidad</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${compraActual.items.map(producto => `
                            <tr>
                                <td>${producto.nombre}</td>
                                <td>$${producto.precio.toLocaleString('es-CL')}</td>
                                <td>${producto.cantidad}</td>
                                <td>$${producto.subtotal.toLocaleString('es-CL')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="total">
                    <p>TOTAL: $${compraActual.total.toLocaleString('es-CL')}</p>
                </div>

                <div class="footer">
                    <p>¡Gracias por su compra!</p>
                    <p>Este documento es una boleta electrónica generada automáticamente</p>
                </div>
            </body>
            </html>
        `;

        // Crear ventana de impresión
        const ventanaImpresion = window.open('', '_blank');
        ventanaImpresion.document.write(contenidoBoleta);
        ventanaImpresion.document.close();

        // Esperar a que cargue el contenido y luego imprimir
        ventanaImpresion.onload = function() {
            ventanaImpresion.print();
            // Cerrar ventana después de imprimir
            setTimeout(() => {
                ventanaImpresion.close();
            }, 500);
        };

    } catch (error) {
        console.error('Error al generar la boleta:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al generar la boleta',
            text: 'No se pudo generar la boleta. Por favor, intente nuevamente.',
            confirmButtonText: 'Aceptar'
        });
    }
}

/**
 * Simula el envío de la boleta por email
 */
function enviarBoletaEmail() {
    try {
        if (!compraActual) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se encontraron datos de la compra. Por favor, recarga la página.',
                confirmButtonText: 'Aceptar'
            });
            return;
        }

        const email = compraActual.correo;

        // Mostrar mensaje de carga
        const btnEnviar = document.getElementById('btnEnviarEmail');
        const textoOriginal = btnEnviar.innerHTML;
        btnEnviar.innerHTML = 'Enviando...';
        btnEnviar.disabled = true;

        // Simular envío de email (en producción aquí iría una llamada a tu backend)
        setTimeout(() => {
            btnEnviar.innerHTML = textoOriginal;
            btnEnviar.disabled = false;

            // Mostrar confirmación
            Swal.fire({
                icon: 'success',
                title: '¡Boleta enviada!',
                text: `La boleta ha sido enviada exitosamente a ${email}`,
                confirmButtonText: 'Aceptar',
                timer: 3000
            });

        }, 2000);

    } catch (error) {
        console.error('Error al enviar la boleta:', error);

        // Restaurar botón en caso de error
        const btnEnviar = document.getElementById('btnEnviarEmail');
        btnEnviar.innerHTML = 'Enviar Boleta';
        btnEnviar.disabled = false;

        Swal.fire({
            icon: 'error',
            title: 'Error al enviar',
            text: 'No se pudo enviar la boleta. Por favor, intente nuevamente.',
            confirmButtonText: 'Aceptar'
        });
    }
}

/**
 * Configura los eventos de la página de éxito
 */
function configurarEventosExito() {
    // Configurar botón de imprimir
    const btnImprimir = document.getElementById('btnImprimirPDF');
    if (btnImprimir) {
        btnImprimir.addEventListener('click', imprimirBoletaPDF);
    } else {
        console.error('Botón de imprimir no encontrado');
    }
    
    // Configurar botón de enviar
    const btnEnviar = document.getElementById('btnEnviarEmail');
    if (btnEnviar) {
        btnEnviar.addEventListener('click', enviarBoletaEmail);
    } else {
        console.error('Botón de enviar no encontrado');
    }
    
    // También agregar eventos para los botones si existen con diferentes IDs
    const btnImprimirAlternativo = document.getElementById('btnImprimirBoleta');
    if (btnImprimirAlternativo) {
        btnImprimirAlternativo.addEventListener('click', imprimirBoletaPDF);
    }
    
    const btnEnviarAlternativo = document.getElementById('btnEnviarBoleta');
    if (btnEnviarAlternativo) {
        btnEnviarAlternativo.addEventListener('click', enviarBoletaEmail);
    }
}
