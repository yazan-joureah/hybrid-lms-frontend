import { CATEGORY_OPTIONS } from '../../constants/courseOptions'
import type { CourseFormPayload } from '../../services/courseService'

interface Props {
    value: CourseFormPayload
    onChange: (next: CourseFormPayload) => void
    showSyncField?: boolean
}

export function CourseInfoForm({ value, onChange, showSyncField = false }: Props) {
    const set = <K extends keyof CourseFormPayload>(key: K, v: CourseFormPayload[K]) => onChange({ ...value, [key]: v })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
                <label className="form-label">العنوان *</label>
                <input className="form-input" required maxLength={200} value={value.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
                <label className="form-label">الوصف *</label>
                <textarea className="form-input" required rows={3} value={value.description} onChange={e => set('description', e.target.value)} style={{ resize: 'none' }} />
            </div>
            <div>
                <label className="form-label">التصنيف *</label>
                <select className="form-input" value={value.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                    <label className="form-label">نوع الكورس *</label>
                    <select className="form-input" value={value.course_type} onChange={e => set('course_type', e.target.value as 'free' | 'paid')}>
                        <option value="free">مجاني</option>
                        <option value="paid">مدفوع</option>
                    </select>
                </div>
                <div>
                    <label className="form-label">السعر</label>
                    <input className="form-input" type="number" min={0} step={0.01} disabled={value.course_type === 'free'} value={value.price} onChange={e => set('price', Number(e.target.value))} />
                </div>
            </div>
            <div>
                <label className="form-label">الحد الأقصى للطلاب (اتركه فارغاً لعدد غير محدود)</label>
                <input className="form-input" type="number" min={1} value={value.max_students ?? ''} onChange={e => set('max_students', e.target.value === '' ? null : Number(e.target.value))} />
            </div>
            <div>
                <label className="form-label">نسبة الإكمال المطلوبة (0 – 1) *</label>
                <input className="form-input" type="number" required min={0} max={1} step={0.05} value={value.completion_threshold} onChange={e => set('completion_threshold', Number(e.target.value))} />
            </div>

            {showSyncField && (
                <div>
                    <label className="form-label">طريقة الالتقاء *</label>
                    <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5 }}>
                            <input type="radio" checked={!value.is_synchronous} onChange={() => set('is_synchronous', false)} />
                            ذاتي التوقيت
                        </label>
                        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5 }}>
                            <input type="radio" checked={value.is_synchronous} onChange={() => set('is_synchronous', true)} />
                            مباشر
                        </label>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>لا يمكن تغيير هذا الخيار لاحقاً.</div>
                </div>
            )}
        </div>
    )
}