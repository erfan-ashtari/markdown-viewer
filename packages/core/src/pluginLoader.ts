import { PluginManager } from '@mdview/plugin-api';
import { useAppStore } from './store/appStore';
// @ts-ignore — JSON import
import pluginRegistry from '../../plugins.json';

// Built-in plugins: static imports for reliability
import { PdfPlugin } from '@mdview/plugin-pdf';
import { ImagesPlugin } from '@mdview/plugin-images';
import { EditorPlugin } from '@mdview/plugin-editor';

// Map of plugin name -> plugin object for built-in plugins
const builtinModules: Record<string, any> = {
  'pdf-viewer': PdfPlugin,
  'image-viewer': ImagesPlugin,
  'editor': EditorPlugin,
};

// Third-party plugins loaded dynamically at startup
let thirdPartyModules: Record<string, any> = {};

async function loadThirdPartyPlugins() {
  for (const entry of pluginRegistry.filter((e: any) => !e.builtin)) {
    try {
      const mod = await import(/* @vite-ignore */ entry.package);
      // Find the Plugin object (has name + register method)
      const pluginObj = Object.values(mod).find(
        (v: any) => v && typeof v === 'object' && 'register' in v && 'name' in v
      );
      if (pluginObj) {
        thirdPartyModules[entry.name] = pluginObj;
      } else {
        console.warn(`Plugin "${entry.name}" at ${entry.package} does not export a valid Plugin object.`);
      }
    } catch (err) {
      console.warn(`Failed to load plugin "${entry.name}":`, err);
    }
  }
}

export const pluginManager = new PluginManager();

export async function loadPlugins() {
  // Load third-party plugins via dynamic import
  await loadThirdPartyPlugins();

  // Merge built-in and third-party
  const allModules = { ...builtinModules, ...thirdPartyModules };

  // First run: enable all plugins by default
  const saved = localStorage.getItem('mdview-enabled-plugins');
  if (saved === null) {
    const allNames = Object.keys(allModules);
    useAppStore.setState({ enabledPlugins: allNames });
    localStorage.setItem('mdview-enabled-plugins', JSON.stringify(allNames));
  }

  const enabledPlugins = useAppStore.getState().enabledPlugins;

  for (const [name, plugin] of Object.entries(allModules)) {
    if (enabledPlugins.includes(name)) {
      pluginManager.register(plugin);
    }
  }
}

export function getAvailablePlugins() {
  return pluginRegistry.map((entry: any) => ({
    name: entry.name,
    version: entry.version,
    description: entry.description || '',
    builtin: entry.builtin || false,
  }));
}
