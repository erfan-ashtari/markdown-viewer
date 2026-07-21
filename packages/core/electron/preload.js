const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  buildFileTree: (dirPath) => ipcRenderer.invoke('build-file-tree', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  readFileBinary: (filePath) => ipcRenderer.invoke('read-file-binary', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  listMdFiles: (dirPath) => ipcRenderer.invoke('list-md-files', dirPath),
  openExternal: (link) => ipcRenderer.invoke('open-external', link),
  openFileWithSystem: (filePath) => ipcRenderer.invoke('open-file-with-system', filePath),
  openFileNewWindow: (filePath) => ipcRenderer.invoke('open-file-new-window', filePath),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  getDarkMode: () => ipcRenderer.invoke('get-dark-mode'),
  sendSettingsChanged: (data) => ipcRenderer.send('settings-changed', data),
  onSelectAll: (callback) => ipcRenderer.on('select-all', callback),
  onFileAssociationOpen: (callback) => ipcRenderer.on('file-association-open', (event, data) => callback(data)),
  onLoadFile: (callback) => ipcRenderer.on('load-file', (event, data) => callback(data)),
  onFullscreenChanged: (callback) => ipcRenderer.on('fullscreen-changed', (event, isFullscreen) => callback(isFullscreen)),
  onSettingsChanged: (callback) => ipcRenderer.on('settings-changed', (event, data) => callback(data)),
  rendererReady: () => ipcRenderer.send('renderer-ready'),
  exportPdf: (htmlContent, margins) => ipcRenderer.invoke('export-pdf', htmlContent, margins),
  setFileFilters: (filters) => ipcRenderer.invoke('set-file-filters', filters),
  getPlugins: () => ipcRenderer.invoke('get-plugins'),
  discoverPlugins: () => ipcRenderer.invoke('discover-plugins'),
  installPlugin: (sourcePath) => ipcRenderer.invoke('install-plugin', sourcePath),
  uninstallPlugin: (name) => ipcRenderer.invoke('uninstall-plugin', name),
  openPluginsFolder: () => ipcRenderer.invoke('open-plugins-folder'),
  getPluginState: () => ipcRenderer.invoke('get-plugin-state'),
  setPluginState: (name, enabled) => ipcRenderer.invoke('set-plugin-state', name, enabled),
  getExporters: () => ipcRenderer.invoke('get-exporters'),
  executeExport: (name, content, meta) => ipcRenderer.invoke('execute-export', name, content, meta),
  executeCommand: (name, args) => ipcRenderer.invoke('execute-command', name, args),
  reloadMain: () => ipcRenderer.send('reload-main'),
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch (e) {
      return null;
    }
  },
});
