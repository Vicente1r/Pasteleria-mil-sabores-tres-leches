// ...existing code...
document.addEventListener('DOMContentLoaded', () => {
  // Selectores
  const tablaBody = document.getElementById('tablaCheckoutBody');
  const totalPagarElem = document.getElementById('totalPagar');
  const montoPagarSpan = document.getElementById('montoPagar');
  const btnPagarAhora = document.getElementById('btnPagarAhora');
  const btnTotalPagar = document.getElementById('btnTotalPagar');

  // Firebase config - configuración correcta para el proyecto
  const firebaseConfig = {
    apiKey: "AIzaSyBBT7jka7a-7v3vY19BlSajamiedLrBTN0",
    authDomain: "pasteleriamilsaborestresleches.web.app",
    projectId: "pasteleriamilsaborestresleches",
    storageBucket: "pasteleriamilsaborestresleches.appspot.com",
    messagingSenderId: "724534518591",
    appId: "1:724534518591:web:fda9e47afb93ed6854e98a",
    measurementId: "G-FXQWCCHM83"
  };

  // Inicializar Firebase si no está
  if (typeof firebase === 'undefined') {
    console.error('Firebase no encontrado. Asegúrate de incluir los SDK v8 en checkout.html');
    return;
  }

  // Inicializar Firebase con configuración correcta
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase inicializado correctamente en checkout.js');
  } else {
    console.log('Firebase ya estaba inicializado');
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  // Configurar Firestore settings
  db.settings({
    timestampsInSnapshots: true
  });

  console.log('Firestore configurado correctamente');

  // Cargar carrito desde localStorage
  function getCarrito() {
    try {
      return JSON.parse(localStorage.getItem('carrito')) || [];
    } catch (e) {
      return [];
    }
  }

  // Renderizar tabla y totales
  function renderCarrito() {
    const carrito = getCarrito();
    tablaBody.innerHTML = '';
    let total = 0;
    carrito.forEach(item => {
      const cantidad = Number(item.cantidad || 1);
      const precio = Number(item.precio || 0);
      const subtotal = cantidad * precio;
      total += subtotal;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${item.imagen || ''}" alt="${item.nombre || ''}" style="width:60px;height:60px;object-fit:cover"></td>
        <td>${item.nombre || 'Producto'}</td>
        <td>$${precio.toLocaleString('es-CL')}</td>
        <td>${cantidad}</td>
        <td>$${subtotal.toLocaleString('es-CL')}</td>
      `;
      tablaBody.appendChild(tr);
    });

    totalPagarElem.textContent = `$${total.toLocaleString('es-CL')}`;
    if (montoPagarSpan) montoPagarSpan.textContent = `${total}`;
    if (btnTotalPagar) btnTotalPagar.querySelector('span')?.textContent = total;
    return total;
  }

  // Extraer id numérico del documento usuarios (por correo o uid)
  async function getNumericUserId(email, uid) {
    try {
      if (uid) {
        const qUid = await db.collection('usuario').where('uid', '==', uid).limit(1).get();
        if (!qUid.empty) {
          const d = qUid.docs[0].data();
          if (d.id_usuario) return Number(d.id_usuario);
        }
      }
      if (email) {
        const q = await db.collection('usuario').where('correo', '==', email).limit(1).get();
        if (!q.empty) {
          const data = q.docs[0].data();
          const candidates = [data.id_usuario, data.id, data.run];
          for (const c of candidates) {
            if (typeof c === 'number' && Number.isInteger(c)) return c;
            if (typeof c === 'string' && /^\d+$/.test(c)) return parseInt(c, 10);
            if (typeof c === 'string') {
              const numeric = parseInt(c.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(numeric)) return numeric;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error buscando id usuario:', err);
    }
    // fallback: timestamp entero
    return Date.now();
  }

  // Guardar compra en Firestore
  async function guardarCompra(compra) {
    try {
      const docRef = await db.collection('compras').add(compra);
      return docRef.id;
    } catch (err) {
      console.error('Error guardando compra:', err);
      throw err;
    }
  }

  // Manejar pago / actualización de compra
  btnPagarAhora?.addEventListener('click', async (e) => {
    e.preventDefault();

    // Obtener compraId de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const compraId = urlParams.get('compraId');

    if (!compraId) {
      alert('No se encontró el ID de compra.');
      return;
    }

    // Obtener datos del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const calle = document.getElementById('calle').value.trim();
    const departamento = document.getElementById('departamento').value.trim();
    const region = document.getElementById('region').value;
    const comuna = document.getElementById('comuna').value;
    const indicaciones = document.getElementById('indicaciones').value.trim();

    // Validar campos requeridos
    if (!nombre || !apellidos || !correo || !calle || !region || !comuna) {
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    try {
      // Actualizar la compra existente con datos de entrega y marcar como completada
      await db.collection('compras').doc(compraId).update({
        nombre_completo: `${nombre} ${apellidos}`,
        correo: correo,
        direccion_entrega: {
          calle: calle,
          departamento: departamento,
          region: region,
          comuna: comuna,
          indicaciones: indicaciones
        },
        estado: 'completada',
        actualizado_en: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert('Compra completada exitosamente.');
      // Redirigir a página de confirmación
      window.location.href = 'compraExitosa.html';
    } catch (err) {
      console.error('Error completando la compra:', err);
      alert('Ocurrió un error al procesar el pago. Intenta nuevamente.');
    }
  });

  // Cargar compra desde URL
  async function cargarCompraDesdeURL() {
    console.log('Iniciando carga de compra desde URL...');

    const urlParams = new URLSearchParams(window.location.search);
    const compraId = urlParams.get('compraId');

    console.log('CompraId de URL:', compraId);

    if (!compraId) {
      console.error('No se encontró el ID de compra en la URL');
      alert('No se encontró el ID de compra. Redirigiendo al carrito.');
      window.location.href = 'carrito.html';
      return;
    }

    try {
      console.log('Intentando obtener documento de compra:', compraId);

      // Obtener datos de la compra desde Firestore
      const compraDoc = await db.collection('compras').doc(compraId).get();

      console.log('Documento existe:', compraDoc.exists);

      if (!compraDoc.exists) {
        console.error('Compra no encontrada en Firestore');
        alert('Compra no encontrada.');
        window.location.href = 'carrito.html';
        return;
      }

      const compraData = compraDoc.data();
      console.log('Datos de compra obtenidos:', compraData);

      // Obtener datos del usuario desde Firestore usando usuarioId
      let usuarioData = null;
      const usuarioId = compraData.usuarioId;
      console.log('UsuarioId de compra:', usuarioId);

      if (usuarioId) {
        try {
          console.log('Buscando usuario por correo:', usuarioId);
          // Buscar usuario por correo (usuarioId es el correo)
          const usuarioQuery = await db.collection('usuario').where('correo', '==', usuarioId).get();
          console.log('Resultado de consulta usuario:', usuarioQuery.empty ? 'vacío' : 'con datos');

          if (!usuarioQuery.empty) {
            usuarioData = usuarioQuery.docs[0].data();
            console.log('Datos de usuario obtenidos:', usuarioData);
          } else {
            console.warn('No se encontró usuario con correo:', usuarioId);
          }
        } catch (userError) {
          console.error('Error obteniendo datos de usuario:', userError);
        }
      } else {
        console.warn('No hay usuarioId en los datos de compra');
      }

      // Mostrar información de la compra
      console.log('Mostrando información de compra...');
      mostrarInformacionCompra(compraData, usuarioData);

      // Llenar formulario con datos del usuario
      if (usuarioData) {
        console.log('Llenando formulario con datos de usuario...');
        document.getElementById('nombre').value = usuarioData.nombre_completo || '';
        document.getElementById('apellidos').value = ''; // No hay apellidos separados
        document.getElementById('correo').value = usuarioData.correo || '';

        // Dirección del usuario
        document.getElementById('calle').value = usuarioData.calle || '';
        document.getElementById('departamento').value = usuarioData.departamento || '';
        document.getElementById('region').value = usuarioData.region || '';
        document.getElementById('comuna').value = usuarioData.comuna || '';
        document.getElementById('indicaciones').value = usuarioData.indicaciones || '';
      } else {
        console.warn('No hay datos de usuario para llenar formulario');
      }

      // Renderizar tabla con items de la compra
      console.log('Renderizando tabla de productos...');
      renderCompra(compraData.items, compraData.total);

      console.log('Carga de compra completada exitosamente');

    } catch (error) {
      console.error('Error cargando compra:', error);
      alert('Error al cargar la compra. Inténtalo de nuevo.');
      window.location.href = 'carrito.html';
    }
  }

  // Mostrar información completa de la compra y usuario
  function mostrarInformacionCompra(compraData, usuarioData) {
    // Llenar información de la compra
    document.getElementById('idCompra').textContent = compraData.idCompra || 'N/A';
    document.getElementById('estadoCompra').textContent = compraData.estado || 'pendiente';
    document.getElementById('estadoCompra').className = `estado-${compraData.estado || 'pendiente'}`;
    document.getElementById('fechaCompra').textContent = compraData.fechaCompra ? (compraData.fechaCompra.toDate ? compraData.fechaCompra.toDate().toLocaleString('es-CL') : new Date(compraData.fechaCompra).toLocaleString('es-CL')) : 'N/A';
    document.getElementById('actualizadoEn').textContent = compraData.actualizadoEn ? (compraData.actualizadoEn.toDate ? compraData.actualizadoEn.toDate().toLocaleString('es-CL') : new Date(compraData.actualizadoEn).toLocaleString('es-CL')) : 'N/A';
    document.getElementById('metodoPago').textContent = compraData.metodoPago || 'N/A';
    document.getElementById('totalCompra').textContent = `$${compraData.total ? compraData.total.toLocaleString('es-CL') : '0'} CLP`;

    // Llenar información del usuario
    document.getElementById('usuarioNombre').textContent = usuarioData?.nombre_completo || 'N/A';
    document.getElementById('usuarioCorreo').textContent = usuarioData?.correo || 'N/A';
    document.getElementById('usuarioRun').textContent = usuarioData?.run || 'N/A';
    document.getElementById('usuarioTelefono').textContent = usuarioData?.telefono || 'N/A';
    document.getElementById('usuarioComuna').textContent = usuarioData?.comuna || 'N/A';
  }

  // Renderizar tabla con items de la compra
  function renderCompra(items, total) {
    tablaBody.innerHTML = '';
    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${item.imagen || ''}" alt="${item.nombre || ''}" style="width:60px;height:60px;object-fit:cover"></td>
        <td>${item.nombre || 'Producto'}</td>
        <td>$${item.precio.toLocaleString('es-CL')}</td>
        <td>${item.cantidad}</td>
        <td>$${item.subtotal.toLocaleString('es-CL')}</td>
      `;
      tablaBody.appendChild(tr);
    });

    totalPagarElem.textContent = `$${total.toLocaleString('es-CL')}`;
    if (montoPagarSpan) montoPagarSpan.textContent = `${total}`;
    if (btnTotalPagar) btnTotalPagar.querySelector('span')?.textContent = total;
  }

  // Inicial render
  cargarCompraDesdeURL();
});
// ...existing code...