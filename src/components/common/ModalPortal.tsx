// src/components/common/ModalPortal.tsx
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface Props {
    children: ReactNode
}


export function ModalPortal({ children }: Props) {
    if (typeof document === 'undefined') return null
    return createPortal(children, document.body)
}