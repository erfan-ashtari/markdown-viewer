export interface Plugin {
  name: string;
  version: string;
  description?: string;
  register(api: PluginAPI): void;
}

export interface PluginAPI {
  registerFileType(config: FileTypeConfig): void;
  registerToolbarItem(config: ToolbarItemConfig): void;
  registerEditor(config: EditorConfig): void;
  registerShortcut(keys: string, handler: () => void): void;
  registerContentOverride(config: ContentOverrideConfig): void;
  registerSlot(config: SlotConfig): void;
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
  canHandle?: (filePath: string) => boolean;
}

export interface ToolbarItemConfig {
  id: string;
  icon: any;
  tooltip: string;
  onClick: () => void;
  position?: 'left' | 'center' | 'right';
}

export interface EditorConfig {
  id: string;
  name: string;
  canEdit: (filePath: string) => boolean;
  editor: any;
  shortcut?: string;
}
