import React, { useMemo, useState, useCallback, useEffect, memo } from 'react';
import type { Plugin } from '@mdview/plugin-api';

// Supported image extensions
const IMAGE_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'tif', 'avif'
];

// Header with zoom controls
const ImageHeader = memo(({ fileName, width, height, zoom, onZoomIn, onZoomOut, onReset, onFit }: {
  fileName: string;
  width: number;
  height: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
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
    <span style={{ fontWeight: 500 }}>Image</span>
    <span style={{ opacity: 0.5 }}>|</span>
    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
    {width > 0 && (
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{width} × {height}</span>
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
      <button onClick={onFit} style={{
        padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px',
        backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px',
      }}>Fit</button>
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
        }}>1:1</button>
      )}
    </div>
  </div>
));
ImageHeader.displayName = 'ImageHeader';

// Image renderer
const ImageRenderer = memo(({ content, filePath }: { content: string; filePath: string }) => {
  const [zoom, setZoom] = useState(100);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [fitMode, setFitMode] = useState<'fit' | 'zoom'>('fit');

  const fileName = useMemo(() => filePath.split(/[/\\]/).pop() || '', [filePath]);

  const imgSrc = useMemo(() =>
    'local-file:///' + filePath.replace(/\\/g, '/'),
    [filePath]
  );

  const handleZoomIn = useCallback(() => {
    setFitMode('zoom');
    setZoom(z => Math.min(z + 10, 500));
  }, []);

  const handleZoomOut = useCallback(() => {
    setFitMode('zoom');
    setZoom(z => Math.max(z - 10, 10));
  }, []);

  const handleReset = useCallback(() => {
    setFitMode('zoom');
    setZoom(100);
  }, []);

  const handleFit = useCallback(() => {
    setFitMode('fit');
    setZoom(100);
  }, []);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  }, []);

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
      setFitMode('zoom');
      const delta = e.deltaY > 0 ? -5 : 5;
      setZoom(z => Math.max(10, Math.min(500, z + delta)));
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const imgStyle: React.CSSProperties = fitMode === 'fit'
    ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
    : { width: zoom + '%', height: 'auto' };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <ImageHeader
        fileName={fileName}
        width={naturalSize.width}
        height={naturalSize.height}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onFit={handleFit}
      />
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: fitMode === 'fit' ? 'center' : 'flex-start',
        justifyContent: fitMode === 'fit' ? 'center' : 'flex-start',
        padding: fitMode === 'fit' ? '0' : '16px',
      }}>
        <img
          src={imgSrc}
          onLoad={handleLoad}
          draggable={false}
          style={{
            ...imgStyle,
            transition: fitMode === 'zoom' ? 'width 0.15s ease' : 'none',
          }}
        />
      </div>
    </div>
  );
});
ImageRenderer.displayName = 'ImageRenderer';

const ImagesPlugin: Plugin = {
  name: 'image-viewer',
  version: '1.0.0',
  description: 'Image viewer with zoom and fit controls',
  register(api) {
    api.registerFileType({
      extensions: IMAGE_EXTENSIONS,
      name: 'Image',
      icon: null,
      renderer: ImageRenderer,
    });
  }
};

export { ImagesPlugin };
