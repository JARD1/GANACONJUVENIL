// 1. Importamos la base (App) y los servicios (Firestore y Storage)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // <-- Base de datos
import { getStorage } from "firebase/storage";    // <-- Para guardar los captures

// 2. Tu configuración (ya está correcta)
const firebaseConfig = {
  apiKey: "AIzaSyD6Sl8P--McAbqP4eIoVsb7xm6pbD2OB5E",
  authDomain: "ganaconjuvenil-backend.firebaseapp.com",
  projectId: "ganaconjuvenil-backend",
  storageBucket: "ganaconjuvenil-backend.firebasestorage.app",
  messagingSenderId: "694351193582",
  appId: "1:694351193582:web:36f836f4b7fb19222e5aff"
};

// 3. Inicializamos la conexión
const app = initializeApp(firebaseConfig);

// 4. Creamos las constantes de los servicios y las EXPORTAMOS
// El "export" es vital para que puedas usarlos en tus otros componentes
export const db = getFirestore(app);
export const storage = getStorage(app);