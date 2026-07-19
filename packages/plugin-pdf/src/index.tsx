import type { Plugin } from '@mdview/plugin-api';

function PdfRenderer(props: { content: string; filePath: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>PDF Document</span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span>{props.filePath.split(/[/\\]/).pop()}</span>
      </div>
      <iframe
        src={'file:///' + props.filePath.replace(/\\/g, '/')}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          backgroundColor: 'var(--bg-primary)'
        }}
      />
    </div>
  );
}

const PdfPlugin: Plugin = {
  name: 'pdf-viewer',
  version: '1.0.0',
  description: 'PDF file viewer for Markdown Viewer',

  register(api) {
    api.registerFileType({
      extensions: ['pdf'],
      name: 'PDF Document',
      icon: null,
      renderer: PdfRenderer,
    });
  }
};

export default PdfPlugin;
