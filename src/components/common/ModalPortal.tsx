// src/components/common/ModalPortal.tsx
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface Props {
    children: ReactNode
}

// يرندر أي نافذة (modal) مباشرة داخل document.body، بمعزل تام عن أي عنصر أب
// عنده backdropFilter / transform / overflow:hidden قد يكسر تموضع position:fixed.
// الـ React tree (context, أحداث onClick) يضل شغال طبيعي رغم اختلاف موقعها بالـ DOM.
export function ModalPortal({ children }: Props) {
    if (typeof document === 'undefined') return null
    return createPortal(children, document.body)
}