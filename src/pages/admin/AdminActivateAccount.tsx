// src/pages/admin/AdminActivateAccount.tsx
import { useState } from 'react'
import { useNav } from '../../context/NavContext'
import { useAuthApi } from '../../context/AuthApiContext'
import EdujarLogo from '../../components/EdujarLogo'
import OtpInput from '../../components/common/OtpInput'

interface Props {
    emailFromQuery: string
}

const strengthLabels = ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية جداً']
const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981', '#06b6d4']

export default function AdminActivateAccount({ emailFromQuery }: Props) {
    const { navigate } = useNav()
    const { resetPassword, getErrorMessage, resendVerification: _unused } = useAuthApi()

    const [email] = useState(emailFromQuery)
    const [code, setCode] = useState('')
    const [otpKey, setOtpKey] = useState(0)
    const [password, setPassword] = useState('')
    const [confirmPass, setConfirmPass] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [done, setDone] = useState(false)

    const strength = password.length === 0 ? 0
        : password.length < 15 ? 1
            : password.length < 20 ? 2
                : password.match(/[A-Z]/) && password.match(/[0-9]/) ? 4 : 3

    const handleSubmit = async () => {
        if (!email) {
            setError('رابط التفعيل غير صالح — البريد الإلكتروني مفقود من الرابط.')
            return
        }
        if (code.length !== 6) {
            setError('أدخل رمز التفعيل المكوّن من 6 أرقام كاملاً (تجدينه بالإيميل المُرسَل إليك).')
            return
        }
        if (password.length < 15) {
            setError('كلمة المرور يجب أن تكون 15 حرفاً على الأقل.')
            return
        }
        if (password !== confirmPass) {
            setError('كلمتا المرور غير متطابقتين.')
            return
        }
        setError('')
        setLoading(true)
        try {
            await resetPassword(email, code, password)
            setDone(true)
            setTimeout(() => navigate('login'), 2500)
        } catch (err) {
            setError(getErrorMessage(err))
            setCode('')
            setOtpKey(k => k + 1)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-shell">
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />
            </div>

            <div className="auth-header">
                <button onClick={() => navigate('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <EdujarLogo width={130} height={34} />
                </button>
            </div>

            <div className="auth-content">
                <div className="auth-card" style={{ maxWidth: 460 }}>
                    {!done ? (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: 26 }}>
                                <div style={{ fontSize: 36, marginBottom: 12 }}>🛡️</div>
                                <h1 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 8px' }}>تفعيل حساب المشرف</h1>
                                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                                    تم إنشاء حساب إداري خاص بك. أدخل رمز التفعيل المُرسَل إلى بريدك،
                                    وحدّد كلمة مرور لتسجيل دخولك لأول مرة.
                                </p>
                            </div>

                            <div style={{ marginBottom: 18 }}>
                                <label className="form-label">البريد الإلكتروني</label>
                                <input className="form-input" type="email" value={email} disabled />
                                {!email && (
                                    <div style={{ fontSize: 12, color: '#f87171', marginTop: 5 }}>
                                        ⚠️ لم يتم العثور على البريد بالرابط — تأكدي من فتح نفس الرابط المُرسَل بالإيميل كاملاً.
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: 18 }}>
                                <label className="form-label">رمز التفعيل (6 أرقام)</label>
                                <OtpInput key={otpKey} onComplete={setCode} error={!!error} disabled={loading} />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label className="form-label">كلمة المرور الجديدة</label>
                                <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                                {password.length > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: strength >= i ? strengthColors[strength] : 'rgba(255,255,255,0.1)' }} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: 11.5, color: strengthColors[strength] }}>{strengthLabels[strength]} (15 حرفاً على الأقل)</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label className="form-label">تأكيد كلمة المرور</label>
                                <input className="form-input" type="password" placeholder="••••••••" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} disabled={loading} />
                            </div>

                            {error && (
                                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? '...جارٍ التفعيل' : 'تفعيل الحساب وتعيين كلمة المرور'}
                            </button>

                            <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginTop: 16, textAlign: 'center' }}>
                                بعد تسجيل الدخول، سيُطلب منك تفعيل التحقق الثنائي (2FA) إلزاميًا قبل الوصول للوحة الإدارة.
                            </p>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
                            <h3 style={{ marginBottom: 10 }}>تم تفعيل حسابك بنجاح</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13.5 }}>جارٍ تحويلك لصفحة تسجيل الدخول...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}