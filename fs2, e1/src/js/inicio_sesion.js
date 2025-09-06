// --- Abrir / cerrar modal ---
const btnAbrirLogin = document.getElementById('inicio_sesion');
const btnAbrirReg   = document.getElementById('registrarse');
const modal         = document.getElementById('modal');
const btnCerrar     = document.getElementById('cerrar');

btnAbrirLogin?.addEventListener('click', () => { modal.showModal(); mostrarLogin(); });
btnAbrirReg?.addEventListener('click',   () => { modal.showModal(); mostrarRegistro(); });
btnCerrar?.addEventListener('click',     () => modal.close());

// --- Tabs ---
const tabLogin   = document.getElementById('tab-login');
const tabReg     = document.getElementById('tab-register');
const panelLogin = document.getElementById('panel-login');
const panelReg   = document.getElementById('panel-register');

function mostrarLogin() {
  tabLogin.setAttribute('aria-selected', 'true');
  tabReg.setAttribute('aria-selected', 'false');
  panelLogin.hidden = false;
  panelReg.hidden = true;
  document.getElementById('email_login')?.focus();
}

function mostrarRegistro() {
  tabLogin.setAttribute('aria-selected', 'false');
  tabReg.setAttribute('aria-selected', 'true');
  panelLogin.hidden = true;
  panelReg.hidden = false;
  document.getElementById('nombre')?.focus();
}

tabLogin?.addEventListener('click', mostrarLogin);
tabReg?.addEventListener('click',   mostrarRegistro);

// Enlaces dentro de los paneles
document.getElementById('btn-ir-registro')?.addEventListener('click', mostrarRegistro);
document.getElementById('btn-ir-login')?.addEventListener('click',    mostrarLogin);

// --- Evitar envíos reales (no hay BD) ---
document.getElementById('btn-login')?.addEventListener('click', (e) => {
  e.preventDefault();
  // Aquí podrías validar campos si quieres
  modal.close();
});

document.getElementById('btn-register')?.addEventListener('click', (e) => {
  e.preventDefault();
  // Ej: validar correo=correo2 y pass=pass2
  const c1 = document.getElementById('correo')?.value.trim();
  const c2 = document.getElementById('correo2')?.value.trim();
  const p1 = document.getElementById('password')?.value;
  const p2 = document.getElementById('password2')?.value;

  if (c1 && c2 && c1 !== c2) { alert('Los correos no coinciden'); return; }
  if (p1 && p2 && p1 !== p2) { alert('Las contraseñas no coinciden'); return; }

  // Simular 'ok'
  alert('Registro enviado (demo).');
  modal.close();
});

// Estado inicial cuando se carga la página
mostrarLogin();
