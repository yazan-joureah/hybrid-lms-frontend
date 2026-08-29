// src/hooks/useConfirmDialog.ts
import { useState, useCallback } from 'react'

interface ConfirmState {
    message: string
    title?: string
    danger?: boolean
    resolve: (value: boolean) => void
}

export function useConfirmDialog() {
    const [state, setState] = useState<ConfirmState | null>(null)

    const confirm = useCallback((message: string, options?: { title?: string; danger?: boolean }) => {
        return new Promise<boolean>(resolve => {
            setState({ message, title: options?.title, danger: options?.danger, resolve })
        })
    }, [])

    const handleConfirm = () => { state?.resolve(true); setState(null) }
    const handleCancel = () => { state?.resolve(false); setState(null) }

    return { confirm, dialogProps: state ? { ...state, onConfirm: handleConfirm, onCancel: handleCancel } : null }
}