import { db } from './firebase-config.js';

document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const productosGrid = document.getElementById("productosGrid");
  const tituloProductos = document.getElementById("titulo-productos");
  const cartLink = document.getElementById("cart-link");

  let productosGlobal = [];
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

  // Inicializar la aplicación
  actualizarContadorCarrito();
  cargarProductos();

  // Función para cargar productos desde Firestore (colección "oferta")
  async function cargarProductos() {
    try {
      console.log("Iniciando carga de ofertas...");
      if (tituloProductos) {
        tituloProductos.textContent = "Cargando ofertas...";
      }

      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const productosRef = collection(db, "oferta");
      const snapshot = await getDocs(productosRef);
      productosGlobal = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("Ofertas cargadas desde Firestore:", productosGlobal);

      if (productosGlobal.length > 0) {
        mostrarProductos(productosGlobal);
        if (tituloProductos) {
          tituloProductos.textContent = `Todas las Ofertas (${productosGlobal.length})`;
        }
      } else {
        console.log("No hay ofertas en Firestore");
        mostrarProductos([]);
        if (tituloProductos) {
          tituloProductos.textContent = "No hay ofertas disponibles";
        }
      }

    } catch (error) {
      console.error("Error cargando ofertas:", error);
      mostrarProductos([]);
      if (tituloProductos) {
        tituloProductos.textContent = "Error al cargar ofertas";
      }
    }
  }

  // Renderizar productos en el grid
  function mostrarProductos(productos) {
    if (!productosGrid) return;

    if (productos.length === 0) {
      productosGrid.innerHTML = `
        <div class="no-productos" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <p style="font-size: 18px; color: #666; margin-bottom: 15px;">No se encontraron ofertas</p>
          <a href="catalogo.html" class="btn-signup">Ver catálogo completo</a>
        </div>
      `;
      return;
    }

    productosGrid.innerHTML = productos.map(producto => {
      const precioOriginal = producto["precio original"] ? `<span class="precio-antes">$${producto["precio original"].toLocaleString('es-CL')} CLP</span>` : '';
      const precioOferta = producto.precio ? `$${producto.precio.toLocaleString('es-CL')} CLP` : 'Consultar';

      return `
        <article class="item producto-card" data-category="${producto.categoria || ''}" data-id="${producto.id}">
            <img src="${producto.imagen || 'https://via.placeholder.com/400x300/cccccc/969696?text=Imagen+No+Disponible'}"
                 alt="${producto.nombre || 'Sin nombre'}"
                 class="producto-imagen"
                 onerror="this.src='https://via.placeholder.com/400x300/cccccc/969696?text=Imagen+No+Disponible'">
          <div class="item-content producto-info">
            <h3 class="producto-nombre">${producto.nombre || 'Sin nombre'}</h3>
            <p>${producto.descripcion || ''}</p>
            <div class="precios-container" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div class="precio-original" style="text-decoration: line-through; color: #999;">${precioOriginal}</div>
              <div class="precio-oferta" style="color: #e36b86; font-weight: bold; font-size: 1.1rem;">${precioOferta}</div>
            </div>
            ${producto.stock ? `<p class="stock-info" style="font-size: 12px; color: #666;">Stock: ${producto.stock}</p>` : ''}
            <button class="btn-agregar btn-comprar" data-id="${producto.id}">
              🛒 Agregar al carrito
            </button>
          </div>
        </article>
      `;
    }).join("");

    // Agregar eventos a los botones
    document.querySelectorAll('.btn-agregar, .btn-comprar').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const productId = this.dataset.id;
        agregarAlCarrito(productId);
      });
    });
  }

  // Agregar producto al carrito
  async function agregarAlCarrito(productId) {
    const producto = productosGlobal.find(p => p.id === productId);

    if (!producto) {
      console.error('Producto no encontrado:', productId);
      mostrarNotificacion('Error al agregar el producto', 'error');
      return;
    }

    // Verificar stock si existe
    if (producto.stock !== undefined && producto.stock <= 0) {
      mostrarNotificacion('Producto sin stock disponible', 'error');
      return;
    }

    // Obtener carrito actualizado del localStorage
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    // Verificar si el producto ya está en el carrito
    const productoExistente = carrito.find(p => p.id === productId);

    if (productoExistente) {
      // Verificar stock antes de incrementar
      if (producto.stock !== undefined && productoExistente.cantidad >= producto.stock) {
        mostrarNotificacion('No hay suficiente stock disponible', 'error');
        return;
      }
      productoExistente.cantidad = (productoExistente.cantidad || 1) + 1;
    } else {
      // Agregar nuevo producto con cantidad 1
      carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        precioOriginal: producto["precio original"],
        imagen: producto.imagen,
        categoria: producto.categoria,
        stock: producto.stock,
        cantidad: 1
      });
    }

    // Guardar en localStorage
    localStorage.setItem('carrito', JSON.stringify(carrito));

    // Actualizar stock en Firebase si existe
    if (producto.stock !== undefined) {
      await actualizarStockFirebase(productId, -1);
    }

    // Actualizar UI
    actualizarContadorCarrito();

    mostrarNotificacion(`"${producto.nombre}" agregado al carrito ✓`);
    console.log('Carrito actualizado:', carrito);
  }

  // Actualizar stock en Firebase
  async function actualizarStockFirebase(productId, cambio) {
    try {
      const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const productoRef = doc(db, "oferta", productId);
      const productoDoc = await getDoc(productoRef);

      if (productoDoc.exists()) {
        const stockActual = productoDoc.data().stock;
        const nuevoStock = Math.max(0, stockActual + cambio);

        await updateDoc(productoRef, {
          stock: nuevoStock
        });

        // Actualizar stock local
        const producto = productosGlobal.find(p => p.id === productId);
        if (producto) {
          producto.stock = nuevoStock;
        }

        console.log(`Stock actualizado en Firebase: ${nuevoStock}`);
      }
    } catch (error) {
      console.error("Error actualizando stock:", error);
    }
  }

  // Actualizar contador de productos en el carrito
  function actualizarContadorCarrito() {
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    const totalProductos = carrito.reduce((sum, p) => sum + (p.cantidad || 1), 0);

    if (cartLink) {
      cartLink.textContent = `Carrito (${totalProductos})`;
    }
  }

  // Mostrar una notificación flotante
  function mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacion = document.createElement('div');
    const color = tipo === 'success' ? '#28a745' : '#dc3545';

    notificacion.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${color};
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

  // Escuchar cambios en localStorage (sincronización entre pestañas)
  window.addEventListener('storage', (e) => {
    if (e.key === 'carrito') {
      actualizarContadorCarrito();
    }
  });

  console.log("Ofertas inicializado correctamente");
});

// Agregar animaciones CSS
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
