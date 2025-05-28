const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Opcional, pero recomendado por seguridad
      nodeIntegration: false, // ¡Cuidado con esto en producción! Considera contextIsolation
 contextIsolation: true, // ¡Cuidado con esto en producción! Considera true
    }
  });

  win.loadFile('index.html'); // Carga tu archivo HTML principal
  // win.webContents.openDevTools(); // Abre las herramientas de desarrollo de Chromium
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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});