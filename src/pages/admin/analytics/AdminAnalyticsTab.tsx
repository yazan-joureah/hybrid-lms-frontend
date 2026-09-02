// src/pages/admin/analytics/AdminAnalyticsTab.tsx
import { useNav } from '../../../context/NavContext'
import { useAdminAnalyticsOverview } from '../../../hooks/admin/useAdminAnalyticsOverview'
import { isSuperAdminRevenue } from '../../../services/adminAnalyticsService'
import { SkeletonLoader } from '../../../components/common/Loading'

const ALERT_TYPE_LABELS: Record<string, string> = {
    LOW_PERFORMANCE: 'أداء منخفض بالاختبارات',
    LOW_ATTENDANCE: 'حضور منخفض',
}

const SEVERITY_COLORS: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
}

function RateCard({ label, value, icon, color }: { label: string; value: number | null; icon: string; color: string }) {
    const display = value == null ? '—' : `${Math.round(value * 100)}%`
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, minHeight: 110 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: `${color}22`, border: `1px solid ${color}44`, marginBottom: 10 }}>{icon}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginTop: 4 }}>{display}</div>
            {value == null && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>لا توجد بيانات كافية بعد</div>}
        </div>
    )
}

export function AdminAnalyticsTab() {
    const { role } = useNav()
    const { overview, loading } = useAdminAnalyticsOverview()

    if (loading || !overview) {
        return <SkeletonLoader type="card" count={3} />
    }

    const { free, paid } = overview.enrollmentDistribution
    const totalEnrollments = free + paid
    const freePercent = totalEnrollments > 0 ? Math.round((free / totalEnrollments) * 100) : 0
    const paidPercent = totalEnrollments > 0 ? 100 - freePercent : 0

    return (
        <div>
            <div className="admin-summary-grid" style={{ marginBottom: 24 }}>
                <RateCard label="معدل إكمال الكورسات (المنصة)" value={overview.platformCompletionRate} icon="🎓" color="#7c3aed" />
                <RateCard label="معدل الحضور (المنصة)" value={overview.platformAttendanceRate} icon="✅" color="#10b981" />

                {isSuperAdminRevenue(overview.revenue) ? (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, minHeight: 110 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: 10 }}>💰</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5 }}>إجمالي الإيرادات المدفوعة</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 4 }}>{overview.revenue.totalAmount.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{overview.revenue.paidTransactionCount} معاملة ناجحة</div>
                    </div>
                ) : (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, minHeight: 110 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: 10 }}>💰</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5 }}>نسبة الاشتراكات المدفوعة</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                            {overview.revenue.paidSharePercent == null ? '—' : `${overview.revenue.paidSharePercent}%`}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>الأرقام المطلقة متاحة للمشرف العام فقط</div>
                    </div>
                )}
            </div>

            <div className="admin-two-col" style={{ gap: 20 }}>
                {/* Enrollment distribution */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                    <h4 style={{ marginBottom: 16 }}>توزيع التسجيلات (نشطة/مكتملة)</h4>
                    {totalEnrollments === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>لا توجد تسجيلات بعد.</p>
                    ) : (
                        <>
                            <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 12 }}>
                                <div style={{ width: `${freePercent}%`, background: '#06b6d4' }} />
                                <div style={{ width: `${paidPercent}%`, background: '#7c3aed' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 18, fontSize: 12.5, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#06b6d4' }} />
                                    مجانية: {free} ({freePercent}%)
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#7c3aed' }} />
                                    مدفوعة: {paid} ({paidPercent}%)
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Active alerts */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                    <h4 style={{ marginBottom: 16 }}>تنبيهات نشطة ({overview.activeAlerts.length})</h4>
                    {overview.activeAlerts.length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>لا توجد تنبيهات حالياً — كل الكورسات ضمن المعدل الطبيعي.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                            {overview.activeAlerts.map((a, i) => {
                                const color = SEVERITY_COLORS[a.severity] || '#94a3b8'
                                return (
                                    <div key={`${a.courseId}-${a.type}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: `${color}11`, border: `1px solid ${color}33` }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.courseTitle}</div>
                                            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>{ALERT_TYPE_LABELS[a.type] || a.type}</div>
                                        </div>
                                        <span className="badge" style={{ background: `${color}22`, color, border: `1px solid ${color}44`, flexShrink: 0 }}>
                                            {Math.round(a.value * 100)}% / {Math.round(a.threshold * 100)}%
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}