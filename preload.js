const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('matte', {
  minimize: () => ipcRenderer.send('win:minimize'),
  maximize: () => ipcRenderer.send('win:maximize'),
  close: () => ipcRenderer.send('win:close')
});
