// src/contexts/ToastContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ToastContextType, ToastType } from '../types';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const typeStyles: Record<ToastType, { border: string; icon: string; color: string }> = {
    success: { border: 'rgba(16,185,129,0.4)', icon: '✅', color: '#34d399' },
    error: { border: 'rgba(239,68,68,0.4)', icon: '⚠️', color: '#f87171' },
    info: { border: 'rgba(6,182,212,0.4)', icon: 'ℹ️', color: '#22d3ee' },
    warning: { border: 'rgba(245,158,11,0.4)', icon: '⚡', color: '#fbbf24' },
};

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showMsg = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++idCounter;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={{ showMsg }}>
            {children}
            <div
                style={{
                    position: 'fixed',
                    top: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    width: 'min(92vw, 380px)',
                    pointerEvents: 'none',
                }}
                dir="rtl"
            >
                {toasts.map((t) => {
                    const s = typeStyles[t.type];
                    return (
                        <div
                            key={t.id}
                            style={{
                                background: 'rgba(12,4,45,0.97)',
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${s.border}`,
                                borderRadius: 14,
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                                pointerEvents: 'auto',
                                animation: 'toast-in 0.2s ease-out',
                            }}
                        >
                            <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                            <span style={{ fontSize: 13.5, color: s.color, fontWeight: 500 }}>{t.message}</span>
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextType {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
