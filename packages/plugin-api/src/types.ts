import React from 'react';

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
