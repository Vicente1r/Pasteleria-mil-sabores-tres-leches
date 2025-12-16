document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. CONFIGURACIÓN DE FIREBASE ---
    const firebaseConfig = {
      apiKey: "AIzaSyBBT7jka7a-7v3vY19BlSajamiedLrBTN0",
      authDomain: "pasteleriamilsaborestresleches.web.app",
      projectId: "pasteleriamilsaborestresleches",
      storageBucket: "pasteleriamilsaborestresleches.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456"
    };


    if (!firebase.apps?.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized");
    }

    const db = firebase.firestore();
    console.log("Firestore initialized");

    // --- 2. VERIFICACIÓN DE SESIÓN (AUTH GUARD) ---
    const usuarioStorage = localStorage.getItem("usuario");
    
    if (!usuarioStorage) {
        alert("Debes iniciar sesión para ver tu perfil de vendedor.");
        window.location.href = "InicioSesionempresa.html";
        return;
    }

    const usuario = JSON.parse(usuarioStorage);

    // Se valida que el rol sea 'vendedor' o sea el demo vendedor
    if (usuario.rol !== "vendedor" && usuario.correo !== 'vendedor@duoc.cl') {
        alert("Acceso no autorizado. Esta página es solo para vendedores.");
        localStorage.removeItem("usuario");
        window.location.href = "../../index.html";
        return;
    }

    // --- 3. ACTUALIZAR INTERFAZ CON DATOS DEL VENDEDOR ---
    const nombreVendedorEl = document.querySelector(".sidebar-sticky h5 strong");
    if (nombreVendedorEl) {
        nombreVendedorEl.textContent = usuario.nombre || "Vendedor";
    }

    // --- 4. FUNCIONALIDAD DE CERRAR SESIÓN ---
    const logoutLinks = document.querySelectorAll('a[href*="logout"], .btn-outline-danger');
    
    logoutLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("usuario");
            // Opcional: firebase.auth().signOut();
            alert("Has cerrado sesión. ¡Vuelve pronto!");
            window.location.href = "../../index.html";
        });
    });

    // --- 5. CARGA DE DATOS DINÁMICOS (PRODUCTOS Y VENTAS) ---
    const productosTbody = document.getElementById("productos-tbody");
    const ventasTbody = document.getElementById("ventas-tbody");

    /**
     * Carga los productos del vendedor desde Firestore
     */
     async function cargarMisProductos(vendedorId) {
        if (!productosTbody) return;
        productosTbody.innerHTML = '<tr><td colspan="4">Cargando todos los productos del sistema...</td></tr>';
        console.log(`DEBUG: Cargando todos los productos (petición iniciada por vendedor: ${vendedorId})`);

        try {
            // Consulta: traer todos los productos (sin filtrar por vendedor)
            const query = await db.collection("producto").get();

            console.log(`DEBUG: La consulta de productos encontró ${query.size} documento(s) en total.`);

            if (query.empty) {
                productosTbody.innerHTML = '<tr><td colspan="4">No hay productos registrados en la base de datos.</td></tr>';
                return;
            }

            let html = "";
            query.docs.forEach(doc => {
                const producto = doc.data();
                const precio = typeof producto.precio === 'number' ? producto.precio.toLocaleString('es-CL') : 'N/A';
                const estadoClass = producto.activo !== false ? 'bg-success' : 'bg-secondary';
                const estadoText = producto.activo !== false ? 'Activo' : 'Inactivo';

                html += `
                    <tr>
                        <td>${producto.nombre}</td>
                        <td>$${precio}</td>
                        <td>${producto.stock || 0}</td>
                        <td><span class="badge ${estadoClass}">${estadoText}</span></td>
                    </tr>
                `;
            });
            productosTbody.innerHTML = html;

        } catch (error) {
            console.error("DEBUG: Error al cargar los productos:", error);
            productosTbody.innerHTML = '<tr><td colspan="4">Error al cargar los productos. Revisa la consola para más detalles.</td></tr>';
        }
    }

    /**
     * Carga todas las compras desde la colección "compras".
     */
    async function cargarMisVentas(vendedorId) {
        if (!ventasTbody) return;
        ventasTbody.innerHTML = '<tr><td colspan="5">Cargando todas las compras...</td></tr>';
        console.log(`DEBUG: Cargando todas las compras (petición iniciada por vendedor: ${vendedorId})`);

        try {
            // Traer todas las órdenes
            const ordenesQuery = await db.collection("compras").get();

            console.log(`DEBUG: Se encontraron ${ordenesQuery.size} órdenes de compra en total.`);
            console.log("DEBUG: Documentos de compras:", ordenesQuery.docs.map(doc => ({ id: doc.id, data: doc.data() })));

            if (ordenesQuery.empty) {
                ventasTbody.innerHTML = '<tr><td colspan="5">No se han encontrado compras registradas en la plataforma.</td></tr>';
                return;
            }

            // Ordenar las órdenes por actualizadoEn descendente en JS
            const ordenesOrdenadas = ordenesQuery.docs.sort((a, b) => {
                const fechaA = a.data().actualizadoEn ? a.data().actualizadoEn.toMillis() : 0;
                const fechaB = b.data().actualizadoEn ? b.data().actualizadoEn.toMillis() : 0;
                return fechaB - fechaA;
            });

            // Mostrar todas las órdenes
            let html = "";
            ordenesOrdenadas.forEach(doc => {
                const venta = doc.data();
                console.log(`DEBUG: Displaying purchase ${venta.idCompra || doc.id}`, venta);

                const fecha = venta.actualizadoEn ? venta.actualizadoEn.toDate().toLocaleDateString('es-CL') : 'Fecha no disponible';
                const total = typeof venta.total === 'number' ? venta.total.toLocaleString('es-CL') : 'N/A';
                const estado = venta.estado || 'pendiente';
                const estadoClass = estado === 'completada' ? 'bg-success' : (estado === 'error_pago' ? 'bg-danger' : 'bg-warning');

                // Mostrar los items de la compra
                const itemsHtml = venta.items && Array.isArray(venta.items) ?
                    venta.items.map(item => `${item.nombre || 'Producto'} (x${item.cantidad || 1})`).join(', ') :
                    'Sin items';

                html += `
                    <tr>
                        <td>${venta.idCompra || (doc.id ? doc.id.substring(0, 8) : '—')}</td>
                        <td>${fecha}</td>
                        <td>${itemsHtml}</td>
                        <td>$${total}</td>
                        <td><span class="badge ${estadoClass}">${estado}</span></td>
                    </tr>
                `;
            });
            console.log(`DEBUG: Generated HTML for ${ordenesOrdenadas.length} purchases`);
            ventasTbody.innerHTML = html;

        } catch (error) {
            console.error("DEBUG: Error al cargar las compras:", error);
            ventasTbody.innerHTML = '<tr><td colspan="5">Error al cargar las compras. Revisa la consola para más detalles.</td></tr>';
        }
    }

    // --- 6. EJECUTAR LAS FUNCIONES DE CARGA ---
    cargarMisProductos(usuario.uid);
    cargarMisVentas(usuario.uid);

    // --- 7. FUNCIONALIDAD PARA ACTUALIZAR PERFIL ---
    const updateProfileForm = document.querySelector("#update-profile-form");
    const nombreUsuarioInput = document.querySelector("#nombreUsuario");
    const updateMessageEl = document.querySelector("#update-message");

    if (updateProfileForm) {
        nombreUsuarioInput.value = usuario.nombre || "";

        updateProfileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nuevoNombre = nombreUsuarioInput.value.trim();

            if (!nuevoNombre) {
                updateMessageEl.textContent = "El nombre no puede estar vacío.";
                updateMessageEl.className = "alert alert-danger";
                return;
            }

            updateMessageEl.textContent = "Actualizando...";
            updateMessageEl.className = "alert alert-info";

            try {
                const userDocRef = db.collection("usuario").doc(usuario.uid);

                await userDocRef.update({
                    nombre: nuevoNombre
                });

                // Actualizar el objeto en localStorage
                usuario.nombre = nuevoNombre;
                localStorage.setItem("usuario", JSON.stringify(usuario));

                // Actualizar la UI
                if (nombreVendedorEl) {
                    nombreVendedorEl.textContent = nuevoNombre;
                }

                updateMessageEl.textContent = "¡Nombre actualizado con éxito!";
                updateMessageEl.className = "alert alert-success";

            } catch (error) {
                console.error("Error al actualizar el perfil:", error);
                updateMessageEl.textContent = "Error al actualizar. Inténtalo de nuevo más tarde.";
                updateMessageEl.className = "alert alert-danger";
            }
        });
    }
});
