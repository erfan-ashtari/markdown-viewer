import React, { useMemo, useState, useEffect, useRef, memo } from 'react';
import type { PluginContext } from '@mdview/plugin-api';
import { headerBar, injectPluginStyles } from '@mdview/plugin-api';

// Header with filename only — webview handles its own zoom
const PdfHeader = memo(({ fileName }: { fileName: string }) => (
  <div style={headerBar}>
    <span style={{ fontWeight: 500 }}>PDF</span>
    <span style={{ opacity: 0.5 }}>|</span>
    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
  </div>
));
PdfHeader.displayName = 'PdfHeader';

// Main renderer
const PdfRenderer = memo(({ content, filePath }: { content: string; filePath: string }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const webviewRef = useRef<any>(null);

  const fileName = useMemo(() => filePath.split(/[/\\]/).pop() || '', [filePath]);

  const embedSrc = useMemo(() =>
    'local-file:///' + filePath.replace(/\\/g, '/'),
    [filePath]
  );

  // Detect webview load success
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;
    const handleLoad = () => setLoaded(true);
    const handleError = () => setError(true);
    webview.addEventListener('did-finish-load', handleLoad);
    webview.addEventListener('did-fail-load', handleError);
    return () => {
      webview.removeEventListener('did-finish-load', handleLoad);
      webview.removeEventListener('did-fail-load', handleError);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PdfHeader fileName={fileName} />
      <div style={{ flex: 1, position: 'relative' }}>
        {!loaded && !error && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '14px',
            backgroundColor: 'var(--bg-primary)',
          }}>
            Loading PDF…
          </div>
        )}
        {error && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '14px',
            backgroundColor: 'var(--bg-primary)',
          }}>
            Failed to load PDF
          </div>
        )}
        <webview
          ref={webviewRef}
          src={embedSrc}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  );
});
PdfRenderer.displayName = 'PdfRenderer';

export function activate(context: PluginContext) {
  // console.log('[plugin-pdf] Activated — registering PDF file type');
  injectPluginStyles();
  context.registerFileType({
    extensions: ['pdf'],
    name: 'PDF Document',
    renderer: PdfRenderer,
  });
}

export function deactivate() {
  // console.log('[plugin-pdf] Deactivated');
  // No cleanup needed for PDF viewer
}