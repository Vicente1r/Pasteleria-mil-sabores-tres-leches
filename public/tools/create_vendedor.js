document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('createForm');
  const status = document.getElementById('status');

  if (!window.firebase) {
    status.textContent = 'Firebase no está cargado. Verifica la ruta a firebase-config.js y los scripts de Firebase.';
    return;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    status.textContent = '';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const nombre = document.getElementById('nombre').value.trim() || 'Vendedor de prueba';

    if (password.length < 6) {
      status.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    try {
      status.textContent = 'Creando usuario en Firebase Auth...';
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const uid = cred.user.uid;

      status.textContent = 'Guardando rol en Firestore...';
      await firebase.firestore().collection('users').doc(uid).set({
        role: 'vendedor',
        nombre: nombre,
        correo: email,
        creadoEn: firebase.firestore.FieldValue.serverTimestamp()
      });

      status.innerHTML = `Vendedor creado correctamente.<br/><strong>Email:</strong> ${email} <br/><strong>Contraseña:</strong> ${password} <br/>Se cerrará sesión del usuario creado.`;

      // Cerrar sesión del usuario creado para no interferir con la sesión actual del desarrollador
      await firebase.auth().signOut();
    } catch (err) {
      console.error(err);
      status.textContent = 'Error: ' + (err && err.message ? err.message : String(err));
    }
  });
});
