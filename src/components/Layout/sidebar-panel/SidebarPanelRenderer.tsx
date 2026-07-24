import React, { memo } from 'react'
import type { SidebarPanel } from '@mdview/plugin-api'
import { SidebarElement } from './SidebarElement'

interface SidebarPanelRendererProps {
  panel: SidebarPanel
  state: Record<string, any>
  onInteraction: (elementId: string, eventType: string, payload: any) => void
}

export const SidebarPanelRenderer: React.FC<SidebarPanelRendererProps> = memo(
  ({ panel, state, onInteraction }) => {
    return (
      <div style={{ padding: '4px 0' }}>
        {panel.children.map((el) => (
          <SidebarElement key={el.id} element={el} state={state} onInteraction={onInteraction} />
        ))}
      </div>
    )
  }
)
SidebarPanelRenderer.displayName = 'SidebarPanelRenderer'
