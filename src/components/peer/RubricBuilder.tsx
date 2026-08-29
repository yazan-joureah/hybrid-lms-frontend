// src/components/peer/RubricBuilder.tsx
import type { RubricCriterion } from '../../services/peerService'

function distributeEvenly(rows: RubricCriterion[]): RubricCriterion[] {
    const n = rows.length
    if (n === 0) return rows
    const base = Math.floor((100 / n) * 100) / 100
    const weights = rows.map(() => base)
    const remainder = Math.round((100 - base * n) * 100) / 100
    weights[weights.length - 1] = Math.round((weights[weights.length - 1] + remainder) * 100) / 100
    return rows.map((r, i) => ({ ...r, weight: weights[i] / 100 }))
}

interface Props {
    rubric: RubricCriterion[]
    onChange: (next: RubricCriterion[]) => void
}

export function RubricBuilder({ rubric, onChange }: Props) {
    const weightSum = rubric.reduce((s, r) => s + r.weight * 100, 0)
    const weightSumOk = Math.abs(weightSum - 100) < 1

    const updateRow = (index: number, field: keyof RubricCriterion, value: string | number) => {
        onChange(rubric.map((r, i) => (i === index ? { ...r, [field]: field === 'criterion' ? value : Number(value) } : r)))
    }

    const addRow = () => onChange(distributeEvenly([...rubric, { criterion: '', maxScore: 10, weight: 0 }]))
    const removeRow = (index: number) => {
        const filtered = rubric.filter((_, i) => i !== index)
        if (filtered.length === 0) return
        onChange(distributeEvenly(filtered))
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>معايير التقييم (Rubric)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: weightSumOk ? '#34d399' : '#f87171' }}>المجموع: {weightSum.toFixed(1)}%</span>
                    <button type="button" className="btn-outline" style={{ padding: '5px 14px', fontSize: 12 }} onClick={() => onChange(distributeEvenly(rubric))}>⚖️ توزيع تلقائي</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rubric.map((row, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                        <input className="form-input" placeholder="اسم المعيار (مثال: جودة المحتوى)" required value={row.criterion} onChange={e => updateRow(index, 'criterion', e.target.value)} style={{ flex: 3 }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                            <input className="form-input" type="number" min={1} title="أقصى درجة" value={row.maxScore} onChange={e => updateRow(index, 'maxScore', e.target.value)} style={{ width: 70 }} />
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>درجة</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                            <input className="form-input" type="number" min={0} max={100} title="نسبة الوزن %" value={Math.round(row.weight * 10000) / 100} onChange={e => updateRow(index, 'weight', Number(e.target.value) / 100)} style={{ width: 65 }} />
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>%</span>
                        </div>
                        {rubric.length > 1 && (
                            <button type="button" onClick={() => removeRow(index)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 15 }}>✕</button>
                        )}
                    </div>
                ))}
            </div>

            <button type="button" className="btn-outline" style={{ alignSelf: 'flex-start', marginTop: 10, padding: '6px 16px', fontSize: 12.5 }} onClick={addRow}>+ إضافة معيار</button>
        </div>
    )
}