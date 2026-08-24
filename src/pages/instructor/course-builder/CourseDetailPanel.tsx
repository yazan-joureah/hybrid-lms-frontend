// src/pages/instructor/course-builder/CourseDetailPanel.tsx
import { useState } from 'react'
import { CourseInfoTab } from './CourseInfoTab'
import { UnitsTab } from './UnitsTab'
import { QuizzesTab } from './QuizzesTab'
import { StudentsTab } from './StudentsTab'
import { PeerTab } from './PeerTab'
import { useCourseDetail } from '../../../hooks/course/useCourseDetail'
import { useCourseUnits } from '../../../hooks/course/useCourseUnits'
import { useInstructorQuizzes } from '../../../hooks/quiz/useInstructorQuizzes'
import { useCourseStudents } from '../../../hooks/course/useCourseStudents'
import { useInstructorPeerAssignments } from '../../../hooks/peer/useInstructorPeerAssignments'


interface Props {
    courseId: string
    onChanged: () => void
    onDeleted: () => void
}

type TabKey = 'details' | 'units' | 'quizzes' | 'peer' | 'students'

export function CourseDetailPanel({ courseId, onChanged, onDeleted }: Props) {
    const [activeTab, setActiveTab] = useState<TabKey>('details')

    const courseDetail = useCourseDetail(courseId, onChanged)
    const unitsState = useCourseUnits(courseId)
    const quizzesState = useInstructorQuizzes(courseId)
    const studentsState = useCourseStudents(courseId)
    const peerState = useInstructorPeerAssignments(courseId)

    return (
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
            <div className="tab-bar" style={{ padding: '4px 4px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className={`tab-item${activeTab === 'details' ? ' active' : ''}`} onClick={() => setActiveTab('details')}>معلومات الكورس</div>
                <div className={`tab-item${activeTab === 'units' ? ' active' : ''}`} onClick={() => setActiveTab('units')}>الوحدات ({unitsState.units.length})</div>
                <div className={`tab-item${activeTab === 'quizzes' ? ' active' : ''}`} onClick={() => setActiveTab('quizzes')}>
                    الاختبارات ({quizzesState.quizzes.length})
                    {!quizzesState.loading && !quizzesState.finalExam && <span style={{ color: '#fbbf24', marginRight: 4 }}>⚠️</span>}
                </div>
                <div className={`tab-item${activeTab === 'peer' ? ' active' : ''}`} onClick={() => setActiveTab('peer')}>
                    المراجعة الجماعية ({peerState.assignments.length})
                </div>
                <div className={`tab-item${activeTab === 'students' ? ' active' : ''}`} onClick={() => setActiveTab('students')}>
                    الطلاب ({studentsState.students.length})
                </div>

            </div>

            <div style={{ padding: 24 }}>
                {activeTab === 'details' && (
                    <CourseInfoTab
                        {...courseDetail}
                        finalExam={quizzesState.finalExam}
                        quizzesLoading={quizzesState.loading}
                        onDeleted={onDeleted}
                        onGoToQuizzesTab={() => setActiveTab('quizzes')}
                    />
                )}
                {activeTab === 'units' && <UnitsTab {...unitsState} />}
                {activeTab === 'quizzes' && (
                    <QuizzesTab {...quizzesState} units={unitsState.units} isSynchronous={Boolean(courseDetail.detail?.is_synchronous)} />
                )}
                {activeTab === 'peer' && <PeerTab {...peerState} units={unitsState.units} />}
                {activeTab === 'students' && <StudentsTab {...studentsState} />}
            </div>
        </div>
    )
}