import { useState } from 'react'
import { ContentForm } from '../../../components/course/ContentForm'
import type { UnitDetail, ContentFormInput } from '../../../services/courseService'

const CONTENT_TYPE_LABELS: Record<ContentFormInput['contentType'], string> = {
    video: '🎥 فيديو', document: '📄 مستند', link: '🔗 رابط', text: '📝 نص',
}

// قصّ آمن عند أقرب فراغ قبل الحد الأقصى — يتجنّب مشكلة قطع الكلمات في
// المنتصف التي تسبّبها -webkit-line-clamp مع نص عربي/لاتيني مختلط الاتجاه
function truncateDesc(text: string, maxLen = 150) {
    if (text.length <= maxLen) return text
    const cut = text.slice(0, maxLen)
    const lastSpace = cut.lastIndexOf(' ')
    return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + '…'
}

interface Props {
    unit: UnitDetail
    index: number
    isLast: boolean
    onMoveUp: () => void
    onMoveDown: () => void
    onUpdate: (title: string, desc?: string) => Promise<void>
    onDelete: () => void
    onAddContent: (input: ContentFormInput) => Promise<boolean | void>
    onDeleteContent: (contentId: string) => void
}

export function UnitCard({ unit, index, isLast, onMoveUp, onMoveDown, onUpdate, onDelete, onAddContent, onDeleteContent }: Props) {
    const [expanded, setExpanded] = useState(false)
    const [editing, setEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(unit.title)
    const [editDesc, setEditDesc] = useState(unit.desc || '')
    const [showContentForm, setShowContentForm] = useState(false)
    const [descExpanded, setDescExpanded] = useState(false)

    const startEdit = () => {
        setEditTitle(unit.title)
        setEditDesc(unit.desc || '')
        setEditing(true)
    }

    const saveEdit = async () => {
        await onUpdate(editTitle, editDesc || undefined)
        setEditing(false)
    }

    const descTooLong = Boolean(unit.desc && unit.desc.length > 150)

    return (
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.04)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button disabled={index === 0} onClick={onMoveUp} style={{ background: 'none', border: 'none', color: index === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', cursor: index === 0 ? 'default' : 'pointer', fontSize: 11 }}>▲</button>
                    <button disabled={isLast} onClick={onMoveDown} style={{ background: 'none', border: 'none', color: isLast ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', cursor: isLast ? 'default' : 'pointer', fontSize: 11 }}>▼</button>
                </div>

                {editing ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                        <input className="form-input" placeholder="وصف (اختياري)" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 12.5 }} onClick={saveEdit}>حفظ</button>
                            <button className="btn-outline" style={{ padding: '6px 16px', fontSize: 12.5 }} onClick={() => setEditing(false)}>إلغاء</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>{unit.title}</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{unit.content?.length || 0} عناصر</span>
                        <button className="btn-outline" style={{ padding: '5px 12px', fontSize: 12 }} onClick={startEdit}>✎</button>
                        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 15 }}>🗑</button>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>{expanded ? '▲' : '▼'}</span>
                    </>
                )}
            </div>

            {expanded && (
                <div style={{ padding: '12px 16px' }}>
                    {unit.desc && (
                        <div style={{
                            fontSize: 12.5,
                            lineHeight: 1.7,
                            color: 'rgba(255,255,255,0.55)',
                            marginBottom: 12,
                            paddingBottom: 12,
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            {descExpanded || !descTooLong ? unit.desc : truncateDesc(unit.desc)}
                            {descTooLong && (
                                <button
                                    onClick={() => setDescExpanded(v => !v)}
                                    style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0, marginRight: 6 }}
                                >
                                    {descExpanded ? 'إخفاء' : 'عرض المزيد'}
                                </button>
                            )}
                        </div>
                    )}
                    {(unit.content || []).map(item => (
                        <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: 13.5 }}>{CONTENT_TYPE_LABELS[item.content_type]} — {item.title}</span>
                            <button onClick={() => onDeleteContent(item._id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 13 }}>🗑</button>
                        </div>
                    ))}
                    {(unit.content || []).length === 0 && (
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', padding: '6px 0' }}>لا يوجد محتوى بعد.</div>
                    )}

                    {showContentForm ? (
                        <ContentForm
                            onSubmit={async input => { const ok = await onAddContent(input); if (ok !== false) setShowContentForm(false); return ok }}
                            onCancel={() => setShowContentForm(false)}
                        />
                    ) : (
                        <button className="btn-outline" style={{ padding: '6px 16px', fontSize: 12.5, marginTop: 10 }} onClick={() => setShowContentForm(true)}>+ إضافة محتوى</button>
                    )}
                </div>
            )}
        </div>
    )
}