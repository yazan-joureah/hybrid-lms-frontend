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
      <div style={{
        flex: 1,
        marginRight: 'var(--sidebar-width)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }} className="max-[900px]:mr-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
