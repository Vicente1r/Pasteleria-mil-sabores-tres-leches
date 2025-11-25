import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Carrito.css';

/**
 * Componente del Carrito de Compras
 * Muestra productos en oferta y productos generales y el resumen del carrito
 */
const Carrito = () => {
  const [carrito, setCarrito] = useState([]);
  const [productosOferta, setProductosOferta] = useState([]);
  const [productosGenerales, setProductosGenerales] = useState([]);
  const [cargandoOferta, setCargandoOferta] = useState(true);
  const [cargandoGenerales, setCargandoGenerales] = useState(true);
  const navigate = useNavigate();

  // Cargar carrito desde localStorage al inicializar
  useEffect(() => {
    const carritoGuardado = JSON.parse(localStorage.getItem('carrito')) || [];
    setCarrito(carritoGuardado);
    cargarProductosOferta();
    cargarProductosGenerales();
  }, []);

  // Escuchar cambios en localStorage (para sincronizar con cambios desde otras pestañas o carrito.html)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'carrito') {
        const nuevoCarrito = JSON.parse(e.newValue) || [];
        setCarrito(nuevoCarrito);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /**
   * Carga productos en oferta desde Firestore (colección "oferta")
   */
  const cargarProductosOferta = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'oferta'));
      const productos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProductosOferta(productos);
    } catch (error) {
      console.error('Error cargando productos en oferta:', error);
      setProductosOferta([]);
    } finally {
      setCargandoOferta(false);
    }
  };

  /**
   * Carga productos generales desde Firestore (colección "producto")
   */
  const cargarProductosGenerales = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'producto'));
      const productos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProductosGenerales(productos);
    } catch (error) {
      console.error('Error cargando productos generales:', error);
      setProductosGenerales([]);
    } finally {
      setCargandoGenerales(false);
    }
  };

  /**
   * Actualiza stock en Firestore
   */
  const actualizarStockFirebase = async (productId, cambio, tipoProducto) => {
    try {
      const collectionName = tipoProducto === 'oferta' ? 'oferta' : 'producto';
      const productoRef = doc(db, collectionName, productId);
      const productoSnap = await getDocs(collection(db, collectionName));
      const productoData = productosOferta.find(p => p.id === productId) || productosGenerales.find(p => p.id === productId);

      if (!productoData) {
        console.warn('Producto no encontrado para actualizar stock:', productId);
        return;
      }

      const nuevoStock = (productoData.stock || 0) + cambio;
      if (nuevoStock < 0) {
        alert('No hay suficiente stock disponible para este producto.');
        return;
      }

      await updateDoc(productoRef, {
        stock: nuevoStock,
      });

      // Actualizar stock local
      if (tipoProducto === 'oferta') {
        setProductosOferta(prev => prev.map(p => p.id === productId ? { ...p, stock: nuevoStock } : p));
      } else {
        setProductosGenerales(prev => prev.map(p => p.id === productId ? { ...p, stock: nuevoStock } : p));
      }
    } catch (error) {
      console.error('Error actualizando stock en Firestore:', error);
    }
  };

  /**
   * Agrega un producto al carrito con verificación de stock y actualización Firestore
   */
  const agregarAlCarrito = async (producto, tipoProducto) => {
    if (!producto || producto.stock <= 0) {
      alert('Producto sin stock disponible');
      return;
    }
    const productoExistente = carrito.find(item => item.id === producto.id);
    let nuevoCarrito;

    if (productoExistente) {
      // Verificar stock antes de incrementar
      if (productoExistente.cantidad >= producto.stock) {
        alert('No hay suficiente stock disponible para incrementar cantidad');
        return;
      }
      nuevoCarrito = carrito.map(item =>
        item.id === producto.id
          ? { ...item, cantidad: (item.cantidad || 1) + 1 }
          : item
      );
    } else {
      nuevoCarrito = [...carrito, { ...producto, cantidad: 1, tipo: tipoProducto }];
    }

    setCarrito(nuevoCarrito);
    guardarCarrito(nuevoCarrito);
    mostrarNotificacion(`"${producto.nombre}" agregado al carrito`);

    // Actualizar stock en Firestore
    await actualizarStockFirebase(producto.id, -1, tipoProducto);
  };

  /**
   * Actualiza la cantidad de un producto en el carrito, validando stock y cambiando Firestore
   */
  const actualizarCantidad = async (index, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;

    const producto = carrito[index];
    if (!producto) return;

    // Verificar stock para incremento
    if (nuevaCantidad > producto.cantidad) {
      const incremento = nuevaCantidad - producto.cantidad;
      if ((producto.stock || 0) < incremento) {
        alert('No hay suficiente stock disponible para incrementar cantidad');
        return;
      }
      // Actualizar stock Firestore restando incremento
      await actualizarStockFirebase(producto.id, -incremento, producto.tipo);
    } else if (nuevaCantidad < producto.cantidad) {
      // Incrementar stock Firestore al reducir cantidad
      const decremento = producto.cantidad - nuevaCantidad;
      await actualizarStockFirebase(producto.id, decremento, producto.tipo);
    }

    const nuevoCarrito = carrito.map((item, i) =>
      i === index ? { ...item, cantidad: nuevaCantidad } : item
    );

    setCarrito(nuevoCarrito);
    guardarCarrito(nuevoCarrito);
  };

  /**
   * Elimina un producto del carrito y actualiza stock Firestore
   */
  const eliminarDelCarrito = async (index) => {
    const producto = carrito[index];
    if (!producto) return;

    const nuevoCarrito = carrito.filter((_, i) => i !== index);
    setCarrito(nuevoCarrito);
    guardarCarrito(nuevoCarrito);
    mostrarNotificacion(`"${producto.nombre}" eliminado del carrito`);

    // Restaurar stock Firestore por cantidad eliminada
    await actualizarStockFirebase(producto.id, producto.cantidad, producto.tipo);
  };

  /**
   * Guarda el carrito en localStorage
   */
  const guardarCarrito = (nuevoCarrito) => {
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
  };

  /**
   * Limpia todo el carrito y actualiza stocks en Firestore
   */
  const limpiarCarrito = async () => {
    if (carrito.length === 0) {
      alert('El carrito ya está vacío');
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres limpiar todo el carrito?')) {
      // Restaurar stock de todos los productos antes de limpiar
      for (const producto of carrito) {
        await actualizarStockFirebase(producto.id, producto.cantidad, producto.tipo);
      }
      setCarrito([]);
      localStorage.removeItem('carrito');
      mostrarNotificacion('Carrito limpiado correctamente');
    }
  };

  /**
   * Navega al checkout
   */
  const irAlCheckout = () => {
    if (carrito.length === 0) {
      alert('Agrega productos al carrito antes de continuar');
      return;
    }
    navigate('/checkout');
  };

  /**
   * Muestra una notificación temporal
   */
  const mostrarNotificacion = (mensaje) => {
    alert(mensaje);
  };

  /**
   * Calcula el total del carrito
   */
  const calcularTotal = () => {
    return carrito.reduce((total, producto) => {
      return total + (producto.precio || 0) * (producto.cantidad || 1);
    }, 0);
  };

  if (cargandoOferta || cargandoGenerales) {
    return (
      <div className="cargando">
        <div className="spinner">🔄</div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="carrito-container">
      {/* Productos en Oferta */}
      <section className="ofertas-section">
        <h2 className="section-title">Productos en Oferta</h2>
        <div className="productos-grid">
          {productosOferta.length === 0 ? (
            <p className="sin-ofertas">No hay productos en oferta en este momento.</p>
          ) : (
            productosOferta.map(producto => (
              <div key={producto.id} className="producto-card">
                <img 
                  src={producto.imagen} 
                  alt={producto.nombre}
                  className="producto-imagen"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300/cccccc/969696?text=Imagen+No+Disponible';
                  }}
                />
                <div className="producto-info">
                  <h3 className="producto-nombre">{producto.nombre}</h3>
                  <div className="precios-oferta">
                    <span className="precio-anterior">
                      ${producto.precioAnterior?.toLocaleString('es-CL')}
                    </span>
                    <span className="precio-actual">
                      ${producto.precio?.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <p className="stock-disponible">
                    Stock: {producto.stock || 0}
                  </p>
                  <button 
                    className="btn-agregar-oferta"
                    disabled={producto.stock <= 0}
                    onClick={() => agregarAlCarrito(producto, 'oferta')}
                  >
                    {producto.stock > 0 ? 'Añadir' : 'Sin Stock'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Productos Generales */}
      <section className="generales-section">
        <h2 className="section-title">Productos Generales</h2>
        <div className="productos-grid">
          {productosGenerales.length === 0 ? (
            <p className="sin-generales">No hay productos disponibles en este momento.</p>
          ) : (
            productosGenerales.map(producto => (
              <div key={producto.id} className="producto-card">
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  className="producto-imagen"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300/cccccc/969696?text=Imagen+No+Disponible';
                  }}
                />
                <div className="producto-info">
                  <h3 className="producto-nombre">{producto.nombre}</h3>
                  <div className="precios-generales">
                    <span className="precio">
                      ${producto.precio?.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <p className="stock-disponible">
                    Stock: {producto.stock || 0}
                  </p>
                  <button
                    className="btn-agregar-general"
                    disabled={producto.stock <= 0}
                    onClick={() => agregarAlCarrito(producto, 'general')}
                  >
                    {producto.stock > 0 ? 'Añadir' : 'Sin Stock'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Resumen del Carrito */}
      <section className="resumen-carrito">
        <h2 className="section-title">Resumen del Carrito</h2>
        
        {/* Tabla de productos en carrito */}
        <div className="tabla-carrito-container">
          <table className="tabla-carrito">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {carrito.length === 0 ? (
                <tr>
                  <td colSpan="6" className="carrito-vacio">
                    <div className="icono">🛒</div>
                    <h3>Tu carrito está vacío</h3>
                    <p>Agrega algunos productos para continuar</p>
                    <button 
                      className="btn-ir-catalogo"
                      onClick={() => navigate('/catalogo')}
                    >
                      Ir al Catálogo
                    </button>
                  </td>
                </tr>
              ) : (
                carrito.map((producto, index) => (
                  <tr key={`${producto.id}-${index}`}>
                    <td>
                      <img 
                        src={producto.imagen} 
                        alt={producto.nombre}
                        className="imagen-tabla"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100x100/cccccc/969696?text=Imagen';
                        }}
                      />
                    </td>
                    <td>{producto.nombre}</td>
                    <td>${producto.precio?.toLocaleString('es-CL')}</td>
                    <td>
                      <div className="controles-cantidad">
                        <button 
                          className="btn-cantidad"
                          onClick={() => actualizarCantidad(index, (producto.cantidad || 1) - 1)}
                        >
                          -
                        </button>
                        <span className="cantidad-actual">
                          {producto.cantidad || 1}
                        </span>
                        <button 
                          className="btn-cantidad"
                          onClick={() => actualizarCantidad(index, (producto.cantidad || 1) + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      ${((producto.precio || 0) * (producto.cantidad || 1)).toLocaleString('es-CL')}
                    </td>
                    <td>
                      <button 
                        className="btn-eliminar"
                        onClick={() => eliminarDelCarrito(index)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total y Botones */}
        {carrito.length > 0 && (
          <div className="carrito-footer">
            <div className="total-container">
              <span className="total-text">Total: $</span>
              <span className="total-precio">
                {calcularTotal().toLocaleString('es-CL')}
              </span>
            </div>
            <div className="botones-carrito">
              <button 
                className="btn-limpiar"
                onClick={limpiarCarrito}
              >
                Limpiar Carrito
              </button>
              <button 
                className="btn-comprar-ahora"
                onClick={irAlCheckout}
              >
                Comprar Ahora
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Carrito;
