import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import API from '../config/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { defaultPages, PAGE_TO_PATH, roleFromApiRole } from '../context/NavContext'
import type { KycStatus } from '../types'
import { getErrorMessage } from '../utils/errorMessages'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png'])
const REJECTED_MESSAGE = 'تم رفض طلب التحقق السابق، يمكنك إعادة التقديم بمستندات جديدة.'
const PENDING_MESSAGE = 'طلبك قيد المراجعة، لا يمكن تقديم طلب جديد'
const SUCCESS_MESSAGE = 'تم إرسال طلبك بنجاح، سيتم مراجعته خلال 48–72 ساعة'

function normalizeKycStatus(value: unknown): KycStatus {
  switch (value) {
    case 'pending_review':
      return 'pending_review'
    case 'rejected':
      return 'rejected'
    case 'verified':
      return 'verified'
    case 'not_submitted':
      return 'not_submitted'
    default:
      return 'not_submitted'
  }
}

async function submitKycRequest(idDocument: File, selfie: File) {
  // TODO: Confirm exact KYC submission endpoint and multipart field names with backend team.
  const formData = new FormData()
  formData.append('id_document', idDocument)
  formData.append('selfie', selfie)

  await API.post('/kyc/requests', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export default function KycSubmit() {
  const { user, refreshSession } = useAuth()
  const { showMsg } = useToast()

  const [pageStatus, setPageStatus] = useState<KycStatus>(() => {
    const rawValue = user
      ? (user as Record<string, unknown>).kyc_status ?? (user as Record<string, unknown>).kycStatus ?? (user as Record<string, unknown>).verification_status ?? (user as Record<string, unknown>).status
      : undefined
    return normalizeKycStatus(rawValue)
  })
  const [submitSucceeded, setSubmitSucceeded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [idDocumentError, setIdDocumentError] = useState('')
  const [selfieError, setSelfieError] = useState('')

  const idDocumentInputRef = useRef<HTMLInputElement | null>(null)
  const selfieInputRef = useRef<HTMLInputElement | null>(null)
  const objectUrlsRef = useRef<string[]>([])

  useEffect(() => {
    if (!user) return
    const rawValue = (user as Record<string, unknown>).kyc_status ?? (user as Record<string, unknown>).kycStatus ?? (user as Record<string, unknown>).verification_status ?? (user as Record<string, unknown>).status
    setPageStatus(normalizeKycStatus(rawValue))
  }, [user])

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const revokePreview = (previewUrl: string | null) => {
    if (!previewUrl) return
    URL.revokeObjectURL(previewUrl)
    objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== previewUrl)
  }

  const handlePreviewUrl = (nextFile: File, currentPreview: string | null) => {
    const nextUrl = URL.createObjectURL(nextFile)
    objectUrlsRef.current.push(nextUrl)
    if (currentPreview) {
      revokePreview(currentPreview)
    }
    return nextUrl
  }

  const validateFile = (file: File | null, field: 'idDocument' | 'selfie') => {
    const errorSetter = field === 'idDocument' ? setIdDocumentError : setSelfieError
    if (!file) {
      errorSetter('')
      return false
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      errorSetter('يرجى اختيار صورة بصيغة JPEG أو PNG.')
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      errorSetter('حجم الملف يجب ألا يتجاوز 10 ميجابايت.')
      return false
    }

    errorSetter('')
    return true
  }

  const clearSelectedFile = (field: 'idDocument' | 'selfie') => {
    if (field === 'idDocument') {
      setIdDocument(null)
      revokePreview(idDocumentPreview)
      setIdDocumentPreview(null)
      setIdDocumentError('')
      if (idDocumentInputRef.current) {
        idDocumentInputRef.current.value = ''
      }
      return
    }

    setSelfie(null)
    revokePreview(selfiePreview)
    setSelfiePreview(null)
    setSelfieError('')
    if (selfieInputRef.current) {
      selfieInputRef.current.value = ''
    }
  }

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: 'idDocument' | 'selfie'
  ) => {
    const file = event.target.files?.[0] ?? null

    if (!file) {
      clearSelectedFile(field)
      return
    }

    if (!validateFile(file, field)) {
      event.target.value = ''
      if (field === 'idDocument') {
        setIdDocument(null)
      } else {
        setSelfie(null)
      }
      return
    }

    if (field === 'idDocument') {
      setIdDocument(file)
      setIdDocumentPreview((prev) => handlePreviewUrl(file, prev))
      setIdDocumentError('')
      return
    }

    setSelfie(file)
    setSelfiePreview((prev) => handlePreviewUrl(file, prev))
    setSelfieError('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!idDocument || !selfie) {
      if (!idDocument) setIdDocumentError('يرجى اختيار صورة بصيغة JPEG أو PNG.')
      if (!selfie) setSelfieError('يرجى اختيار صورة بصيغة JPEG أو PNG.')
      return
    }

    if (!validateFile(idDocument, 'idDocument') || !validateFile(selfie, 'selfie')) {
      return
    }

    setIsSubmitting(true)

    try {
      await submitKycRequest(idDocument, selfie)
      if (typeof refreshSession === 'function') {
        await refreshSession()
      }
      setPageStatus('pending_review')
      setSubmitSucceeded(true)
      showMsg('تم إرسال طلبك بنجاح', 'success')
    } catch (err: unknown) {
      const backendError = err as { response?: { status?: number } }
      if (backendError?.response?.status === 409) {
        setPageStatus('pending_review')
        setSubmitSucceeded(false)
        showMsg(PENDING_MESSAGE, 'info')
        return
      }

      showMsg(getErrorMessage(err), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const role = user ? roleFromApiRole(user.role) : null
  const canRenderForm = !submitSucceeded && (pageStatus === 'not_submitted' || pageStatus === 'rejected')

  if (pageStatus === 'verified') {
    const dashboardPath = role ? PAGE_TO_PATH[defaultPages[role]] : '/student/dashboard'
    return <Navigate to={dashboardPath} replace />
  }

  if (submitSucceeded) {
    return (
      <div className="page-wrapper">
        <div className="glass" style={{ maxWidth: 760, margin: '32px auto', padding: '40px 30px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 18 }}>✅</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 12px' }}>التحقق من الهوية</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.84)', margin: 0 }}>{SUCCESS_MESSAGE}</p>
        </div>
      </div>
    )
  }

  if (pageStatus === 'pending_review') {
    return (
      <div className="page-wrapper">
        <div className="glass" style={{ maxWidth: 760, margin: '32px auto', padding: '40px 30px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 18 }}>⏳</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 12px' }}>التحقق من الهوية</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.84)', margin: 0 }}>{PENDING_MESSAGE}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0 }}>التحقق من الهوية</h1>
          <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.68)', fontSize: 16 }}>
            أكمل خطوات التحقق من هويتك للوصول إلى جميع ميزات المنصة.
          </p>
        </div>

        <div className="glass" style={{ padding: 28 }}>
          <div style={{ marginBottom: 24, display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>المطلوب:</div>
            <ul style={{ margin: 0, paddingRight: 20, color: 'rgba(255,255,255,0.75)', lineHeight: 1.9 }}>
              <li>وثيقة هوية رسمية</li>
              <li>صورة شخصية حديثة</li>
            </ul>
            <div style={{ fontSize: 15, fontWeight: 700 }}>الصيغ المقبولة:</div>
            <div style={{ color: 'rgba(255,255,255,0.75)' }}>JPEG / PNG</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>الحد الأقصى:</div>
            <div style={{ color: 'rgba(255,255,255,0.75)' }}>10 ميجابايت لكل ملف</div>
          </div>

          {pageStatus === 'rejected' && (
            <div className="badge badge-danger" style={{ display: 'inline-flex', marginBottom: 20, fontSize: 14, padding: '8px 12px' }}>
              {REJECTED_MESSAGE}
            </div>
          )}

          {canRenderForm && (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 26 }}>
              <div>
                <label className="form-label">وثيقة الهوية</label>
                <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.58)', fontSize: 13 }}>
                  اختر صورة جواز السفر أو الهوية الوطنية
                </p>

                <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => idDocumentInputRef.current?.click()}
                      style={{ padding: '10px 18px' }}
                    >
                      اختر الملف
                    </button>
                    {idDocument && (
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{idDocument.name}</span>
                    )}
                  </div>

                  <input
                    ref={idDocumentInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(event) => handleFileChange(event, 'idDocument')}
                    style={{ display: 'none' }}
                  />

                  {idDocumentPreview && (
                    <div style={{ display: 'grid', gap: 10 }}>
                      <img src={idDocumentPreview} alt="معاينة وثيقة الهوية" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }} />
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button type="button" className="btn-ghost" onClick={() => idDocumentInputRef.current?.click()}>
                          استبدال
                        </button>
                        <button type="button" className="btn-ghost" onClick={() => clearSelectedFile('idDocument')}>
                          مسح
                        </button>
                      </div>
                    </div>
                  )}

                  {idDocumentError && (
                    <div style={{ color: '#f87171', fontSize: 13 }}>{idDocumentError}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">الصورة الشخصية</label>
                <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.58)', fontSize: 13 }}>
                  ارفع صورة شخصية حديثة وواضحة
                </p>

                <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => selfieInputRef.current?.click()}
                      style={{ padding: '10px 18px' }}
                    >
                      اختر الملف
                    </button>
                    {selfie && (
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{selfie.name}</span>
                    )}
                  </div>

                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(event) => handleFileChange(event, 'selfie')}
                    style={{ display: 'none' }}
                  />

                  {selfiePreview && (
                    <div style={{ display: 'grid', gap: 10 }}>
                      <img src={selfiePreview} alt="معاينة الصورة الشخصية" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }} />
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button type="button" className="btn-ghost" onClick={() => selfieInputRef.current?.click()}>
                          استبدال
                        </button>
                        <button type="button" className="btn-ghost" onClick={() => clearSelectedFile('selfie')}>
                          مسح
                        </button>
                      </div>
                    </div>
                  )}

                  {selfieError && (
                    <div style={{ color: '#f87171', fontSize: 13 }}>{selfieError}</div>
                  )}
                </div>
              </div>

              <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: '14px 20px' }} disabled={isSubmitting}>
                {isSubmitting ? 'جارٍ إرسال الطلب...' : 'إرسال طلب التحقق'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
