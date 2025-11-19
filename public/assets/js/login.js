document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formLogin");
    const correoInput = document.getElementById("correoLogin");
    const claveInput = document.getElementById("claveLogin");
    const mensaje = document.getElementById("mensajeLogin");

    if (!form) return console.error("No se encontró #formLogin");

    // Inicializar Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyBBT7jka7a-7v3vY19BlSajamiedLrBTN0",
        authDomain: "tiendanombretienda.firebaseapp.com",
        projectId: "tiendanombretienda",
        storageBucket: "tiendanombretienda.appspot.com",
        messagingSenderId: "408928911689",
        appId: "1:408928911689:web:d8b313c7e15fc528661a98",
        measurementId: "G-Y1DW47VEWZ"
    };

    if (!firebase.apps?.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

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

    // Credenciales de prueba locales (útiles si no tienes usuarios creados en Firebase)
    // Contraseñas temporales: admin -> "admin123", cliente -> "cliente123"
    if (correo === 'admin@duoc.cl' && clave === 'admin123') {
        const usuario = { nombre: 'Administrador', correo, rol: 'admin' };
        localStorage.setItem('usuario', JSON.stringify(usuario));
        mensaje.style.color = 'green';
        mensaje.innerText = 'Bienvenido Administrador (modo prueba), redirigiendo...';
        setTimeout(() => {
            // Redirigir al panel de administración
            window.location.href = 'admin.html';
        }, 1000);
        return;
    }

    if (correo === 'cliente@duoc.cl' && clave === 'cliente123') {
        const usuario = { nombre: 'Cliente Demo', correo, rol: 'cliente' };
        localStorage.setItem('usuario', JSON.stringify(usuario));
        mensaje.style.color = 'green';
        mensaje.innerText = 'Bienvenido Cliente (modo prueba), redirigiendo...';
        setTimeout(() => {
            window.location.href = `perfilCliente.html`;
        }, 1000);
        return;
    }

    // Admin: autenticar con Firebase Auth
    if (correo === "admin@duoc.cl") {
        try {
            // Asegurar persistencia local de la sesión antes de iniciar (permanece tras redirect)
            try {
                await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            } catch (pErr) {
                console.warn('No se pudo establecer persistencia explícita:', pErr);
            }

            await auth.signInWithEmailAndPassword(correo, clave);
            // Guardar usuario en localStorage
            const usuario = { nombre: "Administrador", correo, rol: "admin" };
            localStorage.setItem("usuario", JSON.stringify(usuario));

            mensaje.style.color = "green";
            mensaje.innerText = "Bienvenido Administrador, redirigiendo...";
            setTimeout(() => {
                const redirect = localStorage.getItem('redirigirDespuesLogin');
                if (redirect) {
                    localStorage.removeItem('redirigirDespuesLogin');
                    window.location.href = redirect;
                } else {
                    window.location.href = `admin.html`;
                }
            }, 1000);
        } catch (error) {
            console.error("Error login admin:", error);
            mensaje.style.color = "red";
            mensaje.innerText = "Credenciales incorrectas para administrador";
        }
        return;
    }

    // Cliente: validar desde Firestore
    try {
        const query = await db.collection("usuario")
            .where("correo", "==", correo)
            .where("clave", "==", clave)
            .get();

        if (!query.empty) {
            const userData = query.docs[0].data();
            const nombre = userData.nombre || correo;

            // Guardar usuario en localStorage con rol real
            const usuario = { nombre, correo, rol: "cliente" };
            localStorage.setItem("usuario", JSON.stringify(usuario));

            mensaje.style.color = "green";
            mensaje.innerText = "Bienvenido cliente, redirigiendo...";
            setTimeout(() => {
                const redirect = localStorage.getItem('redirigirDespuesLogin');
                if (redirect) {
                    localStorage.removeItem('redirigirDespuesLogin');
                    window.location.href = redirect;
                } else {
                    window.location.href = `perfilCliente.html`;
                }
            }, 1000);
        } else {
            mensaje.style.color = "red";
            mensaje.innerText = "Correo o clave incorrectos";
        }
    } catch (error) {
        console.error("Error login cliente:", error);
        mensaje.style.color = "red";
        mensaje.innerText = "Error al verificar usuario";
    }
});
});
