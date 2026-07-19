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
