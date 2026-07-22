/**
 * Runtime Plugin Type Definitions for MDView
 * 
 * Use these types for autocomplete and type checking in your runtime plugins.
 * 
 * Usage:
 *   /// <reference types="@mdview/plugin-api/runtime" />
 *   // or
 *   import type { RuntimePluginContext } from '@mdview/plugin-api/runtime';
 */

// --- Runtime Plugin Context ---

export interface RuntimePluginContext {
  /** Current file info - updated dynamically when files are opened */
  readonly currentFile: FileOpenedEvent | null;

  /** Register a named command */
  registerCommand(name: string, handler: (args?: any) => any | Promise<any>, description?: string): void;

  /** Register a named exporter */
  registerExporter(name: string, handler: (content: string, meta?: any) => string, description?: string): void;

  /** Register a sidebar panel */
  registerSidebarPanel(panel: SidebarPanel): void;

  /** Update sidebar element state */
  updateElementState(updates: Record<string, any>): void;

  /** Replace the entire sidebar panel */
  updatePanel(panel: SidebarPanel): void;

  /** Get persisted state value */
  getState<T>(key: string, defaultValue: T): T;

  /** Set persisted state value */
  setState<T>(key: string, value: T): void;

  /** Register event listener */
  onEvent(event: 'fileOpened' | 'fileChanged' | 'ui-event', callback: (data: any) => void): void;

  /** Register content override for file types */
  registerContentOverride(declaration: ContentOverrideDeclaration): void;

  /** Set render mode for a file extension */
  setRenderMode(extension: string, rendered: boolean): void;

  /** Get current render mode for a file extension */
  getRenderMode(extension: string): boolean;

  /** Show a system notification */
  notify(options: NotificationOptions): void;

  /** Sandboxed file system access */
  fs: PluginFileSystem;
}

// --- File System ---

export interface PluginFileSystem {
  /** Read a file (must be in allowed directory) */
  readFile(filePath: string): string;

  /** Write a file (must be in allowed directory) */
  writeFile(filePath: string, content: string): void;

  /** Check if a file exists */
  exists(filePath: string): boolean;

  /** List directory contents */
  readDir(dirPath: string): string[];

  /** Create directory (recursive) */
  mkdir(dirPath: string): void;
}

// --- Sidebar Panel ---

export interface SidebarPanel {
  /** Unique panel ID (scoped to plugin) */
  id: string;

  /** Display title in sidebar */
  title: string;

  /** Lucide icon name (e.g., "Settings", "Eye") */
  icon?: string;

  /** Whether panel is collapsible (default: true) */
  collapsible?: boolean;

  /** Start collapsed (default: false) */
  defaultCollapsed?: boolean;

  /** Ordered list of UI elements */
  children: SidebarElement[];
}

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

// --- Element Types ---

export interface SidebarButton {
  type: 'button';
  id: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
}

export interface SidebarToggle {
  type: 'toggle';
  id: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
}

export interface SidebarSelect {
  type: 'select';
  id: string;
  label?: string;
  value?: string;
  options: Array<{ label: string; value: string }>;
  disabled?: boolean;
}

export interface SidebarTextInput {
  type: 'text-input';
  id: string;
  label?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
}

export interface SidebarTextArea {
  type: 'text-area';
  id: string;
  value?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export interface SidebarStatus {
  type: 'status';
  id: string;
  label?: string;
  value: string;
  color?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export interface SidebarProgress {
  type: 'progress';
  id: string;
  label?: string;
  value: number;
  showPercent?: boolean;
}

export interface SidebarLabel {
  type: 'label';
  id: string;
  text: string;
  variant?: 'text' | 'heading' | 'muted';
}

export interface SidebarSeparator {
  type: 'separator';
  id: string;
}

export interface SidebarSection {
  type: 'section';
  id: string;
  title: string;
  defaultCollapsed?: boolean;
  children: SidebarElement[];
  visibleWhen?: VisibleWhenCondition;
}

export interface SidebarLink {
  type: 'link';
  id: string;
  label: string;
  url: string;
  external?: boolean;
}

export interface SidebarBadge {
  type: 'badge';
  id: string;
  label: string;
  count?: number;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

export interface SidebarHtml {
  type: 'html';
  id: string;
  src: string;
  height?: number;
}

// --- Common Types ---

export interface VisibleWhenCondition {
  elementId: string;
  value: any;
}

export interface ContentOverrideDeclaration {
  extensions: string[];
  label?: string;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
}

// --- Event Types ---

export interface FileOpenedEvent {
  filePath: string;
  fileName: string;
  content: string;
}

export interface FileChangedEvent {
  filePath: string;
  fileName: string;
  content: string;
}

export interface UIEvent {
  elementId: string;
  eventType: string;
  payload: any;
}

// --- Plugin Manifest ---

export interface RuntimePluginManifest {
  name: string;
  displayName?: string;
  version: string;
  description?: string;
  main: string;
  activationEvents?: string[];
}

// --- Icon Names ---
export type IconName =
  | 'Activity' | 'AlertCircle' | 'ArrowRight' | 'Beaker' | 'Braces'
  | 'Check' | 'CheckCircle' | 'ChevronDown' | 'ChevronRight' | 'Clock'
  | 'Code' | 'Copy' | 'Database' | 'Download' | 'Edit' | 'Eye'
  | 'File' | 'FileText' | 'Filter' | 'Folder' | 'FolderOpen'
  | 'Globe' | 'Hash' | 'Heart' | 'Home' | 'Info' | 'Key'
  | 'Link' | 'List' | 'Lock' | 'Mail' | 'Map' | 'MessageSquare'
  | 'Minus' | 'Moon' | 'MoreHorizontal' | 'Package' | 'Pause'
  | 'Play' | 'Plus' | 'Power' | 'RefreshCw' | 'Save' | 'Search'
  | 'Send' | 'Server' | 'Settings' | 'Share' | 'Shield' | 'Slash'
  | 'Star' | 'Sun' | 'Terminal' | 'Trash2' | 'TrendingUp' | 'Type'
  | 'Unlock' | 'Upload' | 'User' | 'Users' | 'Wrench' | 'X' | 'Zap';

// --- Color Options ---
export type ElementColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type ButtonVariant = 'default' | 'primary' | 'danger' | 'ghost';
export type LabelVariant = 'text' | 'heading' | 'muted';
