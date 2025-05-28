const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    callCloudFunction: (functionName, data) => ipcRenderer.invoke('call-cloud-function', { functionName, data }),
});