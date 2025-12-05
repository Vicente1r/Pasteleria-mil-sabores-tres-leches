import { db } from './firebase-config.js';

document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const dropdownCategorias = document.getElementById("dropdownCategorias");
  const cardsCategorias = document.getElementById("cardsCategorias");
  const productosGrid = document.getElementById("productosGrid");
  const ofertasGrid = document.getElementById("ofertasGrid");
  const tituloProductos = document.getElementById("tituloProductos");
  const tituloOfertas = document.getElementById("titulo-ofertas");
  const buscador = document.getElementById("buscador");
  const btnBuscar = document.getElementById("btnBuscar");
  const carritoTotal = document.querySelector('.carrito-total');
  const btnVerTodos = document.getElementById("btnVerTodos");
  const cartLink = document.getElementById("cart-link");

  let productosGlobal = [];
  let ofertasGlobal = [];
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  let categoriaActiva = 'todos';

  // Inicializar la aplicación
  actualizarCarritoTotal();
  actualizarContadorCarrito();
  cargarProductos();
  cargarOfertasDestacadas();

  // Mock products (local images) — used as fallback or for testing offline
  const mockProducts = [
    { id: 'm-choco-1', nombre: 'Torta Chocolate 1', categoria: 'tortas_chocolate', descripcion: 'Deliciosa torta de chocolate', precio: 15000, imagen: 'torta_cuadrada_chocolate.png' },
    { id: 'm-choco-2', nombre: 'Torta Chocolate 2', categoria: 'tortas_chocolate', descripcion: 'Chocolate y cobertura', precio: 18000, imagen: 'vegana_torta_chocolate.png' },
    { id: 'm-circ-1', nombre: 'Torta Circular Vainilla', categoria: 'tortas_circulares', descripcion: 'Vainilla clásica', precio: 14000, imagen: 'torta_circular_vainilla.png' },
    { id: 'm-circ-2', nombre: 'Torta Circular Manjar', categoria: 'tortas_circulares', descripcion: 'Manjar y crema', precio: 16000, imagen: 'torta_circular_manjar.png' },
    { id: 'm-cua-1', nombre: 'Torta Cuadrada Frutas', categoria: 'tortas_cuadradas', descripcion: 'Frutas frescas', precio: 17000, imagen: 'torta_cuadrada_frutas2.png' },
    { id: 'm-cua-2', nombre: 'Torta Cuadrada Chocolate', categoria: 'tortas_cuadradas', descripcion: 'Chocolate especial', precio: 19000, imagen: 'cuadrada_chocolate2.png' },
    { id: 'm-ind-1', nombre: 'Tiramisú Individual', categoria: 'postres_individuales', descripcion: 'Porción individual', precio: 4500, imagen: 'individual_tiramisu_clasico.png' },
    { id: 'm-ind-2', nombre: 'Mousse Chocolate Individual', categoria: 'postres_individuales', descripcion: 'Mousse de chocolate', precio: 4200, imagen: 'individual_mousse_chocolate.png' }
  ];

  // Función para cargar productos desde Firestore
  async function cargarProductos() {
    try {
      if (tituloProductos) {
        tituloProductos.textContent = "Cargando productos...";
      }

      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const productosRef = collection(db, "producto");
      const snapshot = await getDocs(productosRef);
      productosGlobal = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("Productos cargados desde Firestore:", productosGlobal);

      if (productosGlobal.length > 0) {
        inicializarInterfaz(productosGlobal);
      } else {
        console.log("No hay productos en Firestore, usando mockProducts locales");
        productosGlobal = mockProducts.slice();
        inicializarInterfaz(productosGlobal);
      }

    } catch (error) {
      console.error("Error cargando productos:", error);
      console.log("Usando mockProducts locales como fallback");
      productosGlobal = mockProducts.slice();
      inicializarInterfaz(productosGlobal);
    }
  }

  // Función para cargar ofertas destacadas desde Firestore (colección "oferta")
  async function cargarOfertasDestacadas() {
    try {
      if (tituloOfertas) {
        tituloOfertas.textContent = "Cargando ofertas...";
      }

      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const ofertasRef = collection(db, "oferta");
      const snapshot = await getDocs(ofertasRef);
      ofertasGlobal = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("Ofertas destacadas cargadas desde Firestore:", ofertasGlobal);

      if (ofertasGlobal.length > 0) {
        mostrarOfertasDestacadas(ofertasGlobal.slice(0, 4)); // Mostrar máximo 4 ofertas
        if (tituloOfertas) {
          tituloOfertas.textContent = `Ofertas Especiales (${ofertasGlobal.length} disponibles)`;
        }
      } else {
        console.log("No hay ofertas en Firestore");
        mostrarOfertasDestacadas([]);
        if (tituloOfertas) {
          tituloOfertas.textContent = "No hay ofertas disponibles";
        }
      }

    } catch (error) {
      console.error("Error cargando ofertas destacadas:", error);
      mostrarOfertasDestacadas([]);
      if (tituloOfertas) {
        tituloOfertas.textContent = "Error al cargar ofertas";
      }
    }
  }

  // Función para mostrar ofertas destacadas
  function mostrarOfertasDestacadas(ofertas) {
    if (!ofertasGrid) return;

    if (ofertas.length === 0) {
      ofertasGrid.innerHTML = `
        <div class="no-ofertas" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <p style="font-size: 18px; color: #666; margin-bottom: 15px;">No hay ofertas disponibles en este momento</p>
        </div>
      `;
      return;
    }

    ofertasGrid.innerHTML = ofertas.map(oferta => `
      <article class="item producto-card oferta-card" data-category="${oferta.categoria}" data-id="${oferta.id}">
        <img src="${oferta.imagen}"
             alt="${oferta.nombre}"
             class="producto-imagen"
             onerror="this.src='https://via.placeholder.com/400x300/cccccc/969696?text=Oferta'">
        <div class="item-content producto-info">
          <h3 class="producto-nombre">${oferta.nombre || 'Sin nombre'}</h3>
          <p>${oferta.descripcion || ''}</p>
          <div class="precios-oferta" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span class="precio-anterior" style="text-decoration: line-through; color: #999; font-size: 0.9rem;">$${oferta["precio original"]?.toLocaleString('es-CL')}</span>
            <span class="precio-actual" style="color: #e36b86; font-weight: bold; font-size: 1.1rem;">$${oferta.precio?.toLocaleString('es-CL')}</span>
          </div>
          ${oferta.stock ? `<p class="stock-info" style="font-size: 12px; color: #666;">Stock: ${oferta.stock}</p>` : ''}
          <button class="btn-agregar-oferta btn-comprar" data-id="${oferta.id}">
            🛒 Agregar al carrito
          </button>
        </div>
      </article>
    `).join("");

    // Agregar eventos a los botones de ofertas
    document.querySelectorAll('.btn-agregar-oferta').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const productId = this.dataset.id;
        agregarOfertaAlCarrito(productId);
      });
    });
  }

  // Función para agregar oferta al carrito
  async function agregarOfertaAlCarrito(productId) {
    const oferta = ofertasGlobal.find(p => p.id === productId);

    if (!oferta) {
      console.error('Oferta no encontrada:', productId);
      mostrarNotificacion('Error al agregar la oferta', 'error');
      return;
    }

    // Verificar stock si existe
    if (oferta.stock !== undefined && oferta.stock <= 0) {
      mostrarNotificacion('Oferta sin stock disponible', 'error');
      return;
    }

    // Obtener carrito actualizado del localStorage
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    // Verificar si la oferta ya está en el carrito
    const ofertaExistente = carrito.find(p => p.id === productId);

    if (ofertaExistente) {
      // Verificar stock antes de incrementar
      if (oferta.stock !== undefined && ofertaExistente.cantidad >= oferta.stock) {
        mostrarNotificacion('No hay suficiente stock disponible', 'error');
        return;
      }
      ofertaExistente.cantidad = (ofertaExistente.cantidad || 1) + 1;
    } else {
      // Agregar nueva oferta con cantidad 1
      carrito.push({
        id: oferta.id,
        nombre: oferta.nombre,
        descripcion: oferta.descripcion,
        precio: oferta["precio oferta"] || oferta.Precio || oferta.precio || 0,
        precioAnterior: oferta["precio original"],
        imagen: oferta.imagen,
        categoria: oferta.categoria,
        stock: oferta.stock,
        cantidad: 1
      });
    }

    // Guardar en localStorage
    localStorage.setItem('carrito', JSON.stringify(carrito));

    // Actualizar stock en Firebase si existe
    if (oferta.stock !== undefined) {
      await actualizarStockFirebase(productId, -1);
    }

    // Actualizar UI
    actualizarCarritoTotal();
    actualizarContadorCarrito();

    mostrarNotificacion(`"${oferta.nombre}" agregado al carrito ✓`);
    console.log('Carrito actualizado con oferta:', carrito);
  }

  // Función para cargar productos desde el HTML existente (fallback)
  function cargarProductosDelHTML() {
    const productosHTML = document.querySelectorAll('.item[data-id]');
    productosGlobal = Array.from(productosHTML).map(item => {
      const id = item.dataset.id;
      const categoria = item.dataset.category;
      const nombre = item.querySelector('h3').textContent;
      const descripcion = item.querySelector('p:not(.precio)').textContent;
      const precioText = item.querySelector('.precio').textContent;
      const precio = parsearPrecio(precioText);
      const imagen = item.querySelector('img').src;

      return { id, categoria, nombre, descripcion, precio, imagen, stock: 100 };
    });

    console.log("Productos cargados del HTML:", productosGlobal);

    // Si no se encontraron productos en el HTML, usar mockProducts
    if (!productosGlobal || productosGlobal.length === 0) {
      productosGlobal = mockProducts.slice();
    }
    agregarEventosBotonesHTML();
    if (tituloProductos) {
      tituloProductos.textContent = `Todos los Productos (${productosGlobal.length})`;
    }
  }

  // Función para parsear precios del formato "$45.000 CLP" o "Consultar"
  function parsearPrecio(precioText) {
    if (!precioText || precioText.includes('Consultar') || precioText.includes('Cotizar')) {
      return 0;
    }
    const numeroLimpio = precioText.replace(/[^\d]/g, '');
    return parseInt(numeroLimpio) || 0;
  }

  // Agregar eventos a los botones que ya están en el HTML
  function agregarEventosBotonesHTML() {
    document.querySelectorAll('.btn-comprar, .btn-agregar').forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const productId = this.dataset.id;
        agregarAlCarrito(productId);
      });
    });
  }

  // Inicializar la interfaz con categorías y productos
  function inicializarInterfaz(productos) {
    const categorias = obtenerCategoriasUnicas(productos);

    if (dropdownCategorias) {
      mostrarDropdownCategorias(categorias);
    }

    if (cardsCategorias) {
      mostrarCardsCategorias(categorias);
    }

    // Mostrar todos los productos en una cuadrícula
    if (productos.length > 0) {
      mostrarProductos(productos);
    }

    configurarEventos();
  }

  // Mostrar las categorías en secciones apiladas (Category 1, 2, 3, 4)
  function mostrarCategoriasStacked() {
    if (!productosGrid) return;

    const categoriasOrden = [
      'tortas_chocolate',
      'tortas_circulares',
      'tortas_cuadradas',
      'postres_individuales'
    ];

    const labelMap = {
      'tortas_chocolate': 'Categoría 1',
      'tortas_circulares': 'Categoría 2',
      'tortas_cuadradas': 'Categoría 3',
      'postres_individuales': 'Categoría 4'
    };

    productosGrid.innerHTML = categoriasOrden.map(cat => {
      let productosCat = productosGlobal.filter(p => p.categoria === cat);
      const header = `<h3 id="section-${cat}" class="category-section-title">${labelMap[cat] || cat}</h3>`;
      // si no hay productos reales, crear mock visuales basados en la imagen por categoría
      if (!productosCat || productosCat.length === 0) {
        productosCat = Array.from({ length: 4 }).map((_, i) => ({
          id: `mock-${cat}-${i+1}`,
          nombre: `${labelMap[cat] || cat} - Producto ${i+1}`,
          descripcion: '',
          precio: 0,
          categoria: cat,
          imagen: imagenPorCategoria(cat),
          stock: undefined
        }));
      }

      const grid = `
        <div class="category-grid" data-category="${cat}">
          ${productosCat.map(producto => generarCardProductoHTML(producto)).join('')}
        </div>
      `;

      // envolver en sección para forzar apilado vertical y permitir scroll/anchor
      return `<section class="category-section" id="section-wrapper-${cat}">${header}${grid}</section>`;
    }).join('');

    // Añadir eventos a los botones dentro de las secciones
    document.querySelectorAll('.btn-agregar, .btn-comprar').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const productId = this.dataset.id;
        agregarAlCarrito(productId);
      });
    });
  }

  // Generador de HTML para una tarjeta de producto (reutilizable)
  function generarCardProductoHTML(producto) {
    let imagenSrc = producto.imagen || '';
    if (!imagenSrc) {
      imagenSrc = imagenPorCategoria(producto.categoria);
    } else if (!imagenSrc.startsWith('http') && !imagenSrc.startsWith('/')) {
      imagenSrc = `/assets/${imagenSrc}`;
    }

    return `
      <article class="item producto-card" data-category="${producto.categoria}" data-id="${producto.id}">
        <img src="${imagenSrc}"
             alt="${producto.nombre}"
             class="producto-imagen"
             onerror="this.src='https://via.placeholder.com/400x300/cccccc/969696?text=Imagen+No+Disponible'">
        <div class="item-content producto-info">
          <h3 class="producto-nombre">${producto.nombre || 'Sin nombre'}</h3>
          <p>${producto.descripcion || ''}</p>
          <p class="producto-precio precio">$${(producto.precio || 0).toLocaleString('es-CL')} CLP</p>
          ${producto.stock ? `<p class="stock-info" style="font-size: 12px; color: #666;">Stock: ${producto.stock}</p>` : ''}
          <button class="btn-agregar btn-comprar" data-id="${producto.id}">
            🛒 Agregar al carrito
          </button>
        </div>
      </article>
    `;
  }

  // Obtener categorías únicas de los productos
  function obtenerCategoriasUnicas(productos) {
    const categoriasSet = new Set();
    productos.forEach(producto => {
      if (producto.categoria) {
        categoriasSet.add(producto.categoria);
      }
    });
    return Array.from(categoriasSet);
  }

  // Mostrar categorías en el dropdown
  function mostrarDropdownCategorias(categorias) {
    dropdownCategorias.innerHTML = categorias.map(categoria => `
      <a href="#" class="dropdown-item" data-categoria="${categoria}">
        ${categoria}
      </a>
    `).join("");

    dropdownCategorias.addEventListener('click', (e) => {
      e.preventDefault();
      if (e.target.classList.contains('dropdown-item')) {
        const categoria = e.target.dataset.categoria;
        filtrarPorCategoria(categoria);
      }
    });
  }

  // Mostrar categorías como cards
  function mostrarCardsCategorias(categorias) {
    cardsCategorias.innerHTML = categorias.map(categoria => `
      <div class="categoria-card" data-categoria="${categoria}">
        <div class="categoria-img">
          ${obtenerIconoCategoria(categoria)}
        </div>
        <div class="categoria-nombre">${categoria}</div>
      </div>
    `).join("");

    cardsCategorias.addEventListener('click', (e) => {
      const card = e.target.closest('.categoria-card');
      if (card) {
        const categoria = card.dataset.categoria;
        filtrarPorCategoria(categoria);
      }
    });
  }

  // Obtener un icono representativo para cada categoría
  function obtenerIconoCategoria(categoria) {
    const iconos = {
      'tortas_cuadradas': '🎂',
      'tortas_circulares': '🍰',
      'postres_individuales': '🧁',
      'productos_sin_azucar': '🍯',
      'pasteleria_tradicional': '🥐',
      'productos_sin_gluten': '🌾',
      'vegano': '🌱',
      'especiales': '✨'
    };
    return iconos[categoria] || '🍰';
  }

  // Filtrar productos por categoría
  function filtrarPorCategoria(categoria) {
    const productosFiltrados = productosGlobal.filter(p => p.categoria === categoria);
    if (tituloProductos) {
      tituloProductos.textContent = `${categoria} (${productosFiltrados.length} productos)`;
    }
    categoriaActiva = categoria;
    mostrarProductos(productosFiltrados);
  }

  // Mostrar todos los productos
  function mostrarTodosLosProductos() {
    if (tituloProductos) {
      tituloProductos.textContent = `Todos los productos (${productosGlobal.length})`;
    }
    categoriaActiva = 'todos';
    mostrarProductos(productosGlobal);
    if (buscador) {
      buscador.value = '';
    }
  }

  // Renderizar productos en el grid
  function mostrarProductos(productos) {
    if (!productosGrid) return;

    if (productos.length === 0) {
      productosGrid.innerHTML = `
        <div class="no-productos" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <p style="font-size: 18px; color: #666; margin-bottom: 15px;">No se encontraron productos</p>
          <button onclick="mostrarTodosLosProductos()" class="btn-signup">Ver todos los productos</button>
        </div>
      `;
      return;
    }

    productosGrid.innerHTML = productos.map(producto => {
      // resolver imagen: si es URL absoluta usarla; si es un nombre de archivo local, prepender '../' (porque la página está en /assets/page/)
      let imagenSrc = producto.imagen || '';
      if (!imagenSrc) {
        // asignar imagen según categoría si está faltando
        imagenSrc = imagenPorCategoria(producto.categoria);
      } else if (!imagenSrc.startsWith('http') && !imagenSrc.startsWith('/')) {
        imagenSrc = `/assets/${imagenSrc}`;
      }

      return `
      <article class="item producto-card" data-category="${producto.categoria}" data-id="${producto.id}">
        <img src="${imagenSrc}"
             alt="${producto.nombre}"
             class="producto-imagen"
             onerror="this.src='https://via.placeholder.com/400x300/cccccc/969696?text=Imagen+No+Disponible'">
        <div class="item-content producto-info">
          <h3 class="producto-nombre">${producto.nombre || 'Sin nombre'}</h3>
          <p>${producto.descripcion || ''}</p>
          <p class="producto-precio precio">$${(producto.precio || 0).toLocaleString('es-CL')} CLP</p>
          ${producto.stock ? `<p class="stock-info" style="font-size: 12px; color: #666;">Stock: ${producto.stock}</p>` : ''}
          <button class="btn-agregar btn-comprar" data-id="${producto.id}">
            🛒 Agregar al carrito
          </button>
        </div>
      </article>
    `;
    }).join("");


  // Devuelve una ruta de imagen local por categoría (relativa desde /assets/page/)
  function imagenPorCategoria(categoria) {
    const mapa = {
      'tortas_chocolate': '/assets/torta1.jpg',
      'tortas_circulares': '/assets/torta_circular_vainilla.png',
      'tortas_cuadradas': '/assets/torta_cuadrada_frutas2.png',
      'postres_individuales': '/assets/individual_tiramisu_clasico.png'
    };
    return mapa[categoria] || '/assets/tarta1.jpg';
  }
    // Agregar eventos a los botones
    document.querySelectorAll('.btn-agregar, .btn-comprar').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const productId = this.dataset.id;
        agregarAlCarrito(productId);
      });
    });
  }

  // Agregar producto al carrito - FUNCIÓN CLAVE ACTUALIZADA
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
        precio: producto.precio || 0,
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
    actualizarCarritoTotal();
    actualizarContadorCarrito();
    
    mostrarNotificacion(`"${producto.nombre}" agregado al carrito ✓`);
    console.log('Carrito actualizado:', carrito);
  }

  // Actualizar stock en Firebase
  async function actualizarStockFirebase(productId, cambio) {
    try {
      const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const productoRef = doc(db, "producto", productId);
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

  // Actualizar el total del carrito en el DOM
  function actualizarCarritoTotal() {
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    const total = carrito.reduce((sum, producto) => {
      const precio = producto.precio || 0;
      const cantidad = producto.cantidad || 1;
      return sum + (precio * cantidad);
    }, 0);
    
    if (carritoTotal) {
      carritoTotal.textContent = total.toLocaleString('es-CL');
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

  // Configurar eventos de botones y buscador
  function configurarEventos() {
    if (btnVerTodos) {
      btnVerTodos.addEventListener('click', mostrarTodosLosProductos);
    }

    if (btnBuscar && buscador) {
      btnBuscar.addEventListener('click', buscarProductos);
      buscador.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarProductos();
      });
    }

    const btnCarrito = document.querySelector('.btn-carrito');
    if (btnCarrito) {
      btnCarrito.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'carrito.html';
      });
    }

    // Compatibilidad con la versión estática: responder a los botones .category-thumb
    document.querySelectorAll('.category-thumb').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.filter;
        if (!val || val === 'all' || val === 'todos') {
          mostrarTodosLosProductos();
        } else {
          filtrarPorCategoria(val);
        }
      });
    });
  }

  // Buscar productos
  function buscarProductos() {
    const termino = buscador.value.toLowerCase().trim();
    
    if (!termino) {
      if (categoriaActiva === 'todos') {
        mostrarTodosLosProductos();
      } else {
        filtrarPorCategoria(categoriaActiva);
      }
      return;
    }

    const productosFiltrados = productosGlobal.filter(p => 
      p.nombre?.toLowerCase().includes(termino) ||
      p.categoria?.toLowerCase().includes(termino) ||
      p.descripcion?.toLowerCase().includes(termino)
    );

    if (tituloProductos) {
      tituloProductos.textContent = `Resultados para "${termino}" (${productosFiltrados.length})`;
    }
    mostrarProductos(productosFiltrados);
  }

  // Escuchar cambios en localStorage (sincronización entre pestañas)
  window.addEventListener('storage', (e) => {
    if (e.key === 'carrito') {
      actualizarCarritoTotal();
      actualizarContadorCarrito();
    }
  });

  // Funciones globales
  window.mostrarTodosLosProductos = mostrarTodosLosProductos;
  window.getProductosGlobal = () => productosGlobal;
  window.getCarrito = () => JSON.parse(localStorage.getItem('carrito')) || [];

  console.log("Catálogo inicializado correctamente");
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