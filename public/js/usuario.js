function registerUser(email, password) {
    return auth.createUserWithEmailAndPassword(email, password);
}

function loginUser(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

function logoutUser() {
    return auth.signOut();
}

// Escuchar cambios en el estado de autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('Usuario conectado:', user);
    } else {
        console.log('Usuario desconectado');
    }
});

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await loginUser(email, password);
        console.log('Inicio de sesión exitoso:', userCredential.user);
    } catch (error) {
        console.error('Error en el inicio de sesión:', error.message);
    }
});