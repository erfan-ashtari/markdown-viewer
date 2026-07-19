import React, { useState, useMemo, useCallback, memo } from 'react';
import type { Plugin } from '@mdview/plugin-api';

// Memoized header component
const PdfHeader = memo(({ fileName }: { fileName: string }) => (
  <div style={{
    padding: '8px 16px',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--bg-secondary)',
  }}>
    <span>PDF Document</span>
    <span style={{ opacity: 0.5 }}>|</span>
    <span>{fileName}</span>
  </div>
));
PdfHeader.displayName = 'PdfHeader';

// Memoized loading indicator
const PdfLoading = memo(() => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    fontSize: '14px',
  }}>
    Loading PDF...
  </div>
));
PdfLoading.displayName = 'PdfLoading';

// Memoized error fallback
const PdfError = memo(({ fileName }: { fileName: string }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    gap: '8px',
  }}>
    <p>Failed to load PDF</p>
    <p style={{ fontSize: '12px' }}>{fileName}</p>
  </div>
));
PdfError.displayName = 'PdfError';

// Main renderer — memoized
const PdfRenderer = memo(({ content, filePath }: { content: string; filePath: string }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fileName = useMemo(() => filePath.split(/[/\\]/).pop() || '', [filePath]);
  
  const iframeSrc = useMemo(() => 
    'file:///' + filePath.replace(/\\/g, '/'),
    [filePath]
  );

  const handleLoad = useCallback(() => setLoading(false), []);
  const handleError = useCallback(() => { setLoading(false); setError(true); }, []);

  if (error) return <PdfError fileName={fileName} />;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PdfHeader fileName={fileName} />
      {loading && <PdfLoading />}
      <iframe
        src={iframeSrc}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          backgroundColor: 'var(--bg-primary)',
          display: loading ? 'none' : 'block',
        }}
      />
    </div>
  );
});
PdfRenderer.displayName = 'PdfRenderer';

const PdfPlugin: Plugin = {
  name: 'pdf-viewer',
  version: '1.0.0',
  description: 'Lightweight PDF viewer with iframe rendering',
  register(api) {
    api.registerFileType({
      extensions: ['pdf'],
      name: 'PDF Document',
      icon: null,
      renderer: PdfRenderer,
    });
  }
};

export { PdfPlugin };
