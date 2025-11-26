document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formLogin");
    const correoInput = document.getElementById("correoLogin");
    const claveInput = document.getElementById("claveLogin");
    const mensaje = document.getElementById("mensajeLogin");

    if (!form) return console.error("No se encontró #formLogin");

    // Inicializar Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyA1_om-_HPyYVnUo8ELiM5Zob2VSMGbWvw",
        authDomain: "pasteleriamilsaborestresleches.firebaseapp.com",
        projectId: "pasteleriamilsaborestresleches",
        storageBucket: "pasteleriamilsaborestresleches.firebasestorage.app",
        messagingSenderId: "724534518591",
        appId: "1:724534518591:web:fda9e47afb93ed6854e98a",
        measurementId: "G-FXQWCCHM83"
    };

    if (!firebase.apps?.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // Token generation function
    function generateToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

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
            const token = generateToken();
            localStorage.setItem('usuario', JSON.stringify(usuario));
            localStorage.setItem('token', token);
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
            const token = generateToken();
            localStorage.setItem('usuario', JSON.stringify(usuario));
            localStorage.setItem('token', token);
            mensaje.style.color = 'green';
            mensaje.innerText = 'Bienvenido Cliente (modo prueba), redirigiendo...';
                    setTimeout(() => {
                        window.location.href = "perfilCliente.html";
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
                const token = generateToken();
                localStorage.setItem("usuario", JSON.stringify(usuario));
                localStorage.setItem("token", token);

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
            // Fetch user document by email only
            const query = await db.collection("usuario")
                .where("correo", "==", correo)
                .get();

            if (!query.empty) {
                const userData = query.docs[0].data();
                console.log("User data fetched from Firestore:", userData);

                // Check password manually (case sensitive)
                console.log("Comparing passwords:", {
                    inputClave: `"${clave}" (length: ${clave.length})`,
                    storedContraseña: `"${userData.contraseña}" (length: ${userData.contraseña ? userData.contraseña.length : 0})`
                });

                const trimmedInputClave = clave.trim();
                const trimmedStoredClave = (userData.contraseña || '').trim();

                if (trimmedStoredClave === trimmedInputClave) {
                    const nombre = userData.nombre_completo || correo;

                    // Guardar usuario en localStorage con rol real
                    const usuario = { nombre, correo, rol: "cliente" };
                    const token = generateToken();
                    localStorage.setItem("usuario", JSON.stringify(usuario));
                    localStorage.setItem("token", token);

                    mensaje.style.color = "green";
                    mensaje.innerText = "Bienvenido cliente, redirigiendo...";
                    setTimeout(() => {
                        const redirect = localStorage.getItem('redirigirDespuesLogin');
                        if (redirect) {
                            localStorage.removeItem('redirigirDespuesLogin');
                            window.location.href = redirect;
                        } else {
                            window.location.href = "perfilCliente.html";
                        }
                    }, 1000);
                } else {
                    mensaje.style.color = "red";
                    mensaje.innerText = "Clave incorrecta";
                }
            } else {
                mensaje.style.color = "red";
                mensaje.innerText = "Correo no registrado";
            }
        } catch (error) {
            console.error("Error login cliente:", error);
            mensaje.style.color = "red";
            mensaje.innerText = "Error al verificar usuario";
        }
    });
});
