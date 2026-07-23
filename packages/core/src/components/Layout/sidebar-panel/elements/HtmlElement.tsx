import { memo, useRef, useEffect } from 'react'

// Always use restrictive sandbox — never allow allow-same-origin as it negates sandboxing
const SAFE_SANDBOX = 'allow-scripts'
const ALLOWED_SANDBOX = new Set(['allow-scripts', 'allow-popups'])

export const HtmlElement = memo(({ element, state, onInteraction }: any) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Iframe → App: listen for postMessage from iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (
        iframeRef.current &&
        event.source === iframeRef.current.contentWindow &&
        // Sandbox without allow-same-origin → origin is "null"
        (event.origin === 'null' || event.origin === window.location.origin)
      ) {
        // Ensure data is serializable before forwarding
        try {
          const data = typeof event.data === 'string'
            ? { message: event.data }
            : structuredClone(event.data)
          onInteraction?.(element.id, 'iframe-message', data)
        } catch {
          // Non-serializable data (circular refs, DOM nodes) — drop it
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [element.id, onInteraction])

  // App → Iframe: push only this element's state to iframe without reload
  useEffect(() => {
    if (iframeRef.current?.contentWindow && state) {
      const elementState = state[element.id]
      if (elementState !== undefined) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'state-update', state: elementState },
          '*'
        )
      }
    }
  }, [state, element.id])

  // Honor sandbox prop with allowlist, fall back to safe default
  const sandbox = element.sandbox
    ?.split(/\s+/)
    .filter((t: string) => ALLOWED_SANDBOX.has(t))
    .join(' ') || SAFE_SANDBOX

  // Convert file:// to local-file:// for Electron protocol handling
  // Match HtmlRenderer pattern: file://C:/path -> local-file:///C:/path (three slashes for Windows)
  const src = element.src?.startsWith('file://')
    ? element.src.replace(/^file:\/\/([A-Z]:)/i, 'local-file:///$1').replace(/\\/g, '/')
    : element.src

  return (
    <div style={{
      margin: '4px 10px',
      height: element.height || 200,
      borderRadius: '4px',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
    }}>
      <iframe
        ref={iframeRef}
        src={src}
        sandbox={sandbox}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={element.id}
      />
    </div>
  )
})
HtmlElement.displayName = 'HtmlElement'
