/**
 * tools/create_demo_vendedor_doc.js
 *
 * Creates a demo document in the `vendedor` collection in Firestore and
 * optionally creates a Firebase Auth user for that email.
 *
 * Usage:
 *   node create_demo_vendedor_doc.js --serviceAccount ./serviceAccount.json --email demo@vendedor.cl --password demo1234 --display "Demo Vendedor" --createAuth
 *
 * Requirements:
 * - Install dependencies: `npm install firebase-admin minimist`
 * - Provide a Firebase service account JSON via --serviceAccount
 *
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

const svcPath = argv.serviceAccount || argv.svc;
const email = argv.email || 'vendedor@duoc.cl';
const password = argv.password || 'vendedor1234';
const displayName = argv.display || 'Vendedor Demo';
const createAuth = !!argv.createAuth;

if (!svcPath) {
  console.error('Debe indicar --serviceAccount <ruta a serviceAccount.json>');
  process.exit(1);
}

const fullPath = path.resolve(svcPath);
if (!fs.existsSync(fullPath)) {
  console.error('No se encuentra el service account en:', fullPath);
  process.exit(1);
}

const serviceAccount = require(fullPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  try {
    if (createAuth) {
      // create auth user if not exists
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
        console.log('Auth user already exists:', userRecord.uid);
      } catch (e) {
        console.log('Creating auth user for', email);
        userRecord = await admin.auth().createUser({ email, password, displayName });
        console.log('Created auth user:', userRecord.uid);
      }

      // also write into users collection with role
      await db.collection('users').doc(userRecord.uid).set({
        nombre: displayName,
        correo: email,
        role: 'vendedor',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log('Wrote users/{uid} document for vendedor.');
    }

    // Write a document into 'vendedor' collection for legacy login lookup
    const vendorDoc = {
      nombre: displayName,
      correo: email,
      clave: password,
      creado: admin.firestore.FieldValue.serverTimestamp()
    };

    // Use email as doc id safe form
    const docId = email.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    await db.collection('vendedor').doc(docId).set(vendorDoc, { merge: true });
    console.log('Wrote vendedor document in collection `vendedor` with id:', docId);

    console.log('Listo. Puedes iniciar sesión con:', email, '/', password);
    process.exit(0);
  } catch (err) {
    console.error('Error creando demo vendedor:', err);
    process.exit(1);
  }
}

run();
