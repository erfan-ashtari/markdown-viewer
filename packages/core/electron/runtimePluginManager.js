const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class RuntimePluginManager {
  constructor() {
    this.exporters = new Map();
    this.commands = new Map();
    this.listeners = new Map();
    this.loadedPlugins = new Map();   // name -> { mod, dir, mtime }
    this.stateFile = null;
    this.watcher = null;
    this._lastScan = 0;
    this.currentFile = null;  // { filePath, fileName, content }
    this.pluginContexts = new Map();  // name -> context (for updating currentFile)
  }

  init() {
    const userDataPath = app.getPath('userData');
    this.stateFile = path.join(userDataPath, 'plugins-state.json');

    const pluginsDir = path.join(userDataPath, 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }

    // Ensure workspace directory exists for plugin file I/O
    const workspaceDir = path.join(userDataPath, 'workspace');
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
    }

    if (!fs.existsSync(this.stateFile)) {
      this.saveState({ plugins: {} });
    }

    this.startWatcher(pluginsDir);
  }

  // --- State Management ---

  loadState() {
    try {
      return JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
    } catch {
      return { plugins: {} };
    }
  }

  saveState(state) {
    fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2), 'utf-8');
    // Broadcast to all renderer windows
    this.broadcast('plugin-state-updated', state.plugins);
  }

  broadcast(channel, data) {
    const { BrowserWindow } = require('electron');
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    });
  }

  getPluginState() {
    return this.loadState().plugins;
  }

  setPluginState(name, enabled) {
    const state = this.loadState();
    state.plugins[name] = { enabled };
    this.saveState(state);

    if (enabled) {
      this.loadPlugin(name);
    } else {
      this.unloadPlugin(name);
    }

    return { success: true };
  }

  // --- Plugin Discovery ---

  discoverPlugins() {
    const userDataPath = app.getPath('userData');
    const pluginsDir = path.join(userDataPath, 'plugins');
    if (!fs.existsSync(pluginsDir)) return [];

    const dirs = fs.readdirSync(pluginsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => path.join(pluginsDir, d.name));

    const plugins = [];
    for (const dir of dirs) {
      try {
        const pkgPath = path.join(dir, 'package.json');
        if (!fs.existsSync(pkgPath)) continue;
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (!pkg.name || !pkg.main) continue;
        plugins.push({
          name: pkg.name.replace('@mdview/', '').replace(/^plugin-/, ''),
          displayName: pkg.displayName || pkg.name,
          version: pkg.version,
          description: pkg.description || '',
          main: pkg.main,
          contributes: pkg.contributes || {},
          permissions: (pkg.mdview && pkg.mdview.permissions) || [],
          path: dir,
        });
      } catch (e) {
        console.warn('Invalid plugin at ' + dir + ':', e.message);
      }
    }

    plugins.sort((a, b) => {
      try {
        return fs.statSync(path.join(pluginsDir, b.name)).mtimeMs -
               fs.statSync(path.join(pluginsDir, a.name)).mtimeMs;
      } catch { return 0; }
    });

    return plugins;
  }

  // --- Restricted File System ---

  createFsWrapper(pluginName) {
    const self = this;
    const userDataPath = app.getPath('userData');
    const workspaceDir = path.join(userDataPath, 'workspace');

    function getAllowedDirs() {
      const dirs = [
        path.join(userDataPath, 'plugins'),
        workspaceDir,
      ];
      // Add current file's directory if available
      if (self.currentFile && self.currentFile.filePath) {
        dirs.push(path.dirname(self.currentFile.filePath));
      }
      return dirs;
    }

    function validatePath(filePath) {
      const allowedDirs = getAllowedDirs();
      const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(allowedDirs[1], filePath);
      if (!allowedDirs.some(dir => resolved.startsWith(dir + path.sep) || resolved === dir)) {
        throw new Error('Access denied: path outside allowed directories');
      }
      return resolved;
    }

    return {
      readFile(filePath) {
        return fs.readFileSync(validatePath(filePath), 'utf-8');
      },
      writeFile(filePath, content) {
        fs.writeFileSync(validatePath(filePath), content, 'utf-8');
      },
      exists(filePath) {
        try { return fs.existsSync(validatePath(filePath)); }
        catch { return false; }
      },
      readDir(dirPath) {
        return fs.readdirSync(validatePath(dirPath));
      },
      mkdir(dirPath) {
        fs.mkdirSync(validatePath(dirPath), { recursive: true });
      },
    };
  }

  // --- Plugin Context ---

  createContext(pluginName) {
    const self = this;
    const pluginFs = this.createFsWrapper(pluginName);

    return {
      // Current file info (from sidebar) — updated dynamically
      get currentFile() { return self.currentFile; },
      // Registration
      registerExporter(name, handler, description) {
        self.exporters.set(name, { handler, description: description || name, plugin: pluginName });
        console.log('[runtimePlugin] Registered exporter:', name, 'from', pluginName);
      },
      registerCommand(name, handler, description) {
        self.commands.set(name, { handler, description: description || name, plugin: pluginName });
        console.log('[runtimePlugin] Registered command:', name, 'from', pluginName);
      },

      // Events
      onEvent(event, callback) {
        if (!self.listeners.has(event)) self.listeners.set(event, []);
        self.listeners.get(event).push({ callback, plugin: pluginName });
      },

      // Restricted file system
      fs: pluginFs,
    };
  }

  // --- Plugin Loading ---

  loadPlugin(name) {
    if (this.loadedPlugins.has(name)) return;

    const plugins = this.discoverPlugins();
    const plugin = plugins.find(p => p.name === name);
    if (!plugin) {
      console.warn('[runtimePlugin] Plugin not found:', name);
      return;
    }

    try {
      const entryPath = path.join(plugin.path, plugin.main);
      delete require.cache[require.resolve(entryPath)];
      const mod = require(entryPath);

      if (mod.activate) {
        const context = this.createContext(name);
        this.pluginContexts.set(name, context);
        mod.activate(context);
        const mtime = this.getPluginMtime(plugin.path);
        this.loadedPlugins.set(name, { mod, dir: plugin.path, mtime });
        console.log('[runtimePlugin] Loaded:', name);
      } else {
        console.warn('[runtimePlugin] Plugin', name, 'has no activate() function');
      }
    } catch (err) {
      console.error('[runtimePlugin] Failed to load', name + ':', err.message);
    }
  }

  unloadPlugin(name) {
    const loaded = this.loadedPlugins.get(name);
    if (!loaded) return;

    try {
      if (loaded.mod.deactivate) {
        loaded.mod.deactivate();
      }
    } catch (err) {
      console.warn('[runtimePlugin] Error deactivating', name + ':', err.message);
    }

    for (const [key, val] of this.exporters) {
      if (val.plugin === name) this.exporters.delete(key);
    }
    for (const [key, val] of this.commands) {
      if (val.plugin === name) this.commands.delete(key);
    }

    try {
      const entryPath = path.join(loaded.dir, require(path.join(loaded.dir, 'package.json')).main);
      delete require.cache[require.resolve(entryPath)];
    } catch {}

    this.loadedPlugins.delete(name);
    this.pluginContexts.delete(name);
    console.log('[runtimePlugin] Unloaded:', name);
  }

  // Force reload a plugin (unload + load)
  forceReloadPlugin(name) {
    this.unloadPlugin(name);
    this.loadPlugin(name);
  }

  getPluginMtime(pluginDir) {
    try {
      const pkgPath = path.join(pluginDir, 'package.json');
      return fs.statSync(pkgPath).mtimeMs;
    } catch { return 0; }
  }

  loadAllEnabled() {
    // Prevent rapid rescans
    const now = Date.now();
    if (this._lastScan && (now - this._lastScan) < 1000) return;
    this._lastScan = now;

    const state = this.loadState();
    const plugins = this.discoverPlugins();
    const discoveredNames = new Set(plugins.map(p => p.name));

    // Auto-enable new plugins
    let changed = false;
    for (const plugin of plugins) {
      if (!state.plugins[plugin.name]) {
        state.plugins[plugin.name] = { enabled: true };
        changed = true;
        console.log('[runtimePlugin] Auto-enabled new plugin:', plugin.name);
      }
    }

    // Unload plugins that were removed from disk
    for (const name of this.loadedPlugins.keys()) {
      if (!discoveredNames.has(name)) {
        console.log('[runtimePlugin] Plugin removed from disk, unloading:', name);
        this.unloadPlugin(name);
        delete state.plugins[name];
        changed = true;
      }
    }

    // Force-reload plugins whose files were modified
    for (const plugin of plugins) {
      const loaded = this.loadedPlugins.get(plugin.name);
      if (loaded) {
        const currentMtime = this.getPluginMtime(plugin.path);
        if (currentMtime !== loaded.mtime) {
          console.log('[runtimePlugin] Plugin file changed, reloading:', plugin.name);
          this.forceReloadPlugin(plugin.name);
        }
      }
    }

    if (changed) this.saveState(state);

    // Load all enabled plugins (that aren't already loaded)
    for (const [name, config] of Object.entries(state.plugins)) {
      if (config.enabled && !this.loadedPlugins.has(name)) {
        this.loadPlugin(name);
      }
    }
  }

  // --- Current File Tracking ---

  updateCurrentFile(fileInfo) {
    this.currentFile = fileInfo || null;
    // No need to update contexts — they use self.currentFile via getter
    console.log('[runtimePlugin] Current file updated:', fileInfo ? fileInfo.fileName : 'none');
  }

  // --- Event System ---

  emitEvent(eventName, data) {
    const listeners = this.listeners.get(eventName) || [];
    for (const { callback, plugin } of listeners) {
      try {
        callback(data);
      } catch (err) {
        console.warn('[runtimePlugin] Event handler error in', plugin + ':', err.message);
      }
    }
  }

  // --- Execution ---

  executeExport(name, content, meta) {
    const exporter = this.exporters.get(name);
    if (!exporter) throw new Error('Exporter not found: ' + name);
    return exporter.handler(content, meta);
  }

  executeCommand(name, args) {
    const command = this.commands.get(name);
    if (!command) throw new Error('Command not found: ' + name);
    return command.handler(args);
  }

  getExporters() {
    const result = [];
    for (const [name, val] of this.exporters) {
      result.push({ name, description: val.description });
    }
    return result;
  }

  getCommands() {
    const result = [];
    for (const [name, val] of this.commands) {
      result.push({ name, description: val.description });
    }
    return result;
  }

  // --- File Watcher ---

  startWatcher(pluginsDir) {
    if (!fs.existsSync(pluginsDir)) return;

    let debounceTimer = null;
    const self = this;

    this.watcher = fs.watch(pluginsDir, { recursive: false }, (eventType, filename) => {
      if (!filename) return;
      if (filename === 'plugins-state.json') return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('[runtimePlugin] Plugins directory changed, rescanning...');
        self.loadAllEnabled();
        self.broadcast('plugins-changed');
      }, 500);
    });

    console.log('[runtimePlugin] Watching plugins directory:', pluginsDir);
  }
}

module.exports = RuntimePluginManager;
