import { db } from "../config/firebase";
import { collection, addDoc} from "firebase/firestore"
// video 4 min 5
export async function addUser(user) {
    try {
        const docRef = await addDoc(collection(db, "usuario"), {
            ...user,
            createdAt: new Date(),
        });
        console.log("Usuario registrado con ID: ", docRef.id);
        return docRef;
    } catch (error) {
        console.error("Error al registrar usuario: ", error);
        return error;
    }
}