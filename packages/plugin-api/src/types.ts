export interface Plugin {
  name: string;
  version: string;
  description?: string;
  register(api: PluginAPI): void;
}

export interface PluginAPI {
  registerFileType(config: FileTypeConfig): void;
  registerToolbarItem(config: ToolbarItemConfig): void;
  registerShortcut(keys: string, handler: () => void): void;
  registerContentOverride(config: ContentOverrideConfig): void;
  registerSlot(config: SlotConfig): void;
  registerFileFilter(config: FileFilterConfig): void;
}

export interface ContentOverrideConfig {
  canOverride: (tab: { filePath: string; fileName: string; content: string }) => boolean;
  component: any;
}

export interface SlotConfig {
  slot: string;
  id: string;
  component: any;
  order?: number;
}

export interface FileTypeConfig {
  extensions: string[];
  name: string;
  icon: any;
  renderer: any;
}

export interface ToolbarItemConfig {
  id: string;
  icon: any;
  tooltip: string;
  onClick: () => void;
  position?: 'left' | 'center' | 'right';
}

export interface FileFilterConfig {
  name: string;
  extensions: string[];
}
