// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose ipcRenderer to the web page
contextBridge.exposeInMainWorld('electron', {
    closeWindow: () => {
        ipcRenderer.send('close-window');
    }
});