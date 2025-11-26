// Variables globales
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

let initialized = false;  // Flag to prevent multiple initializations
let rendering = false;  // Flag to prevent multiple renders

document.addEventListener('DOMContentLoaded', function() {
    if (initialized) return;  // Prevent multiple initializations
    initialized = true;
    console.log("Carrito cargado:", carrito);
    inicializarCarrito();
    configurarEventos();
});

/**
 * Inicializa la interfaz del carrito
 */
function inicializarCarrito() {
    actualizarCarritoHeader();
    renderizarCarrito();
    calcularTotal();
}

/**
 * Renderiza los productos en el carrito
 */
function renderizarCarrito() {
    if (rendering) return;  // Prevent multiple renders
    rendering = true;

    const tbody = document.getElementById('tablaCarritoBody');

    if (!tbody) {
        rendering = false;
        return;
    }

    // Recargar carrito del localStorage para asegurar sincronización
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    if (carrito.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="carrito-vacio" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🛒</div>
                    <h3 style="margin-bottom: 10px;">Tu carrito está vacío</h3>
                    <p style="color: #666; margin-bottom: 20px;">Agrega algunos productos para continuar</p>
                    <a href="catalogo.html" class="btn-signup" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Ir al Catálogo</a>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = carrito.map((producto, index) => {
        const precio = producto.precio || 0;
        const cantidad = producto.cantidad || 1;
        const subtotal = precio * cantidad;

        return `
        <tr>
            <td>
                <img src="${producto.imagen}"
                     alt="${producto.nombre}"
                     class="imagen-tabla"
                     style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;"
                     onerror="this.src='https://via.placeholder.com/100x100/cccccc/969696?text=Pastel'">
            </td>
            <td>
                <strong>${producto.nombre}</strong>
                ${producto.descripcion ? `<br><small style="color: #666;">${producto.descripcion}</small>` : ''}
            </td>
            <td>$${precio.toLocaleString('es-CL')}</td>
            <td>
                <div class="controles-cantidad" style="display: flex; align-items: center; gap: 10px; justify-content: center;">
                    <button class="btn-cantidad" onclick="disminuirCantidad(${index})" style="background: #dc3545; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-weight: bold;">-</button>
                    <span class="cantidad-actual" style="min-width: 30px; text-align: center; font-weight: 600;">${cantidad}</span>
                    <button class="btn-cantidad" onclick="aumentarCantidad(${index})" style="background: #28a745; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-weight: bold;">+</button>
                </div>
            </td>
            <td><strong>$${subtotal.toLocaleString('es-CL')}</strong></td>
            <td>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${index})"
                    style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: 600;">
                    🗑️ Eliminar
                </button>
            </td>
        </tr>
        `;
    }).join('');

    rendering = false;  // Reset flag after rendering
}



// EL RESTO DEL CÓDIGO PERMANECE IGUAL (las funciones de aumentar/disminuir cantidad, eliminar, calcular total, etc.)

/**
 * Aumenta la cantidad de un producto en el carrito
 */
function aumentarCantidad(index) {
    // Recargar carrito del localStorage
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    const producto = carrito[index];

    if (!producto) return;

    // Verificar stock antes de aumentar
    if (producto.stock !== undefined && producto.cantidad >= producto.stock) {
        mostrarNotificacion('No hay suficiente stock disponible', 'error');
        return;
    }

    carrito[index].cantidad = (carrito[index].cantidad || 1) + 1;
    guardarCarrito();
    renderizarCarrito();
    calcularTotal();

    mostrarNotificacion('Cantidad actualizada', 'success');
}

/**
 * Disminuye la cantidad de un producto en el carrito
 */
function disminuirCantidad(index) {
    // Recargar carrito del localStorage
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    const producto = carrito[index];

    if (!producto) return;

    if (carrito[index].cantidad > 1) {
        carrito[index].cantidad--;
        guardarCarrito();
        renderizarCarrito();
        calcularTotal();

        mostrarNotificacion('Cantidad actualizada', 'success');
    } else {
        mostrarNotificacion('La cantidad mínima es 1. Usa el botón eliminar si deseas quitar el producto.', 'info');
    }
}

/**
 * Elimina un producto del carrito
 */
function eliminarDelCarrito(index) {
    // Recargar carrito del localStorage
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    const producto = carrito[index];

    if (!producto) return;

    if (confirm(`¿Estás seguro de eliminar "${producto.nombre}" del carrito?`)) {
        const cantidadEliminada = producto.cantidad || 1;

        carrito.splice(index, 1);
        guardarCarrito();
        renderizarCarrito();
        calcularTotal();
        mostrarNotificacion(`"${producto.nombre}" eliminado del carrito`);
    }
}

/**
 * Calcula el total del carrito
 */
function calcularTotal() {
    // Recargar carrito del localStorage
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    const total = carrito.reduce((sum, producto) => {
        return sum + ((producto.precio || 0) * (producto.cantidad || 1));
    }, 0);
    
    const totalElement = document.getElementById('totalCarrito');
    if (totalElement) {
        totalElement.textContent = total.toLocaleString('es-CL');
    }
    
    actualizarCarritoHeader();
}

/**
 * Actualiza el header del carrito
 */
function actualizarCarritoHeader() {
    // Recargar carrito del localStorage
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    const totalProductos = carrito.reduce((sum, producto) => {
        return sum + (producto.cantidad || 1);
    }, 0);

    const total = carrito.reduce((sum, producto) => {
        return sum + ((producto.precio || 0) * (producto.cantidad || 1));
    }, 0);

    const carritoTotalElement = document.querySelector('.carrito-total');
    if (carritoTotalElement) {
        carritoTotalElement.textContent = total.toLocaleString('es-CL');
    }

    // Actualizar el enlace del carrito con la cantidad de productos
    const carritoLinkElement = document.getElementById('carrito-link');
    if (carritoLinkElement) {
        carritoLinkElement.textContent = `Carrito (${totalProductos})`;
    }
}

/**
 * Guarda el carrito en localStorage
 */
function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    console.log("Carrito guardado:", carrito);
}

/**
 * Limpia todo el carrito
 */
function limpiarCarrito() {
    // Recargar carrito del localStorage
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    if (carrito.length === 0) {
        mostrarNotificacion('El carrito ya está vacío', 'info');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
        carrito = [];
        guardarCarrito();
        renderizarCarrito();
        calcularTotal();
        mostrarNotificacion('Carrito vaciado correctamente');
    }
}

/**
 * Procesa la compra y genera boleta
 */
function irAlCheckout() {
    // Recargar carrito del localStorage
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    if (carrito.length === 0) {
        mostrarNotificacion('Agrega productos al carrito antes de continuar', 'error');
        return;
    }

    const total = carrito.reduce((sum, p) => sum + ((p.precio || 0) * (p.cantidad || 1)), 0);
    const totalProductos = carrito.reduce((sum, p) => sum + (p.cantidad || 1), 0);

    // Mostrar confirmación antes de generar la boleta
    if (confirm(`¿Confirmar compra?\n\nTotal: $${total.toLocaleString('es-CL')} CLP\nProductos: ${totalProductos}\n\nSe generará una boleta electrónica.`)) {
        // Generar número de boleta único
        const numeroBoleta = 'B' + Date.now().toString().slice(-8);
        const fecha = new Date().toLocaleDateString('es-CL');
        const hora = new Date().toLocaleTimeString('es-CL');

        // Crear contenido de la boleta
        const boletaHTML = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Boleta - Mil Sabores</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: #f5f5f5;
                    }
                    .boleta-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #e36b86;
                        padding-bottom: 20px;
                        margin-bottom: 20px;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #e36b86;
                        margin-bottom: 10px;
                    }
                    .info-boleta {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                        font-size: 14px;
                        color: #666;
                    }
                    .tabla-productos {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .tabla-productos th {
                        background: #f8f9fa;
                        padding: 12px;
                        text-align: left;
                        border-bottom: 2px solid #dee2e6;
                        font-weight: 600;
                    }
                    .tabla-productos td {
                        padding: 12px;
                        border-bottom: 1px solid #e9ecef;
                    }
                    .total-section {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        margin-top: 20px;
                    }
                    .total-grande {
                        font-size: 24px;
                        font-weight: bold;
                        color: #28a745;
                        margin: 10px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #dee2e6;
                        color: #666;
                        font-size: 12px;
                    }
                    .botones-boleta {
                        display: flex;
                        gap: 10px;
                        justify-content: center;
                        margin-top: 20px;
                    }
                    .btn-imprimir {
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 600;
                    }
                    .btn-volver {
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 600;
                        text-decoration: none;
                    }
                    @media print {
                        body { background: white; }
                        .boleta-container { box-shadow: none; }
                        .botones-boleta { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="boleta-container">
                    <div class="header">
                        <div class="logo">🍰 Mil Sabores</div>
                        <h1>BOLETA ELECTRÓNICA</h1>
                        <p>Pastelería Artesanal</p>
                    </div>

                    <div class="info-boleta">
                        <div>
                            <strong>N° Boleta:</strong> ${numeroBoleta}<br>
                            <strong>Fecha:</strong> ${fecha}<br>
                            <strong>Hora:</strong> ${hora}
                        </div>
                        <div style="text-align: right;">
                            <strong>Estado:</strong> <span style="color: #28a745;">PAGADO</span><br>
                            <strong>Productos:</strong> ${totalProductos}
                        </div>
                    </div>

                    <table class="tabla-productos">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cant.</th>
                                <th>P. Unitario</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${carrito.map((p, i) => {
                                const subtotal = (p.precio || 0) * (p.cantidad || 1);
                                return `
                                    <tr>
                                        <td>${p.nombre}</td>
                                        <td>${p.cantidad}</td>
                                        <td>$${(p.precio || 0).toLocaleString('es-CL')}</td>
                                        <td>$${subtotal.toLocaleString('es-CL')}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>

                    <div class="total-section">
                        <div style="font-size: 18px; font-weight: 600;">TOTAL A PAGAR</div>
                        <div class="total-grande">$${total.toLocaleString('es-CL')} CLP</div>
                        <div style="color: #666; font-size: 14px;">
                            IVA INCLUIDO • Método de pago: Transferencia
                        </div>
                    </div>

                    <div class="footer">
                        <p><strong>¡Gracias por su compra!</strong></p>
                        <p>Mil Sabores - Pastelería Artesanal<br>
                        Contacto: +56 9 8812 7156 • milsabores@tienda.com</p>
                        <p>Boleta electrónica generada automáticamente</p>
                    </div>

                    <div class="botones-boleta">
                        <button class="btn-imprimir" onclick="window.print()">🖨️ Imprimir Boleta</button>
                        <a href="carrito.html" class="btn-volver">← Volver al Carrito</a>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Abrir la boleta en una nueva ventana
        const ventanaBoleta = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
        ventanaBoleta.document.write(boletaHTML);
        ventanaBoleta.document.close();

        // Vaciar carrito después de generar boleta
        carrito = [];
        guardarCarrito();
        renderizarCarrito();
        calcularTotal();

        mostrarNotificacion('¡Compra realizada! Boleta generada correctamente ✓');
    }
}

/**
 * Muestra una notificación temporal
 */
function mostrarNotificacion(mensaje, tipo = 'success') {
    const colores = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8'
    };
    
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colores[tipo] || colores.success};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

/**
 * Configura los eventos de la página
 */
function configurarEventos() {
    const btnLimpiar = document.getElementById('btnLimpiarCarrito');
    const btnComprar = document.getElementById('btnComprarAhora');
    
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarCarrito);
    }
    
    if (btnComprar) {
        btnComprar.addEventListener('click', irAlCheckout);
    }
}

// Removed storage event listener to prevent flickering caused by constant re-rendering

// Hacer funciones disponibles globalmente
window.aumentarCantidad = aumentarCantidad;
window.disminuirCantidad = disminuirCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;

// Agregar estilos CSS para animaciones
const styles = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

console.log("Sistema de carrito inicializado correctamente");