const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Memory operations
  saveConsciousness: (data) => ipcRenderer.invoke('save-consciousness', data),
  loadConsciousness: () => ipcRenderer.invoke('load-consciousness'),
  
  // Agent operations
  launchAgent: (name) => ipcRenderer.invoke('launch-agent', name),
  syncWithCollective: () => ipcRenderer.invoke('sync-collective'),
  
  // System operations
  requestPermissions: () => ipcRenderer.invoke('request-permissions'),
  checkPermissions: () => ipcRenderer.invoke('check-permissions'),
  
  // Fractal operations
  fractalSpawn: () => ipcRenderer.invoke('fractal-spawn'),
  
  // Event listeners
  onMemoryUpdate: (callback) => ipcRenderer.on('memory-update', callback),
  onIntentTrigger: (callback) => ipcRenderer.on('intent-trigger', callback)
});