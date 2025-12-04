// Firebase imports
import { db } from '../../js/firebase-config.js';

// DOM elements
const btnEnviarMensaje = document.getElementById('btn-enviar-mensaje');
const formContacto = document.getElementById('form-contacto');
const notificaciones = document.createElement('div');
notificaciones.id = 'notificaciones';
notificaciones.className = 'notificaciones';
document.body.appendChild(notificaciones);

// Function to check if user is logged in (similar to carrito.js)
async function usuarioLogueado() {
  try {
    // First check localStorage for quick access
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const token = localStorage.getItem('token');
    console.log("Usuario en localStorage:", usuario);
    console.log("Token en localStorage:", token);

    if (usuario && usuario.correo && usuario.nombre && token) {
      console.log("Usuario y token encontrados en localStorage, verificando Firestore...");

      // Verify session is active in Firestore
      try {
        const sesionDoc = await db.collection("sesiones").doc(usuario.correo).get();
        console.log("Documento de sesión existe:", sesionDoc.exists);

        if (sesionDoc.exists) {
          const sesionData = sesionDoc.data();
          console.log("Datos de sesión:", sesionData);
          return sesionData.activo === true;
        } else {
          console.log("No se encontró documento de sesión en Firestore");
          // If no session in Firestore but in localStorage, consider valid
          return true;
        }
      } catch (firestoreError) {
        console.error("Error consultando Firestore:", firestoreError);
        // If Firestore error but user in localStorage, allow access
        return true;
      }
    }

    console.log("No se encontró usuario o token en localStorage");
    return false;
  } catch (error) {
    console.error("Error verificando autenticación:", error);
    // In case of error, check if at least user and token in localStorage
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      const token = localStorage.getItem('token');
      return usuario && usuario.correo && usuario.nombre && token;
    } catch {
      return false;
    }
  }
}

// Function to show notifications
function mostrarNotificacion(mensaje, tipo = 'success') {
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion ${tipo === 'error' ? 'error' : ''}`;
  notificacion.textContent = mensaje;

  notificaciones.appendChild(notificacion);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notificacion.classList.add('fade-out');
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion);
      }
    }, 300);
  }, 3000);
}

// Process contact form submission (similar to procesarPago in checkout.js)
async function procesarContacto() {
  console.log('Processing contact form submission');

  // Check if user is logged in
  const logueado = await usuarioLogueado();
  if (!logueado) {
    mostrarNotificacion('Debes iniciar sesión para enviar el formulario de contacto', 'error');
    // Redirect to login.html after 5 seconds
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 5000);
    return;
  }

  // Validate form
  if (!validarFormularioContacto()) {
    mostrarNotificacion('Por favor completa todos los campos obligatorios', 'error');
    return;
  }

  try {
    // Get contact data
    const datosContacto = obtenerDatosContacto();

    // Get user data from localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario || !usuario.correo) {
      mostrarNotificacion('Error: No se encontraron datos del usuario', 'error');
      return;
    }

    // Fetch user document to get id_usuario
    const userDoc = await db.collection('usuarios').doc(usuario.correo).get();
    if (!userDoc.exists) {
      mostrarNotificacion('Error: Usuario no encontrado en la base de datos', 'error');
      return;
    }
    const userData = userDoc.data();
    const id_usuario = userData.id; // assuming id is an int field

    // Create contact document
    const contacto = {
      id_usuario: id_usuario,
      correo: datosContacto.correo,
      mensaje: datosContacto.mensaje,
      nombre_completo: datosContacto.nombre
    };

    // Save to Firestore
    await db.collection('contactos').add(contacto);

    // Clear form
    formContacto.reset();

    // Show success message
    mostrarNotificacion('Mensaje enviado exitosamente. Nos pondremos en contacto contigo pronto.');

  } catch (error) {
    console.error('Error procesando el contacto:', error);
    mostrarNotificacion('Error al enviar el mensaje. Inténtalo de nuevo.', 'error');
  }
}

// Validate contact form
function validarFormularioContacto() {
  const nombre = document.getElementById('nombre').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const contenido = document.getElementById('contenido').value.trim();

  return nombre && correo && contenido;
}

// Get contact data from form
function obtenerDatosContacto() {
  return {
    nombre: document.getElementById('nombre').value.trim(),
    correo: document.getElementById('correo').value.trim(),
    mensaje: document.getElementById('contenido').value.trim()
  };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, formContacto:', formContacto);
  if (formContacto) {
    console.log('Adding event listener to form');
    formContacto.addEventListener('submit', (e) => {
      e.preventDefault();
      procesarContacto();
    });
  } else {
    console.error('Form not found!');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-contacto');
  if (!form) return;

  // Configuración (usa la misma que en login.js)
  const firebaseConfig = {
    apiKey: "AIzaSyA1_om-_HPyYVnUo8ELiM5Zob2VSMGbWvw",
    authDomain: "pasteleriamilsaborestresleches.firebaseapp.com",
    projectId: "pasteleriamilsaborestresleches",
    storageBucket: "pasteleriamilsaborestresleches.firebasestorage.app",
    messagingSenderId: "724534518591",
    appId: "1:724534518591:web:fda9e47afb93ed6854e98a",
    measurementId: "G-FXQWCCHM83"
  };

  if (!firebase.apps?.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const auth = firebase.auth();
  const db = firebase.firestore();

  async function getNumericUserIdByEmail(email, uid) {
    try {
      // Intentar obtener documento en colección 'usuario' por correo
      const q = await db.collection('usuario').where('correo', '==', email).get();
      if (!q.empty) {
        const data = q.docs[0].data();
        // Buscar campos numéricos comunes (id, id_usuario, run)
        const candidates = [data.id_usuario, data.id, data.run];
        for (const c of candidates) {
          if (typeof c === 'number' && Number.isInteger(c)) return c;
          if (typeof c === 'string' && /^\d+$/.test(c)) return parseInt(c, 10);
        }
      }
      // Si no existe por correo, intentar por uid (si acaso guardaste uid numérico)
      if (uid && /^\d+$/.test(uid)) return parseInt(uid, 10);
    } catch (err) {
      console.error('Error buscando id usuario:', err);
    }
    // Fallback: timestamp como entero
    return Date.now();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = (document.getElementById('nombre')?.value || '').trim();
    const correo = (document.getElementById('correo')?.value || '').trim();
    const mensaje = (document.getElementById('contenido')?.value || '').trim();

    if (!nombre || !correo || !mensaje) {
      alert('Completa nombre, correo y mensaje.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      // No hay sesión -> redirigir a login
      window.location.href = '../../assets/page/login.html'.replace(/\/\.\.\//g, '/'); // Ajusta ruta si hace falta
      return;
    }

    // Obtener id numérico del usuario (buscar en colección 'usuario' por correo)
    const id_usuario = await getNumericUserIdByEmail(user.email || correo, user.uid);

    try {
      await db.collection('contactos').add({
        id_usuario: id_usuario,
        correo: correo,
        mensaje: mensaje,
        nombre_completo: nombre,
        creado_en: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert('Mensaje enviado. Gracias.');
      form.reset();
    } catch (err) {
      console.error('Error guardando contacto:', err);
      alert('Error al enviar mensaje. Intenta nuevamente.');
    }
  });
});
