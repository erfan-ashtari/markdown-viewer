# Pre-Publish Review Report

> **Reviewer:** MiMo Code Agent (16-agent parallel review)
> **Date:** 2026-07-24
> **Commits:** `b928cda` + `f16f93e` (branch: `runtime-plugin-discovery`)
> **Scope:** 18 files changed, +659/-2211 lines

---

## Executive Summary

Two commits were reviewed across security, performance, architecture, code quality, UI/UX, accessibility, test coverage, documentation, dependencies, infrastructure, i18n, legal, API design, and release readiness.

**Status: NOT READY TO PUBLISH**

Three critical issues and several high-severity items must be resolved before merging. The documentation set has 9 issues requiring updates to reflect deleted plugins, new iframe capabilities, and the resizable plugin sidebar.

| Severity | Count | Blocker? |
|----------|-------|----------|
| Critical | 3 | Yes |
| High | 10 | Yes |
| Medium | 12 | Recommended |
| Low | 13 | Optional |

---

## 1. Critical Issues

### C1. Command Injection in Test Plugin

**File:** `test-plugins/plugin-iframe-test/index.js:96-104`

User input from iframe `postMessage` events is directly interpolated into shell commands via `execSync` without sanitization. A malicious iframe could execute arbitrary OS commands.

```js
// VULNERABLE — direct interpolation
execSync(`ls "${path}"`)
```

**Fix:** Replace `execSync` with `fs.readdirSync()` for directory listing, or use a strict character allowlist and escape shell metacharacters. Never construct shell commands from untrusted input.

---

### C2. Resize Handle Missing Accessibility Attributes

**File:** `RuntimePluginSidebar.tsx:417-428`

The resize handle has no ARIA attributes, no `role="separator"`, no `aria-label`, no `tabIndex`, and no keyboard event handlers. This makes it invisible to screen readers and unusable via keyboard.

**Fix:** Add:
- `role="separator"` and `aria-orientation="vertical"`
- `aria-label="Resize plugin sidebar"`
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `tabIndex={0}` with `onKeyDown` for ArrowLeft/ArrowRight/Home/End

---

### C3. Zero Test Coverage

**All changed files have no tests.** The project has no test infrastructure (no Vitest, no Jest, no `.test.*` files). The 893-line `runtimePluginManager.js` contains security-critical path validation, sandbox enforcement, and state persistence — all untested.

**Fix:** Add Vitest + React Testing Library. Priority test targets:
1. `runtimePluginManager.js` — path validation, panel element validation, state persistence
2. `HtmlElement.tsx` — sandbox allowlist filtering, `file://` to `local-file://` conversion, postMessage origin validation
3. `appStore.ts` — width clamping, tab management, plugin state persistence

---

## 2. High-Severity Issues

### H1. postMessage Wildcard Origin

**File:** `HtmlElement.tsx:39-41`

`postMessage(data, '*')` sends state to any origin. A malicious third-party iframe could intercept state updates.

**Fix:** Use a specific origin or `event.source.postMessage()` to target only the intended iframe.

---

### H2. Path Traversal Risk in HTML Validation

**File:** `runtimePluginManager.js:762-806`

The regex-based Windows path handling for HTML element `src` validation could be bypassed with UNC paths or URL encodings.

**Fix:** Use `path.resolve()` consistently and validate against a strict allowlist.

---

### H3. Synchronous fs.readFileSync on Main Thread

**File:** `runtimePluginManager.js:98-100`

`getPluginState()` calls `this.loadState()` which does `fs.readFileSync` on every call, blocking the Electron main process.

**Fix:** Use `this._stateCache` (already populated in `init()`).

---

### H4. God Object Anti-Pattern

**File:** `runtimePluginManager.js:5-22`

`RuntimePluginManager` handles 10+ responsibilities: discovery, loading, state, FS, events, panels, overrides, render modes, commands, broadcasting, file watching.

**Fix:** Split into focused modules: `PluginDiscovery`, `PluginLoader`, `PluginStateManager`, `EventBus`, `SidebarPanelManager`, `RestrictedFsWrapper`.

---

### H5. Console Monkey-Patching

**File:** `runtimePluginManager.js:659-698`

During command execution, `console.log/warn/error` are replaced globally, affecting all concurrent output. Fragile if the handler throws before restore.

**Fix:** Use a scoped logger or context object instead of mutating globals.

---

### H6. Debug Logs in Production

**File:** `RuntimePluginSidebar.tsx:248-250, 397` and `runtimePluginManager.js` (20+ occurrences)

Debug `console.log` statements left in production code, executing on every data fetch and render.

**Fix:** Remove or gate behind `process.env.NODE_ENV === 'development'`.

---

### H7. Resize Handler Duplication

**Files:** `Sidebar.tsx:511-532` and `RuntimePluginSidebar.tsx:372-393`

The resize handlers are nearly identical — only the delta sign differs (left sidebar vs right sidebar).

**Fix:** Extract a shared `useResizable({ width, setWidth, direction })` hook.

---

### H8. Duplicate removeTab/closeTab

**File:** `appStore.ts:114-143`

`removeTab` and `closeTab` are near-identical — both filter tabs and pick the next active tab.

**Fix:** Keep one and alias the other.

---

### H9. postMessage Wildcard in Test Plugin

**File:** `test-plugins/plugin-iframe-test/panel.html:83`

The test plugin's `postMessage` also uses wildcard origin `'*'`.

**Fix:** Use `'null'` (for sandboxed iframes) or the expected parent origin.

---

### H10. Missing Origin Validation in Test Plugin

**File:** `test-plugins/plugin-iframe-test/panel.html:91-98`

The message event listener doesn't verify `event.origin`, allowing potential message injection.

**Fix:** Add origin validation to only accept messages from trusted origins.

---

## 3. Medium-Severity Issues

| # | File | Issue |
|---|------|-------|
| M1 | `HtmlElement.tsx:35-45` | `useEffect` depends on full `state` object — re-runs on unrelated changes |
| M2 | `HtmlElement.tsx:7` | Props typed as `any` — no type safety |
| M3 | `RuntimePluginSidebar.tsx:57-59` | `useCallback` deps missing `onUIInteraction` — stale closure |
| M4 | `runtimePluginManager.js:328` | `updateElementState` mutates state in place with `Object.assign` |
| M5 | `runtimePluginManager.js:441` | `loadPlugin` re-scans entire directory on each call |
| M6 | `runtimePluginManager.js:871-887` | File watcher has no cleanup/dispose method |
| M7 | `appStore.ts:163-164` | Width clamping constants hardcoded — duplicated knowledge |
| M8 | `appStore.ts:101` | `substr` is deprecated — use `substring` |
| M9 | `appStore.ts:210-237` | `navigateToAdjacentFile` does async I/O inside store action |
| M10 | `RuntimePluginSidebar.tsx:395-399` | `getPanelForPlugin` linear search O(N^2) per render |
| M11 | `appStore.ts:176-178` | `setTheme`/`setCurrentFont` mutate DOM inside store action |
| M12 | `RuntimePluginSidebar.tsx:80-85` | Inline `mouseenter`/`mouseleave` style manipulation (6 occurrences) |

---

## 4. Low-Severity Issues

| # | File | Issue |
|---|------|-------|
| L1 | `HtmlElement.tsx:48-51` | Sandbox string recomputed on every render — wrap in `useMemo` |
| L2 | `RuntimePluginSidebar.tsx:101` | `(plugin as any).displayName` — unsafe type cast |
| L3 | `HtmlElement.tsx:72` | iframe title uses raw `element.id` instead of human-readable label |
| L4 | `RuntimePluginSidebar.tsx:219` | Complex nested IIFE for JSON.stringify with try/catch |
| L5 | `appStore.ts:114-143` | `removeTab`/`closeTab` DRY violation |
| L6 | `runtimePluginManager.js:530` | Empty `catch {}` block silently swallows errors |
| L7 | `runtimePluginManager.js:7-9` | Maps use generic names that could collide |
| L8 | All files | 100+ hardcoded English strings — no i18n system exists |
| L9 | `HtmlElement.tsx:67-73` | No fallback content inside iframe for screen readers |
| L10 | `HtmlElement.tsx:60-66` | Container div has no `role` or `aria-label` |
| L11 | `RuntimePluginSidebar.tsx:379` | No visual feedback when drag hits min/max boundary |
| L12 | `runtimePluginManager.js:153-162` | `discoverPlugins` sorts via `fs.statSync` on main thread |
| L13 | `appStore.ts:192-205` | Rapid `enablePlugin`/`disablePlugin` calls cause localStorage jank |

---

## 5. Documentation Issues

### D1. RUNTIME-PLUGIN-GUIDE.md

| Line | Severity | Issue | Fix |
|------|----------|-------|-----|
| 644-651 | High | `html` element properties table missing new `sandbox` property | Add `sandbox?: string` with allowlist docs |
| 650 | High | States `sandbox="allow-scripts"` only — `allow-popups` also allowed | Update to reflect `ALLOWED_SANDBOX` set |
| 994-1031 | High | Example 3 (HTML Renderer) doesn't demonstrate postMessage communication | Add Example 4 for postMessage + state-update |
| 1152-1153 | Medium | Troubleshooting says use `local-file://` but code now auto-converts `file://` | Update to reflect auto-conversion |

### D2. VERSION_STATE_REPORT.md

| Line | Severity | Issue | Fix |
|------|----------|-------|-----|
| 4 | Low | Tags list only goes to v1.1.0 | Add post-v1.1.0 section |
| 439-453 | Medium | State Shape missing `pluginSidebarWidth`, `rightSidebarOpen` | Add to state shape + actions table |
| 869-939 | Medium | File tree doesn't reflect deleted plugins or new `test-plugins/` | Update file tree |
| 943-975 | Medium | Version comparison table missing new features | Add rows for resizable sidebar, postMessage, plugin removal |

### D3. test-plugins/plugin-html-renderer/README.md

| Line | Severity | Issue | Fix |
|------|----------|-------|-----|
| 15-18 | Low | Installation path references old `packages/` location | Update to `{userData}/plugins/` |

---

## 6. Dependency & Infrastructure

**Status: Clean** — No dangling references to deleted plugins in build configs, workspace setup, or CI/CD.

- `packages/plugins.json` — only lists 3 active plugins (pdf, images, editor)
- `packages/core/tsconfig.json` — paths only reference active plugins
- `packages/core/vite.config.ts` — uses auto-generated aliases
- `test-plugins/` — safely isolated from production builds
- `.opencode/` — properly gitignored and npmignored

---

## 7. Recommended Fix Priority

| Priority | Items | Effort |
|----------|-------|--------|
| **P0 — Before merge** | C1 (command injection), C2 (a11y), H1 (postMessage origin) | 2-4 hours |
| **P1 — This sprint** | H3 (sync read), H5 (console monkey-patch), H6 (debug logs), H7 (deduplicate resize), H8 (deduplicate tabs) | 4-6 hours |
| **P2 — Next sprint** | C3 (test infra), H4 (god object), D1-D3 (docs), M1-M12 (medium issues) | 1-2 days |
| **P3 — Backlog** | L1-L13 (low issues) | 1 day |

---

## 8. Release Notes Draft

### Post-v1.1.0 Changes (unreleased)

**New Features:**
- Plugin sidebar is now resizable via drag handle (200-600px range)
- Iframe `html` elements support bidirectional `postMessage` communication
- Iframe `html` elements support configurable sandbox permissions (`allow-scripts`, `allow-popups`)
- Iframe `html` elements auto-sync state updates from the host app

**Breaking Changes:**
- Removed built-in plugins: `plugin-html-renderer`, `plugin-mimo-chat`, `plugin-ui-tester` (migrated to `test-plugins/`)

**Internal:**
- Refactored `RuntimePluginManager` formatting and structure
- Added `pluginSidebarWidth` to Zustand store
- Added `.opencode/` to `.gitignore` and `.npmignore`

---

*Report generated by 16-agent parallel review pipeline. All findings verified against source code.*
