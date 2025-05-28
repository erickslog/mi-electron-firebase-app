const { contextBridge, ipcRenderer } = require('electron');

// Exponer solo las funciones de ipcRenderer necesarias al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
    // Exponer la función para enviar mensajes de login al proceso principal
    sendLogin: (data) => ipcRenderer.send('login', data),

    // Exponer la función para escuchar respuestas de login del proceso principal
    onLoginResponse: (callback) => ipcRenderer.on('login-response', callback),

    // Si necesitas exponer otras funciones para otras operaciones, agrégalas aquí de forma segura
    // Ejemplo (si tuvieras una función para añadir usuarios):
    // sendAddUser: (userData) => ipcRenderer.send('add-user', userData),
    // onAddUserResponse: (callback) => ipcRenderer.on('add-user-response', callback)

    // Evitar exponer otras APIs de Electron o Node.js que no sean necesarias y puedan ser sensibles.
});