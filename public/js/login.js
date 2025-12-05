document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formLogin");
    const correoInput = document.getElementById("correoLogin");
    const claveInput = document.getElementById("claveLogin");
    const mensaje = document.getElementById("mensajeLogin");

    if (!form) return console.error("No se encontró #formLogin");

    // Inicializar Firebase
    const firebaseConfig = {
  apiKey: "AIzaSyBBT7jka7a-7v3vY19BlSajamiedLrBTN0",
  authDomain: "pasteleriamilsaborestresleches.web.app",
  projectId: "pasteleriamilsaborestresleches",
};

    if (!firebase.apps?.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth(); //Apunta a Authentication Firebase
    const db = firebase.firestore(); //Apunta a la colección usuario del base de datos en Firebase

    form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensaje.innerText = "";

    const correo = correoInput.value.trim().toLowerCase();
    const clave = claveInput.value;

    if (!correo || !clave) {
        mensaje.style.color = "red";
        mensaje.innerText = "Debes completar correo y clave";
        return;
    }

    // Admin: autenticar con Firebase Auth
    if (correo === "admin@duoc.cl") {
        try {
            await auth.signInWithEmailAndPassword(correo, clave);
            // Guardar usuario en localStorage
            const usuario = { nombre: "Administrador", correo, rol: "admin" };
            localStorage.setItem("usuario", JSON.stringify(usuario));

            mensaje.style.color = "green";
            mensaje.innerText = "Bienvenido Administrador, redirigiendo...";
            setTimeout(() => {
                window.location.href = `admin.html`;
            }, 1000);
        } catch (error) {
            console.error("Error login admin:", error);
            mensaje.style.color = "red";
            mensaje.innerText = "Credenciales incorrectas para administrador";
        }
        return;
    }

    // Intentar iniciar sesión en Firebase (para vendedores o usuarios creados en Auth)
    try {
        const cred = await auth.signInWithEmailAndPassword(correo, clave);
        const user = cred.user;
        if (user) {
            // Buscar rol en collection 'users' (es el esquema que usamos para admin/vendedor)
            try {
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists) {
                    const data = doc.data();
                    const role = data.role || data.rol;
                    if (role === 'admin') {
                        localStorage.setItem('usuario', JSON.stringify({ nombre: data.nombre || 'Administrador', correo, rol: 'admin' }));
                        mensaje.style.color = 'green';
                        mensaje.innerText = 'Bienvenido Administrador, redirigiendo...';
                        setTimeout(() => window.location.href = 'admin.html', 800);
                        return;
                    }
                    if (role === 'vendedor') {
                        localStorage.setItem('usuario', JSON.stringify({ nombre: data.nombre || 'Vendedor', correo, rol: 'vendedor' }));
                        mensaje.style.color = 'green';
                        mensaje.innerText = 'Bienvenido Vendedor, redirigiendo...';
                        setTimeout(() => window.location.href = 'perfilVendedor.html', 800);
                        return;
                    }
                    // Other roles: fall back to cliente view
                    localStorage.setItem('usuario', JSON.stringify({ nombre: data.nombre || correo, correo, rol: role || 'cliente' }));
                    mensaje.style.color = 'green';
                    mensaje.innerText = 'Bienvenido, redirigiendo...';
                    setTimeout(() => window.location.href = role === 'cliente' ? 'perfilCliente.html' : 'perfilCliente.html', 800);
                    return;
                }
            } catch (e) {
                console.warn('Error leyendo users/{uid}', e);
            }
            // Si no hay doc en users, tratar como cliente autenticado
            localStorage.setItem('usuario', JSON.stringify({ nombre: correo, correo, rol: 'cliente' }));
            mensaje.style.color = 'green';
            mensaje.innerText = 'Bienvenido, redirigiendo...';
            setTimeout(() => window.location.href = 'perfilCliente.html', 800);
            return;
        }
    } catch (authErr) {
        // si no existe en Auth o credenciales inválidas, seguimos con el flujo legacy
        console.info('Firebase Auth sign-in falló o no existe usuario en Auth, probando Firestore legacy...', authErr && authErr.code);
    }

    // Cliente / Vendedor / Admin (legacy Firestore): buscar en colecciones 'vendedor', 'admin' o 'usuario'
    try {
        const collectionsToCheck = ['vendedor', 'admin', 'usuario'];
        let found = null;

        for (const col of collectionsToCheck) {
            const q = await db.collection(col)
                .where('correo', '==', correo)
                .where('clave', '==', clave)
                .limit(1)
                .get();
            if (!q.empty) {
                found = { col, data: q.docs[0].data() };
                break;
            }
        }

        if (found) {
            const role = found.col === 'admin' ? 'admin' : (found.col === 'vendedor' ? 'vendedor' : 'cliente');
            const nombre = found.data.nombre || correo;
            localStorage.setItem('usuario', JSON.stringify({ nombre, correo, rol: role }));

            mensaje.style.color = 'green';
            if (role === 'admin') {
                mensaje.innerText = 'Bienvenido Administrador, redirigiendo...';
                setTimeout(() => window.location.href = 'admin.html', 800);
            } else if (role === 'vendedor') {
                mensaje.innerText = 'Bienvenido Vendedor, redirigiendo...';
                setTimeout(() => window.location.href = 'perfilVendedor.html', 800);
            } else {
                mensaje.innerText = 'Bienvenido Cliente, redirigiendo...';
                setTimeout(() => window.location.href = 'perfilCliente.html', 800);
            }
        } else {
            mensaje.style.color = 'red';
            mensaje.innerText = 'Correo o clave incorrectos';
        }
    } catch (error) {
        console.error('Error login (Firestore legacy):', error);
        mensaje.style.color = 'red';
        mensaje.innerText = 'Error al verificar usuario';
    }

    // Fallback local de desarrollo: aceptar credenciales demo vendedor
    // Úsalo solo en desarrollo si no tienes el documento en Firestore aún.
    if (correo === 'vendedor@duoc.cl' && clave === 'vendedor1234') {
        localStorage.setItem('usuario', JSON.stringify({ nombre: 'Vendedor Demo', correo, rol: 'vendedor' }));
        mensaje.style.color = 'green';
        mensaje.innerText = 'Bienvenido Vendedor (demo), redirigiendo...';
        setTimeout(() => window.location.href = 'perfilVendedor.html', 800);
        return;
    }
});

});