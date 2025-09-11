"use strict";

/* ===== RUTAS ===== */
const ADMIN_PATH   = "html/admin.html";  // admin dentro de /html
const CLIENTE_PATH = "index.html";       // cambia si tienes otra página para no-admin

/* ===== VALIDACIONES ===== */
function validarCorreo(correo) {
  // admite @duoc.cl, @profesor.duoc.cl, @gmail.com
  const regex = /^[\w.+-]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i;
  return regex.test(correo);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-login");
  if (!form) return;

  // Botones del form
  const btnLogin      = form.querySelector("#btn-login");
  const btnIrRegistro = form.querySelector("#btn-ir-registro");
  if (btnLogin && !btnLogin.getAttribute("type")) btnLogin.setAttribute("type", "submit");
  if (btnIrRegistro) btnIrRegistro.setAttribute("type", "button");

  // SOLO existen estos dos inputs en tu login:
  const correoInput = form.querySelector("#login-correo");
  const claveInput  = form.querySelector("#login-clave");

  // Mensajes de estado (está fuera del form)
  const mensajeEl = document.getElementById("mensaje");
  const setMensaje = (txt) => {
    if (mensajeEl) {
      mensajeEl.textContent = txt || "";
      mensajeEl.setAttribute("aria-live", "polite");
    }
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const correo = (correoInput?.value || "").trim().toLowerCase();
    const clave  = (claveInput?.value  || "").trim();

    // limpia error previo
    if (correoInput?.setCustomValidity) correoInput.setCustomValidity("");

    // Validaciones acordes a TU HTML (solo correo + clave)
    if (!validarCorreo(correo)) {
      if (correoInput?.setCustomValidity) {
        correoInput.setCustomValidity("El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com");
        correoInput.reportValidity();
      } else {
        setMensaje("Correo inválido");
      }
      return;
    }

    if (!clave || clave.length < 4) {
      setMensaje("La clave debe tener al menos 4 caracteres");
      return;
    }

    // ¿Es admin?
    const isAdmin = correo === "admin@duoc.cl";

    // Guarda datos mínimos para “candado” del admin y saludo
    sessionStorage.setItem("ms_email", correo);
    // Si no tienes “nombre” en el login, usamos el local-part del correo como fallback
    const nombreFallback = correo.split("@")[0];
    sessionStorage.setItem("ms_nombre", nombreFallback);

    // Arma destino (absoluto desde la URL actual)
    const destino = new URL(isAdmin ? ADMIN_PATH : CLIENTE_PATH, location.href);
    destino.searchParams.set("nombre", nombreFallback);

    setMensaje(`¡Bienvenido ${nombreFallback}! Redirigiendo...`);
    console.log("[LOGIN] isAdmin:", isAdmin);
    console.log("[LOGIN] destino:", destino.toString());

    setTimeout(() => {
      window.location.assign(destino.toString());
    }, 200);
  });
});
