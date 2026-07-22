import { useState, memo } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { SidebarElement as SidebarElementComponent } from '../SidebarElement'

export const SectionElement = memo(({ element, state, onInteraction }: any) => {
  const [collapsed, setCollapsed] = useState(element.defaultCollapsed ?? false)

  return (
    <div style={{ margin: '2px 0' }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '4px 10px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          cursor: 'pointer',
        }}
      >
        <span>{element.title}</span>
        {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
      </button>
      {!collapsed && element.children?.map((child: any) => (
        <SidebarElementComponent key={child.id} element={child} state={state} onInteraction={onInteraction} />
      ))}
    </div>
  )
})
SectionElement.displayName = 'SectionElement'
