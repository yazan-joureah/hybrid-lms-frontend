// src/pages/GuardianManage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useNav } from '../context/NavContext'
import { useAuthApi } from '../context/AuthApiContext'
import EdujarLogo from '../components/EdujarLogo'

interface Props {
    token: string
}

type StatusValue = 'pending' | 'approved' | 'rejected' | 'expired'

const STATUS_META: Record<StatusValue, { icon: string; title: string; color: string }> = {
    pending: { icon: '⏳', title: 'بانتظار موافقة ولي الأمر', color: '#fbbf24' },
    approved: { icon: '✅', title: 'وافق ولي الأمر على الطلب', color: '#34d399' },
    rejected: { icon: '❌', title: 'رفض ولي الأمر الطلب', color: '#f87171' },
    expired: { icon: '⌛', title: 'انتهت صلاحية الطلب', color: 'rgba(255,255,255,0.5)' },
}

// ✅ استخراج التوكن (من ?token=... بالرابط، أو من sessionStorage بعد
// GUARDIAN_PENDING أثناء تسجيل الدخول) صار مسؤولية GuardianManageRoute
// بـ App.tsx عبر useSearchParams الحقيقي من react-router-dom — هاي الصفحة
// هلق تستقبل التوكن جاهز كـ prop بدل ما تعيد الاستخراج يدويًا بنفسها.
export default function GuardianManage({ token }: Props) {
    const { navigate } = useNav()
    const { guardianManageStatus, guardianManageResend, guardianManageUpdateEmail, getErrorMessage } = useAuthApi()

    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

    const [status, setStatus] = useState<StatusValue | null>(null)
    const [guardianEmail, setGuardianEmail] = useState('')
    const [resendCount, setResendCount] = useState(0)
    const [maxResendCount, setMaxResendCount] = useState(5)

    const [resending, setResending] = useState(false)
    const [resendMsg, setResendMsg] = useState('')

    const [editingEmail, setEditingEmail] = useState(false)
    const [newEmail, setNewEmail] = useState('')
    const [updatingEmail, setUpdatingEmail] = useState(false)
    const [updateError, setUpdateError] = useState('')

    const loadStatus = useCallback(async (t: string) => {
        setLoading(true)
        setLoadError('')
        try {
            const data = await guardianManageStatus(t)
            setStatus(data.status)
            setGuardianEmail(data.guardianEmail)
            setResendCount(data.resendCount)
            setMaxResendCount(data.maxResendCount)
        } catch (err) {
            setLoadError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (token) void loadStatus(token)
        else { setLoading(false); setLoadError('رابط غير صالح — لا يوجد رمز وصول.') }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    const handleResend = async () => {
        if (!token) return
        setResending(true)
        setResendMsg('')
        try {
            const res = await guardianManageResend(token)
            setResendCount(res.resendCount)
            setResendMsg('تم إعادة إرسال بريد الموافقة إلى ولي الأمر بنجاح.')
        } catch (err) {
            setResendMsg(getErrorMessage(err))
        } finally {
            setResending(false)
        }
    }

    const handleUpdateEmail = async () => {
        if (!token || !newEmail.trim()) return
        setUpdatingEmail(true)
        setUpdateError('')
        try {
            const res = await guardianManageUpdateEmail(token, newEmail.trim())
            setGuardianEmail(res.guardianEmail)
            setEditingEmail(false)
            setNewEmail('')
            setResendCount(0)
            setResendMsg('تم تحديث بريد ولي الأمر وإعادة إرسال طلب الموافقة.')
        } catch (err) {
            setUpdateError(getErrorMessage(err))
        } finally {
            setUpdatingEmail(false)
        }
    }

    const meta = status ? STATUS_META[status] : null
    const resendExhausted = resendCount >= maxResendCount

    return (
        <div style={{
            minHeight: '100vh', direction: 'rtl',
            background: 'linear-gradient(135deg, #080320 0%, #1a0550 40%, #0d0340 100%)',
            display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
        }}>
            <div style={{ padding: '20px 28px', position: 'relative', zIndex: 1 }}>
                <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <EdujarLogo width={130} height={34} />
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '100%', maxWidth: 460,
                    background: 'rgba(16,6,52,0.85)', backdropFilter: 'blur(28px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
                    padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', textAlign: 'center',
                }}>
                    {loading && (
                        <>
                            <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>...جارٍ تحميل حالة الطلب</p>
                        </>
                    )}

                    {!loading && loadError && (
                        <>
                            <div style={{ fontSize: 44, marginBottom: 14 }}>⚠️</div>
                            <h1 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 8px' }}>تعذّر تحميل الطلب</h1>
                            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>{loadError}</p>
                            <button className="btn-primary" onClick={() => navigate('login')}>العودة لتسجيل الدخول</button>
                        </>
                    )}

                    {!loading && !loadError && meta && (
                        <>
                            <div style={{ fontSize: 40, marginBottom: 14 }}>{meta.icon}</div>
                            <h1 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 6px' }}>{meta.title}</h1>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>
                                بريد ولي الأمر الحالي: <span style={{ color: '#a855f7', fontWeight: 600 }}>{guardianEmail}</span>
                            </p>

                            {status === 'pending' && (
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', marginBottom: 18, textAlign: 'center' }}>
                                        لم يستلم ولي أمرك البريد؟ يمكنك إعادة الإرسال أو تصحيح البريد إذا كتبته خطأ.
                                    </p>

                                    {resendMsg && (
                                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#34d399', marginBottom: 16, textAlign: 'center' }}>
                                            {resendMsg}
                                        </div>
                                    )}

                                    {!editingEmail ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <button
                                                className="btn-primary"
                                                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                                                onClick={handleResend}
                                                disabled={resending || resendExhausted}
                                            >
                                                {resending ? '...جارٍ الإرسال' : resendExhausted ? 'تم استنفاد محاولات الإعادة' : `إعادة إرسال البريد (${resendCount}/${maxResendCount})`}
                                            </button>
                                            <button
                                                className="btn-outline"
                                                style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
                                                onClick={() => { setEditingEmail(true); setNewEmail(guardianEmail); setUpdateError('') }}
                                            >
                                                ✎ تصحيح بريد ولي الأمر
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="form-label">بريد ولي الأمر الجديد</label>
                                            <input
                                                className="form-input"
                                                type="email"
                                                value={newEmail}
                                                onChange={e => setNewEmail(e.target.value)}
                                                placeholder="parent@example.com"
                                                disabled={updatingEmail}
                                                style={{ marginBottom: 12 }}
                                            />
                                            {updateError && (
                                                <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠️ {updateError}</div>
                                            )}
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleUpdateEmail} disabled={updatingEmail || !newEmail.trim()}>
                                                    {updatingEmail ? '...جارٍ الحفظ' : 'حفظ وإعادة الإرسال'}
                                                </button>
                                                <button className="btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingEmail(false)} disabled={updatingEmail}>
                                                    إلغاء
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {status === 'approved' && (
                                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }} onClick={() => navigate('login')}>
                                    تسجيل الدخول الآن
                                </button>
                            )}

                            {(status === 'rejected' || status === 'expired') && (
                                <div>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>
                                        لا يمكن إعادة الإرسال أو التعديل لهذا الطلب. تواصل مع الدعم الفني لإعادة فتح طلب جديد.
                                    </p>
                                    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }} onClick={() => navigate('login')}>
                                        العودة لتسجيل الدخول
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}