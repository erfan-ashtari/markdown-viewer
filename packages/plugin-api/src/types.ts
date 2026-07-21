import React from 'react';

// Plugin entry point (new lifecycle pattern)
export interface PluginModule {
  activate(context: PluginContext): void;
  deactivate?(): void;
}

// Legacy plugin format (still supported)
export interface Plugin {
  name: string;
  version: string;
  description?: string;
  register(api: PluginAPI): void;
}

// Combined — accept either format
export type PluginEntry = PluginModule | Plugin;

// Plugin context (passed to activate())
export interface PluginContext {
  registerFileType(config: FileTypeConfig): void;
  registerSlot(config: SlotConfig): void;
  registerContentOverride(config: ContentOverrideConfig): void;
  registerShortcut(keys: string, handler: () => void): void;
  registerToolbarItem(config: ToolbarItemConfig): void;
  registerFileFilter(config: FileFilterConfig): void;
  subscriptions: { dispose(): void }[];
  extensionPath: string;
  globalState: Record<string, any>;
}

// Runtime plugin entry (from discover-plugins IPC)
export interface RuntimePluginEntry {
  name: string;
  displayName: string;
  version: string;
  description: string;
  publisher: string;
  main: string;
  activationEvents: string[];
  contributes: PluginContributes;
  path: string;
}

// Static declarations from package.json
export interface PluginContributes {
  fileTypes?: Array<{ extensions: string[]; name: string }>;
  slots?: Array<{ slot: string; id: string; order?: number }>;
  shortcuts?: Array<{ keys: string; command: string }>;
  commands?: Array<{ command: string; title: string }>;
  settings?: Record<string, { type: string; default: any; description: string }>;
}

// Registration APIs
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
  component: React.ComponentType<{ content: string; filePath: string; fileName: string; onSave: (newContent: string) => void }>;
}

export interface SlotConfig {
  slot: string;
  id: string;
  component: React.ComponentType<any>;
  order?: number;
}

export interface FileTypeConfig {
  extensions: string[];
  name: string;
  renderer: React.ComponentType<{ content: string; filePath: string }>;
}

export interface ToolbarItemConfig {
  id: string;
  icon: any;
  tooltip: string;
  onClick: () => void;
}

export interface FileFilterConfig {
  name: string;
  extensions: string[];
}