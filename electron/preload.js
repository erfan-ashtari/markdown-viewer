const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  listMdFiles: (dirPath) => ipcRenderer.invoke('list-md-files', dirPath),
  openExternal: (link) => ipcRenderer.invoke('open-external', link),
  openFileWithSystem: (filePath) => ipcRenderer.invoke('open-file-with-system', filePath),
  openFileNewWindow: (filePath) => ipcRenderer.invoke('open-file-new-window', filePath),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  getDarkMode: () => ipcRenderer.invoke('get-dark-mode'),
  sendSettingsChanged: (data) => ipcRenderer.send('settings-changed', data),
  onSelectAll: (callback) => ipcRenderer.on('select-all', callback),
  onLoadFile: (callback) => ipcRenderer.on('load-file', (event, data) => callback(data)),
  onOpenFileFromPath: (callback) => ipcRenderer.on('open-file-from-path', (event, data) => callback(data)),
  onFullscreenChanged: (callback) => ipcRenderer.on('fullscreen-changed', (event, isFullscreen) => callback(isFullscreen)),
  onSettingsChanged: (callback) => ipcRenderer.on('settings-changed', (event, data) => callback(data)),
});
