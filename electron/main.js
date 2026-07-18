const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

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
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
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
      newWindow.webContents.send('load-file', { content, fileName, filePath: targetPath, dirPath });
    }
  });
});

ipcMain.handle('get-dark-mode', () => {
  return nativeTheme.shouldUseDarkColors;
});

function buildFileTree(dirPath, relativePath = '') {
  const entries = [];
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
      if (item.isDirectory()) {
        if (!item.name.startsWith('.') && item.name !== 'node_modules') {
          entries.push({
            name: item.name,
            path: itemPath,
            relativePath: itemRelativePath,
            type: 'directory',
            children: buildFileTree(itemPath, itemRelativePath),
          });
        }
      } else {
        entries.push({
          name: item.name,
          path: itemPath,
          relativePath: itemRelativePath,
          type: 'file',
        });
      }
    }
    entries.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });
  } catch (error) {
    console.error('Error reading directory:', error);
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
