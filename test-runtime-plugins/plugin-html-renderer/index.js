/**
 * HTML Renderer Plugin - Renders HTML files in an iframe with toggle for source/preview view
 *
 * This plugin registers:
 * 1. A content override for HTML/HTM files that renders them in an iframe
 * 2. A sidebar panel with a toggle to switch between rendered and source views
 */

module.exports = {
  _state: null,

  activate(context) {
    console.log('[plugin-html-renderer] Activated');

    // Per-plugin state
    const state = {
      rendered: true,
    };
    this._state = state;

    // 1. Register content override for HTML files
    context.registerContentOverride({
      extensions: ['html', 'htm'],
      label: 'HTML Preview',
    });
    console.log('[plugin-html-renderer] Registered content override for html/htm');

    // 2. Register sidebar panel with toggle
    context.registerSidebarPanel({
      id: 'html-renderer',
      title: 'HTML Renderer',
      icon: 'Eye',
      children: [
        { type: 'status', id: 'mode-status', label: 'Current Mode', value: 'Rendered', color: 'success' },
        { type: 'toggle', id: 'render-toggle', label: 'Rendered View', checked: true },
        { type: 'separator', id: 'sep1' },
        { type: 'label', id: 'info', text: 'Toggle to switch between rendered HTML and source code', variant: 'muted' },
      ],
    });
    console.log('[plugin-html-renderer] Registered sidebar panel');

    // 3. Handle toggle clicks
    context.onEvent('ui-event', ({ elementId, eventType, payload }) => {
      if (elementId === 'render-toggle') {
        const rendered = payload.checked;
        state.rendered = rendered;
        context.setRenderMode('html', rendered);
        context.updateElementState({
          'mode-status': {
            value: rendered ? 'Rendered' : 'Source',
            color: rendered ? 'success' : 'info',
          },
        });
        console.log('[plugin-html-renderer] Render mode:', rendered ? 'rendered' : 'source');
      }
    });

    // 4. Listen for file opened events
    context.onEvent('fileOpened', () => {
      const file = context.currentFile;
      if (file) {
        const ext = file.fileName.split('.').pop()?.toLowerCase();
        if (ext === 'html' || ext === 'htm') {
          console.log('[plugin-html-renderer] HTML file opened:', file.fileName);
        }
      }
    });

    console.log('[plugin-html-renderer] Registered content override + sidebar panel');
  },

  deactivate() {
    this._state = null;
    console.log('[plugin-html-renderer] Deactivated');
  }
};
