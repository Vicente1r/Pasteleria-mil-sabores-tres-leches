// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBBT7jka7a-7v3vY19BlSajamiedLrBTN0",
    authDomain: "tiendanombretienda.firebaseapp.com",
    projectId: "tiendanombretienda",
};

// Inicializar Firebase solo si no está inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Variables globales
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let productosOferta = [];

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log("Carrito cargado:", carrito);
    inicializarCarrito();
    cargarProductosOferta();
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
 * Carga productos en oferta desde Firestore
 */
async function cargarProductosOferta() {
    try {
        const snapshot = await db.collection("producto").get();
        productosOferta = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Filtrar productos con oferta (precio anterior)
        const productosConOferta = productosOferta.filter(producto => producto.precioAnterior);
        renderizarProductosOferta(productosConOferta);
    } catch (error) {
        console.error("Error cargando productos en oferta:", error);
    }
}

/**
 * Renderiza los productos en oferta
 */
function renderizarProductosOferta(productos) {
    const contenedor = document.getElementById('productosOferta');
    
    if (!contenedor) return;
    
    if (productos.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; color: #666;">No hay productos en oferta en este momento.</p>';
        return;
    }

    contenedor.innerHTML = productos.map(producto => `
        <div class="producto-card">
            <img src="${producto.imagen}" 
                 alt="${producto.nombre}" 
                 class="producto-imagen"
                 onerror="this.src='https://via.placeholder.com/400x300/cccccc/969696?text=Imagen+No+Disponible'">
            <div class="producto-info">
                <h3 class="producto-nombre">${producto.nombre}</h3>
                <div class="precios-oferta">
                    <span class="precio-anterior">$${producto.precioAnterior?.toLocaleString('es-CL')}</span>
                    <span class="precio-actual">$${producto.precio?.toLocaleString('es-CL')}</span>
                </div>
                <p class="stock-disponible">Stock: ${producto.stock || 10}</p>
                <button class="btn-agregar-oferta" data-id="${producto.id}">
                    Añadir al carrito
                </button>
            </div>
        </div>
    `).join('');

    // Agregar eventos a los botones de añadir
    document.querySelectorAll('.btn-agregar-oferta').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            agregarProductoAlCarrito(productId);
        });
    });
}

/**
 * Renderiza los productos en el carrito
 */
function renderizarCarrito() {
    const tbody = document.getElementById('tablaCarritoBody');
    
    if (!tbody) return;
    
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
                     onerror="this.src='https://via.placeholder.com/100x100/cccccc/969696?text=Imagen'">
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
}

/**
 * Agrega un producto al carrito desde la sección de ofertas
 */
async function agregarProductoAlCarrito(productId) {
    const producto = productosOferta.find(p => p.id === productId);
    
    if (!producto) {
        mostrarNotificacion('Producto no encontrado', 'error');
        return;
    }
    
    // Verificar stock antes de agregar
    if (producto.stock !== undefined && producto.stock <= 0) {
        mostrarNotificacion('Producto sin stock disponible', 'error');
        return;
    }
    
    // Recargar carrito del localStorage
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    // Verificar si el producto ya está en el carrito
    const productoExistente = carrito.find(item => item.id === productId);
    
    if (productoExistente) {
        // Verificar stock antes de incrementar
        if (producto.stock !== undefined && productoExistente.cantidad >= producto.stock) {
            mostrarNotificacion('No hay suficiente stock disponible', 'error');
            return;
        }
        productoExistente.cantidad = (productoExistente.cantidad || 1) + 1;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio,
            imagen: producto.imagen,
            categoria: producto.categoria,
            stock: producto.stock,
            cantidad: 1
        });
    }
    
    guardarCarrito();
    renderizarCarrito();
    calcularTotal();
    
    // Actualizar stock en Firebase
    if (producto.stock !== undefined) {
        await actualizarStockFirebase(productId, -1);
    }
    
    mostrarNotificacion(`"${producto.nombre}" agregado al carrito ✓`);
}

/**
 * Actualizar stock en Firebase
 */
async function actualizarStockFirebase(productId, cambio) {
    try {
        const productoRef = db.collection("producto").doc(productId);
        const productoDoc = await productoRef.get();
        
        if (productoDoc.exists) {
            const stockActual = productoDoc.data().stock || 0;
            const nuevoStock = Math.max(0, stockActual + cambio);
            
            await productoRef.update({
                stock: nuevoStock
            });
            
            console.log(`Stock actualizado en Firebase: ${nuevoStock}`);
        }
    } catch (error) {
        console.error("Error actualizando stock en Firebase:", error);
    }
}

/**
 * Aumenta la cantidad de un producto en el carrito
 */
async function aumentarCantidad(index) {
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
    
    // Actualizar stock en Firebase
    if (producto.stock !== undefined) {
        await actualizarStockFirebase(producto.id, -1);
    }
    
    mostrarNotificacion('Cantidad actualizada', 'success');
}

/**
 * Disminuye la cantidad de un producto en el carrito
 */
async function disminuirCantidad(index) {
    // Recargar carrito del localStorage
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    const producto = carrito[index];
    
    if (!producto) return;
    
    if (carrito[index].cantidad > 1) {
        carrito[index].cantidad--;
        guardarCarrito();
        renderizarCarrito();
        calcularTotal();
        
        // Restaurar stock en Firebase
        if (producto.stock !== undefined) {
            await actualizarStockFirebase(producto.id, 1);
        }
        
        mostrarNotificacion('Cantidad actualizada', 'success');
    } else {
        mostrarNotificacion('La cantidad mínima es 1. Usa el botón eliminar si deseas quitar el producto.', 'info');
    }
}

/**
 * Elimina un producto del carrito
 */
async function eliminarDelCarrito(index) {
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

        // Restaurar stock en Firebase
        if (producto.stock !== undefined) {
            await actualizarStockFirebase(producto.id, cantidadEliminada);
        }
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
    
    const total = carrito.reduce((sum, producto) => {
        return sum + ((producto.precio || 0) * (producto.cantidad || 1));
    }, 0);
    
    const carritoTotalElement = document.querySelector('.carrito-total');
    if (carritoTotalElement) {
        carritoTotalElement.textContent = total.toLocaleString('es-CL');
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
 * Procesa la compra
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
    
    // Crear mensaje para WhatsApp
    let mensaje = `🛒 *NUEVO PEDIDO - Mil Sabores*\n\n`;
    mensaje += `📦 Total de productos: ${totalProductos}\n\n`;
    mensaje += `*DETALLE DEL PEDIDO:*\n`;
    
    carrito.forEach((p, i) => {
        const subtotal = (p.precio || 0) * (p.cantidad || 1);
        mensaje += `\n${i + 1}. *${p.nombre}*\n`;
        mensaje += `   Cantidad: ${p.cantidad}\n`;
        mensaje += `   Precio unitario: $${(p.precio || 0).toLocaleString('es-CL')}\n`;
        mensaje += `   Subtotal: $${subtotal.toLocaleString('es-CL')}\n`;
    });
    
    mensaje += `\n━━━━━━━━━━━━━━━━\n`;
    mensaje += `💰 *TOTAL A PAGAR: $${total.toLocaleString('es-CL')} CLP*`;
    
    // Reemplaza con tu número de WhatsApp (formato: 56912345678 para Chile)
    const numeroWhatsApp = '56912345678';
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    
    if (confirm(`Se abrirá WhatsApp para confirmar tu pedido.\n\nTotal: $${total.toLocaleString('es-CL')} CLP\n\n¿Continuar?`)) {
        window.open(url, '_blank');
        
        // Opcional: Vaciar carrito después de enviar
        // carrito = [];
        // guardarCarrito();
        // renderizarCarrito();
        // calcularTotal();
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

// Escuchar cambios en localStorage (sincronización entre pestañas)
window.addEventListener('storage', (e) => {
    if (e.key === 'carrito') {
        console.log("Carrito actualizado desde otra pestaña");
        carrito = JSON.parse(e.newValue) || [];
        renderizarCarrito();
        calcularTotal();
    }
});

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