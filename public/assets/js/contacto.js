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

// Handle form submission
async function handleFormSubmit(e) {
  console.log('Button clicked, preventing default');
  e.preventDefault();
  console.log('Default prevented, checking user login');

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

  // Get form data
  const nombre = document.getElementById('nombre').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const contenido = document.getElementById('contenido').value.trim();

  // Validate form data
  if (!nombre || !correo || !contenido) {
    mostrarNotificacion('Por favor, completa todos los campos', 'error');
    return;
  }

  try {
    // Get user data from localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario || !usuario.correo) {
      mostrarNotificacion('Error: No se encontraron datos del usuario', 'error');
      return;
    }

    // Create contact document
    const contactoData = {
      nombre: nombre,
      correo: correo,
      contenido: contenido,
      usuarioId: usuario.correo,
      fechaEnvio: new Date().toISOString(),
      estado: 'pendiente' // or any status you want
    };

    // Save to Firestore
    await db.collection('contactos').add(contactoData);

    // Clear form
    formContacto.reset();

    // Show success message
    mostrarNotificacion('Mensaje enviado exitosamente. Nos pondremos en contacto contigo pronto.');

  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    mostrarNotificacion('Error al enviar el mensaje. Inténtalo de nuevo.', 'error');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, btnEnviarMensaje:', btnEnviarMensaje);
  if (btnEnviarMensaje) {
    console.log('Adding event listener to button');
    btnEnviarMensaje.addEventListener('click', handleFormSubmit);
  } else {
    console.error('Button not found!');
  }
});
