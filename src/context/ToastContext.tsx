// src/context/ToastContext.tsx
import { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { ModalPortal } from '../components/common/ModalPortal'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
    id: number
    type: ToastType
    message: string
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void
    success: (message: string, duration?: number) => void
    error: (message: string, duration?: number) => void
    info: (message: string, duration?: number) => void
    warning: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const TOAST_CONFIG: Record<ToastType, { icon: string; color: string; border: string }> = {
    success: { icon: '✅', color: '#34d399', border: 'rgba(16,185,129,0.35)' },
    error: { icon: '⚠️', color: '#f87171', border: 'rgba(239,68,68,0.35)' },
    info: { icon: 'ℹ️', color: '#7dd3fc', border: 'rgba(6,182,212,0.35)' },
    warning: { icon: '⚡', color: '#fbbf24', border: 'rgba(245,158,11,0.35)' },
}

let idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id))
        if (timers.current[id]) {
            clearTimeout(timers.current[id])
            delete timers.current[id]
        }
    }, [])

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
        const id = ++idCounter
        setToasts(prev => [...prev, { id, type, message }])
        timers.current[id] = setTimeout(() => dismiss(id), duration)
    }, [dismiss])

    // ⚠️ مهم جداً: success/error/info/warning لازم يكون لهن مرجع (reference)
    // ثابت بين الـ renders. لو عرّفناهن inline جوا الـ value object العادي،
    // كل مرة الـ ToastProvider يعمل re-render (مثلاً بسبب setToasts نفسها)
    // بيتولد مرجع دالة جديد لكل واحدة، وأي useEffect بصفحة تانية حاطط
    // toastError/toastSuccess بمصفوفة الاعتماديات (deps array) رح يشوفها
    // "تغيّرت" ويعيد التنفيذ من جديد → لو الـ effect نفسه بينادي toastError
    // بحالة الفشل (زي أي catch block)، هاد بيعمل حلقة لا نهائية:
    // fetch يفشل → toast → re-render → مرجع جديد → effect يعيد نفسه → fetch
    // يفشل من جديد... (شفنا هالضبط بـ AdminPaymentDetail.tsx).
    const success = useCallback((m: string, d?: number) => showToast(m, 'success', d), [showToast])
    const error = useCallback((m: string, d?: number) => showToast(m, 'error', d), [showToast])
    const info = useCallback((m: string, d?: number) => showToast(m, 'info', d), [showToast])
    const warning = useCallback((m: string, d?: number) => showToast(m, 'warning', d), [showToast])

    const value = useMemo(() => ({
        showToast,
        success,
        error,
        info,
        warning,
    }), [showToast, success, error, info, warning])

    return (
        <ToastContext.Provider value={value}>
            {children}
            <style>{`
        @keyframes toast-in { from { opacity:0; transform: translateY(-10px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
            <ModalPortal>
                <div
                    style={{
                        position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
                        zIndex: 500, display: 'flex', flexDirection: 'column', gap: 10,
                        width: '100%', maxWidth: 420, padding: '0 16px', pointerEvents: 'none',
                    }}
                >
                    {toasts.map(t => {
                        const cfg = TOAST_CONFIG[t.type]
                        return (
                            <div
                                key={t.id}
                                style={{
                                    pointerEvents: 'auto',
                                    background: 'rgba(12,4,45,0.97)', backdropFilter: 'blur(20px)',
                                    border: `1px solid ${cfg.border}`, borderRight: `4px solid ${cfg.color}`,
                                    borderRadius: 14, padding: '13px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.45)', animation: 'toast-in 0.25s ease-out',
                                }}
                            >
                                <span style={{ fontSize: 18, flexShrink: 0 }}>{cfg.icon}</span>
                                <span style={{ flex: 1, fontSize: 13.5, color: '#fff', lineHeight: 1.5 }}>{t.message}</span>
                                <button
                                    onClick={() => dismiss(t.id)}
                                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 15, padding: 0, flexShrink: 0 }}
                                >
                                    ✕
                                </button>
                            </div>
                        )
                    })}
                </div>
            </ModalPortal>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within a ToastProvider')
    return ctx
}