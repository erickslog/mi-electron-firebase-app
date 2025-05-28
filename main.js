const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');

const serviceAccount = require('./adminsdk-830c213c31.json');admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();
const auth = admin.auth();
const functions = admin.functions();
const messaging = admin.messaging();
const storage = admin.storage();

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {nodeIntegration: false, contextIsolation: true,
      enableRemoteModule: false // Deshabilitar remote module por seguridad
    }
  });

  win.loadFile('front.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {db.close((err) => {
      if (err) {
        console.error('Error al cerrar la base de datos:', err.message);
      } else {console.log('Conexión a la base de datos cerrada.');}
      app.quit();
    });
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
});// Listener for transaction data from the renderer