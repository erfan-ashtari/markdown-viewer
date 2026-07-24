module.exports = {
  activate(context) {
    // console.log('[icon-test] Activated')

    context.registerSidebarPanel({
      id: 'icon-test',
      title: 'Icon Test',
      icon: 'Beaker',
      children: [
        { type: 'label', id: 'heading', text: 'Icon Registry Test', variant: 'heading' },
        { type: 'separator', id: 'sep1' },

        { type: 'section', id: 'sec-valid', title: 'Valid Icons', children: [
          { type: 'button', id: 'btn-play', label: 'Play', icon: 'Play', variant: 'primary' },
          { type: 'button', id: 'btn-trash', label: 'Trash', icon: 'Trash2', variant: 'danger' },
          { type: 'button', id: 'btn-refresh', label: 'Refresh', icon: 'RefreshCw' },
          { type: 'button', id: 'btn-settings', label: 'Settings', icon: 'Settings' },
          { type: 'button', id: 'btn-eye', label: 'Eye', icon: 'Eye' },
          { type: 'button', id: 'btn-search', label: 'Search', icon: 'Search' },
          { type: 'button', id: 'btn-download', label: 'Download', icon: 'Download' },
          { type: 'button', id: 'btn-star', label: 'Star', icon: 'Star' },
          { type: 'button', id: 'btn-zap', label: 'Zap', icon: 'Zap' },
          { type: 'button', id: 'btn-code', label: 'Code', icon: 'Code' },
          { type: 'button', id: 'btn-terminal', label: 'Terminal', icon: 'Terminal' },
          { type: 'button', id: 'btn-globe', label: 'Globe', icon: 'Globe' },
          { type: 'button', id: 'btn-lock', label: 'Lock', icon: 'Lock' },
          { type: 'button', id: 'btn-heart', label: 'Heart', icon: 'Heart' },
          { type: 'button', id: 'btn-send', label: 'Send', icon: 'Send' },
          { type: 'button', id: 'btn-share', label: 'Share', icon: 'Share' },
          { type: 'button', id: 'btn-wrench', label: 'Wrench', icon: 'Wrench' },
          { type: 'button', id: 'btn-file', label: 'File', icon: 'FileText' },
          { type: 'button', id: 'btn-folder', label: 'Folder', icon: 'FolderOpen' },
          { type: 'button', id: 'btn-info', label: 'Info', icon: 'Info' },
        ]},

        { type: 'separator', id: 'sep2' },
        { type: 'section', id: 'sec-invalid', title: 'Invalid Icons (should show no icon)', children: [
          { type: 'button', id: 'btn-bad1', label: 'NonExistent', icon: 'NonExistent' },
          { type: 'button', id: 'btn-bad2', label: 'FakeIcon', icon: 'FakeIcon' },
          { type: 'button', id: 'btn-bad3', label: 'Empty', icon: '' },
        ]},

        { type: 'separator', id: 'sep3' },
        { type: 'status', id: 'result', label: 'Result', value: 'Click any button to test', color: 'default' },
      ],
    })

    context.onEvent('ui-event', ({ elementId }) => {
      // console.log('[icon-test] Button clicked:', elementId)
      context.updateElementState({
        'result': { value: 'Clicked: ' + elementId, color: 'success' },
      })
    })

    // console.log('[icon-test] Panel registered with 23 icon tests')
  },
  deactivate() {
    // console.log('[icon-test] Deactivated')
  },
}
