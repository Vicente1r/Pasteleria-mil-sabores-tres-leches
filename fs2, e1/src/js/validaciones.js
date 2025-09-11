"use strict";


const ADMIN_PATH   = "html/admin.html";  // admin dentro de /html
const CLIENTE_PATH = "index.html";       // cambia si tienes otra página para no-admin


function validarCorreo(correo) {
  const regex = /^[\w.+-]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i;
  return regex.test(correo);
}

function validarRun(run) {
  const regex = /^\d{7,8}[0-9K]$/i;
  return regex.test(run);
}


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-login");
  if (!form) return;

  const btnLogin      = form.querySelector("#btn-login");
  const btnIrRegistro = form.querySelector("#btn-ir-registro");
  if (btnLogin && !btnLogin.getAttribute("type")) btnLogin.setAttribute("type", "submit");
  if (btnIrRegistro) btnIrRegistro.setAttribute("type", "button");

  const runInput    = form.querySelector("#login-run");
  const nombreInput = form.querySelector("#login-nombre");
  const correoInput = form.querySelector("#login-correo");
  const mensajeEl   = document.getElementById("mensaje"); // status fuera del form

  const setMensaje = (txt) => {
    if (mensajeEl) {
      mensajeEl.textContent = txt || "";
      mensajeEl.setAttribute("aria-live", "polite");
    }
  };


  const limpiarBtn = document.getElementById("limpiarBtn");
  if (limpiarBtn) {
    limpiarBtn.addEventListener("click", () => {
      form.reset();
      setMensaje("");
      if (correoInput?.setCustomValidity) correoInput.setCustomValidity("");
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const run    = (runInput?.value || "").trim();
    const nombre = (nombreInput?.value || "").trim();
    const correo = (correoInput?.value || "").trim().toLowerCase();

    if (correoInput?.setCustomValidity) correoInput.setCustomValidity("");

    if (!validarCorreo(correo)) {
      correoInput.setCustomValidity("El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com");
      correoInput.reportValidity();
      return;
    }
    if (!validarRun(run)) {
      setMensaje("El RUN es inválido");
      return;
    }
    if (!nombre) {
      setMensaje("El nombre es obligatorio");
      return;
    }

    const isAdmin = correo === "admin@duoc.cl";

    // Guarda para “candado” en admin.html (front)
    sessionStorage.setItem("ms_email", correo);
    sessionStorage.setItem("ms_nombre", nombre);

    const destino = new URL(isAdmin ? ADMIN_PATH : CLIENTE_PATH, location.href);
    destino.searchParams.set("nombre", nombre);

    setMensaje(`¡Bienvenido ${nombre}! Redirigiendo...`);
    console.log("[LOGIN] isAdmin:", isAdmin);
    console.log("[LOGIN] destino:", destino.toString());

    setTimeout(() => {
      window.location.assign(destino.toString());
    }, 250);
  });
});
