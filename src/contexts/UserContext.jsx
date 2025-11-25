import { createContext, useState, useEffect } from "react";
// Contexto para manejar el estado del usuario (logueado o no, datos del usuario)
export const UserContext = createContext();
// Proveedor del contexto
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Estado inicial sin usuario

  // Hydrate user from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("usuario"); // Clean invalid data
      }
    }
  }, []);

  //Usamos UserContext.Provider para proveer el estado y la función para actualizarlo a los componentes hijos
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
