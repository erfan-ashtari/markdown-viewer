/**
 * UI Test Plugin - Tests all sidebar panel UI elements and features
 * 
 * This plugin registers a single panel with collapsible sections to test:
 * 1. All 13 element types (buttons, toggles, selects, inputs, status, progress, badges, links, sections, html)
 * 2. Context data access (currentFile)
 * 3. Event handling (ui-event callbacks)
 * 4. Dynamic updates (updateElementState, updatePanel)
 * 5. File system access (context.fs)
 * 6. Conditional visibility (visibleWhen)
 * 7. Legacy command registration (registerCommand alongside registerSidebarPanel)
 */

const path = require('path');
const { pathToFileURL } = require('url');

// Get the plugin's directory for HTML file path
const pluginDir = __dirname;

module.exports = {
  _state: null,

  activate(context) {
    console.log('[plugin-ui-tester] Activated');

    // Per-plugin state
    const state = {
      counter: 0,
      simRunning: false,
      completionCount: 0,
      simInterval: null,
      fileOpenedHandler: null,
      uiEventHandler: null,
    };
    this._state = state;

    // Helper: derive directory from currentFile
    const getCurrentDir = () => {
      const file = context.currentFile;
      return file ? path.dirname(file.filePath) : null;
    };

    // ─── Register single panel with all test sections ──────────────
    context.registerSidebarPanel({
      id: 'ui-tester',
      title: 'UI Test Plugin',
      icon: 'Beaker',
      children: [
        // ── Section 1: Element Gallery ──
        { type: 'section', id: 'sec-gallery', title: 'Element Gallery', children: [
          { type: 'label', id: 'gallery-heading', text: 'All 13 Element Types', variant: 'heading' },
          { type: 'separator', id: 'gallery-sep-buttons' },
          { type: 'label', id: 'gallery-btn-label', text: 'Buttons', variant: 'muted' },
          { type: 'button', id: 'btn-default', label: 'Default', variant: 'default' },
          { type: 'button', id: 'btn-primary', label: 'Primary', icon: 'Play', variant: 'primary' },
          { type: 'button', id: 'btn-danger', label: 'Danger', icon: 'Trash2', variant: 'danger' },
          { type: 'button', id: 'btn-ghost', label: 'Ghost', variant: 'ghost' },
          { type: 'separator', id: 'gallery-sep-toggle' },
          { type: 'label', id: 'gallery-toggle-label', text: 'Toggle', variant: 'muted' },
          { type: 'toggle', id: 'toggle1', label: 'Toggle Switch', checked: false },
          { type: 'separator', id: 'gallery-sep-select' },
          { type: 'label', id: 'gallery-select-label', text: 'Select', variant: 'muted' },
          { type: 'select', id: 'select1', label: 'Choose Option', value: 'opt1', options: [
            { label: 'Option 1', value: 'opt1' },
            { label: 'Option 2', value: 'opt2' },
            { label: 'Option 3', value: 'opt3' },
          ]},
          { type: 'separator', id: 'gallery-sep-input' },
          { type: 'label', id: 'gallery-input-label', text: 'Text Inputs', variant: 'muted' },
          { type: 'text-input', id: 'textinput1', label: 'Text Input', placeholder: 'Type here...', value: '' },
          { type: 'text-area', id: 'textarea1', placeholder: 'Multi-line text...', value: '', rows: 3 },
          { type: 'separator', id: 'gallery-sep-status' },
          { type: 'label', id: 'gallery-status-label', text: 'Status Displays', variant: 'muted' },
          { type: 'status', id: 'status-default', label: 'Default', value: 'Normal status' },
          { type: 'status', id: 'status-info', label: 'Info', value: 'Information', color: 'info' },
          { type: 'status', id: 'status-success', label: 'Success', value: 'Completed', color: 'success' },
          { type: 'status', id: 'status-warning', label: 'Warning', value: 'Caution', color: 'warning' },
          { type: 'status', id: 'status-error', label: 'Error', value: 'Failed', color: 'error' },
          { type: 'separator', id: 'gallery-sep-progress' },
          { type: 'label', id: 'gallery-progress-label', text: 'Progress', variant: 'muted' },
          { type: 'progress', id: 'progress1', label: 'Progress Bar', value: 65 },
          { type: 'separator', id: 'gallery-sep-badge' },
          { type: 'label', id: 'gallery-badge-label', text: 'Badges', variant: 'muted' },
          { type: 'badge', id: 'badge-default', label: 'Default', color: 'default' },
          { type: 'badge', id: 'badge-primary', label: 'Primary', color: 'primary' },
          { type: 'badge', id: 'badge-success', label: 'Success', color: 'success' },
          { type: 'badge', id: 'badge-count', label: 'Count', count: 42, color: 'warning' },
          { type: 'separator', id: 'gallery-sep-link' },
          { type: 'label', id: 'gallery-link-label', text: 'Link', variant: 'muted' },
          { type: 'link', id: 'link1', label: 'Visit GitHub', url: 'https://github.com' },
          { type: 'separator', id: 'gallery-sep-nested' },
          { type: 'label', id: 'gallery-nested-label', text: 'Nested Section', variant: 'muted' },
          { type: 'section', id: 'nested-section', title: 'Click to Expand', children: [
            { type: 'status', id: 'nested-status', value: 'Content inside nested section' },
            { type: 'button', id: 'nested-btn', label: 'Nested Button' },
          ]},
          { type: 'separator', id: 'gallery-sep-html' },
          { type: 'label', id: 'gallery-html-label', text: 'HTML Iframe', variant: 'muted' },
          { type: 'html', id: 'html1', src: pathToFileURL(path.join(pluginDir, 'test.html')).href, height: 150 },
        ]},

        // ── Section 2: Context Inspector ──
        { type: 'section', id: 'sec-context', title: 'Context Inspector', children: [
          { type: 'label', id: 'ctx-heading', text: 'Current File Info', variant: 'heading' },
          { type: 'status', id: 'ctx-filename', label: 'File Name', value: 'No file open' },
          { type: 'status', id: 'ctx-filepath', label: 'File Path', value: '-' },
          { type: 'status', id: 'ctx-wordcount', label: 'Word Count', value: '0', color: 'info' },
          { type: 'status', id: 'ctx-linecount', label: 'Line Count', value: '0', color: 'info' },
          { type: 'status', id: 'ctx-charcount', label: 'Char Count', value: '0', color: 'info' },
          { type: 'status', id: 'ctx-directory', label: 'Directory', value: '-' },
          { type: 'button', id: 'ctx-refresh', label: 'Refresh Stats', icon: 'RefreshCw' },
        ]},

        // ── Section 3: Event Handler ──
        { type: 'section', id: 'sec-events', title: 'Event Handler', children: [
          { type: 'label', id: 'evt-heading', text: 'Event Testing', variant: 'heading' },
          { type: 'button', id: 'evt-counter-btn', label: 'Click Counter', icon: 'Plus' },
          { type: 'status', id: 'evt-counter', label: 'Counter', value: '0', color: 'info' },
          { type: 'toggle', id: 'evt-toggle', label: 'Toggle (logs changes)' },
          { type: 'select', id: 'evt-select', label: 'Select (logs changes)', value: 'a', options: [
            { label: 'Alpha', value: 'a' },
            { label: 'Beta', value: 'b' },
            { label: 'Gamma', value: 'c' },
          ]},
          { type: 'text-input', id: 'evt-text', label: 'Text Input (submit on Enter)', placeholder: 'Type and press Enter...' },
          { type: 'status', id: 'evt-last-event', label: 'Last Event', value: 'None' },
        ]},

        // ── Section 4: Dynamic Updates ──
        { type: 'section', id: 'sec-dynamic', title: 'Dynamic Updates', children: [
          { type: 'label', id: 'dyn-heading', text: 'Async Simulation', variant: 'heading' },
          { type: 'button', id: 'dyn-start', label: 'Start Simulation', icon: 'Play', variant: 'primary' },
          { type: 'progress', id: 'dyn-progress', label: 'Progress', value: 0 },
          { type: 'status', id: 'dyn-status', label: 'Status', value: 'Idle' },
          { type: 'badge', id: 'dyn-badge', label: 'Completed', count: 0, color: 'default' },
          { type: 'button', id: 'dyn-replace', label: 'Replace Panel', icon: 'RefreshCw', variant: 'danger' },
        ]},

        // ── Section 5: File System ──
        { type: 'section', id: 'sec-fs', title: 'File System', children: [
          { type: 'label', id: 'fs-heading', text: 'Restricted FS Access', variant: 'heading' },
          { type: 'button', id: 'fs-read', label: 'Read Current File', icon: 'FileText' },
          { type: 'button', id: 'fs-write', label: 'Write Test File', icon: 'FilePlus' },
          { type: 'button', id: 'fs-list', label: 'List Directory', icon: 'FolderOpen' },
          { type: 'status', id: 'fs-result', label: 'Result', value: 'No operation yet' },
        ]},

        // ── Section 6: Conditional Visibility ──
        { type: 'section', id: 'sec-conditional', title: 'Conditional Visibility', children: [
          { type: 'label', id: 'vis-heading', text: 'Conditional Elements', variant: 'heading' },
          { type: 'toggle', id: 'vis-show-advanced', label: 'Show Advanced Options', checked: false },
          { type: 'status', id: 'vis-basic', label: 'Mode', value: 'Basic' },
          { type: 'section', id: 'vis-advanced', title: 'Advanced Options', visibleWhen: { elementId: 'vis-show-advanced', value: true }, children: [
            { type: 'select', id: 'vis-mode', label: 'Mode', value: 'standard', options: [
              { label: 'Standard', value: 'standard' },
              { label: 'Performance', value: 'performance' },
              { label: 'Debug', value: 'debug' },
            ]},
            { type: 'toggle', id: 'vis-verbose', label: 'Verbose Logging' },
            { type: 'button', id: 'vis-apply', label: 'Apply Settings', icon: 'Check' },
          ]},
        ]},

        // ── Section 7: Legacy Commands ──
        { type: 'section', id: 'sec-legacy', title: 'Legacy Commands', children: [
          { type: 'label', id: 'leg-heading', text: 'Legacy + Panel Coexistence', variant: 'heading' },
          { type: 'status', id: 'leg-info', value: 'This panel coexists with registered commands', color: 'info' },
          { type: 'button', id: 'leg-trigger-cmd', label: 'Trigger Legacy Command', icon: 'Terminal' },
        ]},
      ]
    });

    // ─── Register legacy commands ───────────────────────────────────
    context.registerCommand('test-export', () => {
      console.log('[plugin-ui-tester] Legacy command executed!');
      context.updateElementState({ 'leg-info': { value: 'Command executed at ' + new Date().toLocaleTimeString() } });
    }, 'Test legacy command');

    context.registerCommand('test-stats', () => {
      const file = context.currentFile;
      if (file) {
        const words = file.content.split(/\s+/).filter(Boolean).length;
        console.log(`[plugin-ui-tester] Stats: ${words} words, ${file.content.split('\n').length} lines`);
      }
    }, 'Show file stats in console');

    // ─── Event Handlers ─────────────────────────────────────────────

    // File opened handler
    state.fileOpenedHandler = () => {
      const file = context.currentFile;
      if (file) {
        const words = file.content.split(/\s+/).filter(Boolean).length;
        const lines = file.content.split('\n').length;
        context.updateElementState({
          'ctx-filename': { value: file.fileName },
          'ctx-filepath': { value: file.filePath },
          'ctx-wordcount': { value: String(words) },
          'ctx-linecount': { value: String(lines) },
          'ctx-charcount': { value: String(file.content.length) },
          'ctx-directory': { value: path.dirname(file.filePath) },
        });
      }
    };
    context.onEvent('fileOpened', state.fileOpenedHandler);

    // UI event handler
    state.uiEventHandler = ({ elementId, eventType, payload }) => {
      // Element Gallery - log button clicks
      if (elementId.startsWith('btn-')) {
        console.log(`[plugin-ui-tester] Button clicked: ${elementId}`);
      }

      // Context Inspector
      if (elementId === 'ctx-refresh') {
        state.fileOpenedHandler();
      }

      // Event Handler
      if (elementId === 'evt-counter-btn') {
        state.counter++;
        context.updateElementState({
          'evt-counter': { value: String(state.counter) },
          'evt-last-event': { value: `button click #${state.counter}` },
        });
      } else if (eventType === 'change' && elementId.startsWith('evt-')) {
        context.updateElementState({
          'evt-last-event': { value: `${elementId} changed: ${JSON.stringify(payload)}` },
        });
      } else if (eventType === 'submit' && elementId === 'evt-text') {
        context.updateElementState({
          'evt-last-event': { value: `text submitted: "${payload.value}"` },
        });
      }

      // Dynamic Updates
      if (elementId === 'dyn-start' && !state.simRunning) {
        state.simRunning = true;
        let progress = 0;
        state.simInterval = setInterval(() => {
          progress += 5;
          context.updateElementState({
            'dyn-progress': { value: progress },
            'dyn-status': { value: progress < 100 ? 'Running...' : 'Complete!' },
          });
          if (progress >= 100) {
            clearInterval(state.simInterval);
            state.simInterval = null;
            state.simRunning = false;
            state.completionCount++;
            context.updateElementState({
              'dyn-badge': { count: state.completionCount, color: 'success' },
            });
          }
        }, 200);
      } else if (elementId === 'dyn-replace') {
        context.updatePanel({
          id: 'ui-tester',
          title: 'Panel Replaced!',
          icon: 'CheckCircle',
          children: [
            { type: 'label', id: 'replaced', text: 'This panel was replaced dynamically', variant: 'heading' },
            { type: 'status', id: 'replaced-status', value: 'Success!', color: 'success' },
            { type: 'button', id: 'replaced-btn', label: 'Click Me', variant: 'primary' },
          ],
        });
      }

      // File System
      if (elementId === 'fs-read') {
        const file = context.currentFile;
        if (file) {
          try {
            const content = context.fs.readFile(file.filePath);
            context.updateElementState({
              'fs-result': { value: content.substring(0, 150) + (content.length > 150 ? '...' : '') },
            });
          } catch (err) {
            context.updateElementState({ 'fs-result': { value: `Error: ${err.message}` } });
          }
        } else {
          context.updateElementState({ 'fs-result': { value: 'No file open' } });
        }
      } else if (elementId === 'fs-write') {
        try {
          const dir = getCurrentDir();
          if (dir) {
            const filePath = path.join(dir, 'plugin-test-output.txt');
            context.fs.writeFile(filePath, 'Hello from plugin-ui-tester!\n' + new Date().toISOString());
            context.updateElementState({ 'fs-result': { value: `Wrote ${filePath}` } });
          } else {
            context.updateElementState({ 'fs-result': { value: 'No directory available' } });
          }
        } catch (err) {
          context.updateElementState({ 'fs-result': { value: `Error: ${err.message}` } });
        }
      } else if (elementId === 'fs-list') {
        try {
          const dir = getCurrentDir() || '.';
          const files = context.fs.readDir(dir);
          context.updateElementState({
            'fs-result': { value: files.slice(0, 8).join(', ') + (files.length > 8 ? '...' : '') },
          });
        } catch (err) {
          context.updateElementState({ 'fs-result': { value: `Error: ${err.message}` } });
        }
      }

      // Conditional Visibility
      if (elementId === 'vis-show-advanced') {
        context.updateElementState({
          'vis-show-advanced': { checked: payload.checked },
          'vis-basic': { value: payload.checked ? 'Advanced' : 'Basic' },
        });
      }

      // Legacy Commands
      if (elementId === 'leg-trigger-cmd') {
        context.updateElementState({
          'leg-info': { value: 'Button clicked at ' + new Date().toLocaleTimeString() },
        });
      }
    };
    context.onEvent('ui-event', state.uiEventHandler);

    console.log('[plugin-ui-tester] Registered sidebar panel and 2 legacy commands');
  },

  deactivate() {
    // Clean up intervals
    if (this._state && this._state.simInterval) {
      clearInterval(this._state.simInterval);
    }
    this._state = null;
    console.log('[plugin-ui-tester] Deactivated');
  }
};
