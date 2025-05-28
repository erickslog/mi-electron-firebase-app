const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database'); // Importar la conexión a la base de datos
const bcrypt = require('bcrypt'); // Para hashear contraseñas
const firebase = require('firebase/app');


// Import IPC Main for communication with renderer process
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Replace with your project's service account key path
const serviceAccount = require('./path/to/your/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Replace with your Firestore database URL if needed
  // databaseURL: 'https://your-database-name.firebaseio.com'
});

const firestore = admin.firestore();

// Firebase client-side SDK configuration (for Authentication)
// Replace with your project's web configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase client-side SDK
firebase.initializeApp(firebaseConfig);

// Función para crear la ventana principal de la aplicación
// Función para crear la ventana principal de la aplicación
function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Opcional, pero recomendado por seguridad
      nodeIntegration: false, // ¡Cuidado con esto en producción! Considera contextIsolation
      contextIsolation: true, // Habilitar contextIsolation por seguridad
      enableRemoteModule: false // Deshabilitar remote module por seguridad
    }
  });

  win.loadFile('index.html');
  // win.webContents.openDevTools(); // Abre las herramientas de desarrollo de Chromium
}

// Cuando la aplicación esté lista, crear la ventana
app.whenReady().then(() => {
  createWindow();

  // Manejar la activación de la aplicación (útil en macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cerrar la aplicación cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Cerrar la conexión a la base de datos al cerrar la aplicación
    db.close((err) => {
      if (err) {
        console.error('Error al cerrar la base de datos:', err.message);
      } else {
        console.log('Conexión a la base de datos cerrada.');
      }
      app.quit();
    });
  }
});

// --------------- Lógica de Backend (en el proceso principal) ---------------

// IPC listener for login requests from the renderer process
ipcMain.on('login', async (event, credentials) => {
  const { email, password } = credentials;
  try {
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    event.reply('login-response', { success: true, message: 'Login successful', user: { uid: user.uid, email: user.email } });
  } catch (error) {
    event.reply('login-response', { success: false, message: error.message });
  }
});

// IPC listener for registration requests from the renderer process
ipcMain.on('register', async (event, registrationData) => {
  try {
    const registerAgency = admin.functions().httpsCallable('registerNewAgencyRequest');
    const result = await registerAgency(registrationData);
    event.reply('registration-response', { success: true, data: result.data });
  } catch (error) {
    event.reply('registration-response', { success: false, message: error.message, details: error.details });
  }
});

ipcMain.on('cloud-function-call', async (event, { functionName, data }) => {
  try {
    const callable = admin.functions().httpsCallable(functionName);
    const result = await callable(data);
    event.reply('cloud-function-response', { success: true, data: result.data });
  } catch (error) {
    console.error(`Error calling Cloud Function ${functionName}:`, error);
    event.reply('cloud-function-response', { success: false, message: error.message, details: error.details });
  }
});
// Listener for transaction data from the renderer
ipcMain.on('transaction-data', (event, transactionData) => {
    console.log('Received transaction data:', transactionData);
    // For now, just log the data. In a real application, you would
    // process this data, possibly send it to a Firebase Cloud Function,
    // and interact with the database.
});

// Puedes añadir más handlers IPC para otras operaciones de base de datos (añadir agencia, añadir taquilla, obtener datos, etc.)


// You can add more IPC handlers for other database operations (add agency, add till, get data, etc.)

// Example of interacting with Firestore (you would do this in response to IPC messages or in Cloud Functions)
// async function addTransactionToFirestore(data) {
//   const docRef = await firestore.collection('transactions').add(data);
//   console.log('Document written with ID:', docRef.id);
// }