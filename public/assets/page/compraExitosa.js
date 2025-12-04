// Configuración de Firebase (igual que en login.js)
console.log('Archivo compraExitosa.js cargado correctamente');
const firebaseConfig = {
    apiKey: "AIzaSyA1_om-_HPyYVnUo8ELiM5Zob2VSMGbWvw",
    authDomain: "pasteleriamilsaborestresleches.firebaseapp.com",
    projectId: "pasteleriamilsaborestresleches",
    storageBucket: "pasteleriamilsaborestresleches.firebasestorage.app",
    messagingSenderId: "724534518591",
    appId: "1:724534518591:web:fda9e47afb93ed6854e98a",
    measurementId: "G-FXQWCCHM83"
};

// Inicializar Firebase solo si no está inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Variable global para almacenar los datos de la compra actual
let compraActual = null;

/**
 * Decodifica un token JWT y retorna el payload
 */
function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Token JWT inválido');
        }

        const payload = parts[1];
        const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decodedPayload);
    } catch (error) {
        console.error('Error decodificando token:', error);
        return null;
    }
}

// Inicializar página de éxito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando compraExitosa...');
    alert('JavaScript de compraExitosa cargado correctamente');
    inicializarPaginaExito();
    configurarEventosExito();
});

// También intentar inicializar inmediatamente si el DOM ya está listo
if (document.readyState === 'loading') {
    // El DOM aún se está cargando
} else {
    // El DOM ya está listo
    console.log('DOM ya listo, inicializando inmediatamente...');
    inicializarPaginaExito();
    configurarEventosExito();
}

/**
 * Inicializa la página de éxito con los datos de la compra y usuario desde el token y BD
 */
async function inicializarPaginaExito() {
    console.log('Iniciando compraExitosa con datos del token y BD...');

    try {
        // Obtener datos del usuario logueado
        const usuarioStorage = localStorage.getItem('usuario');
        const token = localStorage.getItem('token');

        console.log('usuarioStorage:', usuarioStorage);
        console.log('token:', token);

        if (!usuarioStorage || !token) {
            console.log('No hay usuario logueado, mostrando datos locales...');
            mostrarDatosLocales();
            return;
        }

        const usuarioData = JSON.parse(usuarioStorage);
        console.log('Usuario logueado:', usuarioData);

        // Decodificar el token para obtener datos del usuario
        const tokenPayload = decodeJWT(token);
        console.log('Datos del token:', tokenPayload);

        let userDataFromDB = null;

        // Intentar obtener datos completos del usuario desde Firestore
        try {
            const userDoc = await db.collection('usuario').where('correo', '==', usuarioData.correo).get();
            if (!userDoc.empty) {
                userDataFromDB = userDoc.docs[0].data();
                console.log('Datos completos del usuario desde BD:', userDataFromDB);
            }
        } catch (dbError) {
            console.warn('Error al obtener datos de BD:', dbError);
        }

        // Combinar datos del token y BD (priorizando BD para datos completos)
        const nombre = userDataFromDB?.nombre_completo || userDataFromDB?.nombre || tokenPayload?.nombre_completo || usuarioData.nombre || 'No especificado';
        const correo = userDataFromDB?.correo || tokenPayload?.correo || usuarioData.correo;
        const telefono = userDataFromDB?.telefono || userDataFromDB?.celular || tokenPayload?.telefono || 'No especificado';
        const direccion = userDataFromDB?.direccion || 'No especificado';
        const comuna = userDataFromDB?.comuna || userDataFromDB?.ciudad || tokenPayload?.comuna || 'No especificado';

        console.log('Datos combinados:', { nombre, correo, telefono, direccion, comuna });

        // Crear datos de compra con información combinada
        compraActual = {
            idCompra: 'COMPRA-' + Date.now(),
            fechaCompra: new Date(),
            nombre: nombre,
            correo: correo,
            telefono: telefono,
            direccion: direccion,
            comuna: comuna,
            productos: [],
            total: 0
        };

        // Intentar cargar productos desde localStorage si existen
        const ultimaCompra = localStorage.getItem('ultimaCompra');
        if (ultimaCompra) {
            const compraData = JSON.parse(ultimaCompra);
            compraActual.productos = compraData.productos || [];
            compraActual.total = compraData.total || 0;
            compraActual.idCompra = compraData.idCompra || compraActual.idCompra;
            if (compraData.fechaCompra) {
                compraActual.fechaCompra = new Date(compraData.fechaCompra);
            }
        }

        console.log('Compra actual:', compraActual);

        // Mostrar datos del usuario (token + BD)
        mostrarDatosCompra(compraActual);
        renderizarProductosExito(compraActual.productos);
        actualizarTotalExito(compraActual.total);

        console.log('Datos del usuario mostrados correctamente (token + BD)');

        // Sincronizar con BD en segundo plano
        setTimeout(() => sincronizarConBaseDatos(compraActual), 100);

    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        mostrarDatosLocales();
    }
}

/**
 * Muestra datos locales cuando no hay usuario logueado o hay error
 */
function mostrarDatosLocales() {
    try {
        const ultimaCompra = localStorage.getItem('ultimaCompra');
        if (ultimaCompra) {
            compraActual = JSON.parse(ultimaCompra);
            console.log('Datos de compra cargados desde localStorage:', compraActual);
        } else {
            // Crear datos de prueba si no hay nada
            console.log('No hay datos en localStorage, creando datos de prueba...');
            crearDatosPruebaLocal();
        }
    } catch (localStorageError) {
        console.error('Error al cargar desde localStorage, creando datos de prueba:', localStorageError);
        crearDatosPruebaLocal();
    }

    // Mostrar datos inmediatamente
    mostrarDatosCompra(compraActual);
    renderizarProductosExito(compraActual.productos || []);
    actualizarTotalExito(compraActual.total || 0);

    console.log('Datos locales mostrados correctamente');
}

/**
 * Crea datos de prueba para modo local cuando no hay datos
 */
function crearDatosPruebaLocal() {
    const fechaActual = new Date();

    compraActual = {
        idCompra: 'PRUEBA-' + Date.now(),
        fechaCompra: fechaActual,
        nombre: 'Cliente de Prueba',
        correo: 'cliente@prueba.com',
        telefono: '+56912345678',
        direccion: 'Dirección de Prueba 123',
        comuna: 'Santiago',
        productos: [
            {
                nombre: 'Producto de Prueba 1',
                precio: 15000,
                cantidad: 2
            },
            {
                nombre: 'Producto de Prueba 2',
                precio: 25000,
                cantidad: 1
            }
        ],
        total: 55000
    };

    // Guardar en localStorage para futuras visitas
    localStorage.setItem('ultimaCompra', JSON.stringify(compraActual));

    // Mostrar datos de prueba
    mostrarDatosCompra(compraActual);
    renderizarProductosExito(compraActual.productos);
    actualizarTotalExito(compraActual.total);

    console.log('Datos de prueba creados y mostrados');
}

/**
 * Sincroniza los datos locales con la base de datos en segundo plano
 */
async function sincronizarConBaseDatos(datosLocales) {
    try {
        console.log('Sincronizando con base de datos en segundo plano...');

        // Verificar si hay usuario logueado
        const usuarioActual = localStorage.getItem('usuarioActual');
        if (!usuarioActual) {
            console.log('No hay usuario logueado, omitiendo sincronización con BD');
            return;
        }

        const usuarioData = JSON.parse(usuarioActual);
        const userId = usuarioData.id || usuarioData.uid || usuarioData.correo;

        if (!userId) {
            console.log('No se pudo obtener ID de usuario, omitiendo sincronización');
            return;
        }

        // Intentar guardar en colección 'compras'
        try {
            const docRef = await db.collection('compras').add({
                ...datosLocales,
                id_usuario: userId,
                sincronizado: true,
                fecha_sincronizacion: new Date()
            });
            console.log('Compra sincronizada en colección compras con ID:', docRef.id);

            // Actualizar localStorage con ID de Firestore
            const datosActualizados = { ...datosLocales, firestoreId: docRef.id };
            localStorage.setItem('ultimaCompra', JSON.stringify(datosActualizados));

        } catch (comprasError) {
            console.error('Error al sincronizar en colección compras:', comprasError);
        }

        // Intentar actualizar colección 'usuario' con historial de compras
        try {
            const usuarioRef = db.collection('usuario').doc(userId);
            const usuarioDoc = await usuarioRef.get();

            if (usuarioDoc.exists) {
                const usuarioInfo = usuarioDoc.data();
                const comprasActuales = usuarioInfo.compras || [];

                // Agregar nueva compra al historial
                comprasActuales.push({
                    ...datosLocales,
                    fecha_sincronizacion: new Date()
                });

                // Mantener solo las últimas 10 compras
                if (comprasActuales.length > 10) {
                    comprasActuales.splice(0, comprasActuales.length - 10);
                }

                await usuarioRef.update({
                    compras: comprasActuales,
                    ultima_compra: datosLocales.fechaCompra
                });

                console.log('Historial de compras actualizado en colección usuario');
            } else {
                // Crear documento de usuario si no existe
                await usuarioRef.set({
                    id: userId,
                    correo: usuarioData.correo || userId,
                    compras: [datosLocales],
                    ultima_compra: datosLocales.fechaCompra,
                    fecha_creacion: new Date()
                });
                console.log('Documento de usuario creado en colección usuario');
            }

        } catch (usuarioError) {
            console.error('Error al sincronizar en colección usuario:', usuarioError);
        }

    } catch (error) {
        console.error('Error general en sincronización con BD:', error);
        // No mostrar error al usuario ya que es en segundo plano
    }
}

/**
 * Sincroniza los datos locales con Firestore en segundo plano
 */
async function sincronizarConFirestore(compraId, datosLocales) {
    try {
        console.log('Sincronizando con Firestore en segundo plano...');
        const compraDoc = await db.collection('compras').doc(compraId).get();

        if (compraDoc.exists) {
            const datosFirestore = compraDoc.data();
            console.log('Datos sincronizados con Firestore:', datosFirestore);
            // Aquí podrías actualizar localStorage con datos de Firestore si es necesario
        } else {
            console.log('Documento no existe en Firestore, guardando datos locales...');
            // Opcionalmente guardar los datos locales en Firestore
            await db.collection('compras').doc(compraId).set(datosLocales);
        }
    } catch (error) {
        console.error('Error al sincronizar con Firestore:', error);
        // No mostrar error al usuario ya que es en segundo plano
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
                        ${compraActual.productos.map(producto => `
                            <tr>
                                <td>${producto.nombre}</td>
                                <td>$${producto.precio.toLocaleString('es-CL')}</td>
                                <td>${producto.cantidad}</td>
                                <td>$${((producto.precio || 0) * (producto.cantidad || 1)).toLocaleString('es-CL')}</td>
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
