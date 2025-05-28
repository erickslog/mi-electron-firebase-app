const firebase = require('firebase/app');
const { initializeApp } = require('firebase/app');
const { getAnalytics } = require('firebase/analytics');
require('firebase/auth'); // Importa solo si usas autenticación
require('firebase/firestore'); // Importa solo si usas Cloud Firestore
// Agrega más módulos de Firebase según los servicios que necesites

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

