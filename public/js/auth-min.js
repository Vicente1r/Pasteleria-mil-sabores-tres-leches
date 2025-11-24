import {
  auth,
  db,
  createUserWithEmailAndPassword,
  doc,
  setDoc,
} from "./firebase-config.js";

const formRegister = document.getElementById("form-register");

if (formRegister) {
  formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btnRegister = document.getElementById("btn-register");
    if (!btnRegister) return;

    btnRegister.disabled = true;
    btnRegister.textContent = "Registrando...";

    try {
      const correo = document.getElementById("correo_reg")?.value.trim();
      const password = document.getElementById("password")?.value;

      if (!correo || !password) {
        alert("Por favor, completa correo y contraseña");
        btnRegister.disabled = false;
        btnRegister.textContent = "Registrar";
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
      const user = userCredential.user;

      const userData = {
        correo: correo,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "usuario", user.uid), userData);

      alert("¡Registro exitoso! Usuario creado y guardado en Firestore.");

    } catch (error) {
      console.error("Error en registro mínimo:", error);
      alert("Error al registrar usuario: " + (error.message || error.code));
    } finally {
      btnRegister.disabled = false;
      btnRegister.textContent = "Registrar";
    }
  });
}
