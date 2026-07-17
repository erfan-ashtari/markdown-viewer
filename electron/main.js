const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // In development, load from Vite dev server; in production, load built files
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('fullscreen-changed', true);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('fullscreen-changed', false);
  });

  mainWindow.webContents.on('context-menu', (event, params) => {
    const template = [
      ...(params.selectionText ? [
        { role: 'copy', label: 'Copy' },
      ] : []),
      ...(params.isEditable ? [
        { role: 'cut', label: 'Cut' },
        { role: 'paste', label: 'Paste' },
      ] : []),
      { type: 'separator' },
      { label: 'Select All', click: () => {
        mainWindow.webContents.send('select-all');
      }},
    ];

    const filtered = template.filter((item, i) => {
      if (item.type === 'separator' && (i === 0 || template[i - 1]?.type === 'separator')) return false
      return true
    })

    if (filtered.length > 0) {
      const menu = Menu.buildFromTemplate(filtered)
      menu.popup({ window: mainWindow })
    }
  });
}

// IPC Handlers
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
    return buildFileTree(folderPath);
  }
  return null;
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

ipcMain.handle('open-external', async (event, link) => {
  await shell.openExternal(link);
});

ipcMain.handle('open-file-with-system', async (event, filePath) => {
  await shell.openPath(filePath);
});

ipcMain.handle('open-file-new-window', async (event, filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);

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
    newWindow.loadURL(`http://localhost:3000?fileId=${encodeURIComponent(filePath)}`);
  } else {
    newWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { fileId: filePath }
    });
  }

  // Send file content once the window is ready
  newWindow.webContents.on('did-finish-load', () => {
    newWindow.webContents.send('load-file', { content, fileName, filePath });
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
        // Skip hidden folders and node_modules
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
    
    // Sort: directories first, then files, alphabetically
    entries.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });
  } catch (error) {
    console.error('Error reading directory:', error);
  }
  return entries;
}

app.whenReady().then(createWindow);

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
