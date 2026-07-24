import { PluginManager } from '@mdview/plugin-api';
import { useAppStore } from './store/appStore';
// @ts-ignore — JSON import
import pluginRegistry from '../electron/plugins.json';

// Built-in plugins: static imports
import { activate as activatePdf, deactivate as deactivatePdf } from '@mdview/plugin-pdf';
import { activate as activateImages, deactivate as deactivateImages } from '@mdview/plugin-images';
import { activate as activateEditor, deactivate as deactivateEditor } from '@mdview/plugin-editor';

// Built-in proxy components for runtime plugin content overrides
import { HtmlRenderer } from './components/HtmlRenderer';

// Map of plugin name -> activate/deactivate functions
const builtinPlugins: Record<string, { activate: Function; deactivate?: Function }> = {
  'pdf-viewer': { activate: activatePdf, deactivate: deactivatePdf },
  'image-viewer': { activate: activateImages, deactivate: deactivateImages },
  'editor': { activate: activateEditor, deactivate: deactivateEditor },
};

// Track deactivate functions for cleanup
const pluginDeactivators: Map<string, () => void> = new Map();

// Track registered content override extensions
let registeredExtensions: string[] = [];

export const pluginManager = new PluginManager();

// Helper to check if a file is HTML
function isHtmlFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return registeredExtensions.includes(ext);
}

// Auto-activate/deactivate content override based on active tab
function setupContentOverrideAutoActivation() {
  let lastActiveTabId: string | null = null;

  // Listen for render mode changes from main process
  window.electronAPI?.onRenderModeChanged?.((data: { extension: string; rendered: boolean }) => {
    const activeTab = useAppStore.getState().tabs.find(t => t.id === useAppStore.getState().activeTabId);
    if (!activeTab) return;

    if (isHtmlFile(activeTab.fileName)) {
      if (data.rendered && !pluginManager.isContentOverrideActive()) {
        // Activate override for rendered mode
        pluginManager.toggleContentOverride({
          filePath: activeTab.filePath,
          fileName: activeTab.fileName,
          content: activeTab.content,
        });
        console.log('[pluginLoader] Auto-activated content override for HTML file');
      } else if (!data.rendered && pluginManager.isContentOverrideActive()) {
        // Deactivate override for source mode
        pluginManager.toggleContentOverride({
          filePath: activeTab.filePath,
          fileName: activeTab.fileName,
          content: activeTab.content,
        });
        console.log('[pluginLoader] Auto-deactivated content override for source mode');
      }
    }
  });

  // Listen for tab changes
  useAppStore.subscribe((state, prevState) => {
    if (state.activeTabId !== prevState.activeTabId) {
      const activeTab = state.tabs.find(t => t.id === state.activeTabId);
      if (!activeTab) return;

      // Skip if same tab
      if (state.activeTabId === lastActiveTabId) return;
      lastActiveTabId = state.activeTabId;

      if (isHtmlFile(activeTab.fileName)) {
        // Check initial render mode and activate if needed
        window.electronAPI?.getRenderMode?.('html').then((rendered: boolean) => {
          if (rendered && !pluginManager.isContentOverrideActive()) {
            pluginManager.toggleContentOverride({
              filePath: activeTab.filePath,
              fileName: activeTab.fileName,
              content: activeTab.content,
            });
            console.log('[pluginLoader] Auto-activated content override for new HTML tab');
          }
        });
      } else if (pluginManager.isContentOverrideActive()) {
        // Deactivate override when switching to non-HTML file
        pluginManager.toggleContentOverride({
          filePath: activeTab.filePath,
          fileName: activeTab.fileName,
          content: activeTab.content,
        });
        console.log('[pluginLoader] Auto-deactivated content override for non-HTML file');
      }
    }
  });
}

export async function loadPlugins() {
  // First run: enable all built-in plugins by default
  const saved = localStorage.getItem('mdview-enabled-plugins');
  if (saved === null) {
    const allNames = Object.keys(builtinPlugins);
    useAppStore.setState({ enabledPlugins: allNames });
    localStorage.setItem('mdview-enabled-plugins', JSON.stringify(allNames));
  }

  const currentEnabled = useAppStore.getState().enabledPlugins;

  // Activate enabled built-in plugins
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
    const commands = await window.electronAPI.getCommands() || [];
    useAppStore.setState({ runtimeCommands: commands || [] });
    console.log('[pluginLoader] Runtime plugins loaded. Exporters:', (exporters || []).length, '| Commands:', (commands || []).length);

    // Fetch content overrides from runtime plugins
    const contentOverrides = await window.electronAPI.getContentOverrides();
    if (contentOverrides && contentOverrides.length > 0) {
      for (const override of contentOverrides) {
        registeredExtensions = override.extensions;
        pluginManager.registerContentOverride({
          canOverride: (tab) => {
            const ext = tab.fileName.split('.').pop()?.toLowerCase() || '';
            return override.extensions.includes(ext);
          },
          component: HtmlRenderer,
        });
        console.log('[pluginLoader] Registered runtime content override for:', override.extensions);
      }
      // Setup auto-activation for content overrides
      setupContentOverrideAutoActivation();
    }
  } catch (err) {
    console.warn('[pluginLoader] Failed to fetch runtime plugin state:', err);
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
