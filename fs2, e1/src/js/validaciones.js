"use strict";

/* ========== Config ========== */
// Ajusta esta ruta según dónde viva tu admin.html respecto del index.html
// (si tu index está en la raíz y admin en /html/, deja tal cual)
const ADMIN_PATH = "html/admin.html";
const CLIENTE_PATH = "assets/page/perfilCliente.html";

/* ========== Validaciones ========== */
function validarCorreo(correo) {
  // @duoc.cl, @profesor.duoc.cl, @gmail.com
  const regex = /^[\w.+-]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i;
  return regex.test(correo);
}

function validarRun(run) {
  // RUN sin puntos ni guión, 7-8 dígitos + DV (0-9/K)
  const regex = /^\d{7,8}[0-9K]$/i;
  return regex.test(run);
}

/* ========== Login ========== */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-login");
  if (!form) return;

  // Botones dentro del form
  const btnLogin = form.querySelector("#btn-login");
  // Fuerza a que el botón de login sea submit (si no lo fuera)
  if (btnLogin && !btnLogin.getAttribute("type")) btnLogin.setAttribute("type", "submit");

  // ¡OJO! Asegura que el botón "ir a registro" NO sea submit
  const btnIrRegistro = form.querySelector("#btn-ir-registro");
  if (btnIrRegistro) btnIrRegistro.setAttribute("type", "button");

  // Inputs (ojo: en tu HTML el id de nombre es "nonmbre")
  const runInput    = form.querySelector("#run");
  const nombreInput = form.querySelector("#nonmbre");
  const correoInput = form.querySelector("#correo");
  const mensajeEl   = document.getElementById("mensaje");

  const setMensaje = (txt) => {
    if (!mensajeEl) return;
    mensajeEl.innerText = txt || "";
    mensajeEl.setAttribute("aria-live", "polite");
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const run    = (runInput?.value || "").trim();
    const nombre = (nombreInput?.value || "").trim();
    const correo = (correoInput?.value || "").trim().toLowerCase();

    // Limpia error previo de correo
    if (correoInput?.setCustomValidity) correoInput.setCustomValidity("");

    // Validaciones básicas
    if (!validarCorreo(correo)) {
      if (correoInput?.setCustomValidity) {
        correoInput.setCustomValidity("El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com");
        correoInput.reportValidity();
      } else {
        setMensaje("Correo inválido");
      }
      console.warn("[LOGIN] Validación correo falló:", correo);
      return;
    }

    if (!validarRun(run)) {
      setMensaje("El RUN es inválido");
      console.warn("[LOGIN] Validación RUN falló:", run);
      return;
    }

    if (!nombre) {
      setMensaje("El nombre es obligatorio");
      console.warn("[LOGIN] Nombre vacío");
      return;
    }

    // ¿Es admin?
    const isAdmin = correo === "admin@duoc.cl";

    // Armamos el destino usando la misma base que la página actual
    const base = location.href;
    const urlDestino = new URL(isAdmin ? ADMIN_PATH : CLIENTE_PATH, base);
    urlDestino.searchParams.set("nombre", nombre);

    setMensaje(`¡Bienvenido ${nombre}! Redirigiendo...`);
    console.log("[LOGIN] isAdmin:", isAdmin);
    console.log("[LOGIN] destino:", urlDestino.toString());

    // Redirección confiable
    setTimeout(() => {
      window.location.assign(urlDestino.toString());
      // Alternativas:
      // window.location.href = urlDestino.toString();
    }, 300);
  });
});
