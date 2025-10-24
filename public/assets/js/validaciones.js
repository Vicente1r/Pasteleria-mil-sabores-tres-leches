"use strict";


const ADMIN_PATH   = "html/admin.html"; 
const CLIENTE_PATH = "index.html"; 


function validarCorreo(correo) {

  const regex = /^[\w.+-]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i;
  return regex.test(correo);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-login");
  if (!form) return;


  const btnLogin      = form.querySelector("#btn-login");
  const btnIrRegistro = form.querySelector("#btn-ir-registro");
  if (btnLogin && !btnLogin.getAttribute("type")) btnLogin.setAttribute("type", "submit");
  if (btnIrRegistro) btnIrRegistro.setAttribute("type", "button");


  const correoInput = form.querySelector("#login-correo");
  const claveInput  = form.querySelector("#login-clave");


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


    if (correoInput?.setCustomValidity) correoInput.setCustomValidity("");


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


    const isAdmin = correo === "admin@duoc.cl";


    sessionStorage.setItem("ms_email", correo);

    const nombreFallback = correo.split("@")[0];
    sessionStorage.setItem("ms_nombre", nombreFallback);


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

