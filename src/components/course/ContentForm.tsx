import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import type { ContentFormInput } from '../../services/courseService'

const emptyDraft: ContentFormInput = { title: '', desc: '', contentType: 'video', url: '', text: '', file: null }

interface Props {
    onSubmit: (input: ContentFormInput) => Promise<boolean | void>
    onCancel: () => void
}

export function ContentForm({ onSubmit, onCancel }: Props) {
    const { error: toastError } = useToast()
    const [draft, setDraft] = useState<ContentFormInput>(emptyDraft)
    const [submitting, setSubmitting] = useState(false)

    const handleSave = async () => {
        if (!draft.title.trim()) { toastError('عنوان المحتوى مطلوب.'); return }
        if (draft.contentType === 'link' && !draft.url) { toastError('الرجاء إدخال رابط.'); return }
        if (draft.contentType === 'text' && !draft.text) { toastError('الرجاء إدخال النص.'); return }
        if ((draft.contentType === 'video' || draft.contentType === 'document') && !draft.file) { toastError('الرجاء اختيار ملف.'); return }

        setSubmitting(true)
        const ok = await onSubmit(draft)
        setSubmitting(false)
        if (ok !== false) setDraft(emptyDraft)
    }

    return (
        <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input className="form-input" placeholder="عنوان المحتوى *" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} style={{ flex: 1 }} />
                <select className="form-input" style={{ width: 130 }} value={draft.contentType} onChange={e => setDraft({ ...draft, contentType: e.target.value as ContentFormInput['contentType'] })}>
                    <option value="video">فيديو</option>
                    <option value="document">مستند</option>
                    <option value="link">رابط</option>
                    <option value="text">نص</option>
                </select>
            </div>
            {draft.contentType === 'link' && (
                <input className="form-input" placeholder="https://..." value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })} style={{ marginBottom: 8 }} />
            )}
            {draft.contentType === 'text' && (
                <textarea className="form-input" rows={3} placeholder="محتوى نصي" value={draft.text} onChange={e => setDraft({ ...draft, text: e.target.value })} style={{ marginBottom: 8, resize: 'none' }} />
            )}
            {(draft.contentType === 'video' || draft.contentType === 'document') && (
                <input
                    type="file"
                    accept={draft.contentType === 'video' ? 'video/mp4' : '.pdf,application/pdf'}
                    onChange={e => setDraft({ ...draft, file: e.target.files?.[0] || null })}
                    style={{ marginBottom: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}
                />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 12.5 }} disabled={submitting} onClick={handleSave}>
                    {submitting ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
                <button className="btn-outline" style={{ padding: '6px 16px', fontSize: 12.5 }} onClick={onCancel}>إلغاء</button>
            </div>
        </div>
    )
}