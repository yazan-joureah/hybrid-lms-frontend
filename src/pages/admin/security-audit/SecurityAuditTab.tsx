// src/pages/admin/security-audit/SecurityAuditTab.tsx
import { useState } from 'react'
import { SecurityAuditOverviewPanel } from './SecurityAuditOverviewPanel'
import { AuditEventsPanel } from './AuditEventsPanel'

export function SecurityAuditTab() {
    const [view, setView] = useState<'overview' | 'events'>('overview')

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
            <div className="tab-bar" style={{ marginBottom: 22, display: 'inline-flex' }}>
                <div className={`tab-item${view === 'overview' ? ' active' : ''}`} onClick={() => setView('overview')}>
                    نظرة عامة
                </div>
                <div className={`tab-item${view === 'events' ? ' active' : ''}`} onClick={() => setView('events')}>
                    سجل الأحداث الكامل
                </div>
            </div>

            {view === 'overview' ? <SecurityAuditOverviewPanel /> : <AuditEventsPanel />}
        </div>
    )
}