/**
 * HTML Preview Plugin - Renders the active HTML file in a sidebar iframe
 *
 * Features:
 * - Automatically detects when an HTML/HTM file is opened
 * - Reads file content and renders it live in a sidebar panel iframe
 * - Shows file info (name, path, size) in the panel
 * - Handles file changes and refreshes the preview
 * - Resizable iframe height via selector
 */

const path = require('path');

module.exports = {
  _state: null,

  activate(context) {
    const heights = [200, 300, 400, 500, 600, 800];
    const state = {
      isHtml: false,
      heightIndex: 2, // default 400
    };
    this._state = state;

    // Helper to check if a file is HTML
    const isHtmlFile = (fileName) => {
      const ext = fileName.split('.').pop()?.toLowerCase();
      return ext === 'html' || ext === 'htm';
    };

    // Helper to build the panel definition with current height
    const buildPanel = () => {
      const h = heights[state.heightIndex];
      return {
        id: 'html-preview',
        title: 'HTML Preview',
        icon: 'Eye',
        children: [
          { type: 'status', id: 'preview-status', label: 'Status', value: 'No HTML file open', color: 'default' },
          { type: 'button', id: 'preview-height', label: `Height: ${h}px`, icon: 'Maximize2', variant: 'ghost' },
          { type: 'separator', id: 'sep1' },
          {
            type: 'html',
            id: 'preview-iframe',
            src: `file:///${path.join(__dirname, 'preview.html').replace(/\\/g, '/')}`,
            height: h,
          },
          { type: 'separator', id: 'sep2' },
          { type: 'button', id: 'preview-refresh', label: 'Refresh', icon: 'RefreshCw', variant: 'ghost' },
        ],
      };
    };

    // ─── Register panel ─────────────────────────────────────────
    context.registerSidebarPanel(buildPanel());

    // ─── Push HTML content to the iframe ────────────────────────
    const pushContent = () => {
      const file = context.currentFile;

      if (!file || !isHtmlFile(file.fileName)) {
        state.isHtml = false;
        context.updateElementState({
          'preview-status': { value: 'No HTML file open', color: 'default' },
          'preview-iframe': { message: 'Open an HTML file to preview' },
        });
        return;
      }

      state.isHtml = true;
      context.updateElementState({
        'preview-status': { value: file.fileName, color: 'success' },
        'preview-iframe': { html: file.content },
      });
    };

    // Listen for file events
    context.onEvent('fileOpened', pushContent);
    context.onEvent('fileChanged', pushContent);

    // ─── Handle UI events ───────────────────────────────────────
    context.onEvent('ui-event', ({ elementId }) => {
      // Refresh button
      if (elementId === 'preview-refresh' && state.isHtml) {
        const file = context.currentFile;
        if (file) {
          context.updateElementState({
            'preview-iframe': { html: file.content },
          });
        }
      }

      // Height toggle - cycle through presets
      if (elementId === 'preview-height') {
        state.heightIndex = (state.heightIndex + 1) % heights.length;
        context.updatePanel(buildPanel());
        pushContent();
      }
    });
  },

  deactivate() {
    this._state = null;
  },
};
