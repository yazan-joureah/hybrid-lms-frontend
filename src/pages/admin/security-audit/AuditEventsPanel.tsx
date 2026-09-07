// src/pages/admin/security-audit/AuditEventsPanel.tsx
import { useAuditEvents } from '../../../hooks/admin/useAuditEvents'
import { SkeletonLoader } from '../../../components/common/Loading'

function formatDateTime(dateStr: string) {
    return new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
}

// يصنّف خطورة الحدث اعتماداً فقط على نمط التسمية الموحّد المستخدم فعلياً
// عبر auditService.record(action: '...') بكل الموديولات (مثال:
// UNAUTHORIZED_QUIZ_CREATE_ATTEMPT، QUIZ_ATTEMPT_AUTO_SUBMITTED) — بلا
// أي حاجة لحقل severity جديد من الباك-إند.
type Severity = 'critical' | 'warning' | 'normal'
function classifyAction(action: string): Severity {
    if (/UNAUTHORIZED|DENIED|LOCKED|FORBIDDEN/.test(action)) return 'critical'
    if (/FAILED|REJECTED|TIMED_OUT|SUSPICIOUS/.test(action)) return 'warning'
    return 'normal'
}
const SEVERITY_STYLES: Record<Severity, { bg: string; border: string }> = {
    critical: { bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.35)' },
    warning: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.3)' },
    normal: { bg: 'transparent', border: 'transparent' },
}

export function AuditEventsPanel() {
    const { items, total, page, pageSize, loading, actionFilter, setActionFilter, availableActions, goToPage } = useAuditEvents()
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return (
        <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
                <select className="form-input" style={{ width: 260 }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                    <option value="">كل أنواع الأحداث ({availableActions.length})</option>
                    {availableActions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>{total} حدث إجمالاً</span>
            </div>

            {loading ? (
                <SkeletonLoader type="row" count={6} />
            ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🗂️</div>
                    <div>لا توجد أحداث تطابق الفلتر الحالي.</div>
                </div>
            ) : (
                <div style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 8 }}>
                    <table className="data-table" style={{ width: '100%', minWidth: 900 }}>
                        <thead>
                            <tr><th>التاريخ</th><th>الحدث</th><th>الفاعل</th><th>نوع المورد</th><th>عنوان IP</th></tr>
                        </thead>
                        <tbody>
                            {items.map(ev => {
                                const severity = classifyAction(ev.action)
                                const style = SEVERITY_STYLES[severity]
                                return (
                                    <tr key={ev._id} style={{ background: style.bg, borderInlineStart: `3px solid ${style.border}` }}>
                                        <td style={{ color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>{formatDateTime(ev.created_at)}</td>
                                        <td>
                                            <code style={{ color: severity === 'critical' ? '#f87171' : severity === 'warning' ? '#fbbf24' : '#c4b5fd', fontSize: 12 }}>
                                                {severity === 'critical' && '🔴 '}{severity === 'warning' && '🟡 '}{ev.action}
                                            </code>
                                        </td>
                                        <td>
                                            {ev.actor_id ? (
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.actor_id.full_name || '—'}</div>
                                                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{ev.actor_id.email}</div>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'rgba(255,255,255,0.35)' }}>{ev.actor_role || '—'}</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>{ev.resource_type || '—'}</td>
                                        <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', direction: 'ltr', textAlign: 'right' }}>{ev.ip_address || '—'}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                    <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12.5 }} disabled={page <= 1} onClick={() => goToPage(page - 1)}>السابق</button>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', alignSelf: 'center' }}>صفحة {page} من {totalPages}</span>
                    <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12.5 }} disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>التالي</button>
                </div>
            )}
        </div>
    )
}