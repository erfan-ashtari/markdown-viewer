/**
 * All Features Test Plugin
 * 
 * Tests:
 * - P0: Persistent State (getState/setState)
 * - P0: TypeScript definitions (via JSDoc)
 * - P1: Bundled dependencies (lodash)
 * - P2: System Notifications (notify)
 * - P2: fileChanged Event
 */

const _ = require('lodash');

/** @type {import('@mdview/plugin-api/runtime').RuntimePluginContext} */
module.exports = {
  _state: null,

  activate(context) {
    console.log('[all-features] Activated');
    console.log('[all-features] Lodash version:', _.VERSION);

    // Per-plugin state
    const state = {
      clickCount: 0,
      fileChangedCount: 0,
    };
    this._state = state;

    // --- P0: Persistent State ---
    const savedCount = context.getState('clickCount', 0);
    state.clickCount = savedCount;
    console.log('[all-features] Loaded clickCount:', savedCount);

    // --- P2: fileChanged Event ---
    context.onEvent('fileChanged', ({ filePath, fileName }) => {
      state.fileChangedCount++;
      console.log('[all-features] fileChanged:', fileName, '(count:', state.fileChangedCount, ')');
      context.updateElementState({
        'file-changed-count': { value: String(state.fileChangedCount), color: 'info' },
        'last-file': { value: fileName },
      });
    });

    context.onEvent('fileOpened', ({ fileName }) => {
      console.log('[all-features] fileOpened:', fileName);
      context.updateElementState({
        'last-opened': { value: fileName },
      });
    });

    // --- Register Sidebar Panel ---
    context.registerSidebarPanel({
      id: 'all-features',
      title: 'All Features Test',
      icon: 'Beaker',
      children: [
        // Lodash Test (P1: Bundled Dependencies)
        { type: 'section', id: 'sec-lodash', title: 'Bundled Dependencies (P1)', children: [
          { type: 'status', id: 'lodash-version', label: 'Lodash Version', value: _.VERSION, color: 'success' },
          { type: 'status', id: 'lodash-test', label: 'Chunk Test', value: _.chunk([1, 2, 3, 4, 5], 2).length + ' chunks', color: 'info' },
          { type: 'label', id: 'lodash-hint', text: 'If you see version and chunks, bundling works!', variant: 'muted' },
        ]},

        // Persistent State (P0)
        { type: 'separator', id: 'sep1' },
        { type: 'section', id: 'sec-state', title: 'Persistent State (P0)', children: [
          { type: 'status', id: 'click-count', label: 'Click Count', value: String(savedCount), color: 'info' },
          { type: 'button', id: 'increment-btn', label: 'Increment', icon: 'Plus', variant: 'primary' },
          { type: 'button', id: 'reset-btn', label: 'Reset', icon: 'RotateCcw', variant: 'danger' },
          { type: 'status', id: 'state-status', label: 'Status', value: 'Click to test persistence', color: 'default' },
        ]},

        // Notifications (P2)
        { type: 'separator', id: 'sep2' },
        { type: 'section', id: 'sec-notify', title: 'Notifications (P2)', children: [
          { type: 'button', id: 'notify-btn', label: 'Send Notification', icon: 'Bell', variant: 'primary' },
          { type: 'label', id: 'notify-hint', text: 'Should show system notification', variant: 'muted' },
        ]},

        // File Events (P2)
        { type: 'separator', id: 'sep3' },
        { type: 'section', id: 'sec-file', title: 'File Events (P2)', children: [
          { type: 'status', id: 'file-changed-count', label: 'Files Saved', value: '0', color: 'info' },
          { type: 'status', id: 'last-file', label: 'Last Saved', value: '-' },
          { type: 'status', id: 'last-opened', label: 'Last Opened', value: '-' },
          { type: 'label', id: 'file-hint', text: 'Save a file to test fileChanged event', variant: 'muted' },
        ]},
      ],
    });

    // --- Handle UI Events ---
    context.onEvent('ui-event', ({ elementId, eventType, payload }) => {
      // P0: Persistent State
      if (elementId === 'increment-btn') {
        state.clickCount++;
        context.setState('clickCount', state.clickCount);
        context.updateElementState({
          'click-count': { value: String(state.clickCount), color: 'success' },
          'state-status': { value: 'Saved! Close & restart to verify', color: 'success' },
        });
        console.log('[all-features] Counter:', state.clickCount);
      }

      if (elementId === 'reset-btn') {
        state.clickCount = 0;
        context.setState('clickCount', 0);
        context.updateElementState({
          'click-count': { value: '0', color: 'info' },
          'state-status': { value: 'Reset!', color: 'warning' },
        });
      }

      // P2: Notifications
      if (elementId === 'notify-btn') {
        context.notify({
          title: 'All Features Test',
          body: 'This is a test notification! Lodash v' + _.VERSION,
        });
        console.log('[all-features] Notification sent');
      }
    });

    console.log('[all-features] Panel registered');
  },

  deactivate() {
    this._state = null;
    console.log('[all-features] Deactivated');
  }
};
