import React, { useMemo, useState, useCallback, useEffect, memo } from 'react';
import type { PluginContext } from '@mdview/plugin-api';
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
        {width.toLocaleString()} x {height.toLocaleString()}
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
      >-</button>
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
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Calculate scaled dimensions and dynamic margins for centering
  const { scaledWidth, scaledHeight, marginTop, marginLeft } = useMemo(() => {
    if (!loaded || naturalSize.width === 0) {
      return { scaledWidth: 0, scaledHeight: 0, marginTop: 0, marginLeft: 0 };
    }
    const container = containerRef.current;
    if (!container) {
      return { scaledWidth: naturalSize.width, scaledHeight: naturalSize.height, marginTop: 0, marginLeft: 0 };
    }
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    if (isFit) {
      return { scaledWidth: 0, scaledHeight: 0, marginTop: 0, marginLeft: 0 };
    }
    const sw = naturalSize.width * (zoom / 100);
    const sh = naturalSize.height * (zoom / 100);
    const ml = sw < containerWidth ? (containerWidth - sw) / 2 : 0;
    const mt = sh < containerHeight ? (containerHeight - sh) / 2 : 0;
    return { scaledWidth: sw, scaledHeight: sh, marginTop: mt, marginLeft: ml };
  }, [zoom, isFit, loaded, naturalSize]);

  const imgStyle: React.CSSProperties = isFit
    ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const }
    : {
        width: scaledWidth || 'auto',
        height: scaledHeight || 'auto',
        maxWidth: 'none',
        maxHeight: 'none',
        marginTop: marginTop,
        marginLeft: marginLeft,
      };

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
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          display: isFit ? 'flex' : 'block',
          alignItems: isFit ? 'center' : undefined,
          justifyContent: isFit ? 'center' : undefined,
          position: 'relative',
        }}
      >
        {!loaded && !error && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '14px',
          }}>
            Loading image...
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
            flexShrink: 0,
            opacity: loaded ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
});
ImageRenderer.displayName = 'ImageRenderer';

export function activate(context: PluginContext) {
  console.log('[plugin-images] Activated — registering image file types');
  injectPluginStyles();
  context.registerFileType({
    extensions: IMAGE_EXTENSIONS,
    name: 'Image',
    renderer: ImageRenderer,
  });
}

export function deactivate() {
  console.log('[plugin-images] Deactivated');
  // No cleanup needed for image viewer
}