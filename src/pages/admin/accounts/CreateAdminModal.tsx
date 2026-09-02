// src/pages/admin/accounts/CreateAdminModal.tsx
import { useState } from 'react'
import { ModalPortal } from '../../../components/common/ModalPortal'

interface Props {
    submitting: boolean
    onClose: () => void
    onSubmit: (email: string, fullName: string) => Promise<{ adminId: string; email: string } | null>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function CreateAdminModal({ submitting, onClose, onSubmit }: Props) {
    const [step, setStep] = useState<'form' | 'success'>('form')
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [touched, setTouched] = useState(false)
    const [copied, setCopied] = useState(false)

    const emailValid = EMAIL_RE.test(email)
    const nameValid = fullName.trim().length >= 2
    const isValid = emailValid && nameValid

    const handleSubmit = async () => {
        const result = await onSubmit(email.trim().toLowerCase(), fullName.trim())
        if (result) setStep('success')
    }

    const activationLink = `${window.location.origin}/admin/activate?email=${encodeURIComponent(email.trim().toLowerCase())}`

    const handleCopyLink = () => {
        navigator.clipboard.writeText(activationLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <ModalPortal>
            <div onClick={step === 'form' ? onClose : undefined} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
                <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 26, maxWidth: 460, width: '100%' }}>
                    {step === 'form' ? (
                        <>
                            <h3 style={{ marginTop: 0 }}>➕ إنشاء حساب مشرف (Admin)</h3>

                            <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                                <strong style={{ color: '#c4b5fd' }}>ℹ️ كيف يعمل التفعيل؟</strong>
                                <ol style={{ margin: '8px 0 0', paddingRight: 18 }}>
                                    <li>يُنشأ الحساب <strong>بدون كلمة مرور</strong>.</li>
                                    <li>يصل للبريد المُدخل رابط تفعيل مباشر + رمز مكوّن من 6 أرقام (صالح 15 دقيقة).</li>
                                    <li>بفتح الرابط، بريده يكون معبّى تلقائيًا — عليه بس إدخال الرمز وتحديد كلمة مرور أول مرة.</li>
                                    <li>بعد تسجيل الدخول، سيُطلب منه <strong>تفعيل التحقق الثنائي (2FA) إلزاميًا</strong> قبل الوصول للوحة الإدارة.</li>
                                </ol>
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label className="form-label">الاسم الكامل</label>
                                <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} disabled={submitting} />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label className="form-label">البريد الإلكتروني</label>
                                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => setTouched(true)} disabled={submitting} />
                                {touched && email && !emailValid && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>بريد إلكتروني غير صالح.</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button className="btn-secondary" onClick={onClose} disabled={submitting}>إلغاء</button>
                                <button className="btn-primary" disabled={submitting || !isValid} onClick={handleSubmit}>
                                    {submitting ? '...جارٍ الإنشاء' : 'إنشاء الحساب'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                                <h3 style={{ margin: '0 0 10px' }}>تم إنشاء الحساب بنجاح</h3>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13.5, lineHeight: 1.7 }}>
                                    تم إرسال رابط تفعيل + رمز إلى <strong style={{ color: '#c4b5fd' }}>{email}</strong>،
                                    صالح لمدة 15 دقيقة فقط.
                                </p>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, marginBottom: 18 }}>
                                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                                    رابط احتياطي (لو الإيميل ما وصل خلال دقائق):
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <code style={{ flex: 1, fontSize: 11.5, color: '#c4b5fd', wordBreak: 'break-all', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: 6 }}>
                                        {activationLink}
                                    </code>
                                    <button className="btn-outline" style={{ padding: '6px 10px', fontSize: 11.5, flexShrink: 0 }} onClick={handleCopyLink}>
                                        {copied ? '✓ نُسخ' : '📋 نسخ'}
                                    </button>
                                </div>
                                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                                    ⚠️ المستخدم لسا محتاج الرمز المُرسَل بالإيميل حتى لو استخدم هالرابط.
                                </div>
                            </div>

                            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
                                فهمت
                            </button>
                        </>
                    )}
                </div>
            </div>
        </ModalPortal>
    )
}