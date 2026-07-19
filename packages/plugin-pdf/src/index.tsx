import React, { useMemo, memo } from 'react';
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

// Main renderer — memoized
const PdfRenderer = memo(({ content, filePath }: { content: string; filePath: string }) => {
  const fileName = useMemo(() => filePath.split(/[/\\]/).pop() || '', [filePath]);
  
  const embedSrc = useMemo(() => {
    const src = 'file:///' + filePath.replace(/\\/g, '/');
    console.log('[PDF Plugin] Rendering PDF:', { filePath, fileName, embedSrc });
    console.log('[PDF Plugin] Content length:', content?.length || 0);
    return src;
  }, [filePath, fileName, content]);

  console.log('[PDF Plugin] PdfRenderer mounted with:', { filePath, contentLength: content?.length });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PdfHeader fileName={fileName} />
      <embed
        src={embedSrc}
        type="application/pdf"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
        }}
      />
    </div>
  );
});
PdfRenderer.displayName = 'PdfRenderer';

const PdfPlugin: Plugin = {
  name: 'pdf-viewer',
  version: '1.0.0',
  description: 'Lightweight PDF viewer',
  register(api) {
    console.log('[PDF Plugin] Registering PDF file type');
    api.registerFileType({
      extensions: ['pdf'],
      name: 'PDF Document',
      icon: null,
      renderer: PdfRenderer,
    });
    console.log('[PDF Plugin] Registration complete');
  }
};

export { PdfPlugin };
