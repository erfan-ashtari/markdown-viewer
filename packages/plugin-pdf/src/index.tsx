import React, { useMemo, useState, useCallback, useEffect, memo } from 'react';
import type { Plugin } from '@mdview/plugin-api';

// Memoized header with zoom controls
const PdfHeader = memo(({ fileName, zoom, onZoomIn, onZoomOut, onReset }: {
  fileName: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) => (
  <div style={{
    padding: '6px 12px',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--bg-secondary)',
  }}>
    <span style={{ fontWeight: 500 }}>PDF</span>
    <span style={{ opacity: 0.5 }}>|</span>
    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
      <button onClick={onZoomOut} style={{
        padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px',
        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px',
      }}>−</button>
      <span style={{ fontSize: '11px', minWidth: '36px', textAlign: 'center' }}>{zoom}%</span>
      <button onClick={onZoomIn} style={{
        padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px',
        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px',
      }}>+</button>
      {zoom !== 100 && (
        <button onClick={onReset} style={{
          padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px',
          backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px',
        }}>Reset</button>
      )}
    </div>
  </div>
));
PdfHeader.displayName = 'PdfHeader';

// Main renderer
const PdfRenderer = memo(({ content, filePath }: { content: string; filePath: string }) => {
  const [zoom, setZoom] = useState(100);

  const fileName = useMemo(() => filePath.split(/[/\\]/).pop() || '', [filePath]);
  
  const embedSrc = useMemo(() => 
    'local-file:///' + filePath.replace(/\\/g, '/'),
    [filePath]
  );

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 10, 300)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z - 10, 30)), []);
  const handleReset = useCallback(() => setZoom(100), []);

  // Keyboard zoom: Ctrl+/- and Ctrl+0
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); handleZoomIn(); }
      else if (e.key === '-') { e.preventDefault(); handleZoomOut(); }
      else if (e.key === '0') { e.preventDefault(); handleReset(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleReset]);

  // Touchpad pinch zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -5 : 5;
      setZoom(z => Math.max(30, Math.min(300, z + delta)));
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PdfHeader
        fileName={fileName}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
        <embed
          src={embedSrc}
          type="application/pdf"
          style={{
            width: zoom + '%',
            height: zoom + '%',
            minHeight: '100%',
            border: 'none',
            transformOrigin: 'top center',
          }}
        />
      </div>
    </div>
  );
});
PdfRenderer.displayName = 'PdfRenderer';

const PdfPlugin: Plugin = {
  name: 'pdf-viewer',
  version: '1.0.0',
  description: 'PDF viewer with zoom controls',
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
