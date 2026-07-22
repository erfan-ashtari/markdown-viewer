const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, Menu, protocol } = require('electron');
const RuntimePluginManager = require('./runtimePluginManager');
const runtimePluginManager = new RuntimePluginManager();
const path = require('path');
const fs = require('fs');

// Resource path helper for dev/prod
function getResourcePath(relativePath) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, relativePath);
  }
  return path.join(__dirname, relativePath);
}

// Plugin-registered file filters (set from renderer)
let pluginFileFilters = [];

// Error logging to file
const logFile = path.join(app.getPath('userData'), 'crash.log');
function logError(err) {
  const msg = `[${new Date().toISOString()}] ${err.stack || err.message || String(err)}\n`;
  try { fs.appendFileSync(logFile, msg); } catch (_) {}
}
process.on('uncaughtException', (err) => { logError(err); });
process.on('unhandledRejection', (err) => { logError(err); });

let mainWindow;
let settingsWindow;
const fileWindows = [];
const pendingFilesByWebContentsId = new Map();

function getFileFromArgs(argv) {
  for (let i = 1; i < argv.length; i++) {
    let arg = argv[i];
    // Handle --open flag (used by CLI wrapper)
    if (arg === '--open' && i + 1 < argv.length) {
      let filePath = argv[i + 1];
      filePath = filePath.replace(/^["']|["']$/g, '');
      try { filePath = decodeURIComponent(filePath); } catch (_) {}
      if (/\.(md|markdown)$/i.test(filePath)) return filePath;
    }
    if (arg.startsWith('--')) continue;
    arg = arg.replace(/^["']|["']$/g, '');
    try { arg = decodeURIComponent(arg); } catch (_) {}
    if (/\.(md|markdown)$/i.test(arg)) return arg;
  }
  return null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Markdown Viewer',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupWindow(mainWindow);
}

function createFileWindow(filePath) {
  const targetPath = path.resolve(filePath);
  if (!fs.existsSync(targetPath)) return;
  if (!fs.statSync(targetPath).isFile()) return;

  const fileName = path.basename(targetPath);
  const dirPath = path.dirname(targetPath);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: fileName,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Store pending file for this window's renderer-ready signal
  const wcId = win.webContents.id;
  pendingFilesByWebContentsId.set(wcId, { filePath: targetPath, dirPath });

  fileWindows.push(win);
  win.on('closed', () => {
    pendingFilesByWebContentsId.delete(wcId);
    const idx = fileWindows.indexOf(win);
    if (idx !== -1) fileWindows.splice(idx, 1);
  });

  setupWindow(win);
}

function isWindowUsable(win) {
  return win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed();
}

function setupWindow(win) {
  win.on('enter-full-screen', () => {
    if (isWindowUsable(win)) win.webContents.send('fullscreen-changed', true);
  });

  win.on('leave-full-screen', () => {
    if (isWindowUsable(win)) win.webContents.send('fullscreen-changed', false);
  });

  win.webContents.on('context-menu', (event, params) => {
    if (!isWindowUsable(win)) return;
    const template = [
      ...(params.selectionText ? [{ role: 'copy', label: 'Copy' }] : []),
      ...(params.isEditable ? [
        { role: 'cut', label: 'Cut' },
        { role: 'paste', label: 'Paste' },
      ] : []),
      { type: 'separator' },
      { label: 'Select All', click: () => {
        if (isWindowUsable(win)) win.webContents.send('select-all');
      }},
    ];
    const filtered = template.filter((item, i) => {
      if (item.type === 'separator' && (i === 0 || template[i - 1]?.type === 'separator')) return false
      return true
    })
    if (filtered.length > 0) {
      Menu.buildFromTemplate(filtered).popup({ window: win })
    }
  });
}

// IPC Handlers
ipcMain.on('renderer-ready', (event) => {
  const sender = event.sender;
  if (sender.isDestroyed()) return;
  const pending = pendingFilesByWebContentsId.get(sender.id);
  if (pending) {
    pendingFilesByWebContentsId.delete(sender.id);
    sender.send('file-association-open', pending);
  }
});

// Broadcast settings changes to ALL windows — registered once, not per settings-open
ipcMain.on('settings-changed', (event, data) => {
  if (isWindowUsable(mainWindow)) {
    mainWindow.webContents.send('settings-changed', data)
  }
  for (const win of fileWindows) {
    if (isWindowUsable(win)) {
      win.webContents.send('settings-changed', data)
    }
  }
})

ipcMain.handle('open-file', async () => {
  const filters = [
    ...pluginFileFilters,
    { name: 'All Files', extensions: ['*'] },
  ];
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters,
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    // Update runtime plugins with current file info
    runtimePluginManager.updateCurrentFile({ filePath, fileName, content });
    runtimePluginManager.emitEvent('fileOpened', { filePath, fileName, content });

    return { filePath, content, fileName };
  }
  return null;
});

ipcMain.handle('open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    return { tree: buildFileTree(folderPath), name: folderPath };
  }
  return null;
});

ipcMain.handle('build-file-tree', async (event, dirPath) => {
  try {
    return { tree: buildFileTree(dirPath), name: dirPath };
  } catch (error) {
    console.error('Error building file tree:', error);
    return null;
  }
});

// Lazy load: read a single directory level for on-demand expansion
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const entries = [];
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      const itemRelativePath = item.name;
      if (item.isDirectory()) {
        if (!item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'System Volume Information') {
          let mtimeMs = 0;
          try { mtimeMs = fs.statSync(itemPath).mtimeMs; } catch {}
          entries.push({
            name: item.name,
            path: itemPath,
            relativePath: itemRelativePath,
            type: 'directory',
            mtimeMs,
            children: [], // Empty - will be loaded on demand
          });
        }
      } else {
        let mtimeMs = 0;
        try { mtimeMs = fs.statSync(itemPath).mtimeMs; } catch {}
        entries.push({
          name: item.name,
          path: itemPath,
          relativePath: itemRelativePath,
          type: 'file',
          mtimeMs,
        });
      }
    }
    entries.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });
    return entries;
  } catch (error) {
    if (error.code !== 'EPERM') {
      console.error('Error reading directory:', error);
    }
    return [];
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    return { filePath, content, fileName };
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
});

// Read binary file as base64
ipcMain.handle('read-file-binary', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error reading binary file:', error);
    return null;
  }
});

// Write file content
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
});

ipcMain.handle('list-md-files', async (event, dirPath) => {
  try {
    const items = fs.readdirSync(dirPath);
    return items
      .filter(item => /\.(md|markdown)$/i.test(item))
      .sort((a, b) => a.localeCompare(b))
      .map(item => ({
        name: item,
        path: path.join(dirPath, item),
      }));
  } catch (error) {
    console.error('Error listing directory:', error);
    return [];
  }
});

ipcMain.handle('open-settings', async () => {
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }
  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Settings',
    resizable: true,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  const isDev = !app.isPackaged
  if (isDev) {
    settingsWindow.loadURL('http://localhost:3000/settings.html')
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/settings.html'))
  }
  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
})

ipcMain.handle('open-external', async (event, link) => {
  await shell.openExternal(link);
});

ipcMain.handle('open-file-with-system', async (event, filePath) => {
  await shell.openPath(filePath);
});

ipcMain.handle('open-file-new-window', async (event, filePath) => {
  const targetPath = path.resolve(filePath);
  if (!fs.existsSync(targetPath)) return;
  if (!fs.statSync(targetPath).isFile()) return;
  const content = fs.readFileSync(targetPath, 'utf-8');
  const fileName = path.basename(targetPath);
  const dirPath = path.dirname(targetPath);

  const newWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: fileName,
    backgroundColor: '#0d1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
    },
  });
  const isDev = !app.isPackaged;
  if (isDev) {
    newWindow.loadURL('http://localhost:3000');
  } else {
    newWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  newWindow.webContents.on('did-finish-load', () => {
    if (isWindowUsable(newWindow)) {
      runtimePluginManager.updateCurrentFile({ filePath: targetPath, fileName, content });
    newWindow.webContents.send('load-file', { content, fileName, filePath: targetPath, dirPath });
    }
  });
});

ipcMain.handle('get-dark-mode', () => {
  return nativeTheme.shouldUseDarkColors;
});

ipcMain.handle('set-file-filters', (event, filters) => {
  pluginFileFilters = filters;
});

// Plugin registry — built-in from plugins.json + runtime from userData
ipcMain.handle('get-plugins', () => {
  // Built-in plugins from plugins.json
  const pluginsJsonPath = path.join(__dirname, '../../plugins.json');
  let builtin = [];
  try {
    builtin = JSON.parse(fs.readFileSync(pluginsJsonPath, 'utf-8')).map(p => ({
      ...p,
      enabled: true,
      state: {},
      runtime: false,
    }));
  } catch {}

  // Runtime plugins from userData
  const pluginState = runtimePluginManager.getPluginState() || {};
  const runtime = runtimePluginManager.discoverPlugins().map(p => ({
    name: p.name,
    displayName: p.displayName,
    version: p.version,
    description: p.description,
    enabled: pluginState[p.name]?.enabled ?? true,
    state: {},
    runtime: true,
  }));

  return [...builtin, ...runtime];
});

// Discover runtime plugins from {userData}/plugins/
ipcMain.handle('discover-plugins', () => {
  const pluginsDir = path.join(app.getPath('userData'), 'plugins');
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
    return [];
  }

  const dirs = fs.readdirSync(pluginsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(pluginsDir, d.name));

  const plugins = [];
  for (const dir of dirs) {
    try {
      const pkgPath = path.join(dir, 'package.json');
      if (!fs.existsSync(pkgPath)) continue;
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (!pkg.name || !pkg.main || !pkg.contributes) continue;
      plugins.push({
        name: pkg.name,
        displayName: pkg.displayName || pkg.name,
        version: pkg.version,
        description: pkg.description || '',
        publisher: pkg.publisher || '',
        main: pkg.main,
        activationEvents: pkg.activationEvents || ['onStartup'],
        contributes: pkg.contributes,
        path: dir,
      });
    } catch (e) {
      console.warn('Invalid plugin at ' + dir + ':', e.message);
    }
  }

  // Sort: newest first
  plugins.sort((a, b) => {
    try {
      const aTime = fs.statSync(path.join(pluginsDir, a.name)).mtimeMs;
      const bTime = fs.statSync(path.join(pluginsDir, b.name)).mtimeMs;
      return bTime - aTime;
    } catch { return 0; }
  });

  return plugins;
});

// Install a plugin from a source directory
ipcMain.handle('install-plugin', async (event, sourcePath) => {
  try {
    const pluginsDir = path.join(app.getPath('userData'), 'plugins');
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });
    const pkg = JSON.parse(fs.readFileSync(path.join(sourcePath, 'package.json'), 'utf-8'));
    const targetDir = path.join(pluginsDir, pkg.name);
    fs.cpSync(sourcePath, targetDir, { recursive: true });
    return { success: true, name: pkg.name };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Uninstall a plugin
ipcMain.handle('uninstall-plugin', (event, pluginName) => {
  const pluginsDir = path.join(app.getPath('userData'), 'plugins');
  const targetDir = path.join(pluginsDir, pluginName);
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true });
    return { success: true };
  }
  return { success: false, error: 'Plugin not found' };
});

// Open plugins folder in file explorer
ipcMain.handle('open-plugins-folder', () => {
  const pluginsDir = path.join(app.getPath('userData'), 'plugins');
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });
  shell.openPath(pluginsDir);
});

// Runtime plugin state management
ipcMain.handle('set-current-file', (event, fileInfo) => {
  runtimePluginManager.updateCurrentFile(fileInfo);
});

ipcMain.handle('set-current-directory', (event, dirPath) => {
  runtimePluginManager.currentFile = { filePath: dirPath + '/.current-dir', fileName: path.basename(dirPath), content: '' };
  console.log('[runtimePlugin] Current directory set:', dirPath);
});

ipcMain.handle('get-plugin-state', () => {
  return runtimePluginManager.getPluginState();
});

ipcMain.handle('set-plugin-state', (event, name, enabled) => {
  return runtimePluginManager.setPluginState(name, enabled);
});

ipcMain.handle('get-exporters', () => {
  const exporters = runtimePluginManager.getExporters();
  console.log('[main] get-exporters called, returning:', exporters.length, 'exporters');
  return exporters;
});

ipcMain.handle('get-commands', () => {
  return runtimePluginManager.getCommands();
});

ipcMain.handle('execute-export', (event, name, content, meta) => {
  try {
    return runtimePluginManager.executeExport(name, content, meta);
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('execute-command', async (event, name, args) => {
  return runtimePluginManager.executeCommand(name, args);
});

// Re-scan and reload all runtime plugins (called after installing a new plugin)
ipcMain.handle('rescan-plugins', () => {
  runtimePluginManager.loadAllEnabled();
  return { success: true, exporters: runtimePluginManager.getExporters() };
});

// Sidebar panel
ipcMain.handle('get-sidebar-panels', () => {
  return runtimePluginManager.getSidebarPanels();
});

ipcMain.handle('handle-ui-interaction', (event, pluginName, elementId, eventType, payload) => {
  return runtimePluginManager.handleUIInteraction(pluginName, elementId, eventType, payload);
});

// Reload main window (from Settings)
ipcMain.on('reload-main', () => {
  if (isWindowUsable(mainWindow)) {
    mainWindow.webContents.reload();
  }
});

function buildFileTree(dirPath, relativePath = '', maxDepth = 1, currentDepth = 0) {
  const entries = [];
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
      if (item.isDirectory()) {
        // Skip hidden dirs, node_modules, and system-protected directories
        if (!item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'System Volume Information') {
          let mtimeMs = 0;
          let children = [];
          try {
            mtimeMs = fs.statSync(itemPath).mtimeMs;
            // Only recurse if we haven't reached max depth
            if (currentDepth < maxDepth) {
              children = buildFileTree(itemPath, itemRelativePath, maxDepth, currentDepth + 1);
            }
          } catch {}
          entries.push({
            name: item.name,
            path: itemPath,
            relativePath: itemRelativePath,
            type: 'directory',
            mtimeMs,
            children,
          });
        }
      } else {
        let mtimeMs = 0;
        try { mtimeMs = fs.statSync(itemPath).mtimeMs; } catch {}
        entries.push({
          name: item.name,
          path: itemPath,
          relativePath: itemRelativePath,
          type: 'file',
          mtimeMs,
        });
      }
    }
    entries.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });
  } catch (error) {
    // Silently handle permission errors for system directories
    if (error.code !== 'EPERM') {
      console.error('Error reading directory:', error);
    }
  }
  return entries;
}

// Single instance lock — prevents duplicate processes, but each file opens in a new window
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    // Focus existing main window
    if (isWindowUsable(mainWindow)) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // Open the file in a NEW window
    const filePath = getFileFromArgs(commandLine);
    if (filePath) {
      createFileWindow(filePath);
    }
  });
}

app.whenReady().then(() => {
  // Register custom protocol for loading local files (used by plugins)
  runtimePluginManager.init();
runtimePluginManager.loadAllEnabled();

protocol.registerFileProtocol('local-file', (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace('local-file://', ''));
    callback({ path: filePath });
  });

  app.setAsDefaultProtocolClient('mdview');

  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    if (mainWindow) {
      // App already running — open in a new window
      createFileWindow(filePath);
    }
    // First launch handled below via process.argv
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    const filePath = url.replace('mdview://', '');
    if (mainWindow) {
      createFileWindow(filePath);
    }
  });

  // Check if launched with a .md file argument
  const fileArg = getFileFromArgs(process.argv);
  if (fileArg) {
    const targetPath = path.resolve(fileArg);
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
      createFileWindow(targetPath);
      return;
    }
  }

  // Normal launch — just open the main window
  createWindow();
});

ipcMain.handle('export-pdf', async (event, htmlContent, margins) => {
  let printWindow = null;
  try {
    printWindow = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    // Wait for fonts and KaTeX to render
    await new Promise(resolve => setTimeout(resolve, 1500));

    const pdfBuffer = await printWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: {
        marginType: 'custom',
        top: margins?.top ?? 0,
        bottom: margins?.bottom ?? 0,
        left: margins?.left ?? 0,
        right: margins?.right ?? 0,
      },
    });

    return pdfBuffer;
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  } finally {
    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.close();
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
