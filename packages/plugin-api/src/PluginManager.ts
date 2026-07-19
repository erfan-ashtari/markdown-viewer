import { Plugin, PluginAPI, FileTypeConfig, ToolbarItemConfig, EditorConfig } from './types';

export class PluginManager implements PluginAPI {
  private plugins: Plugin[] = [];
  private fileTypes: FileTypeConfig[] = [];
  private toolbarItems: ToolbarItemConfig[] = [];
  private editors: EditorConfig[] = [];
  private shortcuts: Map<string, () => void> = new Map();

  register(plugin: Plugin): void {
    console.log('[PluginManager] Registering plugin:', plugin.name, 'v' + plugin.version);
    plugin.register(this);
    this.plugins.push(plugin);
    console.log('[PluginManager] Plugin registered. Total plugins:', this.plugins.length);
    console.log('[PluginManager] Total file types registered:', this.fileTypes.length);
  }

  registerFileType(config: FileTypeConfig): void {
    console.log('[PluginManager] File type registered:', config.name, 'extensions:', config.extensions);
    this.fileTypes.push(config);
  }

  registerToolbarItem(config: ToolbarItemConfig): void {
    console.log('[PluginManager] Toolbar item registered:', config.id);
    this.toolbarItems.push(config);
  }

  registerEditor(config: EditorConfig): void {
    console.log('[PluginManager] Editor registered:', config.id);
    this.editors.push(config);
  }

  registerShortcut(keys: string, handler: () => void): void {
    console.log('[PluginManager] Shortcut registered:', keys);
    this.shortcuts.set(keys, handler);
  }

  getFileType(fileName: string): FileTypeConfig | undefined {
    var ext = fileName.split('.').pop()?.toLowerCase() || '';
    console.log('[PluginManager] Looking up file type for:', fileName, 'ext:', ext);
    var result = this.fileTypes.find(function(ft) { return ft.extensions.includes(ext); });
    console.log('[PluginManager] File type result:', result ? result.name : 'NOT FOUND');
    return result;
  }

  getToolbarItems(): ToolbarItemConfig[] {
    return this.toolbarItems.slice();
  }

  getEditor(filePath: string): EditorConfig | undefined {
    return this.editors.find(function(e) { return e.canEdit(filePath); });
  }

  getShortcut(keys: string): (() => void) | undefined {
    return this.shortcuts.get(keys);
  }

  getPlugins(): Plugin[] {
    return this.plugins.slice();
  }
}
