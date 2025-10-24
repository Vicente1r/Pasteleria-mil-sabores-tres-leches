document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const dropdownCategorias = document.getElementById("dropdownCategorias");
  const cardsCategorias = document.getElementById("cardsCategorias");
  const productosGrid = document.getElementById("productosGrid");
  const tituloProductos = document.getElementById("tituloProductos");
  const buscador = document.getElementById("buscador");
  const btnBuscar = document.getElementById("btnBuscar");
  const carritoTotal = document.querySelector('.carrito-total');
  const btnVerTodos = document.getElementById("btnVerTodos");

  //Agregar referencia al botón del carrito
  const btnCarrito = document.querySelector('.btn-carrito');

  let productosGlobal = []; // Almacena todos los productos cargados desde Firestore
  let carrito = JSON.parse(localStorage.getItem('carrito')) || []; // Carrito de compras
  let categoriaActiva = 'todos'; // Categoría actualmente seleccionada

  // Configuración de Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyBBT7jka7a-7v3vY19BlSajamiedLrBTN0",
    authDomain: "tiendanombretienda.firebaseapp.com",
    projectId: "tiendanombretienda",
  };

  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // Inicializar la aplicación
  actualizarCarritoTotal();
  cargarProductos();
  // Función para cargar productos desde Firestore
  async function cargarProductos() {
    try {
      tituloProductos.textContent = "Cargando productos...";
      
      const snapshot = await db.collection("producto").get(); // Obtener colección "producto"
      productosGlobal = snapshot.docs.map(doc => ({ // Mapear documentos a objetos
        id: doc.id, // Incluir ID del documento
        ...doc.data() // Incluir datos del documento
      }));
      
       // === DEBUG STOCK - AGREGAR ESTO ===
      console.log("=== DEBUG STOCK EN FIREBASE ===");
      productosGlobal.forEach((producto, index) => {
        console.log(`Producto ${index}:`, {
          nombre: producto.nombre,
          stock: producto.stock,
          tipoStock: typeof producto.stock,
          id: producto.id
        });
      });
      console.log("Productos completos:", productosGlobal);
      // === FIN DEBUG ===

      console.log("Productos cargados:", productosGlobal); 
      inicializarInterfaz(productosGlobal); // Inicializar interfaz con productos
      
    } catch (error) {
      console.error("Error cargando productos:", error);
      tituloProductos.textContent = "Error al cargar productos";
      productosGrid.innerHTML = "<p class='error'>No se pudieron cargar los productos. Intenta recargar la página.</p>";
    }
  }
  // Inicializar la interfaz con categorías y productos
  function inicializarInterfaz(productos) {
    const categorias = obtenerCategoriasUnicas(productos);// Obtener categorías únicas
    
    // Inicializar dropdown de categorías
    mostrarDropdownCategorias(categorias);
    
    // Inicializar cards de categorías
    mostrarCardsCategorias(categorias);
    
    // Mostrar todos los productos inicialmente
    mostrarTodosLosProductos();
    
    // Configurar eventos
    configurarEventos();

    // AGREGAR ESTA LÍNEA para sincronización en tiempo real
    escucharCambiosStock();
  }
  // Obtener categorías únicas de los productos desde Firestore Database collection "producto"
  function obtenerCategoriasUnicas(productos) {
    const categoriasSet = new Set(); // Usar Set para evitar duplicados
    productos.forEach(producto => { // Asegurarse de que la categoría exista
      if (producto.categoria) { // Validar que la categoría no sea nula o indefinida
        categoriasSet.add(producto.categoria); // Agregar categoría al Set
      }
    });
    return Array.from(categoriasSet);// Convertir Set a Array
  }
  // Mostrar categorías en el dropdown y en las cards
  function mostrarDropdownCategorias(categorias) { // Incluye opción "Todos"
    //dropdownCategorias para el dropdown de categorías en el HTML
    dropdownCategorias.innerHTML = categorias.map(categoria => `
      <a href="#" class="dropdown-item" data-categoria="${categoria}">
        ${categoria}
      </a>
    `).join("");// Unir sin comas

    // Evento para items del dropdown
    dropdownCategorias.addEventListener('click', (e) => { // Delegación de eventos
      e.preventDefault(); // Prevenir comportamiento por defecto
      if (e.target.classList.contains('dropdown-item')) { // Verificar que el clic fue en un item
        const categoria = e.target.dataset.categoria;// Obtener categoría del data-attribute
        filtrarPorCategoria(categoria); // Filtrar productos por categoría
      }
    });
  }
  // Mostrar categorías como cards
  function mostrarCardsCategorias(categorias) {
    //cardsCategorias para el contenedor de las cards de categorías en el HTML
    cardsCategorias.innerHTML = categorias.map(categoria => `
      <div class="categoria-card" data-categoria="${categoria}">
        <div class="categoria-img">
          ${obtenerIconoCategoria(categoria)}
        </div>
        <div class="categoria-nombre">${categoria}</div>
      </div>
    `).join("");

    // Evento para cards de categorías
    cardsCategorias.addEventListener('click', (e) => { // Delegación de eventos
      const card = e.target.closest('.categoria-card'); // Buscar el elemento padre con la clase .categoria-card
      if (card) {
        const categoria = card.dataset.categoria; // Obtener categoría del data-attribute
        filtrarPorCategoria(categoria); // Filtrar productos por categoría
      }
    });
  }
  // Obtener un icono representativo para cada categoría
  function obtenerIconoCategoria(categoria) {
    const iconos = {
      'Ropa': '👕',
      'Tecnología': '💻',
      'Electrónica': '📱',
      'Hogar': '🏠',
      'Deportes': '⚽',
      'Zapatos': '👟',
      'Accesorios': '🕶️',
      'Libros': '📚',
      'Juguetes': '🧸',
      'Belleza': '💄'
    };
    return iconos[categoria] || '📦';
  }
  // Filtrar productos por categoría
  function filtrarPorCategoria(categoria) {
    const productosFiltrados = productosGlobal.filter(p => p.categoria === categoria); // Filtrar productos
    tituloProductos.textContent = `${categoria} (${productosFiltrados.length} productos)`; // Actualizar título
    categoriaActiva = categoria; // Actualizar categoría activa
    mostrarProductos(productosFiltrados); // Mostrar productos filtrados
  }
  // Mostrar todos los productos
  function mostrarTodosLosProductos() {
    tituloProductos.textContent = `Todos los productos (${productosGlobal.length})`; // Actualizar título
    categoriaActiva = 'todos'; // Actualizar categoría activa
    mostrarProductos(productosGlobal); // Mostrar todos los productos
    buscador.value = ''; // Limpiar buscador
  }
  // Renderizar productos en el grid
  function mostrarProductos(productos) {
    if (productos.length === 0) {
      productosGrid.innerHTML = `
        <div class="no-productos" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <p style="font-size: 18px; color: #666; margin-bottom: 15px;">No se encontraron productos</p>
          <button onclick="mostrarTodosLosProductos()" class="btn-signup">Ver todos los productos</button>
        </div>
      `;
      // Agregar evento al botón de "Ver Todos" en el mensaje de no productos
      //document.querySelector('.no-productos .btn-ver-todos').addEventListener('click', mostrarTodosLosProductos);
      return;
    }
    // Limpiar grid antes de renderizar
    productosGrid.innerHTML = productos.map(producto => `
      
      <div class="producto-card">
        <img src="${producto.imagen}" 
             alt="${producto.nombre}" 
             class="producto-imagen"
             onerror="this.src='https://via.placeholder.com/400x300/cccccc/969696?text=Imagen+No+Disponible'">
        <div class="producto-info">
          <h3 class="producto-nombre">${producto.nombre || 'Sin nombre'}</h3>
          <p class="producto-precio">$${(producto.precio || 0).toLocaleString('es-CL')}</p>

          <!--AGREGAR ESTA LÍNEA PARA MOSTRAR STOCK -->
          <p class="producto-stock">Stock: ${producto.stock}</p>
          
          <button class="btn-agregar" data-id="${producto.id}">
            🛒 Agregar al carrito
          </button>
        </div>
      </div>
    `).join("");

    // Agregar eventos a los botones de comprar
    document.querySelectorAll('.btn-agregar').forEach(btn => { // Seleccionar todos los botones
      btn.addEventListener('click', function() { // Usar función normal para mantener el contexto de 'this'
        const productId = this.dataset.id; // Obtener ID del producto desde data-attribute
        agregarAlCarrito(productId); // Agregar producto al carrito
      });
    });
  }
  // Agregar producto al carrito
  function agregarAlCarrito(productId) { // productId es el ID del producto a agregar
    const producto = productosGlobal.find(p => p.id === productId); // Buscar producto por ID
    
    //AGREGAR ESTA VALIDACIÓN SIMPLE
    const stockActual = producto.stock !== undefined ? producto.stock : 100;
    if (producto && stockActual <= 0) {
        mostrarNotificacion('Producto sin stock disponible', 'error');
        return;
    }
    
    if (producto) { // Validar que el producto exista
      // cambiar carrito.push(producto); por 
       // Verificar si el producto ya está en el carrito
      const productoExistente = carrito.find(item => item.id === productId);
      
      if (productoExistente) {
        // Si ya existe, aumentar la cantidad
        productoExistente.cantidad = (productoExistente.cantidad || 1) + 1;
      } else {
        // Si no existe, agregarlo con cantidad 1
        carrito.push({
          ...producto,
          cantidad: 1
        });
      }

      
      localStorage.setItem('carrito', JSON.stringify(carrito)); // Guardar carrito en localStorage
      actualizarCarritoTotal(); // Actualizar total del carrito
      
      // ACTUALIZAR STOCK EN FIREBASE - AGREGAR ESTA LÍNEA
      actualizarStockFirebase(productId, 1);

      // Mostrar feedback con notificación flotante
      mostrarNotificacion(`"${producto.nombre}" agregado al carrito`);// Mostrar notificación
      console.log('Producto agregado al carrito:', producto); // Log para debugging
    }
  }
 // Actualizar el total del carrito en el DOM
  function actualizarCarritoTotal() {
    const total = carrito.reduce((sum, producto) => sum + ((producto.precio || 0) * (producto.cantidad || 1)), 0); // Sumar precios, Modificar para que sea más precisa
    carritoTotal.textContent = total.toLocaleString('es-CL'); // Actualizar texto en el DOM con formato peso chileno
  }
  // Mostrar una notificación flotante al agregar al carrito
  function mostrarNotificacion(mensaje,  tipo = 'success') { // mensaje es el texto a mostrar // Se agrega tipo para futuros usos
    const notificacion = document.createElement('div'); // Crear un nuevo div

    //Agregar estilos al tipo de notificación
    const backgroundColor = tipo === 'success' ? '#28a745' : '#dc3545';

    //Cambiar background: #28a745; por backgroundColor y agregar transition: all 0.3s ease;
    notificacion.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${backgroundColor}; 
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2);
      font-weight: 600;
      transition: all 0.3s ease;
    `;
    notificacion.textContent = mensaje; // Establecer el mensaje
    document.body.appendChild(notificacion); // Agregar al body
    
    setTimeout(() => { // Desaparecer después de 3 segundos
      notificacion.remove(); // Remover del DOM
    }, 3000);
  }
  // Configurar eventos de botones y buscador
  function configurarEventos() {
    // Botón Ver Todos
    btnVerTodos.addEventListener('click', mostrarTodosLosProductos);

    // Buscador
    btnBuscar.addEventListener('click', buscarProductos);
    buscador.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') buscarProductos();
    });

    // Agregar Botón carrito redirige a la página del carrito
    btnCarrito.addEventListener('click', () => {
      // Redirigir a la página del carrito
      window.location.href = 'carrito.html';
    });

    // Carrito - mostrar resumen al hacer clic
    //document.querySelector('.btn-carrito').addEventListener('click', () => {
     // if (carrito.length === 0) {
       // alert('El carrito está vacío');
      //} else {
        //const total = carrito.reduce((sum, producto) => sum + (producto.precio || 0), 0);
      //  const productosLista = carrito.map(p => `• ${p.nombre} - $${p.precio?.toLocaleString('es-CL')}`).join('\n');
      //  alert(`CARRITO (${carrito.length} productos)\n\n${productosLista}\n\nTOTAL: $${total.toLocaleString('es-CL')}`);
     // }
    //});
  }
  // Buscar productos por nombre, categoría o descripción
  function buscarProductos() {
    const termino = buscador.value.toLowerCase().trim();
    if (!termino) {
      // Si no hay término, volver a mostrar según categoría activa
      if (categoriaActiva === 'todos') {
        mostrarTodosLosProductos();
      } else {
        filtrarPorCategoria(categoriaActiva);
      }
      return;
    }
    // Filtrar productos que coincidan con el término
    const productosFiltrados = productosGlobal.filter(p => 
      p.nombre?.toLowerCase().includes(termino) ||
      p.categoria?.toLowerCase().includes(termino) ||
      p.descripcion?.toLowerCase().includes(termino)
    );
    // Actualizar título y mostrar resultados
    tituloProductos.textContent = `Resultados para "${termino}" (${productosFiltrados.length})`;
    mostrarProductos(productosFiltrados);
  }

  // Funciones globales para debugging
  window.mostrarTodosLosProductos = mostrarTodosLosProductos;
  window.getProductosGlobal = () => productosGlobal;
  window.getCarrito = () => carrito;

  /**
   * Obtener el número total de items en el carrito
   */
  function obtenerTotalItemsCarrito() {
    return carrito.reduce((total, producto) => total + (producto.cantidad || 1), 0);
  }

  /**
   * Actualizar el contador de items en el carrito (si existe en el HTML)
   */
  function actualizarContadorItemsCarrito() {
    const contadorItems = document.querySelector('.carrito-count');
    if (contadorItems) {
      contadorItems.textContent = `(${obtenerTotalItemsCarrito()})`;
    }
  }

  //INICIALIZACIÓN ADICIONAL: Actualizar contadores al cargar
  actualizarContadorItemsCarrito();

  // Funciones globales para debugging (SE MANTIENEN)
  window.mostrarTodosLosProductos = mostrarTodosLosProductos;
  window.getProductosGlobal = () => productosGlobal;
  window.getCarrito = () => carrito;

  //NUEVAS FUNCIONES GLOBALES PARA EL SISTEMA DE CARRITO
  window.irAlCarrito = () => {
    window.location.href = 'carrito.html';
  };

  window.limpiarCarrito = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todo el carrito?')) {
      carrito = [];
      localStorage.removeItem('carrito');
      actualizarCarritoTotal();
      actualizarContadorItemsCarrito();
      mostrarNotificacion('Carrito limpiado correctamente');
    }
  };

    /**
   * Actualizar stock en Firebase cuando se agrega al carrito
   */
  async function actualizarStockFirebase(productId, cantidad) {
      try {
          const productoRef = db.collection("producto").doc(productId);
          const productoDoc = await productoRef.get();
          
          if (productoDoc.exists) {
              const stockActual = productoDoc.data().stock;
              const nuevoStock = stockActual - cantidad;
              
              await productoRef.update({
                  stock: nuevoStock
              });
              
              console.log(`Stock actualizado: ${productoDoc.data().nombre} - Nuevo stock: ${nuevoStock}`);
          }
      } catch (error) {
          console.error("Error actualizando stock en Firebase:", error);
      }
  }

  /**
   * Restaurar stock cuando se elimina del carrito
   */
  async function restaurarStockFirebase(productId, cantidad) {
      try {
          const productoRef = db.collection("producto").doc(productId);
          const productoDoc = await productoRef.get();
          
          if (productoDoc.exists) {
              const stockActual = productoDoc.data().stock;
              const nuevoStock = stockActual + cantidad;
              
              await productoRef.update({
                  stock: nuevoStock
              });
              
              console.log(`Stock restaurado: ${productoDoc.data().nombre} - Nuevo stock: ${nuevoStock}`);
          }
      } catch (error) {
          console.error("Error restaurando stock en Firebase:", error);
      }
  }

  /**
   * Escuchar cambios en el stock en tiempo real
   */
  function escucharCambiosStock() {
      db.collection("producto").onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
              if (change.type === "modified") {
                  const productoActualizado = {
                      id: change.doc.id,
                      ...change.doc.data()
                  };
                  
                  // Actualizar en productosGlobal
                  const index = productosGlobal.findIndex(p => p.id === productoActualizado.id);
                  if (index !== -1) {
                      productosGlobal[index] = productoActualizado;
                      
                      // Si estamos viendo productos de esta categoría, actualizar la vista
                      const productosActuales = categoriaActiva === 'todos' 
                          ? productosGlobal 
                          : productosGlobal.filter(p => p.categoria === categoriaActiva);
                      
                      if (productosActuales.some(p => p.id === productoActualizado.id)) {
                          mostrarProductos(productosActuales);
                      }
                  }
              }
          });
      });
  }

  /**
   * Limpiar carrito y restaurar todo el stock
   */
  async function limpiarCarritoYRestaurarStock() {
      if (carrito.length === 0) return;
      
      try {
          // Restaurar stock de todos los productos en el carrito
          for (const producto of carrito) {
              await restaurarStockFirebase(producto.id, producto.cantidad || 1);
          }
          
          carrito = [];
          localStorage.removeItem('carrito');
          actualizarCarritoTotal();
          actualizarContadorItemsCarrito();
          mostrarNotificacion('Carrito limpiado y stock restaurado');
      } catch (error) {
          console.error("Error limpiando carrito:", error);
      }
  }

  // Reemplazar la función global existente
  window.limpiarCarrito = limpiarCarritoYRestaurarStock;

  console.log("Catálogo inicializado correctamente");
});
