// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBBT7jka7a-7v3vY19BlSajamiedLrBTN0",
    authDomain: "tiendanombretienda.firebaseapp.com",
    projectId: "tiendanombretienda",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables globales
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Datos de regiones y comunas de Chile
const regionesComunas = {
    "Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],
    "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"],
    "Antofagasta": ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"],
    "Atacama": ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"],
    "Coquimbo": ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"],
    "Valparaíso": ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"],
    "Metropolitana": ["Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"],
    "O'Higgins": ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"],
    "Maule": ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"],
    "Ñuble": ["Chillán", "Bulnes", "Chillán Viejo", "El Carmen", "Pemuco", "Pinto", "Quillón", "San Ignacio", "Yungay", "Quirihue", "Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Ránquil", "Treguaco", "San Carlos", "Coihueco", "Ñiquén", "San Fabián", "San Nicolás"],
    "Biobío": ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualpén", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío", "Lebú", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa"],
    "Araucanía": ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"],
    "Los Ríos": ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"],
    "Los Lagos": ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"],
    "Aysén": ["Coihaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"],
    "Magallanes": ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
};

// Inicializar checkout cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {

    // Comprobar si hay sesión activa únicamente mediante Firebase Auth
    let user = null;
    try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            user = firebase.auth().currentUser;
        }
    } catch (e) {
        user = null;
    }

    if (!user) {
        alert('Debes iniciar sesión para poder comprar.');
        localStorage.setItem('redirigirDespuesLogin', 'checkout.html');
        window.location.href = 'login.html';
        return;
    }

    inicializarCheckout();
    configurarEventosCheckout();
    cargarRegiones(); // Cargar las regiones al iniciar
});

/**
 * Carga las regiones en el select correspondiente
 */
function cargarRegiones() {
    const selectRegion = document.getElementById('region');
    
    // Ordenar regiones alfabéticamente
    const regionesOrdenadas = Object.keys(regionesComunas).sort();
    
    regionesOrdenadas.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        selectRegion.appendChild(option);
    });
}

/**
 * Carga las comunas según la región seleccionada
 */
function cargarComunas(region) {
    const selectComuna = document.getElementById('comuna');
    const comunas = regionesComunas[region] || [];
    
    // Limpiar select de comunas
    selectComuna.innerHTML = '<option value="">Selecciona una comuna</option>';
    
    // Ordenar comunas alfabéticamente
    comunas.sort().forEach(comuna => {
        const option = document.createElement('option');
        option.value = comuna;
        option.textContent = comuna;
        selectComuna.appendChild(option);
    });
    
    // Habilitar el select de comunas
    selectComuna.disabled = false;
}

/**
 * Inicializa la interfaz del checkout
 */
function inicializarCheckout() {
    actualizarCarritoHeader();
    renderizarProductosCheckout();
    actualizarTotales();
}

/**
 * Renderiza los productos en la tabla del checkout
 */
function renderizarProductosCheckout() {
    const tbody = document.getElementById('tablaCheckoutBody');
    
    if (carrito.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="carrito-vacio">
                    <div class="icono">🛒</div>
                    <h3>No hay productos en el carrito</h3>
                    <a href="carrito.html" class="btn-ir-catalogo">Volver al Carrito</a>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = carrito.map(producto => `
        <tr>
            <td>
                <img src="${producto.imagen}" 
                     alt="${producto.nombre}" 
                     class="imagen-tabla"
                     onerror="this.src='https://via.placeholder.com/100x100/cccccc/969696?text=Imagen'">
            </td>
            <td>${producto.nombre}</td>
            <td>$${producto.precio?.toLocaleString('es-CL')}</td>
            <td>${producto.cantidad || 1}</td>
            <td>$${((producto.precio || 0) * (producto.cantidad || 1)).toLocaleString('es-CL')}</td>
        </tr>
    `).join('');
}

/**
 * Actualiza los totales en la interfaz
 */
function actualizarTotales() {
    const total = carrito.reduce((sum, producto) => {
        return sum + ((producto.precio || 0) * (producto.cantidad || 1));
    }, 0);
    
    document.getElementById('totalPagar').textContent = total.toLocaleString('es-CL');
    document.getElementById('montoPagar').textContent = total.toLocaleString('es-CL');
}

/**
 * Actualiza el header del carrito
 */
function actualizarCarritoHeader() {
    const total = carrito.reduce((sum, producto) => {
        return sum + ((producto.precio || 0) * (producto.cantidad || 1));
    }, 0);
    
    document.querySelector('.carrito-total').textContent = total.toLocaleString('es-CL');
}

/**
 * Procesa el pago y guarda la compra en Firestore
 */
async function procesarPago() {
    // Validar que hay productos en el carrito
    if (carrito.length === 0) {
        alert('No hay productos en el carrito');
        return;
    }

    // Validar formularios
    if (!validarFormularios()) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }

    try {
        // Verificar sesión obligatoria: sólo Firebase Auth (no se permiten sesiones por localStorage)
        let authUserCheck = null;
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                authUserCheck = firebase.auth().currentUser;
            }
        } catch (e) {
            authUserCheck = null;
        }

        if (!authUserCheck) {
            alert('Debes iniciar sesión para completar la compra.');
            localStorage.setItem('redirigirDespuesLogin', 'checkout.html');
            setTimeout(() => { window.location.href = 'login.html'; }, 600);
            return;
        }

        // Obtener datos del formulario
        const datosCliente = obtenerDatosCliente();
        const datosDireccion = obtenerDatosDireccion();
        const total = carrito.reduce((sum, producto) => sum + ((producto.precio || 0) * (producto.cantidad || 1)), 0);
        // Determinar usuario autenticado (se asume sesión iniciada)
        let authUser = null;
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                authUser = firebase.auth().currentUser;
            }
        } catch (e) {
            authUser = null;
        }

        const usuarioStorageRaw = localStorage.getItem('usuario');
        const usuarioStorageParsed = usuarioStorageRaw ? JSON.parse(usuarioStorageRaw) : null;

        // Crear objeto de compra (no se permite guest)
        const compra = {
            fecha: new Date(),
            cliente: datosCliente,
            direccion: datosDireccion,
            productos: [...carrito], // Copia del carrito
            total: total,
            estado: 'pendiente',
            numeroOrden: generarNumeroOrden(),
            userId: authUser ? authUser.uid : (usuarioStorageParsed ? (usuarioStorageParsed.correo || usuarioStorageParsed.nombre || null) : null)
        };

        // Guardar en Firestore
        const docRef = await db.collection('compras').add(compra);
        
        // Simular procesamiento de pago (50% de éxito)
        const pagoExitoso = Math.random() > 0.5;
        
        if (pagoExitoso) {
            // Actualizar estado en Firestore
            await db.collection('compras').doc(docRef.id).update({
                estado: 'completada'
            });
            
            // Limpiar carrito y redirigir a éxito
            localStorage.removeItem('carrito');
            localStorage.setItem('ultimaCompra', JSON.stringify({
                ...compra,
                id: docRef.id
            }));
            window.location.href = `compraexitosa.html?orden=${compra.numeroOrden}`;
        } else {
            // Actualizar estado en Firestore
            await db.collection('compras').doc(docRef.id).update({
                estado: 'error_pago'
            });
            
            // Redirigir a error
            localStorage.setItem('ultimaCompra', JSON.stringify({
                ...compra,
                id: docRef.id
            }));
            window.location.href = `errorPago.html?orden=${compra.numeroOrden}`;
        }

    } catch (error) {
        console.error('Error procesando la compra:', error);
        alert('Error al procesar la compra. Intenta nuevamente.');
    }
}

/**
 * Valida los formularios de cliente y dirección
 */
function validarFormularios() {
    const formCliente = document.getElementById('formCliente');
    const formDireccion = document.getElementById('formDireccion');
    
    return formCliente.checkValidity() && formDireccion.checkValidity();
}

/**
 * Obtiene los datos del cliente del formulario
 */
function obtenerDatosCliente() {
    return {
        nombre: document.getElementById('nombre').value,
        apellidos: document.getElementById('apellidos').value,
        correo: document.getElementById('correo').value
    };
}

/**
 * Obtiene los datos de dirección del formulario
 */
function obtenerDatosDireccion() {
    return {
        calle: document.getElementById('calle').value,
        departamento: document.getElementById('departamento').value || '',
        region: document.getElementById('region').value,
        comuna: document.getElementById('comuna').value,
        indicaciones: document.getElementById('indicaciones').value || ''
    };
}

/**
 * Genera un número de orden único
 */
function generarNumeroOrden() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `ORDEN${timestamp}${random}`;
}

/**
 * Configura los eventos del checkout
 */
function configurarEventosCheckout() {
    document.getElementById('btnPagarAhora').addEventListener('click', procesarPago);
    
    // Evento para cargar comunas cuando se selecciona una región
    document.getElementById('region').addEventListener('change', function() {
        if (this.value) {
            cargarComunas(this.value);
        } else {
            // Si no hay región seleccionada, deshabilitar comuna
            const selectComuna = document.getElementById('comuna');
            selectComuna.innerHTML = '<option value="">Primero selecciona una región</option>';
            selectComuna.disabled = true;
        }
    });
    
    // Validación en tiempo real
    const inputs = document.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validarCampo(this);
        });
    });
}

/**
 * Valida un campo individual
 */
function validarCampo(campo) {
    if (!campo.value.trim()) {
        campo.style.borderColor = '#dc3545';
    } else {
        campo.style.borderColor = '#28a745';
    }
}





