import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

import { getAuth } from "firebase/auth"; //Importar auth

const firebaseConfig = {
  apiKey: "AIzaSyBBT7jka7a-7v3vY19BlSajamiedLrBTN0",
  authDomain: "pasteleriamilsaborestresleches.firebaseapp.com",
  projectId: "pasteleriamilsaborestresleches",
  storageBucket: "pasteleriamilsaborestresleches.appspot.com", // Reemplaza con tu bucket de almacenamiento
  messagingSenderId: "408928911689",
  appId: "1:408928911689:web:d8b313c7e15fc528661a98",
  measurementId: "G-Y1DW47VEWZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

export const auth = getAuth(app); //Se exporta auth 
