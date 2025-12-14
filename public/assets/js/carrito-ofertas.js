import { db } from './firebase-config.js';

document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const ofertasGrid = document.getElementById("ofertasGrid");

  // Inicializar la aplicación
  cargarOfertas();

  // Función para cargar ofertas desde Firestore (colección "oferta")
  async function cargarOfertas() {
    try {
      console.log("Iniciando carga de ofertas para carrito...");

      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const ofertasRef = collection(db, "oferta");
      const snapshot = await getDocs(ofertasRef);
      const ofertas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("Ofertas cargadas desde Firestore para carrito:", ofertas);

      if (ofertas.length > 0) {
        mostrarOfertas(ofertas);
      } else {
        console.log("No hay ofertas en Firestore");
        mostrarOfertas([]);
      }

    } catch (error) {
      console.error("Error cargando ofertas:", error);
      mostrarOfertas([]);
    }
  }

  // Renderizar ofertas en el grid del sidebar
  function mostrarOfertas(ofertas) {
    if (!ofertasGrid) return;

    if (ofertas.length === 0) {
      ofertasGrid.innerHTML = `
        <div class="no-ofertas" style="text-align: center; padding: 20px;">
          <p style="font-size: 14px; color: #666;">No hay ofertas disponibles</p>
        </div>
      `;
      return;
    }

    ofertasGrid.innerHTML = ofertas.slice(0, 4).map(oferta => { // Mostrar máximo 4 ofertas
      const precioOriginal = oferta["precio original"] ? `<span class="precio-antes">$${oferta["precio original"].toLocaleString('es-CL')} CLP</span>` : '';
      const precioOferta = oferta.precio ? `$${oferta.precio.toLocaleString('es-CL')} CLP` : 'Consultar';

      return `
        <article class="item producto-card" data-id="${oferta.id}">
          <img src="${oferta.imagen || 'https://via.placeholder.com/200x150/cccccc/969696?text=Imagen+No+Disponible'}"
               alt="${oferta.nombre || 'Sin nombre'}"
               class="producto-imagen"
               onerror="this.src='https://via.placeholder.com/200x150/cccccc/969696?text=Imagen+No+Disponible'">
          <div class="item-content producto-info">
            <h3 class="producto-nombre">${oferta.nombre || 'Sin nombre'}</h3>
            <div class="precios-container" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div class="precio-original" style="text-decoration: line-through; color: #999; font-size: 0.9rem;">${precioOriginal}</div>
              <div class="precio-oferta" style="color: #e36b86; font-weight: bold; font-size: 1rem;">${precioOferta}</div>
            </div>
            <button class="btn-agregar" data-id="${oferta.id}">
              🛒 Agregar
            </button>
          </div>
        </article>
      `;
    }).join("");

    // Agregar eventos a los botones
    document.querySelectorAll('.btn-agregar').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const productId = this.dataset.id;
        agregarAlCarrito(productId, ofertas);
      });
    });
  }

  // Agregar producto al carrito
  function agregarAlCarrito(productId, ofertas) {
    const oferta = ofertas.find(p => p.id === productId);

    if (!oferta) {
      console.error('Oferta no encontrada:', productId);
      mostrarNotificacion('Error al agregar la oferta', 'error');
      return;
    }

    // Obtener carrito actualizado del localStorage
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    // Verificar si el producto ya está en el carrito
    const productoExistente = carrito.find(p => p.id === productId);

    if (productoExistente) {
      productoExistente.cantidad = (productoExistente.cantidad || 1) + 1;
    } else {
      // Agregar nuevo producto con cantidad 1
      carrito.push({
        id: oferta.id,
        nombre: oferta.nombre,
        descripcion: oferta.descripcion,
        precio: oferta.precio,
        precioOriginal: oferta["precio original"],
        imagen: oferta.imagen,
        categoria: oferta.categoria,
        stock: oferta.stock,
        cantidad: 1
      });
    }

    // Guardar en localStorage
    localStorage.setItem('carrito', JSON.stringify(carrito));

    // Actualizar contador de carrito (si existe en esta página)
    const cartLink = document.getElementById("cart-link");
    if (cartLink) {
      const totalProductos = carrito.reduce((sum, p) => sum + (p.cantidad || 1), 0);
      cartLink.textContent = `🛒 Carrito (${totalProductos})`;
    }

    mostrarNotificacion(`"${oferta.nombre}" agregado al carrito ✓`);
    console.log('Carrito actualizado:', carrito);
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

  console.log("Carrito ofertas inicializado correctamente");
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
