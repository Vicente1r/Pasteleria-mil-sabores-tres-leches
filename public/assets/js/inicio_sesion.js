
  const formRegister = document.getElementById("form-register");
  if (formRegister) {
    formRegister.addEventListener("submit", function(e) {

      const nombre = document.getElementById("nombre")?.value || "";
      const correo = document.getElementById("correo_reg")?.value || "";
      if (nombre && correo) {
        let usuarios = [];
        try {
          usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
        } catch {}

        const idx = usuarios.findIndex(u => u.correo === correo);
        if (idx >= 0) usuarios[idx].nombre = nombre;
        else usuarios.push({ correo, nombre });
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
      }
    });
  }
"use strict";

// Configuración de Firebase
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

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const abrir = document.getElementById("inicio_sesion");
  const cerrar = document.getElementById("cerrar");

  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const panelLogin = document.getElementById("panel-login");
  const panelRegister = document.getElementById("panel-register");
  const notificacion = document.getElementById("notificacion-bienvenida");


  abrir?.addEventListener("click", () => {
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  });


  cerrar?.addEventListener("click", () => modal.close?.());


  function activarLogin() {
    tabLogin.setAttribute("aria-selected", "true");
    tabRegister.setAttribute("aria-selected", "false");
    panelLogin.hidden = false;
    panelRegister.hidden = true;
  }
  function activarRegistro() {
    tabLogin.setAttribute("aria-selected", "false");
    tabRegister.setAttribute("aria-selected", "true");
    panelLogin.hidden = true;
    panelRegister.hidden = false;
  }

  tabLogin?.addEventListener("click", activarLogin);
  tabRegister?.addEventListener("click", activarRegistro);



  function mostrarBienvenida(nombre) {
    if (!notificacion) return;
    if (nombre && nombre.trim()) {
      notificacion.textContent = `¡Bienvenido, ${nombre}!`;
    } else {
      notificacion.textContent = `¡Bienvenido,`;
    }
    notificacion.style.display = "block";
    setTimeout(() => {
      notificacion.style.display = "none";
    }, 3500);
  }

  function mostrarNotificacion(mensaje, tipo = 'success') {
    const notif = document.createElement('div');
    notif.className = `notificacion ${tipo === 'error' ? 'error' : ''}`;
    notif.textContent = mensaje;
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${tipo === 'error' ? '#ff4444' : '#4CAF50'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;
    document.body.appendChild(notif);
    setTimeout(() => {
      if (notif.parentNode) {
        notif.parentNode.removeChild(notif);
      }
    }, 3000);
  }


  const formLogin = document.getElementById("form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", async function(e) {
      e.preventDefault();

      const correo = document.getElementById("login-correo")?.value || "";
      const clave = document.getElementById("login-clave")?.value || "";

      let nombre = "";
      let rol = "cliente"; // Default role
      let uid = "";

      try {
        // Fallback de desarrollo: aceptar credenciales demo vendedor
        if (correo === 'vendedor@duoc.cl' && clave === 'vendedor1234') {
          nombre = 'Vendedor Demo';
          rol = 'vendedor';
          uid = correo; // Use email as UID for demo

          // Guardar en localStorage
          localStorage.setItem("usuario", JSON.stringify({
            correo: correo,
            nombre: nombre,
            rol: rol,
            uid: uid,
            fechaLogin: new Date().toISOString()
          }));

          localStorage.setItem("token", `session_${Date.now()}_${correo}`);

          modal.close?.();
          mostrarBienvenida(nombre);
          return;
        }

        // Primero buscar en localStorage para compatibilidad
        const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
        const usuarioLocal = usuarios.find(u => u.correo === correo);

        if (usuarioLocal && usuarioLocal.nombre) {
          nombre = usuarioLocal.nombre;
          rol = usuarioLocal.rol || "cliente";
          uid = usuarioLocal.uid || correo; // Use email as fallback UID
        } else {
          // Si no está en localStorage, buscar en Firestore
          const usuarioDoc = await db.collection("usuario").doc(correo).get();
          if (usuarioDoc.exists) {
            const usuarioData = usuarioDoc.data();
            nombre = usuarioData.nombre || "";
            rol = usuarioData.rol || "cliente";
            uid = usuarioDoc.id;
          } else {
            // Try alternative collection name
            const usuarioDocAlt = await db.collection("usuarios").doc(correo).get();
            if (usuarioDocAlt.exists) {
              const usuarioData = usuarioDocAlt.data();
              nombre = usuarioData.nombre || "";
              rol = usuarioData.rol || "cliente";
              uid = usuarioDocAlt.id;
            }
          }
        }

        if (nombre) {
          // Guardar usuario en Firestore si no existe
          const usuarioRef = db.collection("usuario").doc(correo);
          const usuarioDoc = await usuarioRef.get();
          if (!usuarioDoc.exists) {
            await usuarioRef.set({
              email: correo,
              nombre: nombre,
              rol: rol,
              fechaRegistro: new Date().toISOString(),
              activo: true
            });
          }

          // Guardar sesión en Firestore
          await db.collection("sesiones").doc(correo).set({
            correo: correo,
            nombre: nombre,
            rol: rol,
            fechaLogin: new Date().toISOString(),
            activo: true
          });

          // También guardar en localStorage para acceso rápido
          localStorage.setItem("usuario", JSON.stringify({
            correo: correo,
            nombre: nombre,
            rol: rol,
            uid: uid || correo,
            fechaLogin: new Date().toISOString()
          }));

          // Guardar token de sesión
          localStorage.setItem("token", `session_${Date.now()}_${correo}`);

          modal.close?.();
          mostrarBienvenida(nombre);
        } else {
          mostrarNotificacion("Usuario no encontrado. Regístrate primero.", "error");
        }
      } catch (error) {
        console.error("Error al iniciar sesión:", error);
        mostrarNotificacion("Error al iniciar sesión. Inténtalo de nuevo.", "error");
      }
    });
  }


  activarLogin();


  const linkRegistrarse = document.getElementById("registrarse");
  linkRegistrarse?.addEventListener("click", function(e) {
    e.preventDefault();
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
    activarRegistro();
    tabRegister?.focus();
  });


  const linkIniciarSesion = document.getElementById("inicio_sesion");
  linkIniciarSesion?.addEventListener("click", function(e) {
    e.preventDefault();
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
    activarLogin();
    tabLogin?.focus();
  });
});

