const firebase = require('firebase/app');
require('firebase/auth'); // Si vas a usar autenticación
require('firebase/firestore'); // Si vas a usar Cloud Firestore
// Agrega más módulos de Firebase según los servicios que necesites

// Tu objeto de configuración de Firebase (¡Reemplaza con el tuyo!)
const firebaseConfig = {
  apiKey: "AIzaSyCkiTfJTnzvCNZw6p2py4DKCKu-T3Fw4GA",
  authDomain: "agencia-apuestas.firebaseapp.com",
  projectId: "agencia-apuestas",
  storageBucket: "agencia-apuestas.firebasestorage.app",
  messagingSenderId: "534643498596",
  appId: "1:534643498596:web:7a9ae54369d361d8848971",
  measurementId: "G-25NL0117NN"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

