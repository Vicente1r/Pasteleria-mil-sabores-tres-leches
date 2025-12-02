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

    // Función para generar un token JWT simple (para admin)
    function generateAdminToken() {
        const header = {
            alg: "HS256",
            typ: "JWT"
        };
        const payload = {
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 86400, // 24 horas
            rol: "admin"
        };
        const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const payloadBase64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        // Nota: Este es un JWT sin firma real. Para producción, genera el token en el backend.
        return `${headerBase64}.${payloadBase64}.fake_signature`;
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

        // Admin: autenticar desde la colección 'admin' en Firestore
        try {
            const adminQuery = await db.collection("admin")
                .where("correo", "==", correo)
                .get();

            if (!adminQuery.empty) {
                const adminData = adminQuery.docs[0].data();
                
                // Validar contraseña (comparación directa - sin encriptación)
                if (adminData.contraseña === clave) {
                    const usuario = { nombre: "Administrador", correo, rol: "admin" };
                    const token = generateAdminToken();
                    localStorage.setItem("usuario", JSON.stringify(usuario));
                    localStorage.setItem("token", token);
                    localStorage.setItem("adminLoginTime", new Date().toISOString());

                    mensaje.style.color = "green";
                    mensaje.innerText = "Bienvenido Administrador, redirigiendo...";
                    setTimeout(() => {
                        window.location.href = "PerfilAdmin.html";
                    }, 1000);
                    return;
                } else {
                    mensaje.style.color = "red";
                    mensaje.innerText = "Correo o contraseña incorrectos";
                    return;
                }
            }
        } catch (adminError) {
            console.error("Error al buscar admin en Firestore:", adminError);
        }

        // Si no es admin, verificar si es cliente
        mensaje.style.color = "red";
        mensaje.innerText = "Correo o contraseña incorrectos";

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
                    const token = generateAdminToken(); // Reutilizar para clientes también
                    localStorage.setItem("usuario", JSON.stringify(usuario));
                    localStorage.setItem("token", token);

                    mensaje.style.color = "green";
                    mensaje.innerText = "Bienvenido cliente, redirigiendo...";
                    setTimeout(() => {
                        window.location.href = "perfilCliente.html";
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
