// src/pages/student/Checkout.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { BASE_URL } from '../../../config/api'
import { useNav } from '../../../context/NavContext'
import { useToast } from '../../../context/ToastContext'
import { courseService, type Enrollment } from '../../../services/courseService'
import { payService, formatCurrency } from '../../../services/payService'
import { getErrorMessage } from '../../../utils/errorMessages'
import { SkeletonLoader } from '../../../components/common/Loading'

// مفتاح تخزين مؤقت لتمرير enrollmentId لصفحة الدفع — نظام التنقل هون
// (NavContext) ما بيدعم route params متل react-router، فبنتّبع نفس نمط
// SELECTED_ENROLLMENT_KEY الموجود أصلاً بـ MyCourses.tsx
export const CHECKOUT_ENROLLMENT_KEY = 'checkout_enrollment_id'

// ⚠️ افتراض غير مؤكد (متل نفس أسلوب التعليقات بـ AuthApiContext.tsx):
// بافترض إنو صورة الغلاف متاحة عبر GET مباشر (زي getProfilePictureUrl)
// مش عبر blob محمي بـ Authorization header. لازم تأكيد من الباك قبل الاعتماد.
const getCourseCoverUrl = (courseId: string) => `${BASE_URL}/courses/${courseId}/cover-image`

export default function Checkout() {
    const { navigate } = useNav()
    const { error: toastError } = useToast()
    const { enrollmentId } = useParams<{ enrollmentId: string }>()

    const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
    const [loading, setLoading] = useState(true)
    const [redirecting, setRedirecting] = useState(false)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        void loadOrder()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enrollmentId])

    const loadOrder = async () => {
        if (!enrollmentId) {
            setNotFound(true)
            setLoading(false)
            return
        }
        setLoading(true)
        try {

            const list = await courseService.getMyCourses()
            const found = list.find(e => e._id === enrollmentId)

            if (!found) {
                setNotFound(true)
                return
            }
            if (found.status !== 'pending_payment') {

                navigate('my-courses')
                return
            }
            setEnrollment(found)
        } catch (err) {
            toastError(getErrorMessage(err))
            setNotFound(true)
        } finally {
            setLoading(false)
        }
    }

    const handlePay = async () => {
        if (!enrollment) return
        setRedirecting(true)
        try {
            // ⚠️ نرسل فقط enrollment._id — الباك هو من يحسب السعر من الكورس
            // مباشرة. لا يوجد أي amount/price يُرسل من الفرونت هون، وهاد مقصود
            // ومهم أمنياً (لمنع التلاعب بالسعر من طرف العميل).
            const result = await payService.initiatePayment(enrollment._id)
            if (result?.checkoutUrl) {
                // مغادرة فعلية لموقعنا نحو صفحة الدفع الآمنة تبع Stripe —
                // ما بنتعامل مع بيانات البطاقة إطلاقاً داخل تطبيقنا (PCI DSS)
                window.location.href = result.checkoutUrl
            } else {
                throw new Error('NO_CHECKOUT_URL')
            }
        } catch (err) {
            toastError(getErrorMessage(err))
            setRedirecting(false)
        }
    }

    if (loading) {
        return (
            <div className="page-wrapper">
                <SkeletonLoader type="card" count={1} />
            </div>
        )
    }

    if (notFound || !enrollment) {
        return (
            <div className="page-wrapper">
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>🧾</div>
                    <h3 style={{ marginBottom: 8 }}>لا يوجد طلب دفع صالح</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>ربما تم الدفع مسبقاً أو انتهت صلاحية الطلب.</p>
                    <button className="btn-primary" onClick={() => navigate('my-courses')}>العودة إلى كورساتي</button>
                </div>
            </div>
        )
    }

    const course = enrollment.course_id

    return (
        <div className="page-wrapper" style={{ maxWidth: 900 }}>
            <style>{`
                @keyframes checkout-spin { to { transform: rotate(360deg); } }
                .checkout-spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255,255,255,0.35);
                    border-top-color: #fff;
                    border-radius: 50%;
                    display: inline-block;
                    animation: checkout-spin 0.7s linear infinite;
                    margin-left: 8px;
                }
            `}</style>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 22 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
                    <h2 style={{ marginTop: 0 }}>مراجعة الطلب</h2>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', margin: '16px 0' }}>
                        <img
                            src={getCourseCoverUrl(course?._id || '')}
                            alt={course?.title}
                            style={{ width: 96, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: 'rgba(255,255,255,0.06)' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0' }}
                        />
                        <div>
                            <h4 style={{ margin: '0 0 4px' }}>{course?.title}</h4>
                            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 13 }}>{course?.category}</p>
                            <span className="badge" style={{ marginTop: 6, display: 'inline-block' }}>
                                {course?.is_synchronous ? 'كورس مباشر' : 'كورس ذاتي التوقيت'}
                            </span>
                        </div>
                    </div>

                    <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'rgba(255,255,255,0.6)' }}>
                        <span>سعر الكورس</span>
                        <span>{formatCurrency(course?.price || 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 700, fontSize: 17, borderTop: '1px dashed rgba(255,255,255,0.15)', marginTop: 6 }}>
                        <span>الإجمالي</span>
                        <span>{formatCurrency(course?.price || 0)}</span>
                    </div>

                    <button
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '13px', display: 'flex', alignItems: 'center' }}
                        onClick={handlePay}
                        disabled={redirecting}
                    >
                        {redirecting ? (
                            <>جارٍ التحويل إلى بوابة الدفع<span className="checkout-spinner" /></>
                        ) : (
                            '🔒 الدفع الآمن عبر Stripe'
                        )}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>
                        لن تُخزَّن بيانات بطاقتك على خوادمنا — يتم التحويل مباشرة إلى صفحة Stripe الآمنة.
                    </p>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 22 }}>
                    <h4 style={{ marginTop: 0 }}>لماذا تثق بنا؟</h4>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5, color: 'rgba(255,255,255,0.7)' }}>
                        <li>🔐 معالجة الدفع عبر Stripe (متوافقة مع PCI DSS)</li>
                        <li>↩️ يمكن تقديم طلب استرداد بعد الدفع من صفحة "سجل المدفوعات"</li>
                        <li>✅ وصول فوري للكورس بعد تأكيد الدفع</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}