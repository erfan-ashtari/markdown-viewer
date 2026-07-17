const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  openExternal: (link) => ipcRenderer.invoke('open-external', link),
  openFileWithSystem: (filePath) => ipcRenderer.invoke('open-file-with-system', filePath),
  openFileNewWindow: (filePath) => ipcRenderer.invoke('open-file-new-window', filePath),
  getDarkMode: () => ipcRenderer.invoke('get-dark-mode'),
  onSelectAll: (callback) => ipcRenderer.on('select-all', callback),
  onLoadFile: (callback) => ipcRenderer.on('load-file', (event, data) => callback(data)),
  onFullscreenChanged: (callback) => ipcRenderer.on('fullscreen-changed', (event, isFullscreen) => callback(isFullscreen)),
});
