import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gradient-bg)', direction: 'rtl' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main area */}
      <div className="app-shell-main">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
