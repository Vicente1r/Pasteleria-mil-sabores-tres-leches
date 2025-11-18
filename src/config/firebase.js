import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

import { getAuth } from "firebase/auth"; //Importar auth

const firebaseConfig = {
  apiKey: "AIzaSyBBT7jka7a-7v3vY19BlSajamiedLrBTN0",
  authDomain: "pasteleriamilsaborestresleches.web.app",
  projectId: "pasteleriamilsaborestresleches",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

export const auth = getAuth(app); //Se exporta auth 
