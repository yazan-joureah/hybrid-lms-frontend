import { useState } from 'react'
import { CourseInfoTab } from './CourseInfoTab'
import { UnitsTab } from './UnitsTab'
import { useCourseUnits } from '../../../hooks/course/useCourseUnits'

interface Props {
    courseId: string
    onChanged: () => void
    onDeleted: () => void
}

export function CourseDetailPanel({ courseId, onChanged, onDeleted }: Props) {
    const [activeTab, setActiveTab] = useState<'details' | 'units'>('details')
    const unitsState = useCourseUnits(courseId) // مصدر وحيد للحالة — يُمرَّر لـ UnitsTab بدل استدعاء الهوك مرتين

    return (
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
            <div className="tab-bar" style={{ padding: '4px 4px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className={`tab-item${activeTab === 'details' ? ' active' : ''}`} onClick={() => setActiveTab('details')}>معلومات الكورس</div>
                <div className={`tab-item${activeTab === 'units' ? ' active' : ''}`} onClick={() => setActiveTab('units')}>الوحدات ({unitsState.units.length})</div>
            </div>
            <div style={{ padding: 24 }}>
                {activeTab === 'details' && <CourseInfoTab courseId={courseId} onChanged={onChanged} onDeleted={onDeleted} />}
                {activeTab === 'units' && <UnitsTab {...unitsState} />}
            </div>
        </div>
    )
}