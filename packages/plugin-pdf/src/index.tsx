import React, { useMemo, useState, useEffect, memo } from 'react';
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

// Main renderer
const PdfRenderer = memo(({ content, filePath }: { content: string; filePath: string }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const fileName = useMemo(() => filePath.split(/[/\\]/).pop() || '', [filePath]);

  useEffect(() => {
    let cancelled = false;
    window.electronAPI?.readFileBinary?.(filePath).then((base64) => {
      if (!cancelled && base64) {
        setDataUrl('data:application/pdf;base64,' + base64);
      } else if (!cancelled) {
        setError(true);
      }
    }).catch(() => {
      if (!cancelled) setError(true);
    });
    return () => { cancelled = true; };
  }, [filePath]);

  if (error) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <PdfHeader fileName={fileName} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          Failed to load PDF
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PdfHeader fileName={fileName} />
      {dataUrl ? (
        <embed
          src={dataUrl}
          type="application/pdf"
          style={{ flex: 1, width: '100%', border: 'none' }}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          Loading PDF...
        </div>
      )}
    </div>
  );
});
PdfRenderer.displayName = 'PdfRenderer';

const PdfPlugin: Plugin = {
  name: 'pdf-viewer',
  version: '1.0.0',
  description: 'Lightweight PDF viewer',
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
