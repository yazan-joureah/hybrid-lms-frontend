// src/pages/admin/kyc/KycRequestList.tsx
import type { KycListItem } from '../../../services/kycService'

interface Props {
    requests: KycListItem[]
    onSelect: (item: KycListItem) => void
}

export function KycRequestList({ requests, onSelect }: Props) {
    if (requests.length === 0) {
        return <p style={{ color: 'rgba(255,255,255,0.5)' }}>لا توجد طلبات توثيق قيد المراجعة حاليًا.</p>
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map(r => (
                <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {r.user_id?.full_name || 'مستخدم غير معروف'}{' '}
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>({r.user_id?.email})</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                            {r.applicant_role === 'Instructor' ? 'مدرّس' : 'طالب'} · {new Date(r.submitted_at).toLocaleString('ar')}
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => onSelect(r)}>مراجعة</button>
                </div>
            ))}
        </div>
    )
}