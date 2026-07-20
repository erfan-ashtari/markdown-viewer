import React from 'react';

// Shared style constants for plugin UI components
// Ensures consistent look across all plugins (PDF, Image, Editor)

export const buttonBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '28px',
  minHeight: '28px',
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 400,
  transition: 'background-color 0.15s, opacity 0.15s',
};

export const buttonDisabled: React.CSSProperties = {
  opacity: 0.4,
  cursor: 'default',
  pointerEvents: 'none',
};

export const headerBar: React.CSSProperties = {
  padding: '6px 12px',
  borderBottom: '1px solid var(--border-color)',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: 'var(--bg-secondary)',
};

// Inject global hover/focus styles for plugin buttons.
// Call once during plugin registration.
let injected = false;
export function injectPluginStyles(): void {
  if (injected) return;
  injected = true;

  if (typeof document === 'undefined') return;

  const existing = document.getElementById('mdview-plugin-styles');
  if (existing) return;

  const style = document.createElement('style');
  style.id = 'mdview-plugin-styles';
  style.textContent = `
    .mdview-plugin-btn:hover:not(:disabled) {
      background-color: var(--bg-tertiary) !important;
    }
    .mdview-plugin-btn:focus-visible {
      outline: 2px solid var(--accent-color);
      outline-offset: 1px;
    }
    .mdview-plugin-btn:active:not(:disabled) {
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);
}
