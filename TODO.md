# TODO: Implement Contact Form Functionality

## Tasks
- [x] Implement `contacto.js` as an ES module with Firebase imports
- [x] Add event listener to the form submit event
- [x] Check if user is authenticated using `auth.currentUser`
- [x] If not authenticated, redirect to `login.html`
- [x] If authenticated, retrieve user data from Firestore
- [x] Extract form values (nombre, correo, contenido)
- [x] Compute `id_usuario` as int from user's RUN
- [x] Insert document into "contactos" collection with: id_usuario, correo, mensaje, nombre_completo
- [x] Provide user feedback on success/error

## Followup Steps
- [ ] Test the form submission with and without authentication
- [ ] Verify data insertion in Firebase Firestore
