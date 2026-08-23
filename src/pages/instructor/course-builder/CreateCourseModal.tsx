import { useState, type FormEvent } from 'react'
import { useToast } from '../../../context/ToastContext'
import { courseService, type CourseFormPayload } from '../../../services/courseService'
import { getErrorMessage } from '../../../utils/errorMessages'
import { EMPTY_COURSE_FORM } from '../../../constants/courseOptions'
import { CourseInfoForm } from '../../../components/course/CourseInfoForm'

interface Props {
    onClose: () => void
    onCreated: () => void
}

export function CreateCourseModal({ onClose, onCreated }: Props) {
    const { success, error: toastError, info } = useToast()
    const [form, setForm] = useState<CourseFormPayload>(EMPTY_COURSE_FORM)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [creating, setCreating] = useState(false)

    const handleCoverChange = (file: File | null) => {
        setCoverFile(file)
        setCoverPreview(file ? URL.createObjectURL(file) : null)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!form.title.trim() || !form.description.trim()) {
            toastError('العنوان والوصف مطلوبان.')
            return
        }
        setCreating(true)
        try {
            const created = await courseService.createCourse(form)
            if (created?._id && coverFile) {
                await courseService.uploadCoverImage(created._id, coverFile)
            }
            success('تم إنشاء الكورس كمسودة بنجاح!')
            onCreated()
            onClose()
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setCreating(false)
        }
    }

    const handleCancel = () => {
        onClose()
        info('تم إلغاء إنشاء الكورس.')
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: 28, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 20px' }}>إنشاء كورس جديد</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <CourseInfoForm value={form} onChange={setForm} showSyncField />

                    <div>
                        <label className="form-label">صورة الغلاف (اختياري)</label>
                        <input
                            type="file" accept="image/*"
                            onChange={e => handleCoverChange(e.target.files?.[0] || null)}
                            style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}
                        />
                        {coverPreview && <img src={coverPreview} alt="معاينة" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                        <button type="button" className="btn-outline" style={{ padding: '10px 20px', fontSize: 14 }} onClick={handleCancel}>إلغاء</button>
                        <button type="submit" className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }} disabled={creating}>
                            {creating ? 'جارٍ الإنشاء...' : 'إنشاء الكورس'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}