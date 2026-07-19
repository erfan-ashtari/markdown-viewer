import { Plugin, PluginAPI, FileTypeConfig, ToolbarItemConfig, EditorConfig } from './types';

export class PluginManager implements PluginAPI {
  private plugins: Plugin[] = [];
  private fileTypes: FileTypeConfig[] = [];
  private toolbarItems: ToolbarItemConfig[] = [];
  private editors: EditorConfig[] = [];
  private shortcuts: Map<string, () => void> = new Map();

  register(plugin: Plugin): void {
    plugin.register(this);
    this.plugins.push(plugin);
    console.log('Plugin loaded: ' + plugin.name + ' v' + plugin.version);
  }

  registerFileType(config: FileTypeConfig): void {
    this.fileTypes.push(config);
  }

  registerToolbarItem(config: ToolbarItemConfig): void {
    this.toolbarItems.push(config);
  }

  registerEditor(config: EditorConfig): void {
    this.editors.push(config);
  }

  registerShortcut(keys: string, handler: () => void): void {
    this.shortcuts.set(keys, handler);
  }

  getFileType(fileName: string): FileTypeConfig | undefined {
    var ext = fileName.split('.').pop()?.toLowerCase() || '';
    return this.fileTypes.find(function(ft) { return ft.extensions.includes(ext); });
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
