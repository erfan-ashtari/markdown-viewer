# Plugin System — Audit Report

**Date:** 2026-07-19 (original audit) / 2026-07-20 (resolution + re-audit)
**Scope:** Full review of plugin architecture, self-containment, API cleanliness
**Verdict:** Resolved — All issues fixed

---

## Executive Summary

The plugin system has been audited twice — once on 2026-07-19 and again on 2026-07-20 with a thorough code review. All issues have been resolved:

- Dead APIs removed (`EditorConfig`, `registerEditor`, `getEditor`, `canHandle`)
- `registerShortcut` wired up in `App.tsx` keyboard handler
- `get-plugins` IPC reads dynamically from `packages/plugins.json`
- Plugins can register file dialog filters via `registerFileFilter`
- Keyboard shortcut conflicts between core and plugins resolved
- Third-party plugins load dynamically at startup
- Build config auto-generated from plugin manifest
- All 3 built-in plugins are fully self-contained

---

## Issues Found & Resolved

### Issue 1: `registerShortcut` was dead API [CRITICAL] — FIXED

**Problem:** `PluginManager.registerShortcut()` stored handlers but `getShortcut()` was never called by core. Plugin shortcuts silently did nothing.

**Fix:** Added shortcut dispatch at the top of `handleKeyDown` in `App.tsx`. It constructs a shortcut key string from the event and checks `pluginManager.getShortcut()` before hardcoded shortcuts. Plugin shortcuts take priority.

### Issue 2: `get-plugins` IPC was hardcoded [CRITICAL] — FIXED

**Problem:** `main.js` had a hardcoded array of 3 plugins. Every new plugin required editing core.

**Fix:** `main.js` now reads from `packages/plugins.json` at runtime. `pluginLoader.ts` also reads from the same manifest. One source of truth.

### Issue 3: File dialogs were markdown-only [IMPORTANT] — FIXED

**Problem:** Open-file dialog only showed `.md/.markdown`.

**Fix:** Added `registerFileFilter` API. Plugins register filters during registration. `App.tsx` sends them to main via IPC. The open-file dialog uses the registered filters.

### Issue 4: Dead APIs in plugin-api [CRITICAL] — FIXED

**Problem:** Three dead API surfaces existed:
- `EditorConfig` type + `registerEditor()` + `getEditor()` — never used by any plugin (editor uses `registerContentOverride`)
- `FileTypeConfig.canHandle` — never called by `getFileType()`
- `editors` array in PluginManager — stored data nothing read

**Fix:** Removed all dead code:
- Deleted `EditorConfig` interface from types.ts
- Removed `registerEditor` from `PluginAPI` interface
- Removed `registerEditor()`, `getEditor()`, and `editors` array from PluginManager
- Removed `canHandle` from `FileTypeConfig`
- Updated exports in index.ts

### Issue 5: Keyboard shortcut conflicts [IMPORTANT] — FIXED

**Problem:** PDF and image plugins registered Ctrl+/- and Ctrl+0 handlers at the window level, conflicting with core's zoom handlers. Both fired simultaneously — the plugin zoomed its content, core updated its zoom state unnecessarily.

**Fix:** Core's zoom handlers now check `pluginManager.isContentOverrideActive()` and skip when a plugin is active. This prevents core from interfering with plugin zoom while still working for markdown files.

### Issue 6: Plugin-specific comments in core [MINOR] — FIXED

Replaced plugin-specific comments with generic text.

### Issue 7: Guide accuracy [MINOR] — FIXED

Rewrote the guide with accurate self-contained claim and complete API documentation.

### Issue 8: Editor plugin stale code [MINOR] — FIXED

Removed stale blank line where shortcut registration was deleted. Updated stale comment referencing a non-existent core function.

---

## Architecture

### Plugin Manifest (`packages/plugins.json`)

Single source of truth for all plugin metadata. Both build config and runtime loading read from here.

### Config Generator (`packages/core/scripts/generate-plugin-config.js`)

Reads `plugins.json` and generates Vite alias paths + TypeScript paths. Run after adding a plugin.

### Dynamic Plugin Loading (`packages/core/src/pluginLoader.ts`)

- Built-in plugins: static imports (fast, reliable)
- Third-party plugins: dynamic `import()` at startup
- `loadPlugins()` is async to support dynamic imports

### Complete Plugin API (6 methods)

| API | Purpose | Used by |
|-----|---------|---------|
| `registerFileType` | Render any file extension | PDF, Image plugins |
| `registerSlot` | Inject UI into named layout slots | Editor plugin |
| `registerContentOverride` | Replace the entire content area | Editor plugin |
| `registerShortcut` | Register keyboard shortcuts | Any plugin |
| `registerToolbarItem` | Add toolbar buttons | Any plugin |
| `registerFileFilter` | Register file dialog filters | Any plugin |

### What's NOT in the API (removed as dead)

| Removed | Why |
|---------|-----|
| `registerEditor` / `getEditor` / `EditorConfig` | Never used — editor uses `registerContentOverride` |
| `FileTypeConfig.canHandle` | Never called by `getFileType()` |

---

## What's Working Well

1. **`registerFileType`** — Clean separation. Core calls `getFileType()` generically.
2. **`registerSlot`** — The `<Slot>` component renders any registered component with context props.
3. **`registerContentOverride`** — Core checks `getActiveContentOverride()` and renders generically.
4. **`registerToolbarItem`** — Header renders the array generically.
5. **`registerShortcut`** — Now wired up, plugin shortcuts take priority over core shortcuts.
6. **`registerFileFilter`** — Plugins can register file dialog filters dynamically.
7. **Slot context API** — Core passes actions through context. Plugins never import core.
8. **Plugin components** — All three plugins are fully self-contained. No cross-package imports.
9. **`local-file://` protocol** — Generic infrastructure any plugin can use.
10. **`writeFile` / `readFileBinary` IPC** — Generic file I/O available to all plugins.

---

## File-by-file audit (post-resolution)

### Core files

| File | Plugin-specific code? | Notes |
|---|---|---|
| `App.tsx` | No | Generic override/file-type/shortcut dispatch + zoom skip when plugin active |
| `Header.tsx` | No | Slot context is generic API functions |
| `Slot.tsx` | No | Generic slot renderer |
| `pluginLoader.ts` | Reads `plugins.json` | Single source of truth for metadata |
| `main.js` | No | Dynamic `get-plugins`, `set-file-filters` IPC |
| `preload.js` | No | Generic IPC bridges |

### Plugin files

| File | Imports from core? | Self-contained? |
|---|---|---|
| `plugin-pdf/src/index.tsx` | No | Yes — only imports React + `@mdview/plugin-api` |
| `plugin-images/src/index.tsx` | No | Yes — only imports React + `@mdview/plugin-api` |
| `plugin-editor/src/index.tsx` | No | Yes — only imports React + `@mdview/plugin-api` + internal `./Editor` |
| `plugin-editor/src/Editor.tsx` | No | Yes — only imports React + internal `./index` |
| `plugin-api/src/types.ts` | No | Yes — generic types only |
| `plugin-api/src/PluginManager.ts` | No | Yes — generic registry only |

### API files

| File | Plugin-specific code? | Notes |
|---|---|---|
| `types.ts` | No | All types are generic (`FileTypeConfig`, `SlotConfig`, etc.) |
| `PluginManager.ts` | No | All methods are generic registries |
| `index.ts` | No | Clean exports |
