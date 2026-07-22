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
  sidebarPanels?: SidebarPanel[];
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

// ─── Sidebar Panel UI Schema (Runtime Plugins) ─────────────────────

/** Root container for a runtime plugin's sidebar UI. */
export interface SidebarPanel {
  /** Unique panel ID (scoped to plugin). */
  id: string;
  /** Display title shown in the sidebar header. */
  title: string;
  /** Optional icon (lucide icon name string). */
  icon?: string;
  /** Whether the panel is collapsible. Default true. */
  collapsible?: boolean;
  /** Whether the panel starts collapsed. Default false. */
  defaultCollapsed?: boolean;
  /** Ordered list of UI elements to render. */
  children: SidebarElement[];
}

/** Discriminated union of all supported sidebar UI elements. */
export type SidebarElement =
  | SidebarButton
  | SidebarToggle
  | SidebarSelect
  | SidebarTextInput
  | SidebarTextArea
  | SidebarStatus
  | SidebarProgress
  | SidebarLabel
  | SidebarSeparator
  | SidebarSection
  | SidebarLink
  | SidebarBadge
  | SidebarHtml;

/** Base properties shared by all sidebar elements. */
interface SidebarElementBase {
  /** Unique element ID within the panel (plugin-unique, stable). */
  id: string;
  /** Optional conditional visibility: element ID to watch + expected value. */
  visibleWhen?: { elementId: string; value: any };
}

/** Button — triggers an action. */
export interface SidebarButton extends SidebarElementBase {
  type: 'button';
  label: string;
  /** Lucide icon name, e.g. "Play", "Send", "Trash2". */
  icon?: string;
  /** Visual variant. Default "default". */
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  /** Show a spinner while the action is in-flight. */
  loading?: boolean;
  /** Disable the button. */
  disabled?: boolean;
}

/** Toggle — boolean on/off switch. */
export interface SidebarToggle extends SidebarElementBase {
  type: 'toggle';
  label: string;
  checked: boolean;
  disabled?: boolean;
}

/** Select — dropdown with fixed options. */
export interface SidebarSelect extends SidebarElementBase {
  type: 'select';
  label?: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  disabled?: boolean;
}

/** Text input — single-line. */
export interface SidebarTextInput extends SidebarElementBase {
  type: 'text-input';
  placeholder?: string;
  value: string;
  label?: string;
  disabled?: boolean;
}

/** Text area — multi-line. */
export interface SidebarTextArea extends SidebarElementBase {
  type: 'text-area';
  placeholder?: string;
  value: string;
  rows?: number;
  disabled?: boolean;
}

/** Status — read-only text display. */
export interface SidebarStatus extends SidebarElementBase {
  type: 'status';
  label?: string;
  value: string;
  color?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

/** Progress — progress bar. */
export interface SidebarProgress extends SidebarElementBase {
  type: 'progress';
  label?: string;
  /** 0–100. */
  value: number;
  /** Show percentage text. Default true. */
  showPercent?: boolean;
}

/** Label — static text. */
export interface SidebarLabel extends SidebarElementBase {
  type: 'label';
  text: string;
  variant?: 'text' | 'heading' | 'muted';
}

/** Separator — horizontal rule. */
export interface SidebarSeparator extends SidebarElementBase {
  type: 'separator';
}

/** Section — collapsible group of child elements. */
export interface SidebarSection extends SidebarElementBase {
  type: 'section';
  title: string;
  defaultCollapsed?: boolean;
  children: SidebarElement[];
}

/** Link — clickable hyperlink. */
export interface SidebarLink extends SidebarElementBase {
  type: 'link';
  label: string;
  url: string;
  external?: boolean;
}

/** Badge — small count or status indicator. */
export interface SidebarBadge extends SidebarElementBase {
  type: 'badge';
  label: string;
  count?: number;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

/** Html — sandboxed iframe for custom content. */
export interface SidebarHtml extends SidebarElementBase {
  type: 'html';
  /** URL to load in a sandboxed iframe. Must be a file:// URL within the plugin's directory. */
  src: string;
  /** Height of the iframe in pixels. Default 200. */
  height?: number;
  /** Sandboxed permissions. Default "allow-scripts". */
  sandbox?: string;
}