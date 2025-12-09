// Preload script for Electron
// This runs in the renderer process but has access to Node.js APIs
// Use contextBridge to safely expose APIs to the renderer

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform information
  platform: process.platform,

  // App version
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Window controls (optional)
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
});

// Log that preload script has loaded
console.log('Electron preload script loaded');
