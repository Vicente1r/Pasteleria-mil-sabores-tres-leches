import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyA1_om-_HPyYVnUo8ELiM5Zob2VSMGbWvw",
    authDomain: "pasteleriamilsaborestresleches.firebaseapp.com",
    projectId: "pasteleriamilsaborestresleches",
    storageBucket: "pasteleriamilsaborestresleches.firebasestorage.app",
    messagingSenderId: "724534518591",
    appId: "1:724534518591:web:fda9e47afb93ed6854e98a",
    measurementId: "G-FXQWCCHM83"
  };
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  export const db = getFirestore(app);