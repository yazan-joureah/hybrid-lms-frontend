
// src/pages/GuardianApprove.tsx
// UC-AUTH-02 — نموذج موافقة ولي الأمر الفعلي (مختلف عن GuardianManage.tsx
// الذي يخدم الطالب فقط). لا يستدعي أي GET عند التحميل عمداً — الباك اند
// (guardianApprovePagePlaceholder) لا يعيد بيانات حقيقية أصلاً، والتنفيذ
// الفعلي (POST) يحدث فقط بضغطة صريحة من ولي الأمر — هذا يمنع تفعيل
// الموافقة تلقائياً عبر ماسحات الروابط في أنظمة البريد (Prefetching).
import { useState } from 'react'
import { useNav } from '../context/NavContext'
import { useAuthApi } from '../context/AuthApiContext'
import EdujarLogo from '../components/EdujarLogo'

interface Props {
    token: string
}

type Decision = 'approve' | 'decline'
type Relationship = 'parent' | 'guardian'

export default function GuardianApprove({ token }: Props) {
    const { navigate } = useNav()
    const { guardianApprove, getErrorMessage } = useAuthApi()

    const [guardianFullName, setGuardianFullName] = useState('')
    const [relationship, setRelationship] = useState<Relationship | ''>('')
    const [decision, setDecision] = useState<Decision | null>(null)
    const [consent, setConsent] = useState(false)

    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [result, setResult] = useState<{ status: string; message: string } | null>(null)

    const canSubmit =
        !!token &&
        guardianFullName.trim().length > 0 &&
        !!relationship &&
        !!decision &&
        (decision === 'decline' || consent)

    const handleSubmit = async () => {
        if (!canSubmit || !decision || !relationship) return
        setSubmitting(true)
        setSubmitError('')
        try {
            const res = await guardianApprove({
                token,
                decision,
                guardianFullName: guardianFullName.trim(),
                relationship,
                consent: decision === 'approve' ? true : undefined,
            })
            setResult(res)
        } catch (err) {
            setSubmitError(getErrorMessage(err))
        } finally {
            setSubmitting(false)
        }
    }

    const invalidLink = !token

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
                    width: '100%', maxWidth: 480,
                    background: 'rgba(16,6,52,0.85)', backdropFilter: 'blur(28px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
                    padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', textAlign: 'center',
                }}>
                    {invalidLink && (
                        <>
                            <div style={{ fontSize: 44, marginBottom: 14 }}>⚠️</div>
                            <h1 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 8px' }}>رابط غير صالح</h1>
                            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)' }}>
                                لا يوجد رمز وصول في هذا الرابط. تأكد من فتح الرابط الكامل من البريد الإلكتروني.
                            </p>
                        </>
                    )}

                    {!invalidLink && result && (
                        <>
                            <div style={{ fontSize: 40, marginBottom: 14 }}>
                                {result.status === 'active' ? '✅' : 'ℹ️'}
                            </div>
                            <h1 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 8px' }}>تم تسجيل قرارك</h1>
                            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)' }}>{result.message}</p>
                        </>
                    )}

                    {!invalidLink && !result && (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 36, marginBottom: 12, textAlign: 'center' }}>👨‍👩‍👧</div>
                            <h1 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 6px', textAlign: 'center' }}>
                                طلب موافقة ولي الأمر
                            </h1>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 22px', textAlign: 'center' }}>
                                يرجى تعبئة بياناتك أدناه لاتخاذ قرارك بخصوص طلب تسجيل الطالب في المنصة.
                            </p>

                            <label className="form-label">اسمك الكامل</label>
                            <input
                                className="form-input"
                                type="text"
                                value={guardianFullName}
                                onChange={e => setGuardianFullName(e.target.value)}
                                placeholder="الاسم الكامل"
                                disabled={submitting}
                                style={{ marginBottom: 14 }}
                            />

                            <label className="form-label">صلتك بالطالب</label>
                            <select
                                className="form-input"
                                value={relationship}
                                onChange={e => setRelationship(e.target.value as Relationship)}
                                disabled={submitting}
                                style={{ marginBottom: 18 }}
                            >
                                <option value="">اختر...</option>
                                <option value="parent">أب / أم</option>
                                <option value="guardian">وصي قانوني</option>
                            </select>

                            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                                <button
                                    type="button"
                                    className="btn-outline"
                                    style={{
                                        flex: 1, justifyContent: 'center',
                                        borderColor: decision === 'decline' ? '#f87171' : undefined,
                                        color: decision === 'decline' ? '#f87171' : undefined,
                                    }}
                                    onClick={() => setDecision('decline')}
                                    disabled={submitting}
                                >
                                    رفض الطلب
                                </button>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ flex: 1, justifyContent: 'center', opacity: decision === 'approve' ? 1 : 0.55 }}
                                    onClick={() => setDecision('approve')}
                                    disabled={submitting}
                                >
                                    الموافقة على الطلب
                                </button>
                            </div >

                            {decision === 'approve' && (
                                <label style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 8,
                                    fontSize: 12.5, color: 'rgba(255,255,255,0.65)',
                                    marginBottom: 18, cursor: 'pointer',
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={consent}
                                        onChange={e => setConsent(e.target.checked)}
                                        disabled={submitting}
                                        style={{ marginTop: 2 }}
                                    />
                                    أقرّ بأنني ولي أمر هذا الطالب وأوافق على تسجيله في المنصة وفق الشروط والأحكام.
                                </label >
                            )}

                            {decision === 'decline' && (
                                <div style={{
                                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                                    borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: 'rgba(255,255,255,0.6)',
                                    marginBottom: 18, textAlign: 'center',
                                }}>
                                    سيتم إشعار الطالب لتصحيح بيانات ولي الأمر أو التواصل معك مباشرة.
                                </div >
                            )}

                            {submitError && (
                                <div style={{ color: '#f87171', fontSize: 13, marginBottom: 14, textAlign: 'center' }}>
                                    ⚠️ {submitError}
                                </div>
                            )}

                            <button
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center', padding: '13px' }}
                                onClick={handleSubmit}
                                disabled={!canSubmit || submitting}
                            >
                                {submitting ? '...جارٍ الإرسال' : 'تأكيد القرار'}
                            </button >
                        </div >
                    )}
                </div >
            </div >
        </div >
    )
}