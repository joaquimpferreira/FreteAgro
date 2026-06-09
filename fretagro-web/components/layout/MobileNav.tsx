// "use client" — MobileNav is an interactive sheet that requires browser state
'use client'

import * as React from 'react'
import { Sidebar } from './Sidebar'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  return <Sidebar isOpen={isOpen} onClose={onClose} />
}
