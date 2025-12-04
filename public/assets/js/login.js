
document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("formLogin");
    const correoInput = document.getElementById("correoLogin");
    const claveInput = document.getElementById("claveLogin");
    const mensaje = document.getElementById("mensajeLogin");

    if (!form) return console.error("No se encontró #formLogin");

    // Initialize Firebase (keeping original config for compatibility)
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

    // Function to generate a token (for backward compatibility)
    function generateToken() {
        const header = {
            alg: "HS256",
            typ: "JWT"
        };
        const payload = {
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 86400, // 24 horas
            rol: "cliente"
        };
        const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const payloadBase64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
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

        // Admin: authenticate from 'admin' collection in Firestore
        try {
            const adminQuery = await db.collection("admin")
                .where("correo", "==", correo)
                .get();

            if (!adminQuery.empty) {
                const adminData = adminQuery.docs[0].data();

                // Validate password (direct comparison - no encryption)
                if (adminData.contraseña === clave) {
                    const usuario = { nombre: "Administrador", correo, rol: "admin" };
                    const token = generateToken();
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

        // If not admin, check if it's a client
        mensaje.style.color = "red";
        mensaje.innerText = "Correo o contraseña incorrectos";

        // Client: validate from Firestore
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

                    // Store user in localStorage with real role
                    const usuario = { nombre, correo, rol: "cliente" };
                    const token = generateToken();
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
