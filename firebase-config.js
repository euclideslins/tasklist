// firebase-config.js - Configuração do Firebase
// IMPORTANTE: Você precisa criar um projeto no Firebase Console

const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    databaseURL: "https://SEU_PROJETO-default-rtdb.firebaseio.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_ID",
    appId: "SEU_APP_ID"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();
