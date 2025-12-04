// Import Firebase from the existing config
import { auth, db } from './firebase-config.js';
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Function to extract numeric part from RUN (assuming RUN format like 12345678-9)
function extractNumericFromRun(run) {
  if (!run) return null;

  // Handle both string and number types (Firestore can store numbers)
  let numericValue;
  if (typeof run === 'string') {
    const numericPart = run.replace(/[^0-9]/g, '');
    numericValue = parseInt(numericPart, 10);
  } else if (typeof run === 'number') {
    numericValue = run;
  } else {
    return null;
  }

  // Ensure it's a valid positive integer
  return (numericValue && numericValue > 0) ? numericValue : null;
}

// Main function
document.addEventListener('DOMContentLoaded', () => {
  console.log('contacto.js loaded successfully');

  const formContacto = document.getElementById('form-contacto');

  if (!formContacto) {
    console.error('Form with id "form-contacto" not found');
    return;
  }

  console.log('Form found, adding event listener');

  formContacto.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');

    // Check if user is authenticated (hybrid approach: check both Firebase Auth and localStorage)
    const firebaseUser = auth.currentUser;
    const localUser = localStorage.getItem('usuario');

    console.log('Firebase user:', firebaseUser);
    console.log('Local user:', localUser);

    if (!firebaseUser && !localUser) {
      alert('Debes iniciar sesión para enviar un mensaje.');
      window.location.href = 'login.html';
      return;
    }

    // Get form values
    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const mensaje = document.getElementById('contenido').value.trim();

    console.log('Form values:', {
      nombre: `"${nombre}" (length: ${nombre.length})`,
      correo: `"${correo}" (length: ${correo.length})`,
      mensaje: `"${mensaje}" (length: ${mensaje.length})`
    });

    // Check each field individually for better debugging
    if (!nombre) {
      alert('Por favor, ingresa tu nombre completo.');
      return;
    }
    if (!correo) {
      alert('Por favor, ingresa tu correo electrónico.');
      return;
    }
    if (!mensaje) {
      alert('Por favor, escribe tu mensaje.');
      return;
    }

    try {
      console.log('Getting user data from Firestore...');

      let userData;
      let userEmail;

      // Get user data based on authentication method
      if (firebaseUser) {
        // Firebase Auth user
        const userDocRef = doc(db, 'usuario', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          console.error('Firebase user document not found');
          alert('Error: No se encontraron datos del usuario.');
          return;
        }

        userData = userDocSnap.data();
        userEmail = firebaseUser.email;
      } else if (localUser) {
        // localStorage user (admin or client)
        const parsedUser = JSON.parse(localUser);
        userEmail = parsedUser.correo;

        // Query user by email for localStorage users
        const userQuery = query(collection(db, 'usuario'), where('correo', '==', userEmail));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          userData = userSnapshot.docs[0].data();
        } else {
          // Check if it's admin
          const adminQuery = query(collection(db, 'admin'), where('correo', '==', userEmail));
          const adminSnapshot = await getDocs(adminQuery);

          if (!adminSnapshot.empty) {
            userData = adminSnapshot.docs[0].data();
          } else {
            console.error('User not found in either collection');
            alert('Error: Usuario no encontrado en la base de datos.');
            return;
          }
        }
      }

      console.log('User data:', userData);
      console.log('User data.run:', userData.run, 'Type:', typeof userData.run);

      const idUsuario = extractNumericFromRun(userData.run);
      console.log('Extracted user ID:', idUsuario);

      if (!idUsuario) {
        console.error('Failed to extract user ID from RUN:', userData.run);
        alert('Error: No se pudo obtener el ID del usuario. RUN inválido: ' + userData.run);
        return;
      }

      // Prepare data for "contactos" collection
      const contactoData = {
        id_usuario: idUsuario,
        nombre: nombre,
        correo: correo,
        mensaje: mensaje,
        fecha_publicacion: new Date()
      };

      console.log('Data to save:', contactoData);

      // Add document to "contactos" collection
      const docRef = await addDoc(collection(db, 'contactos'), contactoData);
      console.log('Document written with ID: ', docRef.id);

      alert('Mensaje enviado correctamente.');
      formContacto.reset();

    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
      alert('Error: ' + error.message);
    }
  });
});
