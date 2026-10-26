const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  runPowerShell: (payload) => ipcRenderer.invoke('system:runPowerShell', payload),
  startEmbeddedInstall: (payload) => ipcRenderer.invoke('installer:startEmbedded', payload),
  cancelEmbeddedInstall: () => ipcRenderer.invoke('installer:cancelEmbedded'),
  onInstallerLog: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('installer:log', handler);
    return () => ipcRenderer.removeListener('installer:log', handler);
  },
  onInstallerProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('installer:progress', handler);
    return () => ipcRenderer.removeListener('installer:progress', handler);
  },
  onInstallerDone: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('installer:done', handler);
    return () => ipcRenderer.removeListener('installer:done', handler);
  },
  copyClipboard: (text) => ipcRenderer.send('system:copyClipboard', text),
  getInstalledPackages: () => ipcRenderer.invoke('system:getInstalledPackages'),
});

try {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.classList.add('is-electron');
  }
} catch (e) {}

window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('is-electron');
  if (document.body) {
    document.body.classList.add('is-electron');
  }
});
