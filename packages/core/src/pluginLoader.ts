import { PluginManager } from '@mdview/plugin-api';
import { useAppStore } from './store/appStore';

// Built-in plugins
import { PdfPlugin } from '@mdview/plugin-pdf';
import { ImagesPlugin } from '@mdview/plugin-images';
import { EditorPlugin } from '@mdview/plugin-editor';

const builtinPlugins = [PdfPlugin, ImagesPlugin, EditorPlugin];

export const pluginManager = new PluginManager();

export function loadPlugins() {
  // First run: no localStorage key means enable all plugins by default
  const saved = localStorage.getItem('mdview-enabled-plugins');
  if (saved === null) {
    const allNames = builtinPlugins.map(p => p.name);
    useAppStore.setState({ enabledPlugins: allNames });
    localStorage.setItem('mdview-enabled-plugins', JSON.stringify(allNames));
  }

  const enabledPlugins = useAppStore.getState().enabledPlugins;

  for (const plugin of builtinPlugins) {
    if (enabledPlugins.includes(plugin.name)) {
      pluginManager.register(plugin);
    }
  }
}

export function getAvailablePlugins() {
  return builtinPlugins.map(p => ({
    name: p.name,
    version: p.version,
    description: p.description || '',
    builtin: true,
  }));
}
