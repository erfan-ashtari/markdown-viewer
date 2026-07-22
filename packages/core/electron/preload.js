const { contextBridge, ipcRenderer, webUtils } = require('electron');

// Store wrapper functions for proper listener cleanup
const listenerMap = new Map();

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  buildFileTree: (dirPath) => ipcRenderer.invoke('build-file-tree', dirPath),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
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
  setCurrentFile: (fileInfo) => ipcRenderer.invoke('set-current-file', fileInfo),
  setCurrentDirectory: (dirPath) => ipcRenderer.invoke('set-current-directory', dirPath),
  getPluginState: () => ipcRenderer.invoke('get-plugin-state'),
  setPluginState: (name, enabled) => ipcRenderer.invoke('set-plugin-state', name, enabled),
  getExporters: () => ipcRenderer.invoke('get-exporters'),
  getCommands: () => ipcRenderer.invoke('get-commands'),
  executeExport: (name, content, meta) => ipcRenderer.invoke('execute-export', name, content, meta),
  executeCommand: (name, args) => ipcRenderer.invoke('execute-command', name, args),
  rescanPlugins: () => ipcRenderer.invoke('rescan-plugins'),
  // Sidebar panel
  getSidebarPanels: () => ipcRenderer.invoke('get-sidebar-panels'),
  handleUIInteraction: (pluginName, elementId, eventType, payload) =>
    ipcRenderer.invoke('handle-ui-interaction', pluginName, elementId, eventType, payload),
  onSidebarPanelRegistered: (callback) => {
    const wrapper = (event, data) => callback(data);
    listenerMap.set(callback, wrapper);
    ipcRenderer.on('sidebar-panel-registered', wrapper);
  },
  offSidebarPanelRegistered: (callback) => {
    const wrapper = listenerMap.get(callback);
    if (wrapper) {
      ipcRenderer.removeListener('sidebar-panel-registered', wrapper);
      listenerMap.delete(callback);
    }
  },
  onSidebarPanelUpdated: (callback) => {
    const wrapper = (event, data) => callback(data);
    listenerMap.set(callback, wrapper);
    ipcRenderer.on('sidebar-panel-updated', wrapper);
  },
  offSidebarPanelUpdated: (callback) => {
    const wrapper = listenerMap.get(callback);
    if (wrapper) {
      ipcRenderer.removeListener('sidebar-panel-updated', wrapper);
      listenerMap.delete(callback);
    }
  },
  onSidebarPanelStateUpdated: (callback) => {
    const wrapper = (event, data) => callback(data);
    listenerMap.set(callback, wrapper);
    ipcRenderer.on('sidebar-panel-state-updated', wrapper);
  },
  offSidebarPanelStateUpdated: (callback) => {
    const wrapper = listenerMap.get(callback);
    if (wrapper) {
      ipcRenderer.removeListener('sidebar-panel-state-updated', wrapper);
      listenerMap.delete(callback);
    }
  },
  onSidebarPanelRemoved: (callback) => {
    const wrapper = (event, data) => callback(data);
    listenerMap.set(callback, wrapper);
    ipcRenderer.on('sidebar-panel-removed', wrapper);
  },
  offSidebarPanelRemoved: (callback) => {
    const wrapper = listenerMap.get(callback);
    if (wrapper) {
      ipcRenderer.removeListener('sidebar-panel-removed', wrapper);
      listenerMap.delete(callback);
    }
  },
  onPluginsChanged: (callback) => {
    const wrapper = () => callback();
    listenerMap.set(callback, wrapper);
    ipcRenderer.on('plugins-changed', wrapper);
  },
  offPluginsChanged: (callback) => {
    const wrapper = listenerMap.get(callback);
    if (wrapper) {
      ipcRenderer.removeListener('plugins-changed', wrapper);
      listenerMap.delete(callback);
    }
  },
  onPluginStateUpdated: (callback) => {
    const wrapper = (event, data) => callback(data);
    listenerMap.set(callback, wrapper);
    ipcRenderer.on('plugin-state-updated', wrapper);
  },
  offPluginStateUpdated: (callback) => {
    const wrapper = listenerMap.get(callback);
    if (wrapper) {
      ipcRenderer.removeListener('plugin-state-updated', wrapper);
      listenerMap.delete(callback);
    }
  },
  onPluginCommandLog: (callback) => {
    const wrapper = (event, data) => callback(data);
    listenerMap.set(callback, wrapper);
    ipcRenderer.on('plugin-command-log', wrapper);
  },
  offPluginCommandLog: (callback) => {
    const wrapper = listenerMap.get(callback);
    if (wrapper) {
      ipcRenderer.removeListener('plugin-command-log', wrapper);
      listenerMap.delete(callback);
    }
  },
  reloadMain: () => ipcRenderer.send('reload-main'),
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch (e) {
      return null;
    }
  },
});
