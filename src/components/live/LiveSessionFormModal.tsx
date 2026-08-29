// src/components/live/LiveSessionFormModal.tsx
import { useState, type FormEvent } from 'react'
import { ModalPortal } from '../common/ModalPortal'
import type { CourseUnit } from '../../services/courseService'
import type { LiveSession, LiveSessionFormPayload } from '../../services/liveService'

function toDateTimeLocal(iso?: string) {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildInitialForm(session: LiveSession | null, defaultUnitId: string): LiveSessionFormPayload {
    if (!session) {
        return { title: '', unitId: defaultUnitId, startTime: '', endTime: '', meetingLink: '', lobbyEnabled: false }
    }
    const unitId = typeof session.unit_id === 'object' ? session.unit_id?._id : session.unit_id
    return {
        title: session.title,
        unitId: unitId || '',
        startTime: toDateTimeLocal(session.startTime),
        endTime: toDateTimeLocal(session.endTime),
        meetingLink: session.meetingLink || '',
        lobbyEnabled: Boolean(session.lobbyEnabled),
    }
}

interface Props {
    editingSession: LiveSession | null
    units: CourseUnit[]
    onSubmit: (form: LiveSessionFormPayload) => Promise<boolean | void>
    onClose: () => void
}

export function LiveSessionFormModal({ editingSession, units, onSubmit, onClose }: Props) {
    const [form, setForm] = useState<LiveSessionFormPayload>(() => buildInitialForm(editingSession, units[0]?._id || ''))
    const [submitting, setSubmitting] = useState(false)
    const [validationError, setValidationError] = useState('')

    const set = <K extends keyof LiveSessionFormPayload>(key: K, value: LiveSessionFormPayload[K]) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setValidationError('')

        if (!form.title.trim()) { setValidationError('عنوان الحصة مطلوب.'); return }

        const start = new Date(form.startTime)
        const end = new Date(form.endTime)
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            setValidationError('يرجى تحديد وقت بدء ووقت نهاية صحيحين.')
            return
        }
        if (end <= start) {
            setValidationError('وقت النهاية يجب أن يكون بعد وقت البداية.')
            return
        }
        if (!editingSession && start.getTime() <= Date.now()) {
            setValidationError('يجب أن يكون وقت بدء الجلسة في المستقبل.')
            return
        }

        setSubmitting(true)
        const payload: LiveSessionFormPayload = {
            title: form.title.trim(),
            unitId: form.unitId || undefined,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            meetingLink: form.meetingLink?.trim() || undefined,
            lobbyEnabled: form.lobbyEnabled,
        }
        const ok = await onSubmit(payload)
        setSubmitting(false)
        if (ok !== false) onClose()
    }

    return (
        <ModalPortal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
                <div style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{editingSession ? 'تعديل الحصة' : 'جدولة حصة مباشرة'}</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
                    </div>

                    <form id="live-session-form" onSubmit={handleSubmit} style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label className="form-label">عنوان الحصة</label>
                            <input className="form-input" required maxLength={200} value={form.title} onChange={e => set('title', e.target.value)} />
                        </div>

                        {!editingSession && (
                            <div>
                                <label className="form-label">الوحدة (اختياري)</label>
                                <select className="form-input" value={form.unitId} onChange={e => set('unitId', e.target.value)}>
                                    <option value="">بدون وحدة (حصة عامة)</option>
                                    {units.map(u => <option key={u._id} value={u._id}>{u.title}</option>)}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label className="form-label">وقت البدء</label>
                                <input className="form-input" type="datetime-local" required value={form.startTime} onChange={e => set('startTime', e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label">وقت الانتهاء</label>
                                <input className="form-input" type="datetime-local" required value={form.endTime} onChange={e => set('endTime', e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">رابط الاجتماع (اختياري)</label>
                            <input className="form-input" type="url" placeholder="اتركه فارغًا لإنشاء غرفة Jitsi تلقائيًا" value={form.meetingLink} onChange={e => set('meetingLink', e.target.value)} />
                        </div>

                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, cursor: 'pointer' }}>
                            <input type="checkbox" checked={Boolean(form.lobbyEnabled)} onChange={e => set('lobbyEnabled', e.target.checked)} />
                            تفعيل غرفة الانتظار (Lobby)
                        </label>

                        {validationError && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>
                                {validationError}
                            </div>
                        )}
                    </form>

                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button type="button" className="btn-outline" style={{ padding: '9px 20px', fontSize: 13.5 }} onClick={onClose}>إلغاء</button>
                        <button type="submit" form="live-session-form" className="btn-primary" style={{ padding: '9px 24px', fontSize: 13.5 }} disabled={submitting}>
                            {submitting ? 'جارٍ الحفظ...' : editingSession ? 'حفظ التعديلات' : 'جدولة الحصة'}
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}