import { PluginManager, Plugin, PluginModule } from '@mdview/plugin-api';
import { useAppStore } from './store/appStore';
// @ts-ignore — JSON import
import pluginRegistry from '../../plugins.json';

// Built-in plugins: static imports for reliability
import { PdfPlugin } from '@mdview/plugin-pdf';
import { ImagesPlugin } from '@mdview/plugin-images';
import { EditorPlugin } from '@mdview/plugin-editor';

// Map of plugin name -> plugin object for built-in plugins
const builtinModules: Record<string, any> = {
  'editor': EditorPlugin,
  'image-viewer': ImagesPlugin,
  'pdf-viewer': PdfPlugin,
};

// Track deactivate functions for cleanup
const pluginDeactivators: Map<string, () => void> = new Map();

export const pluginManager = new PluginManager();

function isPluginModule(obj: any): obj is PluginModule {
  return obj && typeof obj === 'object' && typeof obj.activate === 'function';
}

function isLegacyPlugin(obj: any): obj is Plugin {
  return obj && typeof obj === 'object' && typeof obj.register === 'function' && 'name' in obj;
}

export async function loadPlugins() {
  // Phase 1: Built-in plugins (compiled by Vite)
  const enabledPlugins = useAppStore.getState().enabledPlugins;

  // First run: enable all built-in plugins by default
  const saved = localStorage.getItem('mdview-enabled-plugins');
  if (saved === null) {
    const allNames = Object.keys(builtinModules);
    useAppStore.setState({ enabledPlugins: allNames });
    localStorage.setItem('mdview-enabled-plugins', JSON.stringify(allNames));
  }

  const currentEnabled = useAppStore.getState().enabledPlugins;

  // Activate enabled built-in plugins
  for (const [name, plugin] of Object.entries(builtinModules)) {
    if (!currentEnabled.includes(name)) continue;

    if (isPluginModule(plugin)) {
      // New lifecycle: activate(context)
      const context = pluginManager.createContext(name);
      plugin.activate(context);
      if (plugin.deactivate) {
        pluginDeactivators.set(name, plugin.deactivate);
      }
    } else if (isLegacyPlugin(plugin)) {
      // Legacy: register(api)
      pluginManager.register(plugin);
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