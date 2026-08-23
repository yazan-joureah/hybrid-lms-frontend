import { useState } from 'react'
import { useToast } from '../../../context/ToastContext'
import { UnitCard } from './UnitCard'
import type { useCourseUnits } from '../../../hooks/course/useCourseUnits'

type UnitsTabProps = ReturnType<typeof useCourseUnits>

export function UnitsTab({ units, addUnit, updateUnit, deleteUnit, moveUnit, addContent, deleteContent }: UnitsTabProps) {
    const { error: toastError } = useToast()
    const [newTitle, setNewTitle] = useState('')
    const [newDesc, setNewDesc] = useState('')

    const handleAdd = async () => {
        if (!newTitle.trim()) { toastError('الرجاء إدخال عنوان الوحدة.'); return }
        await addUnit(newTitle.trim(), newDesc.trim() || undefined)
        setNewTitle('')
        setNewDesc('')
    }

    const handleDelete = async (unitId: string) => {
        if (!window.confirm('حذف هذه الوحدة سيحذف كل محتواها. هل أنت متأكد؟')) return
        await deleteUnit(unitId)
    }

    return (
        <div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>إضافة وحدة جديدة</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <label className="form-label">عنوان الوحدة *</label>
                        <input className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    </div>
                    <div style={{ flex: '2 1 260px' }}>
                        <label className="form-label">وصف (اختياري)</label>
                        <input className="form-input" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                    </div>
                    <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5 }} onClick={handleAdd}>+ إضافة</button>
                </div>
            </div>

            {units.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.35)', fontSize: 13.5 }}>لا توجد وحدات بعد.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {units.map((unit, index) => (
                        <UnitCard
                            key={unit._id}
                            unit={unit}
                            index={index}
                            isLast={index === units.length - 1}
                            onMoveUp={() => moveUnit(index, -1)}
                            onMoveDown={() => moveUnit(index, 1)}
                            onUpdate={(title, desc) => updateUnit(unit._id, title, desc)}
                            onDelete={() => handleDelete(unit._id)}
                            onAddContent={input => addContent(unit._id, input)}
                            onDeleteContent={contentId => deleteContent(unit._id, contentId)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}