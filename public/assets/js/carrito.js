document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const carritoVacio = document.getElementById('carrito-vacio');
  const carritoItems = document.getElementById('carrito-items');
  const carritoResumen = document.getElementById('carrito-resumen');
  const subtotalElement = document.getElementById('subtotal');
  const totalElement = document.getElementById('total');
  const btnSeguirComprando = document.getElementById('btn-seguir-comprando');
  const btnProcederPago = document.getElementById('btn-proceder-pago');
  const notificaciones = document.getElementById('notificaciones');

  let carrito = [];

  // Configuración de Firebase (igual que en catalogo.js)
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

  // Inicializar el carrito
  cargarCarrito();
  configurarEventos();
  actualizarContadorCarritoHeader();

  // Cargar carrito desde localStorage
  function cargarCarrito() {
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    if (carrito.length === 0) {
      mostrarCarritoVacio();
    } else {
      mostrarCarritoItems();
      actualizarResumen();
    }
  }

  // Mostrar mensaje de carrito vacío
  function mostrarCarritoVacio() {
    carritoVacio.style.display = 'block';
    carritoItems.style.display = 'none';
    carritoResumen.style.display = 'none';
  }

  // Mostrar items del carrito
  function mostrarCarritoItems() {
    carritoVacio.style.display = 'none';
    carritoItems.style.display = 'block';
    carritoResumen.style.display = 'block';

    carritoItems.innerHTML = carrito.map(item => generarHTMLItem(item)).join('');

    // Agregar eventos a los controles de cantidad y botones de eliminar
    document.querySelectorAll('.btn-menos').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.target.dataset.id;
        cambiarCantidad(itemId, -1);
      });
    });

    document.querySelectorAll('.btn-mas').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.target.dataset.id;
        cambiarCantidad(itemId, 1);
      });
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.target.dataset.id;
        eliminarItem(itemId);
      });
    });

    document.querySelectorAll('.cantidad-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const itemId = e.target.dataset.id;
        const nuevaCantidad = parseInt(e.target.value);
        if (nuevaCantidad > 0) {
          actualizarCantidad(itemId, nuevaCantidad);
        } else {
          e.target.value = 1;
        }
      });
    });
  }

  // Generar HTML para un item del carrito
  function generarHTMLItem(item) {
    const imagenSrc = item.imagen && item.imagen.startsWith('http')
      ? item.imagen
      : item.imagen
        ? `/assets/${item.imagen}`
        : 'https://via.placeholder.com/80x80/cccccc/969696?text=Sin+Imagen';

    const precio = item.precio || 0;
    const cantidad = item.cantidad || 1;
    const subtotal = precio * cantidad;

    return `
      <div class="carrito-item" data-id="${item.id}">
        <img src="${imagenSrc}"
             alt="${item.nombre}"
             class="item-imagen"
             onerror="this.src='https://via.placeholder.com/80x80/cccccc/969696?text=Sin+Imagen'">

        <div class="item-info">
          <h3 class="item-nombre">${item.nombre || 'Producto sin nombre'}</h3>
          <p class="item-descripcion">${item.descripcion || ''}</p>
          <p class="item-precio">$${(item.precio || 0).toLocaleString('es-CL')} CLP</p>
        </div>

        <div class="item-cantidad">
          <button class="btn-cantidad btn-menos" data-id="${item.id}" ${cantidad <= 1 ? 'disabled' : ''}>-</button>
          <input type="number" class="cantidad-input" data-id="${item.id}" value="${cantidad}" min="1" max="${item.stock || 999}">
          <button class="btn-cantidad btn-mas" data-id="${item.id}" ${item.stock && cantidad >= item.stock ? 'disabled' : ''}>+</button>
        </div>

        <div class="item-subtotal">$${subtotal.toLocaleString('es-CL')} CLP</div>

        <button class="btn-eliminar" data-id="${item.id}">Eliminar</button>
      </div>
    `;
  }

  // Cambiar cantidad de un item
  function cambiarCantidad(itemId, cambio) {
    const itemIndex = carrito.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const item = carrito[itemIndex];
    const nuevaCantidad = (item.cantidad || 1) + cambio;

    // Validar límites
    if (nuevaCantidad < 1) return;
    if (item.stock && nuevaCantidad > item.stock) {
      mostrarNotificacion('No hay suficiente stock disponible', 'error');
      return;
    }

    actualizarCantidad(itemId, nuevaCantidad);
  }

  // Actualizar cantidad específica
  function actualizarCantidad(itemId, nuevaCantidad) {
    const itemIndex = carrito.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const item = carrito[itemIndex];
    const cantidadAnterior = item.cantidad || 1;

    item.cantidad = nuevaCantidad;

    // Actualizar stock en Firebase si cambió la cantidad
    if (nuevaCantidad > cantidadAnterior) {
      // Se agregó más cantidad
      actualizarStockFirebase(itemId, -(nuevaCantidad - cantidadAnterior));
    } else if (nuevaCantidad < cantidadAnterior) {
      // Se redujo la cantidad
      actualizarStockFirebase(itemId, cantidadAnterior - nuevaCantidad);
    }

    guardarCarrito();
    mostrarCarritoItems();
    actualizarResumen();
    actualizarContadorCarritoHeader();

    mostrarNotificacion(`Cantidad actualizada: ${item.nombre}`);
  }

  // Eliminar item del carrito
  function eliminarItem(itemId) {
    const itemIndex = carrito.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const item = carrito[itemIndex];
    const cantidadEliminada = item.cantidad || 1;

    // Devolver stock a Firebase
    actualizarStockFirebase(itemId, cantidadEliminada);

    carrito.splice(itemIndex, 1);
    guardarCarrito();

    if (carrito.length === 0) {
      mostrarCarritoVacio();
    } else {
      mostrarCarritoItems();
      actualizarResumen();
    }

    mostrarNotificacion(`"${item.nombre}" eliminado del carrito`);
  }

  // Actualizar stock en Firebase
  async function actualizarStockFirebase(productId, cambio) {
    try {
      const productoRef = db.collection("producto").doc(productId);
      const productoDoc = await productoRef.get();

      if (productoDoc.exists) {
        const stockActual = productoDoc.data().stock;
        const nuevoStock = Math.max(0, stockActual + cambio);

        await productoRef.update({
          stock: nuevoStock
        });

        console.log(`Stock actualizado en Firebase: ${nuevoStock}`);
      }
    } catch (error) {
      console.error("Error actualizando stock:", error);
    }
  }

  // Actualizar resumen del carrito
  function actualizarResumen() {
    const subtotal = carrito.reduce((sum, item) => {
      const precio = item.precio || 0;
      const cantidad = item.cantidad || 1;
      return sum + (precio * cantidad);
    }, 0);

    const total = subtotal; // Por ahora no hay envío ni impuestos

    if (subtotalElement) {
      subtotalElement.textContent = `$${subtotal.toLocaleString('es-CL')} CLP`;
    }

    if (totalElement) {
      totalElement.textContent = `$${total.toLocaleString('es-CL')} CLP`;
    }
  }

  // Guardar carrito en localStorage
  function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }

  // Verificar si el usuario está logueado
  async function usuarioLogueado() {
    try {
      // Primero verificar localStorage para acceso rápido
      const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));
      console.log("Usuario en localStorage:", usuarioActual);

      if (usuarioActual && usuarioActual.correo && usuarioActual.nombre) {
        console.log("Usuario encontrado en localStorage, verificando Firestore...");

        // Verificar que la sesión esté activa en Firestore
        try {
          const sesionDoc = await db.collection("sesiones").doc(usuarioActual.correo).get();
          console.log("Documento de sesión existe:", sesionDoc.exists);

          if (sesionDoc.exists) {
            const sesionData = sesionDoc.data();
            console.log("Datos de sesión:", sesionData);
            return sesionData.activo === true;
          } else {
            console.log("No se encontró documento de sesión en Firestore");
            // Si no hay sesión en Firestore pero sí en localStorage, considerarlo válido
            return true;
          }
        } catch (firestoreError) {
          console.error("Error consultando Firestore:", firestoreError);
          // Si hay error con Firestore pero el usuario está en localStorage, permitir acceso
          return true;
        }
      }

      console.log("No se encontró usuario en localStorage");
      return false;
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      // En caso de error, verificar si al menos hay usuario en localStorage
      try {
        const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));
        return usuarioActual && usuarioActual.correo && usuarioActual.nombre;
      } catch {
        return false;
      }
    }
  }

  // Configurar eventos
  function configurarEventos() {
    if (btnSeguirComprando) {
      btnSeguirComprando.addEventListener('click', () => {
        window.location.href = 'catalogo.html';
      });
    }

    if (btnProcederPago) {
      btnProcederPago.addEventListener('click', () => {
        if (carrito.length === 0) {
          mostrarNotificacion('Tu carrito está vacío', 'error');
          return;
        }

        // Redirección directa sin mensajes de autenticación
        window.location.href = 'perfilCliente.html';
      });
    }

    // Escuchar cambios en localStorage (sincronización entre pestañas)
    window.addEventListener('storage', (e) => {
      if (e.key === 'carrito') {
        cargarCarrito();
      }
    });
  }

  // Mostrar notificación
  function mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo === 'error' ? 'error' : ''}`;
    notificacion.textContent = mensaje;

    notificaciones.appendChild(notificacion);

    // Auto-remover después de 3 segundos
    setTimeout(() => {
      notificacion.classList.add('fade-out');
      setTimeout(() => {
        if (notificacion.parentNode) {
          notificacion.parentNode.removeChild(notificacion);
        }
      }, 300);
    }, 3000);
  }

  // Actualizar contador del carrito en el header
  function actualizarContadorCarritoHeader() {
    const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    const carritoLink = document.querySelector('.usuario a[href*="carrito"]');

    if (carritoLink) {
      const textoBase = '🛒 Carrito';
      carritoLink.innerHTML = `${textoBase} (${totalItems})`;
    }
  }

  console.log("Carrito inicializado correctamente");
});
