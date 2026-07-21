import React, { useMemo, useState, useCallback, useEffect, memo } from 'react';
import type { PluginContext } from '@mdview/plugin-api';
import { buttonBase, headerBar, injectPluginStyles } from '@mdview/plugin-api';

const IMAGE_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'tif', 'avif'
];

const ImageHeader = memo(({ fileName, width, height, fitMode, onToggleFit }: {
  fileName: string;
  width: number;
  height: number;
  fitMode: 'width' | 'height';
  onToggleFit: () => void;
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
    <button
      className="mdview-plugin-btn"
      onClick={onToggleFit}
      aria-label={fitMode === 'width' ? 'Switch to fit height' : 'Switch to fit width'}
      title={fitMode === 'width' ? 'Fit to height' : 'Fit to width'}
      style={{
        ...buttonBase,
        padding: '4px 10px',
        fontSize: '11px',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {fitMode === 'width' ? 'Fit Width' : 'Fit Height'}
    </button>
  </div>
));
ImageHeader.displayName = 'ImageHeader';

const ImageRenderer = memo(({ content, filePath }: { content: string; filePath: string }) => {
  const [fitMode, setFitMode] = useState<'width' | 'height'>('width');
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset on tab change
  useEffect(() => {
    setFitMode('width');
    setLoaded(false);
    setError(false);
    setNaturalSize({ width: 0, height: 0 });
  }, [filePath]);

  const fileName = useMemo(() => filePath.split(/[/\\]/).pop() || '', [filePath]);
  const imgSrc = useMemo(() => 'local-file:///' + filePath.replace(/\\/g, '/'), [filePath]);

  const handleToggleFit = useCallback(() => {
    setFitMode(m => m === 'width' ? 'height' : 'width');
  }, []);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setLoaded(true);
  }, []);

  const imgStyle: React.CSSProperties = fitMode === 'width'
    ? { maxWidth: '100%', height: 'auto', objectFit: 'contain' as const }
    : { maxHeight: '100%', width: 'auto', objectFit: 'contain' as const };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <ImageHeader
        fileName={fileName}
        width={naturalSize.width}
        height={naturalSize.height}
        fitMode={fitMode}
        onToggleFit={handleToggleFit}
      />
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {!loaded && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Loading image...
          </div>
        )}
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
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
}