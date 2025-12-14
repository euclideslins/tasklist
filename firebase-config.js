// firebase-config.js - Configuração do Firebase

const firebaseConfig = {
    apiKey: "AIzaSyAPdkJBA5iu4jo6ZlBfsb5RlFKQEBNWLG4",
    authDomain: "tasklist-be3ae.firebaseapp.com",
    databaseURL: "https://tasklist-be3ae-default-rtdb.firebaseio.com",
    projectId: "tasklist-be3ae",
    storageBucket: "tasklist-be3ae.firebasestorage.app",
    messagingSenderId: "1053181368290",
    appId: "1:1053181368290:web:1764934e01e480d6390bbb"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();
