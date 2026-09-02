// src/pages/admin/security-audit/SecurityAuditOverviewPanel.tsx
import { useSecurityAuditOverview, RANGE_OPTIONS } from '../../../hooks/admin/useSecurityAuditOverview'
import { SkeletonLoader } from '../../../components/common/Loading'

function formatDateShort(dateStr: string) {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: '2-digit' }).format(d)
}

function SummaryCard({ label, value, icon, tone }: { label: string; value: number | string; icon: string; tone: 'primary' | 'danger' }) {
    const toneMap: Record<string, string> = {
        primary: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(168,85,247,0.12))',
        danger: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(249,115,22,0.04))',
    }
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, minHeight: 110 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: toneMap[tone], marginBottom: 10 }}>{icon}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginTop: 4 }}>{value.toLocaleString?.('ar') ?? value}</div>
        </div>
    )
}

export function SecurityAuditOverviewPanel() {
    const { overview, loading, rangeDays, setRangeDays } = useSecurityAuditOverview()

    const maxDaily = overview ? Math.max(1, ...overview.dailyTimeline.map(d => d.count)) : 1
    const maxAction = overview ? Math.max(1, ...overview.actionBreakdown.map(a => a.count)) : 1

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {RANGE_OPTIONS.map(d => (
                    <button
                        key={d}
                        className={d === rangeDays ? 'btn-primary' : 'btn-outline'}
                        style={{ padding: '6px 16px', fontSize: 13 }}
                        onClick={() => setRangeDays(d)}
                    >
                        آخر {d} يوم
                    </button>
                ))}
            </div>

            {loading || !overview ? (
                <SkeletonLoader type="card" count={2} />
            ) : (
                <>
                    <div className="admin-summary-grid" style={{ marginBottom: 24 }}>
                        <SummaryCard label="إجمالي الأحداث المسجّلة" value={overview.totalEvents} icon="📊" tone="primary" />
                        <SummaryCard label="محاولات قفل الحساب (ACCOUNT_LOCKED)" value={overview.accountLockoutsCount} icon="🔒" tone="danger" />
                    </div>

                    {/* الخط الزمني اليومي */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
                        <h4 style={{ marginBottom: 16 }}>النشاط اليومي</h4>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, overflowX: 'auto' }}>
                            {overview.dailyTimeline.map(point => (
                                <div key={point.date} title={`${point.date}: ${point.count}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 18, flex: '1 0 auto' }}>
                                    <div style={{
                                        width: '100%', maxWidth: 14,
                                        height: Math.max(3, (point.count / maxDaily) * 90),
                                        background: point.count > 0 ? 'linear-gradient(180deg, #a855f7, #7c3aed)' : 'rgba(255,255,255,0.06)',
                                        borderRadius: 3,
                                    }} />
                                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 4, whiteSpace: 'nowrap' }}>
                                        {formatDateShort(point.date)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="admin-two-col" style={{ gap: 20 }}>
                        {/* توزيع الأحداث حسب النوع */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                            <h4 style={{ marginBottom: 16 }}>الأحداث الأكثر تكراراً</h4>
                            {overview.actionBreakdown.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>لا توجد أحداث ضمن هذا النطاق الزمني.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {overview.actionBreakdown.map(item => (
                                        <div key={item.action}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                                                <code style={{ color: '#c4b5fd' }}>{item.action}</code>
                                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{item.count}</span>
                                            </div>
                                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
                                                <div style={{ height: '100%', borderRadius: 3, width: `${(item.count / maxAction) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* أكثر الفاعلين نشاطاً (Admins/SuperAdmins) */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                            <h4 style={{ marginBottom: 16 }}>أكثر المشرفين نشاطاً</h4>
                            {overview.topActors.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>لا توجد إجراءات إدارية ضمن هذا النطاق الزمني.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {overview.topActors.map(actor => (
                                        <div key={actor.actorId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{actor.fullName || 'مستخدم محذوف/مجهول'}</div>
                                                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>
                                                    {actor.email || '—'} · {actor.actorRole === 'SuperAdmin' ? 'مشرف عام' : 'مشرف'}
                                                </div>
                                            </div>
                                            <span className="badge">{actor.count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}