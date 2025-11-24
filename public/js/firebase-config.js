import { initializeApp } from "firebase/app";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

// Configuración de Firebase para el proyecto "Pasteleriamilsaborestresleches"
const firebaseConfig = {
  apiKey: "AIzaSyA1_om-_HPyYVnUo8ELiM5Zob2VSMGbWvw",
  authDomain: "pasteleriamilsaborestresleches.firebaseapp.com",
  projectId: "pasteleriamilsaborestresleches",
  storageBucket: "pasteleriamilsaborestresleches.firebasestorage.app",
  messagingSenderId: "724534518591",
  appId: "1:724534518591:web:fda9e47afb93ed6854e98a",
  measurementId: "G-FXQWCCHM83",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar instancias de auth y Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Exportar funciones de autenticación y Firestore necesarias
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
};
