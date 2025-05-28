const { contextBridge, ipcRenderer } = require('electron');

// Expose secure IPC channels to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Exponer la función para enviar mensajes de login al proceso principal
    sendLogin: (data) => ipcRenderer.send('login', data),

    // Exponer la función para escuchar respuestas de login del proceso principal
    onLoginResponse: (callback) => ipcRenderer.on('login-response', callback),

    // Si necesitas exponer otras funciones para otras operaciones, agrégalas aquí de forma segura
    // Exponer la función para llamar a Cloud Functions
    callCloudFunction: (functionName, data) => ipcRenderer.invoke('call-cloud-function', { functionName, data }),

    // Expose function to send registration data to the main process
    sendRegistration: (data) => ipcRenderer.send('register', data),

    // Evitar exponer otras APIs de Electron o Node.js que no sean necesarias y puedan ser sensibles.
});