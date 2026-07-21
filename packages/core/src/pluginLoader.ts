import { PluginManager } from '@mdview/plugin-api';
import { useAppStore } from './store/appStore';
// @ts-ignore — JSON import
import pluginRegistry from '../../plugins.json';

// Built-in plugins: static imports
import { activate as activatePdf, deactivate as deactivatePdf } from '@mdview/plugin-pdf';
import { activate as activateImages, deactivate as deactivateImages } from '@mdview/plugin-images';
import { activate as activateEditor, deactivate as deactivateEditor } from '@mdview/plugin-editor';

// Map of plugin name -> activate/deactivate functions
const builtinPlugins: Record<string, { activate: Function; deactivate?: Function }> = {
  'pdf-viewer': { activate: activatePdf, deactivate: deactivatePdf },
  'image-viewer': { activate: activateImages, deactivate: deactivateImages },
  'editor': { activate: activateEditor, deactivate: deactivateEditor },
};

// Track deactivate functions for cleanup
const pluginDeactivators: Map<string, () => void> = new Map();

export const pluginManager = new PluginManager();

export async function loadPlugins() {
  // Phase 1: Discover runtime plugins (from {userData}/plugins/)
  let runtimeEntries: any[] = [];
  try {
    runtimeEntries = await window.electronAPI.discoverPlugins();
  } catch (err) {
    console.warn('[pluginLoader] Failed to discover runtime plugins:', err);
  }

  // First run: enable all plugins (built-in + runtime) by default
  const saved = localStorage.getItem('mdview-enabled-plugins');
  if (saved === null) {
    const allNames = [...Object.keys(builtinPlugins), ...runtimeEntries.map((e: any) => e.name)];
    useAppStore.setState({ enabledPlugins: allNames });
    localStorage.setItem('mdview-enabled-plugins', JSON.stringify(allNames));
  }

  const currentEnabled = useAppStore.getState().enabledPlugins;

  // Phase 2: Activate enabled built-in plugins
  for (const [name, plugin] of Object.entries(builtinPlugins)) {
    if (!currentEnabled.includes(name)) continue;

    const context = pluginManager.createContext(name);
    console.log('[pluginLoader] Activating built-in:', name);
    plugin.activate(context);
    if (plugin.deactivate) {
      pluginDeactivators.set(name, plugin.deactivate as () => void);
    }
  }

  // Fetch runtime plugin data from main process
  try {
    const exporters = await window.electronAPI.getExporters();
    useAppStore.setState({ runtimeExporters: exporters || [] });
    console.log('[pluginLoader] Runtime exporters:', (exporters || []).length);
    const commands = await window.electronAPI.getCommands() || [];
    useAppStore.setState({ runtimeCommands: commands || [] });
  } catch (err) {
    console.warn('[pluginLoader] Failed to fetch runtime plugin state:', err);
  }

  // Phase 3: Activate enabled runtime plugins
  for (const entry of runtimeEntries) {
    if (!currentEnabled.includes(entry.name)) continue;

    try {
      const mod = await import(/* @vite-ignore */ `file://${entry.path}/${entry.main}`);
      if (mod.activate) {
        const context = pluginManager.createContext(entry.name);
        console.log('[pluginLoader] Activating runtime:', entry.name);
        mod.activate(context);
        if (mod.deactivate) {
          pluginDeactivators.set(entry.name, mod.deactivate);
        }
      } else {
        console.warn(`[pluginLoader] Runtime plugin "${entry.name}" has no activate() function.`);
      }
    } catch (err) {
      console.warn(`[pluginLoader] Failed to load runtime plugin "${entry.name}":`, err);
    }
  }
}

export function deactivatePlugin(name: string): void {
  const deactivator = pluginDeactivators.get(name);
  if (deactivator) {
    deactivator();
    pluginDeactivators.delete(name);
  }
  pluginManager.dispose(name);
}

export function getAvailablePlugins() {
  // Built-in from plugins.json
  const builtin = pluginRegistry.map((entry: any) => ({
    name: entry.name,
    displayName: entry.displayName || entry.name,
    version: entry.version,
    description: entry.description || '',
    activationEvents: entry.activationEvents || ['onStartup'],
    contributes: entry.contributes || {},
  }));

  // Runtime plugins are handled by get-plugins IPC in main.js
  // Settings UI reads directly from that IPC, so we just return built-in here
  return builtin;
}