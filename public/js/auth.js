import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
} from "../../public/js/firebase-config.js";

// from "./firebase-config.js";
// ================== ELEMENTOS DEL DOM ==================
const modal = document.getElementById("modal");
// Buscar elemento de inicio de sesión: preferir id pero aceptar clase (.btn-login)
let btnInicioSesion =
  document.getElementById("inicio_sesion") || document.querySelector(".btn-login");
// Buscar elemento de registrarse: preferir id pero aceptar clase (.btn-signup)
let btnRegistrarse =
  document.getElementById("registrarse") || document.querySelector(".btn-signup");
const btnCerrar = document.getElementById("cerrar");

const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const panelLogin = document.getElementById("panel-login");
const panelRegister = document.getElementById("panel-register");

const formLogin = document.getElementById("form-login");
const formRegister = document.getElementById("form-register");

const btnIrRegistro = document.getElementById("btn-ir-registro");
const btnIrLogin = document.getElementById("btn-ir-login");

const notificacionBienvenida = document.getElementById("notificacion-bienvenida");

// Variable para almacenar datos del usuario
let currentUserData = null;

// ================== FUNCIONES DE VALIDACIÓN ==================
function validarRut(rut) {
  const rutLimpio = rut.replace(/[^0-9kK]/g, "");
  if (rutLimpio.length < 8) return false;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toLowerCase();

  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo.charAt(i));
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperado = 11 - (suma % 11);
  const dvCalculado =
    dvEsperado === 11 ? "0" : dvEsperado === 10 ? "k" : dvEsperado.toString();

  return dv === dvCalculado;
}

function mostrarError(mensaje) {
  alert(mensaje);
}

function mostrarExito(mensaje) {
  alert(mensaje);
}

// ================== ACTUALIZAR UI DEL USUARIO ==================
function actualizarUIUsuario(userData) {
  if (!btnInicioSesion) return;

  if (userData) {
    // Usuario autenticado
    currentUserData = userData;
    btnInicioSesion.textContent = `Hola, ${userData.nombre}`;
    btnInicioSesion.style.cursor = "default";

    // Ocultar botón de registrarse
    if (btnRegistrarse) {
      btnRegistrarse.style.display = "none";
    }

    // Agregar botón de cerrar sesión si no existe
    let btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
    if (!btnCerrarSesion) {
      const separador = document.createElement("span");
      separador.className = "separar";
      separador.textContent = "|";
      separador.id = "separador-cerrar-sesion";

      btnCerrarSesion = document.createElement("a");
      btnCerrarSesion.id = "btn-cerrar-sesion";
      btnCerrarSesion.textContent = "Cerrar sesión";
      btnCerrarSesion.style.cursor = "pointer";
      btnCerrarSesion.href = "#";

      btnCerrarSesion.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await signOut(auth);
          // Limpiar estado local relacionado con el usuario
          try {
            localStorage.removeItem('usuario');
            localStorage.removeItem('token');
            localStorage.removeItem('adminLoginTime');
            localStorage.removeItem('redirigirDespuesLogin');
          } catch (lsErr) {
            console.warn('No se pudo limpiar localStorage:', lsErr);
          }

          mostrarExito("Sesión cerrada exitosamente");
          // Redirigir al inicio
          try { window.location.href = '/'; } catch(_) { /* ignore */ }
        } catch (error) {
          console.error("Error al cerrar sesión:", error);
          mostrarError("Error al cerrar sesión");
        }
      });

      // Insertar después del botón de inicio de sesión
      const usuarioDiv =
        document.querySelector(".usuario") ||
        document.querySelector(".auth-buttons") ||
        document.querySelector(".nav-right");
      const separadorAnterior = btnInicioSesion
        ? btnInicioSesion.nextElementSibling
        : null;

      if (
        separadorAnterior &&
        separadorAnterior.classList &&
        separadorAnterior.classList.contains("separar")
      ) {
        separadorAnterior.after(separador);
        separador.after(btnCerrarSesion);
      } else if (usuarioDiv) {
        // Agregar separador si no existe
        usuarioDiv.appendChild(separador);
        usuarioDiv.appendChild(btnCerrarSesion);
      }

      // Agregar enlace a perfil de usuario
      let btnPerfil = document.getElementById("btn-perfil");
      if (!btnPerfil && usuarioDiv) {
        btnPerfil = document.createElement("a");
        btnPerfil.id = "btn-perfil";
        btnPerfil.textContent = "Mi Perfil";
          // Si es admin -> panel admin; si es vendedor -> perfil vendedor; si no -> perfil cliente
          if (userData && (userData.rol === 'admin' || userData.role === 'admin')) {
            btnPerfil.href = 'admin.html';
          } else if (userData && (userData.rol === 'vendedor' || userData.role === 'vendedor')) {
            btnPerfil.href = 'perfilVendedor.html';
          } else {
            btnPerfil.href = 'perfilCliente.html';
          }
        btnPerfil.style.marginRight = "10px";
        usuarioDiv.insertBefore(btnPerfil, separador || null);
      }

      // Si es admin, agregar enlace al panel de administración
      const isAdmin =
        userData && (userData.rol === "admin" || userData.role === "admin");
      let btnPanelAdmin = document.getElementById("btn-panel-admin");
      if (isAdmin && !btnPanelAdmin && usuarioDiv) {
        btnPanelAdmin = document.createElement("a");
        btnPanelAdmin.id = "btn-panel-admin";
        btnPanelAdmin.textContent = "Panel Admin";
        btnPanelAdmin.href = "admin.html";
        btnPanelAdmin.style.marginRight = "10px";
        usuarioDiv.insertBefore(
          btnPanelAdmin,
          document.getElementById("separador-cerrar-sesion") || null
        );
      }
    }

    // Cambiar comportamiento del click en "Iniciar sesión"
    if (btnInicioSesion && btnInicioSesion.parentNode) {
      const nuevoBtn = btnInicioSesion.cloneNode(true);
      btnInicioSesion.parentNode.replaceChild(nuevoBtn, btnInicioSesion);
      btnInicioSesion =
        document.getElementById("inicio_sesion") || document.querySelector(".btn-login");
    }
  } else {
    // Usuario no autenticado
    currentUserData = null;
    const btnActual =
      document.getElementById("inicio_sesion") || document.querySelector(".btn-login");
    if (btnActual) {
      btnActual.textContent = "Iniciar sesión";
      btnActual.style.cursor = "pointer";

      // Restaurar funcionalidad de abrir modal (si existe)
      try {
        const nuevoBtn = btnActual.cloneNode(true);
        if (btnActual.parentNode) btnActual.parentNode.replaceChild(nuevoBtn, btnActual);
        nuevoBtn.addEventListener("click", () => abrirModal(false));
      } catch (e) {
        // ignore
      }
    }

    if (btnRegistrarse) {
      btnRegistrarse.style.display = "inline";
    }

    // Eliminar botón de cerrar sesión
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
    const separadorCerrarSesion = document.getElementById("separador-cerrar-sesion");
    const btnPerfil = document.getElementById("btn-perfil");
    const btnPanelAdmin = document.getElementById("btn-panel-admin");
    if (btnCerrarSesion) btnCerrarSesion.remove();
    if (separadorCerrarSesion) separadorCerrarSesion.remove();
    if (btnPerfil) btnPerfil.remove();
    if (btnPanelAdmin) btnPanelAdmin.remove();
  }
}

// ================== MANEJO DEL MODAL ==================
function abrirModal(mostrarRegistro = false) {
  if (!modal) return;
  modal.showModal();

  if (mostrarRegistro) {
    mostrarPanelRegistro();
  } else {
    mostrarPanelLogin();
  }
}

function cerrarModal() {
  if (!modal) return;
  modal.close();
  if (formLogin) formLogin.reset();
  if (formRegister) formRegister.reset();
}

function mostrarPanelLogin() {
  if (panelLogin) panelLogin.hidden = false;
  if (panelRegister) panelRegister.hidden = true;
  if (tabLogin) {
    tabLogin.setAttribute("aria-selected", "true");
    tabLogin.classList.add("active");
  }
  if (tabRegister) {
    tabRegister.setAttribute("aria-selected", "false");
    tabRegister.classList.remove("active");
  }
}

function mostrarPanelRegistro() {
  if (panelLogin) panelLogin.hidden = true;
  if (panelRegister) panelRegister.hidden = false;
  if (tabLogin) {
    tabLogin.setAttribute("aria-selected", "false");
    tabLogin.classList.remove("active");
  }
  if (tabRegister) {
    tabRegister.setAttribute("aria-selected", "true");
    tabRegister.classList.add("active");
  }
}

// ================== EVENT LISTENERS DEL MODAL ==================
// IMPORTANTE: Solo agregar listeners si el usuario NO está autenticado
if (btnInicioSesion) {
  btnInicioSesion.addEventListener("click", (e) => {
    if (!currentUserData) {
      e.preventDefault();
      abrirModal(false);
    }
  });
}

if (btnRegistrarse) {
  btnRegistrarse.addEventListener("click", (e) => {
    e.preventDefault();
    abrirModal(true);
  });
}

if (btnCerrar) {
  btnCerrar.addEventListener("click", (e) => {
    e.preventDefault();
    cerrarModal();
  });
}

if (tabLogin) tabLogin.addEventListener("click", mostrarPanelLogin);
if (tabRegister) tabRegister.addEventListener("click", mostrarPanelRegistro);
if (btnIrRegistro) btnIrRegistro.addEventListener("click", mostrarPanelRegistro);
if (btnIrLogin) btnIrLogin.addEventListener("click", mostrarPanelLogin);

// ================== REGISTRO DE USUARIO ==================
if (formRegister) {
  formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btnRegister = document.getElementById("btn-register");
    if (!btnRegister) return;

    btnRegister.disabled = true;
    btnRegister.textContent = "Registrando...";

    try {
      const run = document.getElementById("reg-run")?.value.trim();
      const nombre = document.getElementById("nombre")?.value.trim();
      const correo = document.getElementById("correo_reg")?.value.trim();
      const correo2 = document.getElementById("correo2")?.value.trim();
      const password = document.getElementById("password")?.value;
      const password2 = document.getElementById("password2")?.value;
      const fecha = document.getElementById("reg-fecha")?.value;
      const telefono = document.getElementById("telefono")?.value.trim();
      const comuna = document.getElementById("comuna")?.value;

      // Validaciones
      if (!validarRut(run)) {
        mostrarError("RUT inválido. Por favor verifica el formato.");
        btnRegister.disabled = false;
        btnRegister.textContent = "Registrar";
        return;
      }

      if (correo !== correo2) {
        mostrarError("Los correos no coinciden");
        btnRegister.disabled = false;
        btnRegister.textContent = "Registrar";
        return;
      }

      if (password !== password2) {
        mostrarError("Las contraseñas no coinciden");
        btnRegister.disabled = false;
        btnRegister.textContent = "Registrar";
        return;
      }

      if (password.length < 4) {
        mostrarError("La contraseña debe tener al menos 4 caracteres");
        btnRegister.disabled = false;
        btnRegister.textContent = "Registrar";
        return;
      }

      if (!comuna) {
        mostrarError("Por favor selecciona una comuna");
        btnRegister.disabled = false;
        btnRegister.textContent = "Registrar";
        return;
      }

      // Crear usuario en Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        correo,
        password
      );
      const user = userCredential.user;

      // Guardar datos en Firestore
      const userData = {
        run: run,
        nombre: nombre,
        correo: correo,
        telefono: telefono || "",
        comuna: comuna,
        fechaNacimiento: fecha,
        role: "cliente", // ✅ Se define rol por defecto
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "usuario", user.uid), userData);

      mostrarExito("¡Registro exitoso! Bienvenido a Mil Sabores");
      cerrarModal();

      // Actualizar UI inmediatamente
      actualizarUIUsuario(userData);

      // Mostrar notificación
      if (notificacionBienvenida) {
        notificacionBienvenida.textContent = `¡Bienvenido ${userData.nombre}!`;
        notificacionBienvenida.style.display = "block";
        setTimeout(() => {
          notificacionBienvenida.style.display = "none";
        }, 5000);
      }
    } catch (error) {
      console.error("Error al registrar:", error);

      let mensajeError = "Error al registrar usuario";

      if (error.code === "auth/email-already-in-use") {
        mensajeError = "Este correo ya está registrado";
      } else if (error.code === "auth/invalid-email") {
        mensajeError = "Correo electrónico inválido";
      } else if (error.code === "auth/weak-password") {
        mensajeError = "La contraseña es muy débil";
      }

      mostrarError(mensajeError);
    } finally {
      btnRegister.disabled = false;
      btnRegister.textContent = "Registrar";
    }
  });
}

// ================== INICIO DE SESIÓN ==================
if (formLogin) {
  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();

    const correo = document.getElementById("login-correo")?.value.trim();
    const clave = document.getElementById("login-clave")?.value;

    // Mini "base de datos" local
    const adminEmail = "admin@duoc.cl";
    const adminPass = "123456";

    if (correo === adminEmail && clave === adminPass) {
      // ✅ Redirigir a panel admin
      window.location.href = "../assets/page/Admin.html";
    } else {
      // ✅ Redirigir a perfil cliente genérico
      window.location.href = "../assets/page/perfilCliente.html";
    }
  });
}

// ================== OBSERVADOR DE ESTADO ==================
onAuthStateChanged(auth, async (user) => {
  console.log(
    "Estado de autenticación cambió:",
    user ? "Autenticado" : "No autenticado"
  );

  if (user) {
    // Usuario autenticado
    try {
      const docRef = doc(db, "usuario", user.uid);
      const docSnap = await getDoc(docRef);

      // Si el admin no está en Firestore con rol, lo definimos aquí
      if (user.email === "admin@duoc.cl") {
        if (!userData.role || userData.role !== "admin") {
          userData.role = "admin";
        }
      }

      if (docSnap.exists()) {
        const userData = docSnap.data();
        console.log("Datos del usuario cargados:", userData.nombre);
        actualizarUIUsuario(userData);
      } else {
        console.warn("No se encontraron datos del usuario en Firestore");
        actualizarUIUsuario({ nombre: user.email.split("@")[0] });
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
    }
  } else {
    // Usuario no autenticado
    console.log("No hay usuario autenticado");
    actualizarUIUsuario(null);
  }
});

console.log("✅ Sistema de autenticación Firebase cargado correctamente");
