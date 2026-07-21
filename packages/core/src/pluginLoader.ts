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
  const saved = localStorage.getItem('mdview-enabled-plugins');
  if (saved === null) {
    const allNames = Object.keys(builtinPlugins);
    useAppStore.setState({ enabledPlugins: allNames });
    localStorage.setItem('mdview-enabled-plugins', JSON.stringify(allNames));
  }

  const currentEnabled = useAppStore.getState().enabledPlugins;

  for (const [name, plugin] of Object.entries(builtinPlugins)) {
    if (!currentEnabled.includes(name)) continue;

    const context = pluginManager.createContext(name);
    console.log('[pluginLoader] Activating:', name);
    plugin.activate(context);
    if (plugin.deactivate) {
      pluginDeactivators.set(name, plugin.deactivate as () => void);
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
  return pluginRegistry.map((entry: any) => ({
    name: entry.name,
    displayName: entry.displayName || entry.name,
    version: entry.version,
    description: entry.description || '',
    activationEvents: entry.activationEvents || ['onStartup'],
    contributes: entry.contributes || {},
  }));
}