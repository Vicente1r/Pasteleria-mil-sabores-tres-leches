import { addUser} from "./services/firestoreService";
import { validarCorreo, validarRun, esMayorEdad } from "./utils/script";

//Espera que el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formUsuario");
  const runInput = document.getElementById("run");
  const nombreInput = document.getElementById("nombre");
  const correoInput = document.getElementById("correo");
  const claveInput = document.getElementById("clave");
  const fechaInput = document.getElementById("fecha");
  const mensaje = document.getElementById("mensaje");
  // validar si hay o no conexion con el formulario de registro de usuario
  // video 4 min 15
  if (!form) return console.log("No se encontro #formUsuario")

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensaje.innerText = "";

    const run = runInput.value.trim().toUpperCase();
    const nombre = nombreInput.value.trim();
    const correo = correoInput.value.trim();
    const clave = claveInput.value;
    const fecha = fechaInput.value;

    //Validar el ingreso correcto de los datos para el registro
    //video 4 min 19
    if(!validarRun(run)) return mensaje.innerText = "Run incorrecto";
    if(!nombre) return mensaje.innerText = "Nombre en blanco";
    if(!validarCorreo(correo)) return mensaje.innerText = "Correo incorrecto";
    if(!esMayorEdad(fecha)) return mensaje.innerText = "debe se mayor de 18 años";

    try {
      await addUser ({run, nombre, correo, clave, fecha});
      mensaje.innerText = "formulario se envio correctamente";

      setTimeout(() =>{
        window.location.href =
          correo.toLowerCase() === "admin@duoc.cl"
          ? `asset/page/perfilAdmin.html?nombre=${encodeURIComponent(nombre)}`
          : `asset/page/perfilCliente.html?nombre=${encodeURIComponent(nombre)}`
          
      }, 1000);
    } catch(error) {
      console.error("Error al guardar usuario: ", error);
      mensaje.innerText = "error al guardar usuario en Firebase"

    }
  });
});