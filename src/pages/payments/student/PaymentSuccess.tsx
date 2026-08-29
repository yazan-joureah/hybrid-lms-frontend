// src/pages/student/PaymentSuccess.tsx
import { useState, useEffect, useRef } from 'react'
import { useNav } from '../../../context/NavContext'
import { useToast } from '../../../context/ToastContext'
import { payService, type Payment } from '../../../services/payService'
import { getErrorMessage } from '../../../utils/errorMessages'

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 15 // ~30 ثانية — عادة تأكيد الدفع بالباك (عبر webhook Stripe الموقّع) بيوصل خلال ثوانٍ

type Phase = 'verifying' | 'paid' | 'pending' | 'failed' | 'error'

interface Props {
    paymentId: string | null
}

// ⚠️ هاي الصفحة تتحقق من حالة الدفع عبر polling على GET /pay/payments/:id
// فقط — ما بترسل أي نداء يزعم "الدفع تم" من الفرونت للباك (زي
// /payments/webhook يلي كان بالنسخة التانية). تأكيد الدفع الحقيقي بصير
// حصرياً عبر webhook موقّع من Stripe مباشرة للباك، بمعزل تام عن هاي الصفحة.
export default function PaymentSuccess({ paymentId }: Props) {
    const { navigate } = useNav()
    const { error: toastError } = useToast()

    const [phase, setPhase] = useState<Phase>('verifying')
    const [payment, setPayment] = useState<Payment | null>(null)
    const pollCount = useRef(0)

    useEffect(() => {
        if (!paymentId) {
            setPhase('error')
            return
        }
        let timer: ReturnType<typeof setTimeout>
        const poll = async () => {
            try {
                const p = await payService.getPaymentStatus(paymentId)
                setPayment(p)

                if (p?.status === 'paid') { setPhase('paid'); return }
                if (p?.status === 'failed') { setPhase('failed'); return }

                pollCount.current += 1
                if (pollCount.current >= MAX_POLLS) { setPhase('pending'); return }
                timer = setTimeout(poll, POLL_INTERVAL_MS)
            } catch (err) {
                toastError(getErrorMessage(err))
                setPhase('error')
            }
        }
        void poll()
        return () => clearTimeout(timer)
    }, [paymentId, toastError])

    const courseTitle = payment && typeof payment.course_id === 'object' ? payment.course_id.title : null

    return (
        <div className="page-wrapper" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '36px 28px', textAlign: 'center' }}>
                {phase === 'verifying' && (
                    <>
                        <div style={{ fontSize: 44, marginBottom: 14 }}>⏳</div>
                        <h2 style={{ margin: '0 0 10px' }}>جارِ تأكيد عملية الدفع...</h2>
                        <p style={{ color: 'rgba(255,255,255,0.55)' }}>لا تُغلق هذه الصفحة، الأمر يستغرق ثوانٍ قليلة.</p>
                    </>
                )}

                {phase === 'paid' && (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
                        <h2 style={{ margin: '0 0 10px' }}>تم الدفع بنجاح!</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                            {courseTitle ? `تم تفعيل تسجيلك في كورس "${courseTitle}".` : 'تم تفعيل تسجيلك في الكورس.'}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12.5, marginTop: -4 }}>تم إرسال الفاتورة إلى بريدك الإلكتروني.</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
                            <button className="btn-primary" onClick={() => navigate('my-courses')}>الذهاب إلى كورساتي</button>
                            <button className="btn-outline" onClick={() => { sessionStorage.setItem('profile_initial_tab', 'billing'); navigate('profile') }}>
                                عرض سجل المدفوعات
                            </button>
                        </div>
                    </>
                )}

                {phase === 'pending' && (
                    <>
                        <div style={{ fontSize: 44, marginBottom: 14 }}>⏳</div>
                        <h2 style={{ margin: '0 0 10px' }}>الدفع قيد التأكيد</h2>
                        <p style={{ color: 'rgba(255,255,255,0.55)' }}>استلمنا طلبك ونحن بانتظار تأكيد نهائي من بوابة الدفع. سيتم تفعيل الكورس تلقائياً خلال دقائق.</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
                            <button className="btn-primary" onClick={() => window.location.reload()}>تحقق مجدداً</button>
                            <button className="btn-outline" onClick={() => navigate('student-dashboard')}>العودة إلى لوحتي</button>
                        </div>
                    </>
                )}

                {phase === 'failed' && (
                    <>
                        <div style={{ fontSize: 44, marginBottom: 14 }}>❌</div>
                        <h2 style={{ margin: '0 0 10px' }}>فشلت عملية الدفع</h2>
                        <p style={{ color: 'rgba(255,255,255,0.55)' }}>{payment?.failure_reason || 'حدث خطأ أثناء معالجة الدفع.'}</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
                            <button className="btn-primary" onClick={() => navigate('my-courses')}>إعادة المحاولة من كورساتي</button>
                            <button className="btn-outline" onClick={() => navigate('student-dashboard')}>العودة إلى لوحتي</button>
                        </div>
                    </>
                )}

                {phase === 'error' && (
                    <>
                        <div style={{ fontSize: 44, marginBottom: 14 }}>⚠️</div>
                        <h2 style={{ margin: '0 0 10px' }}>تعذّر تأكيد حالة الدفع</h2>
                        <p style={{ color: 'rgba(255,255,255,0.55)' }}>تحقق من سجل مدفوعاتك أو تواصل مع الدعم إن استمرت المشكلة.</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
                            <button className="btn-primary" onClick={() => { sessionStorage.setItem('profile_initial_tab', 'billing'); navigate('profile') }}>
                                سجل المدفوعات
                            </button>
                            <button className="btn-outline" onClick={() => navigate('student-dashboard')}>العودة إلى لوحتي</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}