import { PluginManager } from '@mdview/plugin-api';
import { useAppStore } from './store/appStore';

// Built-in plugins
import PdfPlugin from '@mdview/plugin-pdf';

const builtinPlugins = [PdfPlugin];

export const pluginManager = new PluginManager();

export function loadPlugins() {
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
