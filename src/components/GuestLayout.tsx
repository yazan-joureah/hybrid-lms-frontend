// src/components/GuestLayout.tsx
import type { ReactNode } from 'react'
import { useNav } from '../context/NavContext'
import EdujarLogo from './EdujarLogo'

interface Props {
    children: ReactNode
}

export default function GuestLayout({ children }: Props) {
    const { navigate } = useNav()

    return (
        <div style={{ minHeight: '100vh', background: 'var(--gradient-bg)' }}>
            <header
                style={{
                    position: 'sticky', top: 0, zIndex: 50,
                    height: 'var(--header-height)',
                    background: 'rgba(8,3,32,0.92)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 24px',
                }}
            >
                <div style={{ cursor: 'pointer' }} onClick={() => navigate('landing')}>
                    <EdujarLogo width={120} height={32} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 13.5 }} onClick={() => navigate('login')}>
                        تسجيل الدخول
                    </button>
                    <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13.5 }} onClick={() => navigate('register')}>
                        إنشاء حساب
                    </button>
                </div>
            </header>
            <main>{children}</main>
        </div>
    )
}