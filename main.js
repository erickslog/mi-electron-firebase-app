const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database'); // Importar la conexión a la base de datos
const bcrypt = require('bcrypt'); // Para hashear contraseñas

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

// Listener para la solicitud de login desde el renderer
ipcMain.on('login', async (event, { usuario, clave, codigoAgencia, numeroTaquilla }) => {
    try {
        // Consulta optimizada: Busca al usuario, su agencia y verifica el número de taquilla
        const user = await new Promise((resolve, reject) => {
            db.get(`SELECT u.*, a.codigo_agencia, t.numero_taquilla
                    FROM usuarios u
                    JOIN agencias a ON u.agencia_id = a.id
                    JOIN taquillas t ON u.agencia_id = t.agencia_id
                    WHERE u.usuario = ? AND a.codigo_agencia = ? AND t.numero_taquilla = ?`,
                [usuario, codigoAgencia, numeroTaquilla], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        if (!user) {
            event.reply('login-response', { success: false, message: 'Usuario, código de agencia o número de taquilla incorrectos.' });
            return;
        }

        // Verificar la clave hasheada de forma asíncrona
        const passwordMatch = await bcrypt.compare(clave, user.clave);

        if (passwordMatch) {
            event.reply('login-response', { success: true, message: 'Inicio de sesión exitoso.', user: { id: user.id, usuario: user.usuario, rol: user.rol, agencia_id: user.agencia_id } }); // Enviar solo datos necesarios
        } else {
            event.reply('login-response', { success: false, message: 'Clave incorrecta.' });
        }
    } catch (error) {
        console.error('Error durante el login:', error.message);
        event.reply('login-response', { success: false, message: 'Error interno del servidor.' });
    }
});

// Puedes añadir más handlers IPC para otras operaciones de base de datos (añadir agencia, añadir taquilla, obtener datos, etc.)
