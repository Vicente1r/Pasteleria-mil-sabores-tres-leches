// Script de prueba para escribir en Firestore con configuración firebase-config.js

import {
  db,
  doc,
  setDoc,
} from './public/js/firebase-config.js';

async function testFirestoreWrite() {
  try {
    const testDocRef = doc(db, 'testCollection', 'testDoc');
    await setDoc(testDocRef, {
      message: "Esto es una prueba de escritura en Firestore",
      timestamp: new Date().toISOString()
    });
    console.log("Documento de prueba escrito correctamente en Firestore");
  } catch (error) {
    console.error("Error al escribir documento de prueba en Firestore:", error);
  }
}

testFirestoreWrite();
