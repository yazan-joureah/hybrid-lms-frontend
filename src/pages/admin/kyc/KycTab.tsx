// src/pages/admin/kyc/KycTab.tsx
import { useState } from 'react'
import { useKycRequests } from '../../../hooks/admin/useKycRequests'
import { KycRequestList } from './KycRequestList'
import { KycReviewPanel } from './KycReviewPanel'

export function KycTab() {
    const { requests, loading, refetch } = useKycRequests()
    const [selectedId, setSelectedId] = useState<string | null>(null)

    if (selectedId) {
        return <KycReviewPanel requestId={selectedId} onClose={() => setSelectedId(null)} onDecided={refetch} />
    }

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>طلبات قيد المراجعة ({requests.length})</h3>
            {loading ? (
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>...جارٍ التحميل</div>
            ) : (
                <KycRequestList requests={requests} onSelect={item => setSelectedId(item._id)} />
            )}
        </div>
    )
}