import React from 'react'
import { pluginManager } from '../pluginLoader'

interface SlotProps {
  name: string
  context?: Record<string, any>
}

export const Slot: React.FC<SlotProps> = React.memo(({ name, context = {} }) => {
  const items = pluginManager.getSlotItems(name)
  
  if (items.length === 0) return null

  return (
    <>
      {items.map((item) => (
        <item.component key={item.id} {...context} />
      ))}
    </>
  )
})

Slot.displayName = 'Slot'
