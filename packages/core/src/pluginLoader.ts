import { PluginManager } from '@mdview/plugin-api';
import { useAppStore } from './store/appStore';

// Built-in plugins
import { PdfPlugin } from '@mdview/plugin-pdf';

const builtinPlugins = [PdfPlugin];

export const pluginManager = new PluginManager();

export function loadPlugins() {
  console.log('[PluginLoader] Loading plugins...');
  console.log('[PluginLoader] Available built-in plugins:', builtinPlugins.map(p => p.name));
  
  const enabledPlugins = useAppStore.getState().enabledPlugins;
  console.log('[PluginLoader] Enabled plugins from store:', enabledPlugins);
  
  for (const plugin of builtinPlugins) {
    const isEnabled = enabledPlugins.includes(plugin.name);
    console.log('[PluginLoader] Plugin', plugin.name, isEnabled ? 'ENABLED' : 'DISABLED');
    if (isEnabled) {
      pluginManager.register(plugin);
    }
  }
  
  console.log('[PluginLoader] Loaded plugins:', pluginManager.getPlugins().map(p => p.name));
  console.log('[PluginLoader] Registered file types:', pluginManager.getFileType('test.pdf') ? 'pdf found' : 'pdf NOT found');
}

export function getAvailablePlugins() {
  return builtinPlugins.map(p => ({
    name: p.name,
    version: p.version,
    description: p.description || '',
    builtin: true,
  }));
}
