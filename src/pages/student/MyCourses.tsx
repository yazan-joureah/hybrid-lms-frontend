import { useState } from 'react'

const courses = {
  active: [
    { id: 1, title: 'React المتقدم وإدارة الحالة', instructor: 'محمد الخالدي', progress: 72, img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=160&fit=crop&auto=format', lessons: 24, completedLessons: 17, lastLesson: 12 },
    { id: 2, title: 'Python للتحليل المالي', instructor: 'أحمد عبدالله', progress: 45, img: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=300&h=160&fit=crop&auto=format', lessons: 20, completedLessons: 9, lastLesson: 7 },
    { id: 3, title: 'تصميم UI/UX بـ Figma', instructor: 'سارة الأحمد', progress: 90, img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=160&fit=crop&auto=format', lessons: 22, completedLessons: 20, lastLesson: 18 },
  ],
  completed: [
    { id: 4, title: 'JavaScript من الصفر للاحتراف', instructor: 'كريم ناصر', progress: 100, img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=160&fit=crop&auto=format', lessons: 30, completedLessons: 30, lastLesson: 30 },
    { id: 5, title: 'HTML & CSS الأساسيات', instructor: 'مريم العلي', progress: 100, img: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=300&h=160&fit=crop&auto=format', lessons: 18, completedLessons: 18, lastLesson: 18 },
  ],
}

const curriculum = [
  { id: 1, title: 'مقدمة إلى React', duration: '45 دقيقة', completed: true, type: 'فيديو' },
  { id: 2, title: 'المكونات والـ Props', duration: '52 دقيقة', completed: true, type: 'فيديو' },
  { id: 3, title: 'إدارة الـ State', duration: '60 دقيقة', completed: true, type: 'فيديو' },
  { id: 4, title: 'الـ Hooks الأساسية', duration: '75 دقيقة', completed: true, type: 'فيديو' },
  { id: 5, title: 'Custom Hooks', duration: '55 دقيقة', completed: true, type: 'فيديو' },
  { id: 6, title: 'Context API', duration: '48 دقيقة', completed: true, type: 'فيديو' },
  { id: 7, title: 'React Router', duration: '65 دقيقة', completed: true, type: 'فيديو' },
  { id: 8, title: 'تحسين الأداء', duration: '58 دقيقة', completed: false, type: 'فيديو', current: true },
  { id: 9, title: 'Redux Toolkit', duration: '90 دقيقة', completed: false, type: 'فيديو' },
  { id: 10, title: 'اختبار التطبيق', duration: '70 دقيقة', completed: false, type: 'فيديو' },
  { id: 11, title: 'مشروع نهائي', duration: '120 دقيقة', completed: false, type: 'مشروع' },
]

const attachments = [
  { name: 'ملاحظات الدرس - React Hooks.pdf', size: '2.3 MB' },
  { name: 'مشاريع الدورة الكاملة.zip', size: '15.8 MB' },
  { name: 'مرجع سريع - React API.pdf', size: '1.1 MB' },
]

export default function MyCourses() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [selectedCourse, setSelectedCourse] = useState<typeof courses.active[0] | null>(null)
  const [playerTab, setPlayerTab] = useState<'content' | 'attachments'>('content')
  const [currentLesson, setCurrentLesson] = useState(8)

  const handleOpenCourse = (c: typeof courses.active[0]) => setSelectedCourse(c)

  return (
    <div className="page-wrapper">
      {!selectedCourse ? (
        <>
          <div style={{ marginBottom: 24 }}>
            <h2 className="section-title">كورساتي</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>تابع تقدمك في جميع الكورسات المسجّلة</p>
          </div>

          <div className="tab-bar" style={{ marginBottom: 24, display: 'inline-flex' }}>
            <div className={`tab-item${activeTab === 'active' ? ' active' : ''}`} onClick={() => setActiveTab('active')}>
              قيد التقدم ({courses.active.length})
            </div>
            <div className={`tab-item${activeTab === 'completed' ? ' active' : ''}`} onClick={() => setActiveTab('completed')}>
              مكتملة ({courses.completed.length})
            </div>
          </div>

          {courses[activeTab].length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)' }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>📚</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                {activeTab === 'active' ? 'لا توجد كورسات نشطة' : 'لم تكمل أي كورس بعد'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
              {courses[activeTab].map(c => (
                <div key={c.id} className="course-card" onClick={() => handleOpenCourse(c)}>
                  <img src={c.img} alt={c.title} style={{ width: '100%', height: 168, objectFit: 'cover' }} />
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>{c.title}</h3>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
                      {c.instructor} • {c.completedLessons}/{c.lessons} درس
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>التقدم</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{c.progress}%</span>
                    </div>
                    <div className="progress-bar" style={{ marginBottom: 14 }}>
                      <div className="progress-fill" style={{ width: `${c.progress}%` }} />
                    </div>
                    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '9px', fontSize: 13.5 }}>
                      {c.progress === 100 ? '🏆 مكتمل — مراجعة' : '▶ متابعة التعلم'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Lesson Player View */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, height: 'calc(100vh - 140px)' }}>
          {/* Main player */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button onClick={() => setSelectedCourse(null)} style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, padding: 0, width: 'fit-content' }}>
              ← العودة للكورسات
            </button>

            {/* Video player */}
            <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={selectedCourse.img} alt="video" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
              <button style={{ position: 'absolute', width: 68, height: 68, borderRadius: '50%', background: 'rgba(124,58,237,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#fff' }}>▶</button>
              <div style={{ position: 'absolute', bottom: 16, right: 16, left: 16 }}>
                <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '8px 12px', backdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                    <span>الدرس {currentLesson}: تحسين الأداء</span>
                    <span>58:00</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tab-bar" style={{ display: 'inline-flex' }}>
              <div className={`tab-item${playerTab === 'content' ? ' active' : ''}`} onClick={() => setPlayerTab('content')}>المحتوى</div>
              <div className={`tab-item${playerTab === 'attachments' ? ' active' : ''}`} onClick={() => setPlayerTab('attachments')}>المرفقات ({attachments.length})</div>
            </div>

            {playerTab === 'content' && (
              <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, flex: 1, overflowY: 'auto' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>
                  الدرس {currentLesson}: تحسين الأداء في React
                </h3>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 16 }}>
                  في هذا الدرس ستتعلم كيفية تحسين أداء تطبيقات React باستخدام useMemo وuseCallback وReact.memo لتقليل إعادة التصيير غير الضرورية.
                </p>
                <button style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 9999, padding: '10px 24px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✓ تحديد الدرس كمكتمل
                </button>
              </div>
            )}

            {playerTab === 'attachments' && (
              <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>ملفات الكورس</h3>
                {attachments.map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 22 }}>📄</span>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{a.size}</div>
                      </div>
                    </div>
                    <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12.5 }}>تحميل ⬇</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Curriculum sidebar */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 700, margin: '0 0 6px' }}>محتوى الكورس</h3>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{selectedCourse.completedLessons}/{curriculum.length} درس مكتمل</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {curriculum.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => setCurrentLesson(lesson.id)}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 10px',
                    borderRadius: 10, cursor: 'pointer', marginBottom: 2, transition: 'background 0.15s',
                    background: lesson.current ? 'rgba(124,58,237,0.15)' : currentLesson === lesson.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: lesson.current ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: lesson.completed ? 'linear-gradient(135deg, #10b981, #059669)' : lesson.current ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                  }}>
                    {lesson.completed ? '✓' : lesson.current ? '▶' : lesson.id}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: lesson.current ? 600 : 400, color: lesson.completed ? 'rgba(255,255,255,0.5)' : '#fff', marginBottom: 2 }}>
                      {lesson.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', gap: 8 }}>
                      <span>⏱ {lesson.duration}</span>
                      <span className="badge badge-neutral" style={{ padding: '0 6px', fontSize: 9.5 }}>{lesson.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
