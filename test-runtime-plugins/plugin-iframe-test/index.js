/**
 * Iframe Bridge Test Plugin
 *
 * Tests bidirectional postMessage between a sidebar iframe and the plugin.
 * Demonstrates: file context, command execution, state push to iframe.
 *
 * Flow:
 *   1. Iframe sends { type: 'chat', text } via window.parent.postMessage()
 *   2. HtmlElement forwards to plugin as ui-event (eventType='iframe-message')
 *   3. Plugin processes, updates sidebar state via updateElementState()
 *   4. HtmlElement pushes { type: 'state-update', state } to iframe
 *   5. Iframe renders the response
 */

const path = require('path');
const { execSync } = require('child_process');

/** @type {import('@mdview/plugin-api/runtime').RuntimePluginContext} */
module.exports = {
  _count: 0,

  activate(context) {
    console.log('[iframe-test] Activated');

    const pluginDir = __dirname;
    const file = () => context.currentFile;

    // ─── Register Panel ─────────────────────────────────────
    context.registerSidebarPanel({
      id: 'iframe-test',
      title: 'Iframe Test',
      icon: 'MessageSquare',
      children: [
        // File context header
        { type: 'status', id: 'file-status', label: 'Active File', value: 'No file open', color: 'default' },
        { type: 'separator', id: 'sep0' },

        // The iframe
        {
          type: 'html',
          id: 'test-iframe',
          src: `file://${path.join(pluginDir, 'panel.html').replace(/\\/g, '/')}`,
          height: 260,
        },
        { type: 'separator', id: 'sep1' },

        // Sidebar status elements updated by iframe messages
        { type: 'status', id: 'last-message', label: 'Last Command', value: 'Waiting...', color: 'default' },
        { type: 'status', id: 'message-count', label: 'Messages', value: '0', color: 'info' },
      ],
    });

    // ─── File Context Tracking ──────────────────────────────
    const updateFileUI = () => {
      const f = file();
      context.updateElementState({
        'file-status': { value: f ? f.fileName : 'No file open', color: f ? 'success' : 'default' },
      });
    };
    updateFileUI();
    context.onEvent('fileOpened', updateFileUI);
    context.onEvent('fileChanged', updateFileUI);

    // ─── Handle Iframe Messages ─────────────────────────────
    context.onEvent('ui-event', ({ elementId, eventType, payload }) => {
      if (eventType !== 'iframe-message' || elementId !== 'test-iframe') return;

      this._count++;
      const msg = payload?.text || payload?.message || '';
      console.log(`[iframe-test] #${this._count}:`, msg);

      let response = '';

      // Process commands from the iframe
      if (msg.startsWith('fileinfo')) {
        const f = file();
        response = f
          ? `File: ${f.fileName}\nPath: ${f.filePath}\nDir: ${f.dirPath}\nSize: ${f.content?.length || 0} chars`
          : 'No file open';
      } else if (msg.startsWith('head ')) {
        const f = file();
        const n = parseInt(msg.slice(5)) || 10;
        response = f
          ? f.content.split('\n').slice(0, n).join('\n')
          : 'No file open';
      } else if (msg.startsWith('wc')) {
        const f = file();
        if (f) {
          const lines = f.content.split('\n').length;
          const words = f.content.split(/\s+/).filter(Boolean).length;
          const chars = f.content.length;
          response = `${lines} lines, ${words} words, ${chars} chars`;
        } else {
          response = 'No file open';
        }
      } else if (msg.startsWith('ls ')) {
        const dir = msg.slice(3).trim() || (file()?.dirPath) || '.';
        try {
          const isWin = process.platform === 'win32';
          const cmd = isWin ? `cmd /c dir /b "${dir}"` : `ls "${dir}"`;
          response = execSync(cmd, { encoding: 'utf-8', timeout: 5000 }).trim();
        } catch (e) {
          response = `Error: ${e.message.split('\n')[0]}`;
        }
      } else if (msg.startsWith('date')) {
        response = new Date().toString();
      } else {
        response = `Echo: ${msg}\n\nCommands: fileinfo, head [n], wc, ls [dir], date`;
      }

      // Update sidebar + push state to iframe
      context.updateElementState({
        'last-message': { value: msg.substring(0, 80), color: 'success' },
        'message-count': { value: String(this._count), color: 'info' },
        'test-iframe': {
          echo: response,
          count: this._count,
          timestamp: new Date().toLocaleTimeString(),
          fileName: file()?.fileName || '-',
        },
      });
    });

    console.log('[iframe-test] Ready');
  },
};
