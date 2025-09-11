"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const abrir = document.getElementById("inicio_sesion");
  const cerrar = document.getElementById("cerrar");

  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const panelLogin = document.getElementById("panel-login");
  const panelRegister = document.getElementById("panel-register");

  // abrir modal
  abrir?.addEventListener("click", () => {
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  });

  // cerrar modal
  cerrar?.addEventListener("click", () => modal.close?.());

  // tabs
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

  // Por defecto: login
  activarLogin();
});
