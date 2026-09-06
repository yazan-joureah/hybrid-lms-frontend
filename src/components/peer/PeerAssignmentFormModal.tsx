// src/components/peer/PeerAssignmentFormModal.tsx
import { useState } from 'react'
import { ModalPortal } from '../common/ModalPortal'
import type { CourseUnit } from '../../services/courseService'
import type { PeerAssignment, PeerAssignmentFormPayload, RubricCriterion } from '../../services/peerService'
import { RubricBuilder } from './RubricBuilder'

function toDateTimeLocal(iso?: string) {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildInitialForm(assignment: PeerAssignment | null): PeerAssignmentFormPayload {
    if (!assignment) {
        return {
            title: '', description: '', unitId: '', submissionDeadline: '', reviewDeadline: '',
            reviewersPerSubmission: 2, allowFileSubmission: true, maxAttempts: 3,
            rubric: [{ criterion: '', maxScore: 10, weight: 1 }],
        }
    }
    return {
        title: assignment.title, description: assignment.description || '',
        unitId: typeof assignment.unitId === 'object' ? assignment.unitId?._id : assignment.unitId || '',
        submissionDeadline: toDateTimeLocal(assignment.submissionDeadline), reviewDeadline: toDateTimeLocal(assignment.reviewDeadline),
        reviewersPerSubmission: assignment.reviewersPerSubmission, allowFileSubmission: assignment.allowFileSubmission,
        maxAttempts: assignment.maxAttempts, rubric: assignment.rubric,
    }
}

interface Props {
    editingAssignment: PeerAssignment | null
    units: CourseUnit[]
    onSubmit: (form: PeerAssignmentFormPayload) => Promise<boolean | void>
    onClose: () => void
}

export function PeerAssignmentFormModal({ editingAssignment, units, onSubmit, onClose }: Props) {
    const [form, setForm] = useState<PeerAssignmentFormPayload>(() => buildInitialForm(editingAssignment))
    const [submitting, setSubmitting] = useState(false)
    const [validationError, setValidationError] = useState('')

    const set = <K extends keyof PeerAssignmentFormPayload>(key: K, value: PeerAssignmentFormPayload[K]) => setForm(prev => ({ ...prev, [key]: value }))
    const setRubric = (rubric: RubricCriterion[]) => setForm(prev => ({ ...prev, rubric }))

    const isLocked = editingAssignment ? editingAssignment.status !== 'open' : false
    const weightSum = form.rubric.reduce((s, r) => s + r.weight * 100, 0)
    const weightSumOk = Math.abs(weightSum - 100) < 1

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setValidationError('')
        if (form.rubric.some(r => !r.criterion.trim())) { setValidationError('كل معيار تقييم يجب أن يكون له اسم.'); return }
        if (!weightSumOk) { setValidationError('مجموع أوزان المعايير يجب أن يساوي 100%.'); return }

        // 🛠️ تحقق ترتيب المواعيد قبل الإرسال — يمنع خطأ الخادم INVALID_REVIEW_DEADLINE
        if (form.submissionDeadline && form.reviewDeadline &&
            new Date(form.reviewDeadline) <= new Date(form.submissionDeadline)) {
            setValidationError('موعد نهاية المراجعة يجب أن يكون بعد موعد نهاية التسليم.')
            return
        }


        if (form.submissionDeadline && form.reviewDeadline &&
            new Date(form.reviewDeadline) <= new Date(form.submissionDeadline)) {
            setValidationError('موعد نهاية المراجعة يجب أن يكون بعد موعد نهاية التسليم.')
            return
        }
        // 🛠️ إزالة حقول التاريخ الفارغة قبل الإرسال
        const payload = { ...form };
        if (!payload.submissionDeadline) delete payload.submissionDeadline;
        if (!payload.reviewDeadline) delete payload.reviewDeadline;

        // 🛠️ تحويل صيغة datetime-local (بلا ثواني ولا منطقة زمنية، مثل
        // "2026-09-07T09:09") إلى ISO 8601 كامل مطلوب من Zod (.datetime())
        // في الخادم — وإلا يُرفض بـ "must be a valid ISO date-time"
        if (payload.submissionDeadline) payload.submissionDeadline = new Date(payload.submissionDeadline).toISOString();
        if (payload.reviewDeadline) payload.reviewDeadline = new Date(payload.reviewDeadline).toISOString();
        // 🛠️ إزالة unitId الفارغ (القيمة الافتراضية "" من عنصر <select>)
        if (!payload.unitId) delete payload.unitId;

        // 🛠️ إزالة unitId الفارغ (القيمة الافتراضية "" من عنصر <select>) —
        // إرسالها كسلسلة فارغة يفشل فحص صيغة ObjectId في الخادم قبل ما يوصل
        // لمنطق "اختياري" في الخدمة نفسها
        if (!payload.unitId) delete payload.unitId;

        setSubmitting(true)
        const ok = await onSubmit(payload)
        setSubmitting(false)
        if (ok !== false) onClose()
    }

    return (
        <ModalPortal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
                <div style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{editingAssignment ? 'تعديل مهمة المراجعة' : 'إنشاء مهمة مراجعة جماعية جديدة'}</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
                    </div>

                    <form id="peer-form" onSubmit={handleSubmit} style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label className="form-label">عنوان المهمة *</label>
                            <input className="form-input" required maxLength={200} value={form.title} onChange={e => set('title', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">الوصف (اختياري)</label>
                            <textarea className="form-input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'none' }} />
                        </div>

                        {!editingAssignment && (
                            <div>
                                <label className="form-label">ربط بوحدة (اختياري)</label>
                                <select className="form-input" value={form.unitId} onChange={e => set('unitId', e.target.value)}>
                                    <option value="">على مستوى الكورس (بدون وحدة)</option>
                                    {units.map(u => <option key={u._id} value={u._id}>{u.title}</option>)}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                            <div>
                                <label className="form-label">موعد نهاية التسليم</label>
                                <input className="form-input" type="datetime-local" value={form.submissionDeadline} onChange={e => set('submissionDeadline', e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label">موعد نهاية المراجعة</label>
                                <input className="form-input" type="datetime-local" disabled={!form.submissionDeadline} value={form.reviewDeadline} onChange={e => set('reviewDeadline', e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label">عدد المراجعين لكل تسليم</label>
                                <input className="form-input" type="number" min={1} max={10} value={form.reviewersPerSubmission} onChange={e => set('reviewersPerSubmission', Number(e.target.value))} />
                            </div>
                        </div>
                        {!form.submissionDeadline && (
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>بدون موعد تسليم، سيتم التوزيع يدوياً فقط عبر زر "توزيع المراجعات الآن".</div>
                        )}

                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                            <input type="checkbox" checked={form.allowFileSubmission} disabled={isLocked} onChange={e => set('allowFileSubmission', e.target.checked)} />
                            السماح للطلاب بإرفاق ملف مع التسليم
                        </label>

                        <div>
                            <label className="form-label">عدد محاولات التسليم المسموحة</label>
                            <select className="form-input" disabled={isLocked} value={form.maxAttempts} onChange={e => set('maxAttempts', Number(e.target.value))}>
                                <option value={1}>محاولة واحدة فقط</option>
                                <option value={2}>محاولتان</option>
                                <option value={3}>3 محاولات (افتراضي)</option>
                            </select>
                            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>عند إعادة التسليم بعد التصحيح، تُلغى الدرجة السابقة ويُعاد توزيع مراجعين جدد.</div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
                            <RubricBuilder rubric={form.rubric} onChange={setRubric} />
                        </div>

                        {validationError && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>
                                {validationError}
                            </div>
                        )}
                    </form>

                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button type="button" className="btn-outline" style={{ padding: '9px 20px', fontSize: 13.5 }} onClick={onClose}>إلغاء</button>
                        <button type="submit" form="peer-form" className="btn-primary" style={{ padding: '9px 24px', fontSize: 13.5 }} disabled={submitting || !weightSumOk}>
                            {submitting ? 'جارٍ الحفظ...' : editingAssignment ? 'حفظ التعديلات' : 'إنشاء المهمة'}
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}