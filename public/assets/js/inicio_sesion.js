
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


  const formLogin = document.getElementById("form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", function(e) {
      e.preventDefault();

      const correo = document.getElementById("login-correo")?.value || "";

      let nombre = "";
      try {
        const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
        const usuario = usuarios.find(u => u.correo === correo);
        if (usuario && usuario.nombre) nombre = usuario.nombre;
      } catch {}
      modal.close?.();
      mostrarBienvenida(nombre);
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
