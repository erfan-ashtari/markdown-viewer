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
    this.sidebarPanels = new Map();   // pluginName -> SidebarPanel
    this.panelStates = new Map();     // pluginName -> { [elementId]: state }
    this.contentOverrides = new Map(); // pluginName -> { extensions, label }
    this.renderModeStates = new Map(); // extension -> boolean (rendered vs source)
    this._stateCache = null;          // Cached state for debounced writes
    this._saveTimeout = null;         // Debounce timer for state saves
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

    // Load persisted states
    this._stateCache = this.loadState();
    this._loadPersistedStates();

    this.startWatcher(pluginsDir);
  }

  _loadPersistedStates() {
    const state = this._stateCache;

    // Load persisted panel states
    if (state.panelStates) {
      for (const [name, panelState] of Object.entries(state.panelStates)) {
        this.panelStates.set(name, panelState);
      }
    }

    // Load persisted render modes
    if (state.renderModes) {
      for (const [ext, rendered] of Object.entries(state.renderModes)) {
        this.renderModeStates.set(ext, rendered);
      }
    }
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
  }

  _saveStateDebounced() {
    clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => {
      this.saveState(this._stateCache);
    }, 500);
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

    // Broadcast per-plugin update
    this.broadcast('plugin-state-updated', { name, enabled, state: {} });

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

    function validatePath(filePath) {
      // Get current file directory dynamically (always fresh)
      const fileDir = self.currentFile && self.currentFile.filePath
        ? path.dirname(self.currentFile.filePath)
        : workspaceDir;

      const allowedDirs = [
        path.join(userDataPath, 'plugins'),
        workspaceDir,
        fileDir,
      ];

      const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(fileDir, filePath);
      // Resolve symlinks to prevent directory escape via symlink
      let realPath;
      try {
        realPath = fs.realpathSync(resolved);
      } catch {
        // File doesn't exist — validate the nearest existing parent directory
        // to prevent symlink write bypass
        let parent = path.dirname(resolved);
        let parentReal = null;
        // Walk up until we find an existing ancestor
        while (parent !== path.dirname(parent)) {
          try {
            parentReal = fs.realpathSync(parent);
            break;
          } catch {
            parent = path.dirname(parent);
          }
        }
        if (!parentReal) {
          throw new Error('Access denied: cannot validate path');
        }
        // Reconstruct realPath from validated parent + remaining relative parts
        const remainder = path.relative(parent, resolved);
        realPath = path.join(parentReal, remainder);
      }
      if (!allowedDirs.some(dir => realPath.startsWith(dir + path.sep) || realPath === dir)) {
        throw new Error('Access denied: path outside allowed directories');
      }
      return realPath;
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

      // Sidebar panel registration
      registerSidebarPanel(panel) {
        // Find the plugin's directory for scoped validation
        const pluginDir = self.loadedPlugins.get(pluginName)?.dir;
        console.log('[DEBUG] registerSidebarPanel called by plugin:', pluginName, 'panel id:', panel?.id);
        try {
          self._validatePanel(panel, pluginDir);
          self.sidebarPanels.set(pluginName, panel);
          self.panelStates.set(pluginName, {});
          console.log('[DEBUG] Panel stored successfully. Map size now:', self.sidebarPanels.size);
          self.broadcast('sidebar-panel-registered', {
            pluginName,
            panel,
            state: {},
          });
          console.log('[runtimePlugin] Registered sidebar panel:', panel.id, 'from', pluginName);
        } catch (err) {
          console.error('[runtimePlugin] registerSidebarPanel FAILED:', err.message);
          throw err;
        }
      },

      updateElementState(updates) {
        const current = self.panelStates.get(pluginName) || {};
        Object.assign(current, updates);
        self.panelStates.set(pluginName, current);
        // Persist panel state
        if (!self._stateCache.panelStates) self._stateCache.panelStates = {};
        self._stateCache.panelStates[pluginName] = current;
        self._saveStateDebounced();
        self.broadcast('sidebar-panel-state-updated', {
          pluginName,
          state: current,
        });
      },

      updatePanel(panel) {
        const pluginDir = self.loadedPlugins.get(pluginName)?.dir;
        self._validatePanel(panel, pluginDir);
        self.sidebarPanels.set(pluginName, panel);
        // Reset state for new elements in replaced panel
        self.panelStates.set(pluginName, {});
        // Persist panel state reset
        if (!self._stateCache.panelStates) self._stateCache.panelStates = {};
        self._stateCache.panelStates[pluginName] = {};
        self._saveStateDebounced();
        self.broadcast('sidebar-panel-updated', {
          pluginName,
          panel,
          state: {},
        });
      },

      // Events
      onEvent(event, callback) {
        if (!self.listeners.has(event)) self.listeners.set(event, []);
        self.listeners.get(event).push({ callback, plugin: pluginName });
      },

      // Content override registration (declarative - no React components)
      registerContentOverride(declaration) {
        self.contentOverrides.set(pluginName, {
          extensions: declaration.extensions || [],
          label: declaration.label || 'Preview',
        });
        self.broadcast('content-overrides-changed', self.getContentOverrides());
        console.log('[runtimePlugin] Registered content override:', pluginName, declaration.extensions);
      },

      // Render mode management
      setRenderMode(extension, rendered) {
        self.renderModeStates.set(extension, rendered);
        // Persist render mode
        if (!self._stateCache.renderModes) self._stateCache.renderModes = {};
        self._stateCache.renderModes[extension] = rendered;
        self._saveStateDebounced();
        self.broadcast('render-mode-changed', { extension, rendered });
        console.log('[runtimePlugin] Render mode:', extension, rendered ? 'rendered' : 'source');
      },

      getRenderMode(extension) {
        return self.renderModeStates.get(extension) ?? true;
      },

      // Plugin-scoped persistent state
      getState(key, defaultValue) {
        const data = self._stateCache.pluginData?.[pluginName] || {};
        return key in data ? data[key] : defaultValue;
      },

      setState(key, value) {
        if (!self._stateCache.pluginData) self._stateCache.pluginData = {};
        if (!self._stateCache.pluginData[pluginName]) self._stateCache.pluginData[pluginName] = {};
        self._stateCache.pluginData[pluginName][key] = value;
        self._saveStateDebounced();
      },

      // Notifications
      notify(options) {
        const { BrowserWindow } = require('electron');
        const wins = BrowserWindow.getAllWindows();
        if (wins.length > 0) {
          wins[0].webContents.send('show-notification', options);
        }
      },

      // Restricted file system
      fs: pluginFs,
    };
  }

  // --- Plugin Loading ---

  loadPlugin(name) {
    if (this.loadedPlugins.has(name)) {
      console.log('[DEBUG] Plugin already loaded:', name);
      return;
    }

    const plugins = this.discoverPlugins();
    const plugin = plugins.find(p => p.name === name);
    if (!plugin) {
      console.warn('[runtimePlugin] Plugin not found:', name);
      console.log('[DEBUG] Available plugins:', plugins.map(p => p.name));
      return;
    }

    console.log('[DEBUG] Loading plugin:', name, 'from', plugin.path);
    try {
      const entryPath = path.join(plugin.path, plugin.main);
      console.log('[DEBUG] Entry path:', entryPath);
      delete require.cache[require.resolve(entryPath)];
      const mod = require(entryPath);
      console.log('[DEBUG] Module loaded. Has activate:', typeof mod.activate);

      if (mod.activate) {
        // Set loadedPlugins BEFORE activate() so registerSidebarPanel can resolve pluginDir
        const mtime = this.getPluginMtime(plugin.path);
        this.loadedPlugins.set(name, { mod, dir: plugin.path, mtime, main: plugin.main });

        const context = this.createContext(name);
        this.pluginContexts.set(name, context);
        console.log('[DEBUG] Calling activate for:', name);
        mod.activate(context);
        console.log('[DEBUG] activate() completed for:', name);
        console.log('[runtimePlugin] Loaded:', name);
      } else {
        console.warn('[runtimePlugin] Plugin', name, 'has no activate() function');
      }
    } catch (err) {
      console.error('[runtimePlugin] Failed to load', name + ':', err.message);
      console.error('[DEBUG] Full error:', err.stack);
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
    // Clean up event listeners registered by this plugin
    for (const [event, listeners] of this.listeners) {
      this.listeners.set(event, listeners.filter(l => l.plugin !== name));
    }

    this.sidebarPanels.delete(name);
    this.panelStates.delete(name);
    this.broadcast('sidebar-panel-removed', { pluginName: name });

    // Clean up content overrides registered by this plugin
    this.contentOverrides.delete(name);
    this.broadcast('content-overrides-changed', this.getContentOverrides());

    try {
      const entryPath = path.join(loaded.dir, loaded.main);
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
    const name = fileInfo ? fileInfo.fileName : '(none)';
    const dir = fileInfo && fileInfo.filePath ? path.dirname(fileInfo.filePath) : '(none)';
    console.log('[Active Tab]', name, '->', dir);
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

  // Command execution queue to prevent concurrent console monkey-patching
  _commandQueue = Promise.resolve();

  executeCommand(name, args) {
    const command = this.commands.get(name);
    if (!command) throw new Error('Command not found: ' + name);

    return new Promise((resolve, reject) => {
      this._commandQueue = this._commandQueue.then(async () => {
        const logs = [];
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...a) => { logs.push({ level: 'log', args: a }); originalLog.apply(console, a); };
        console.warn = (...a) => { logs.push({ level: 'warn', args: a }); originalWarn.apply(console, a); };
        console.error = (...a) => { logs.push({ level: 'error', args: a }); originalError.apply(console, a); };

        try {
          const result = command.handler(args);
          // Handle async handlers
          const value = result instanceof Promise ? await result : result;
          resolve(value);
        } catch (err) {
          reject(err);
        } finally {
          console.log = originalLog;
          console.warn = originalWarn;
          console.error = originalError;
          this.broadcast('plugin-command-log', { command: name, plugin: command.plugin, logs });
        }
      });
    });
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
      result.push({ id: name, name, description: val.description, when: val.plugin });
    }
    return result;
  }

  // --- Sidebar Panel ---

  _validatePanel(panel, pluginDir) {
    if (!panel || typeof panel !== 'object') throw new Error('SidebarPanel must be an object');
    if (!panel.id || typeof panel.id !== 'string') throw new Error('SidebarPanel.id is required');
    if (!panel.title || typeof panel.title !== 'string') throw new Error('SidebarPanel.title is required');
    if (!Array.isArray(panel.children)) throw new Error('SidebarPanel.children must be an array');
    this._validateElements(panel.children, panel.id, 0, pluginDir);
  }

  _validateElements(elements, panelId, depth, pluginDir) {
    if (depth > 5) throw new Error('Section nesting too deep in panel ' + panelId);
    const validTypes = new Set([
      'button', 'toggle', 'select', 'text-input', 'text-area',
      'status', 'progress', 'label', 'separator', 'section',
      'link', 'badge', 'html',
    ]);
    for (const el of elements) {
      if (!el || typeof el !== 'object') throw new Error('Invalid element in panel ' + panelId);
      if (!validTypes.has(el.type)) throw new Error('Unknown element type "' + el.type + '" in panel ' + panelId);
      if (!el.id || typeof el.id !== 'string') throw new Error('Element missing id in panel ' + panelId);
      if (el.type === 'html' && el.src) {
        // Accept both file:// and local-file:// protocols
        const isFileProtocol = el.src.startsWith('file://') || el.src.startsWith('local-file://');
        if (!isFileProtocol) throw new Error('HTML element src must be file:// or local-file:// in panel ' + panelId);
        // Validate the path is within the SPECIFIC plugin's directory (not all plugins)
        try {
          // Normalize to file:// for URL parsing
          const normalizedSrc = el.src.startsWith('local-file://')
            ? el.src.replace('local-file://', 'file://')
            : el.src;
          const url = new URL(normalizedSrc);
          let srcPath = decodeURIComponent(url.pathname);
          // On Windows, URL pathname starts with /C:/ which path.resolve() mishandles
          // Strip leading slash if it's a Windows drive letter path
          if (process.platform === 'win32' && /^\/[A-Z]:/i.test(srcPath)) {
            srcPath = srcPath.substring(1);
          }
          const resolvedSrc = path.resolve(srcPath);
          // Use plugin-specific directory if available, fall back to plugins root
          const allowedRoot = pluginDir || path.join(app.getPath('userData'), 'plugins');
          const resolvedRoot = path.resolve(allowedRoot);
          // Use path.relative for safe containment check across all platforms
          const rel = path.relative(resolvedRoot, resolvedSrc);
          if (rel.startsWith('..') || path.isAbsolute(rel)) {
            throw new Error('HTML element src must be within the plugin directory in panel ' + panelId);
          }
        } catch (e) {
          if (e.message.startsWith('HTML element src must be')) throw e;
          throw new Error('Invalid HTML element src URL in panel ' + panelId + ': ' + e.message);
        }
      }
      if (el.type === 'section' && Array.isArray(el.children)) {
        this._validateElements(el.children, panelId, depth + 1, pluginDir);
      }
    }
  }

  getSidebarPanels() {
    const result = [];
    console.log('[DEBUG] getSidebarPanels called. sidebarPanels map size:', this.sidebarPanels.size);
    for (const [pluginName, panel] of this.sidebarPanels) {
      console.log('[DEBUG] Found panel for plugin:', pluginName, 'panel id:', panel.id);
      result.push({
        pluginName,
        panel,
        state: this.panelStates.get(pluginName) || {},
      });
    }
    console.log('[DEBUG] getSidebarPanels returning', result.length, 'panels');
    return result;
  }

  getContentOverrides() {
    const result = [];
    for (const [name, override] of this.contentOverrides) {
      result.push({ name, ...override });
    }
    return result;
  }

  handleUIInteraction(pluginName, elementId, eventType, payload) {
    const panel = this.sidebarPanels.get(pluginName);
    if (!panel) throw new Error('No panel registered by plugin: ' + pluginName);

    const listeners = this.listeners.get('ui-event') || [];
    for (const { callback, plugin } of listeners) {
      if (plugin === pluginName) {
        try {
          callback({ elementId, eventType, payload });
        } catch (err) {
          console.warn('[runtimePlugin] UI event handler error in ' + plugin + ':', err.message);
        }
      }
    }
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
