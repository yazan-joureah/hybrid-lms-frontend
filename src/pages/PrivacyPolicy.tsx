// src/pages/PrivacyPolicy.tsx
import { useState } from 'react'
import { useNav } from '../context/NavContext'
import EdujarLogo from '../components/EdujarLogo'

type Lang = 'ar' | 'en'

const CONTENT: Record<Lang, { title: string; updated: string; sections: { h: string; body: string[] }[] }> = {
    ar: {
        title: 'سياسة الخصوصية — منصة Hybrid LMS',
        updated: 'آخر تحديث: [التاريخ]',
        sections: [
            {
                h: '1. من نحن',
                body: [
                    'منصة Hybrid LMS هي منصة تعليمية إلكترونية (نظام إدارة تعلّم هجين) تتيح للطلاب والمدرّسين التسجيل بكورسات متزامنة (جلسات مباشرة) وغير متزامنة (محتوى مسجَّل)، مع اختبارات، تقييم جماعي بين الأقران، شهادات رقمية موثّقة، ونظام دفع إلكتروني.',
                    'هذه السياسة تشرح البيانات التي نجمعها، لماذا نجمعها، كيف نحميها، وحقوقك تجاهها.',
                ],
            },
            {
                h: '2. البيانات التي نجمعها',
                body: [
                    '2.1 بيانات الحساب الأساسية: الاسم الكامل، البريد الإلكتروني، رقم الهاتف (اختياري)، تاريخ الميلاد، الجنس، نبذة شخصية، صورة الملف الشخصي، كلمة المرور (مُشفَّرة — لا نخزّنها كنص صريح أبداً).',
                    '2.2 بيانات توثيق الهوية (KYC): صورة وثيقة هوية رسمية + صورة سيلفي، مشفَّرة بخوارزمية AES-256-GCM بمفتاح مُشتق خصيصاً لكل مستخدم (HKDF-SHA256). الوصول لفك التشفير مقتصر على المشرفين المخوَّلين فقط.',
                    '2.3 بيانات المدفوعات: تُعالَج عبر معالج دفع خارجي موثوق. لا نخزّن بيانات بطاقتك الائتمانية الكاملة على خوادمنا.',
                    '2.4 بيانات الجلسات المباشرة: توقيت الانضمام/المغادرة ومدة الحضور، لاحتساب نسبة الحضور المطلوبة لإتمام الكورس.',
                    '2.5 بيانات تسجيل الدخول عبر Google: الاسم والبريد الإلكتروني فقط.',
                    '2.6 بيانات ولي الأمر (للقاصرين تحت 18 سنة): بريد إلكتروني لطلب موافقة صريحة قبل تفعيل الحساب.',
                    '2.7 بيانات تقنية وأمنية: عنوان IP، معرّف الجهاز، توقيت تسجيلات الدخول، لأغراض أمنية بحتة.',
                ],
            },
            {
                h: '3. لماذا نجمع بياناتك',
                body: [
                    'إنشاء وإدارة حسابك، توثيق هويتك (شرط لإصدار الشهادات وصلاحيات التدريس)، معالجة المدفوعات والاستردادات، احتساب حضورك وإصدار شهادتك، حماية حسابك من الاختراق، الامتثال لحماية القاصرين، وتحسين المنصة.',
                ],
            },
            {
                h: '4. كيف نحمي بياناتك',
                body: [
                    'تشفير جميع البيانات الحساسة بخوارزميات معتمدة دولياً.',
                    'سجل تدقيق غير قابل للتعديل لكل إجراء حسّاس.',
                    'مصادقة متعددة العوامل (MFA) عبر TOTP، إلزامية للمدرّسين والمشرفين.',
                    'جلسات محمية بكوكيز HttpOnly + Secure + SameSite=None، تنتهي خلال 7 أيام، وتُلغى فوراً عند تغيير كلمة المرور.',
                    'قفل تلقائي للحساب عند تكرار محاولات الدخول الفاشلة.',
                ],
            },
            {
                h: '5. مشاركة بياناتك مع أطراف ثالثة',
                body: [
                    'لا نبيع بياناتك لأي طرف ثالث. نشارك بيانات محدودة فقط مع: معالج الدفع، مزوّد البريد الإلكتروني، خدمة الاجتماعات المرئية، مزوّد تسجيل الدخول الاجتماعي (Google)، والجهات القانونية عند وجود أمر قضائي ملزم.',
                ],
            },
            {
                h: '6. الاحتفاظ بالبيانات وحذفها',
                body: [
                    'عند حذف حسابك، يبقى "محذوفاً مؤقتاً" لمدة 30 يوماً قابلة للاسترجاع الكامل.',
                    'بعد انقضاء المهلة دون استرجاع، تُخفى بياناتك الشخصية آلياً ونهائياً، مع الاحتفاظ بسجلات الفواتير وسجلات التدقيق بشكل مجهول الهوية فقط.',
                    'وثائق KYC المشفَّرة تُحذف نهائياً عند إخفاء الحساب.',
                ],
            },
            {
                h: '7. خصوصية القاصرين',
                body: [
                    'تسجيل القاصر مشروط بموافقة صريحة من ولي أمره. القاصر ممنوع كلياً من التسجيل كمدرّس. أي تعارض بين تاريخ الميلاد المُسجَّل والعمر الموثَّق بالوثيقة يُعلِّق التوثيق تلقائياً لحين التصحيح وإعادة موافقة ولي الأمر، دون تعليق الحساب بالكامل.',
                ],
            },
            {
                h: '8. حقوقك',
                body: [
                    'الوصول لبياناتك وطلب نسخة منها، تصحيح البيانات غير الدقيقة (تاريخ الميلاد يُقفَل بعد توثيق الهوية بنجاح)، طلب حذف حسابك بالكامل، سحب موافقتك على تسجيل الدخول الاجتماعي، وتقديم شكوى لأي جهة تنظيمية مختصة.',
                ],
            },
            {
                h: '9. الكوكيز',
                body: ['نستخدم كوكيز ضرورية فقط لإدارة جلسة الدخول. لا نستخدم كوكيز تتبّع إعلاني أو تحليلات جهات ثالثة.'],
            },
            {
                h: '10. التعديلات على هذه السياسة',
                body: ['قد نُحدِّث هذه السياسة من وقت لآخر، وسنُعلمك بأي تغيير جوهري قبل سريانه.'],
            },
            {
                h: '11. التواصل معنا',
                body: ['لأي استفسار بخصوص خصوصيتك، تواصل معنا عبر: [بريد الدعم]'],
            },
        ],
    },
    en: {
        title: 'Privacy Policy — Hybrid LMS Platform',
        updated: 'Last updated: [DATE]',
        sections: [
            {
                h: '1. Who We Are',
                body: [
                    'Hybrid LMS is an online learning platform (hybrid LMS) enabling students and instructors to enroll in synchronous (live) and asynchronous (recorded) courses, with quizzes, peer assessment, digital certificates, and an integrated payment system.',
                    'This policy explains what data we collect, why we collect it, how we protect it, and your rights over it.',
                ],
            },
            {
                h: '2. Data We Collect',
                body: [
                    '2.1 Core Account Data: full name, email, phone (optional), date of birth, gender, bio, profile picture, password (stored only as a secure hash).',
                    '2.2 Identity Verification (KYC) Data: an official ID document photo + a live selfie, encrypted with AES-256-GCM using a per-user derived key (HKDF-SHA256). Decryption access is restricted to authorized reviewers only.',
                    '2.3 Payment Data: processed via a trusted third-party payment processor. We never store your full card details on our servers.',
                    '2.4 Live Session Data: join/leave timestamps and attendance duration, used to calculate required attendance percentage.',
                    '2.5 Google Sign-In Data: only your name and email address.',
                    '2.6 Guardian Data (for minors under 18): a guardian email to request explicit approval before account activation.',
                    '2.7 Technical & Security Data: IP address, device identifier, login timestamps, for security purposes only.',
                ],
            },
            {
                h: '3. Why We Collect Your Data',
                body: [
                    'Creating and managing your account, verifying your identity (required for certificates and teaching privileges), processing payments and refunds, calculating attendance and issuing certificates, protecting your account, complying with minor-protection requirements, and improving the platform.',
                ],
            },
            {
                h: '4. How We Protect Your Data',
                body: [
                    'Encryption of all sensitive data using internationally recognized algorithms.',
                    'An immutable audit log for every sensitive action.',
                    'Mandatory MFA (TOTP) for instructor and admin accounts.',
                    'Sessions protected via HttpOnly + Secure + SameSite=None cookies, expiring within 7 days, invalidated immediately on password change.',
                    'Automatic account lockout after repeated failed login attempts.',
                ],
            },
            {
                h: '5. Sharing Your Data',
                body: [
                    'We never sell your data. We share limited data only with: the payment processor, email service provider, video conferencing service, Google (only if used), and legal authorities under a binding court order.',
                ],
            },
            {
                h: '6. Data Retention & Deletion',
                body: [
                    'Deleted accounts remain "soft-deleted" and fully restorable for 30 days.',
                    'After 30 days without restoration, personal data is automatically and permanently anonymized, while invoice and audit records are retained only in anonymized form.',
                    'Encrypted KYC documents are permanently deleted upon anonymization.',
                ],
            },
            {
                h: "7. Children's Privacy",
                body: [
                    'Minor registration requires explicit guardian approval. Minors cannot register as "Instructor". Any age discrepancy detected during KYC review suspends verification (not the whole account) pending correction and renewed guardian approval.',
                ],
            },
            {
                h: '8. Your Rights',
                body: [
                    'Access your data, correct inaccuracies (date of birth locks after successful KYC), request full account deletion, withdraw Google sign-in consent, and file a complaint with any relevant regulator.',
                ],
            },
            {
                h: '9. Cookies',
                body: ['We use only strictly necessary session cookies. No advertising or third-party analytics cookies.'],
            },
            {
                h: '10. Changes to This Policy',
                body: ['We may update this policy periodically and will notify you of material changes before they take effect.'],
            },
            {
                h: '11. Contact Us',
                body: ['For any privacy inquiry, contact us at: [support email]'],
            },
        ],
    },
}

export default function PrivacyPolicy() {
    const { navigate } = useNav()
    const [lang, setLang] = useState<Lang>('ar')
    const data = CONTENT[lang]
    const isRtl = lang === 'ar'

    return (
        <div style={{
            minHeight: '100vh', direction: isRtl ? 'rtl' : 'ltr',
            background: 'linear-gradient(135deg, #080320 0%, #1a0550 40%, #0d0340 100%)',
            display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
        }}>
            <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <EdujarLogo width={130} height={34} />
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => setLang('ar')}
                        className={lang === 'ar' ? 'btn-primary' : 'btn-outline'}
                        style={{ padding: '6px 16px', fontSize: 13 }}
                    >العربية</button>
                    <button
                        onClick={() => setLang('en')}
                        className={lang === 'en' ? 'btn-primary' : 'btn-outline'}
                        style={{ padding: '6px 16px', fontSize: 13 }}
                    >English</button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '20px 16px 60px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '100%', maxWidth: 760,
                    background: 'rgba(16,6,52,0.85)', backdropFilter: 'blur(28px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
                    padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                    textAlign: isRtl ? 'right' : 'left',
                }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{data.title}</h1>
                    <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', margin: '0 0 28px' }}>{data.updated}</p>

                    {data.sections.map((s) => (
                        <div key={s.h} style={{ marginBottom: 24 }}>
                            <h2 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 10, color: '#c4b5fd' }}>{s.h}</h2>
                            {s.body.map((p, i) => (
                                <p key={i} style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.9, margin: '0 0 8px' }}>{p}</p>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}