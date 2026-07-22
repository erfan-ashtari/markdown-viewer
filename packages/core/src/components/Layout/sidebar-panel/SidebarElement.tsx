import React from 'react'
import type { SidebarElement as SidebarElementType } from '@mdview/plugin-api'
import { ButtonElement } from './elements/ButtonElement'
import { ToggleElement } from './elements/ToggleElement'
import { SelectElement } from './elements/SelectElement'
import { TextInputElement } from './elements/TextInputElement'
import { TextAreaElement } from './elements/TextAreaElement'
import { StatusElement } from './elements/StatusElement'
import { ProgressElement } from './elements/ProgressElement'
import { LabelElement } from './elements/LabelElement'
import { SeparatorElement } from './elements/SeparatorElement'
import { SectionElement } from './elements/SectionElement'
import { LinkElement } from './elements/LinkElement'
import { BadgeElement } from './elements/BadgeElement'
import { HtmlElement } from './elements/HtmlElement'

const ELEMENT_MAP: Record<string, React.ComponentType<any>> = {
  button: ButtonElement,
  toggle: ToggleElement,
  select: SelectElement,
  'text-input': TextInputElement,
  'text-area': TextAreaElement,
  status: StatusElement,
  progress: ProgressElement,
  label: LabelElement,
  separator: SeparatorElement,
  section: SectionElement,
  link: LinkElement,
  badge: BadgeElement,
  html: HtmlElement,
}

interface SidebarElementProps {
  element: SidebarElementType
  state: Record<string, any>
  onInteraction: (elementId: string, eventType: string, payload: any) => void
}

export const SidebarElement: React.FC<SidebarElementProps> = React.memo(
  ({ element, state, onInteraction }) => {
    if (element.visibleWhen) {
      const watchedValue = state[element.visibleWhen.elementId]
      if (watchedValue !== element.visibleWhen.value) return null
    }

    const Component = ELEMENT_MAP[element.type]
    if (!Component) {
      console.warn(`Unknown sidebar element type: ${element.type}`)
      return null
    }

    return <Component element={element} state={state} onInteraction={onInteraction} />
  }
)
SidebarElement.displayName = 'SidebarElement'
