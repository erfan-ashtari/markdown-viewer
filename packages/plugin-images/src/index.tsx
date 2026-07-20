import React, { useMemo, useState, useCallback, useEffect, memo } from 'react';
import type { Plugin } from '@mdview/plugin-api';
import { buttonBase, buttonDisabled, headerBar, injectPluginStyles } from '@mdview/plugin-api';

const IMAGE_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'tif', 'avif'
];

const ImageHeader = memo(({ fileName, width, height, zoom, isFit, onToggleFit, onZoomIn, onZoomOut }: {
  fileName: string;
  width: number;
  height: number;
  zoom: number;
  isFit: boolean;
  onToggleFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) => (
  <div style={headerBar}>
    <span style={{ fontWeight: 500 }}>Image</span>
    <span style={{ opacity: 0.5 }}>|</span>
    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
    {width > 0 && (
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        {width.toLocaleString()} × {height.toLocaleString()}
      </span>
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
      <button
        className="mdview-plugin-btn"
        onClick={onToggleFit}
        aria-label={isFit ? 'Switch to actual size' : 'Fit to window'}
        style={{
          ...buttonBase,
          backgroundColor: isFit ? 'var(--accent-color)' : 'var(--bg-primary)',
          color: isFit ? 'white' : 'var(--text-primary)',
        }}
      >{isFit ? '1:1' : 'Fit'}</button>
      <button
        className="mdview-plugin-btn"
        onClick={onZoomOut}
        disabled={zoom <= 10 && !isFit}
        aria-label="Zoom out"
        style={{ ...buttonBase, ...((zoom <= 10 && !isFit) ? buttonDisabled : {}) }}
      >−</button>
      <span style={{ fontSize: '11px', minWidth: '36px', textAlign: 'center' }}>{isFit ? 'Fit' : zoom + '%'}</span>
      <button
        className="mdview-plugin-btn"
        onClick={onZoomIn}
        disabled={zoom >= 350}
        aria-label="Zoom in"
        style={{ ...buttonBase, ...(zoom >= 350 ? buttonDisabled : {}) }}
      >+</button>
    </div>
  </div>
));
ImageHeader.displayName = 'ImageHeader';

const ImageRenderer = memo(({ content, filePath }: { content: string; filePath: string }) => {
  const [zoom, setZoom] = useState(100);
  const [isFit, setIsFit] = useState(true);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset zoom when switching tabs
  useEffect(() => {
    setZoom(100);
    setIsFit(true);
    setLoaded(false);
    setError(false);
    setNaturalSize({ width: 0, height: 0 });
  }, [filePath]);

  const fileName = useMemo(() => filePath.split(/[/\\]/).pop() || '', [filePath]);
  const imgSrc = useMemo(() => 'local-file:///' + filePath.replace(/\\/g, '/'), [filePath]);

  const handleToggleFit = useCallback(() => setIsFit(f => !f), []);
  const handleZoomIn = useCallback(() => { setIsFit(false); setZoom(z => Math.min(z + 10, 350)); }, []);
  const handleZoomOut = useCallback(() => { setIsFit(false); setZoom(z => Math.max(z - 10, 10)); }, []);
  const handleReset = useCallback(() => { setIsFit(false); setZoom(100); }, []);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setLoaded(true);
  }, []);

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

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setIsFit(false);
      const delta = e.deltaY > 0 ? -5 : 5;
      setZoom(z => Math.max(10, Math.min(350, z + delta)));
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const imgStyle: React.CSSProperties = isFit
    ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
    : { width: zoom + '%', maxWidth: 'none', maxHeight: 'none' };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <ImageHeader
        fileName={fileName}
        width={naturalSize.width}
        height={naturalSize.height}
        zoom={zoom}
        isFit={isFit}
        onToggleFit={handleToggleFit}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {!loaded && (
          <div style={{
            position: 'absolute',
            color: 'var(--text-muted)',
            fontSize: '14px',
          }}>
            Loading image…
          </div>
        )}
        {error && (
          <div style={{
            position: 'absolute',
            color: 'var(--text-muted)',
            fontSize: '14px',
          }}>
            Failed to load image
          </div>
        )}
        <img
          src={imgSrc}
          onLoad={handleLoad}
          onError={() => setError(true)}
          draggable={false}
          alt={fileName}
          style={{
            ...imgStyle,
            transition: isFit ? 'none' : 'width 0.1s ease',
            flexShrink: 0,
            opacity: loaded ? 1 : 0,
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
    injectPluginStyles();
    api.registerFileType({
      extensions: IMAGE_EXTENSIONS,
      name: 'Image',
      renderer: ImageRenderer,
    });
  }
};

export { ImagesPlugin };
