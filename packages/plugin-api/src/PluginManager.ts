import { Plugin, PluginAPI, FileTypeConfig, ToolbarItemConfig, ContentOverrideConfig, SlotConfig, FileFilterConfig } from './types';

export class PluginManager implements PluginAPI {
  private plugins: Plugin[] = [];
  private fileTypes: FileTypeConfig[] = [];
  private toolbarItems: ToolbarItemConfig[] = [];
  private shortcuts: Map<string, () => void> = new Map();
  private contentOverrides: ContentOverrideConfig[] = [];
  private activeContentOverride: ContentOverrideConfig | null = null;
  private slots: SlotConfig[] = [];
  private fileFilters: FileFilterConfig[] = [];
  private overrideListeners: (() => void)[] = [];

  register(plugin: Plugin): void {
    plugin.register(this);
    this.plugins.push(plugin);
  }

  registerFileType(config: FileTypeConfig): void {
    this.fileTypes.push(config);
  }

  registerToolbarItem(config: ToolbarItemConfig): void {
    this.toolbarItems.push(config);
  }

  registerShortcut(keys: string, handler: () => void): void {
    this.shortcuts.set(keys, handler);
  }

  registerContentOverride(config: ContentOverrideConfig): void {
    this.contentOverrides.push(config);
  }

  registerSlot(config: SlotConfig): void {
    this.slots.push(config);
  }

  registerFileFilter(config: FileFilterConfig): void {
    this.fileFilters.push(config);
  }

  // Subscription for override changes (general-purpose)
  onOverrideChange(callback: () => void): void {
    this.overrideListeners.push(callback);
  }

  offOverrideChange(callback: () => void): void {
    this.overrideListeners = this.overrideListeners.filter(function(fn) { return fn !== callback; });
  }

  private notifyOverrideChange(): void {
    this.overrideListeners.forEach(function(fn) { fn(); });
  }

  getFileType(fileName: string): FileTypeConfig | undefined {
    var ext = fileName.split('.').pop()?.toLowerCase() || '';
    return this.fileTypes.find(function(ft) { return ft.extensions.includes(ext); });
  }

  getToolbarItems(): ToolbarItemConfig[] {
    return this.toolbarItems.slice();
  }

  getShortcut(keys: string): (() => void) | undefined {
    return this.shortcuts.get(keys);
  }

  getPlugins(): Plugin[] {
    return this.plugins.slice();
  }

  getSlotItems(slotName: string): SlotConfig[] {
    return this.slots
      .filter(function(s) { return s.slot === slotName; })
      .sort(function(a, b) { return (a.order || 100) - (b.order || 100); });
  }

  getFileFilters(): FileFilterConfig[] {
    return this.fileFilters.slice();
  }

  // Content override methods
  toggleContentOverride(tab: { filePath: string; fileName: string; content: string }): void {
    if (this.activeContentOverride) {
      this.activeContentOverride = null;
    } else {
      this.activeContentOverride = this.contentOverrides.find(c => c.canOverride(tab)) || null;
    }
    this.notifyOverrideChange();
  }

  isContentOverrideActive(): boolean {
    return this.activeContentOverride !== null;
  }

  getActiveContentOverride(): ContentOverrideConfig | null {
    return this.activeContentOverride;
  }

  hasContentOverride(tab: { filePath: string; fileName: string; content: string }): boolean {
    return this.contentOverrides.some(c => c.canOverride(tab));
  }
}
