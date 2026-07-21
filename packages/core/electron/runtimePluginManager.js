const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class RuntimePluginManager {
  constructor() {
    this.exporters = new Map();    // name -> { handler, description }
    this.commands = new Map();     // name -> { handler, description }
    this.listeners = new Map();    // event -> [callbacks]
    this.loadedPlugins = new Map(); // name -> { mod, dir }
    this.stateFile = null;
  }

  // Initialize with userData path
  init() {
    const userDataPath = app.getPath('userData');
    this.stateFile = path.join(userDataPath, 'plugins-state.json');

    // Ensure plugins directory exists
    const pluginsDir = path.join(userDataPath, 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }

    // Ensure state file exists
    if (!fs.existsSync(this.stateFile)) {
      this.saveState({ plugins: {} });
    }
  }

  // State management
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

  // Plugin discovery
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
          path: dir,
        });
      } catch (e) {
        console.warn('Invalid plugin at ' + dir + ':', e.message);
      }
    }

    // Sort: newest first
    plugins.sort((a, b) => {
      try {
        return fs.statSync(path.join(pluginsDir, b.name)).mtimeMs -
               fs.statSync(path.join(pluginsDir, a.name)).mtimeMs;
      } catch { return 0; }
    });

    return plugins;
  }

  // Create secure context for a plugin
  createContext(pluginName) {
    const self = this;
    return {
      registerExporter(name, handler, description) {
        self.exporters.set(name, { handler, description: description || name, plugin: pluginName });
        console.log('[runtimePlugin] Registered exporter:', name, 'from', pluginName);
      },
      registerCommand(name, handler, description) {
        self.commands.set(name, { handler, description: description || name, plugin: pluginName });
        console.log('[runtimePlugin] Registered command:', name, 'from', pluginName);
      },
      onEvent(event, callback) {
        if (!self.listeners.has(event)) self.listeners.set(event, []);
        self.listeners.get(event).push({ callback, plugin: pluginName });
      },
    };
  }

  // Load a single plugin
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
      // Clear require cache for hot reload
      delete require.cache[require.resolve(entryPath)];
      const mod = require(entryPath);

      if (mod.activate) {
        const context = this.createContext(name);
        mod.activate(context);
        this.loadedPlugins.set(name, { mod, dir: plugin.path });
        console.log('[runtimePlugin] Loaded:', name);
      } else {
        console.warn('[runtimePlugin] Plugin', name, 'has no activate() function');
      }
    } catch (err) {
      console.error('[runtimePlugin] Failed to load', name + ':', err.message);
    }
  }

  // Unload a single plugin
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

    // Remove registered exporters/commands from this plugin
    for (const [key, val] of this.exporters) {
      if (val.plugin === name) this.exporters.delete(key);
    }
    for (const [key, val] of this.commands) {
      if (val.plugin === name) this.commands.delete(key);
    }

    // Clear require cache
    try {
      const entryPath = path.join(loaded.dir, require(path.join(loaded.dir, 'package.json')).main);
      delete require.cache[require.resolve(entryPath)];
    } catch {}

    this.loadedPlugins.delete(name);
    console.log('[runtimePlugin] Unloaded:', name);
  }

  // Load all enabled plugins
  loadAllEnabled() {
    const state = this.loadState();
    for (const [name, config] of Object.entries(state.plugins)) {
      if (config.enabled) {
        this.loadPlugin(name);
      }
    }
  }

  // Execute an exporter
  executeExport(name, content, meta) {
    const exporter = this.exporters.get(name);
    if (!exporter) throw new Error('Exporter not found: ' + name);
    return exporter.handler(content, meta);
  }

  // Execute a command
  executeCommand(name, args) {
    const command = this.commands.get(name);
    if (!command) throw new Error('Command not found: ' + name);
    return command.handler(args);
  }

  // Get list of registered exporters
  getExporters() {
    const result = [];
    for (const [name, val] of this.exporters) {
      result.push({ name, description: val.description });
    }
    return result;
  }

  // Get list of registered commands
  getCommands() {
    const result = [];
    for (const [name, val] of this.commands) {
      result.push({ name, description: val.description });
    }
    return result;
  }
}

module.exports = RuntimePluginManager;