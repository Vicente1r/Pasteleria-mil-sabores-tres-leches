#!/usr/bin/env node
/**
 * Script para crear un usuario 'vendedor' usando Firebase Admin SDK.
 * Uso:
 *   node create_vendedor_admin.js --serviceAccount ./serviceAccount.json --email vendedor@example.com --password Pass1234 --nombre "Vendedor Prueba"
 * Requiere: npm install firebase-admin
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--serviceAccount') out.serviceAccount = args[++i];
    else if (a === '--email') out.email = args[++i];
    else if (a === '--password') out.password = args[++i];
    else if (a === '--nombre') out.nombre = args[++i];
    else if (a === '--projectId') out.projectId = args[++i];
    else {
      console.error('Argumento desconocido', a);
      process.exit(1);
    }
  }
  return out;
}

async function main() {
  const args = parseArgs();
  if (!args.serviceAccount || !args.email || !args.password) {
    console.error('Uso: node create_vendedor_admin.js --serviceAccount ./serviceAccount.json --email correo --password clave [--nombre "Nombre"]');
    process.exit(1);
  }

  const servicePath = path.resolve(args.serviceAccount);
  if (!fs.existsSync(servicePath)) {
    console.error('El archivo de cuenta de servicio no se encontró en', servicePath);
    process.exit(1);
  }

  const admin = require('firebase-admin');
  const serviceAccount = require(servicePath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: args.projectId || serviceAccount.project_id || undefined,
  });

  const auth = admin.auth();
  const db = admin.firestore();

  try {
    console.log('Creando usuario', args.email);
    const userRecord = await auth.createUser({
      email: args.email,
      emailVerified: false,
      password: args.password,
      displayName: args.nombre || '',
      disabled: false,
    });

    console.log('Usuario creado con uid=', userRecord.uid);

    // Asignar custom claim role: 'vendedor'
    await auth.setCustomUserClaims(userRecord.uid, { role: 'vendedor' });
    console.log('Asignado custom claim role: vendedor');

    // Escribir documento en Firestore
    await db.collection('users').doc(userRecord.uid).set({
      role: 'vendedor',
      nombre: args.nombre || '',
      correo: args.email,
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Documento users/{uid} creado en Firestore');

    console.log('\nHecho. Credenciales:');
    console.log('  email:', args.email);
    console.log('  password:', args.password);
    console.log('\nNota: la cuenta fue creada en el proyecto asociado al service account proporcionado.');
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
