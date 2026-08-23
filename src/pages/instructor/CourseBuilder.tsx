import { useState } from 'react'

type ModuleItem = { id: number; type: 'lesson' | 'quiz' | 'assignment'; title: string; duration?: string }
type Module = { id: number; title: string; items: ModuleItem[]; expanded: boolean }

const initial: Module[] = [
  { id: 1, title: 'الوحدة 1: المقدمة', expanded: true, items: [
    { id: 1, type: 'lesson', title: 'مقدمة إلى React', duration: '45 دقيقة' },
    { id: 2, type: 'lesson', title: 'إعداد البيئة', duration: '30 دقيقة' },
    { id: 3, type: 'quiz', title: 'اختبار المقدمة' },
  ]},
  { id: 2, title: 'الوحدة 2: المكونات', expanded: false, items: [
    { id: 4, type: 'lesson', title: 'المكونات الوظيفية', duration: '60 دقيقة' },
    { id: 5, type: 'assignment', title: 'واجب: بناء مكوّن بطاقة' },
  ]},
]

const typeConfig: Record<string, { icon: string; color: string }> = {
  lesson: { icon: '▶', color: '#7c3aed' },
  quiz: { icon: '📝', color: '#f59e0b' },
  assignment: { icon: '📋', color: '#10b981' },
}

export default function CourseBuilder() {
  const [modules, setModules] = useState<Module[]>(initial)
  const [published, setPublished] = useState(false)
  const [title, setTitle] = useState('React المتقدم وإدارة الحالة')
  const [desc, setDesc] = useState('تعلم React بأسلوب احترافي مع أمثلة تطبيقية شاملة')

  const toggleModule = (id: number) => setModules(prev => prev.map(m => m.id === id ? { ...m, expanded: !m.expanded } : m))

  const addModule = () => setModules(prev => [...prev, { id: Date.now(), title: `الوحدة ${prev.length + 1}: جديدة`, expanded: true, items: [] }])

  const addItem = (moduleId: number, type: ModuleItem['type']) => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, items: [...m.items, { id: Date.now(), type, title: type === 'lesson' ? 'درس جديد' : type === 'quiz' ? 'اختبار جديد' : 'واجب جديد' }] } : m))
  }

  const totalLessons = modules.reduce((a, m) => a + m.items.filter(i => i.type === 'lesson').length, 0)
  const totalItems = modules.reduce((a, m) => a + m.items.length, 0)

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="section-title">بناء الكورس</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>أنشئ وعدّل محتوى كورسك بسهولة</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className={`badge ${published ? 'badge-success' : 'badge-warning'}`}>{published ? 'منشور' : 'مسودة'}</span>
          <button className="btn-outline" style={{ padding: '9px 20px', fontSize: 14 }} onClick={() => setPublished(false)}>حفظ مسودة</button>
          <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }} onClick={() => setPublished(true)}>
            {published ? '✓ منشور' : 'نشر الكورس'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22 }}>
        {/* Curriculum */}
        <div>
          {/* Course info */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>معلومات الكورس</h3>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">عنوان الكورس</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="form-label">وصف الكورس</label>
              <textarea className="form-input" rows={3} value={desc} onChange={e => setDesc(e.target.value)} style={{ resize: 'none' }} />
            </div>
          </div>

          {/* Module tree */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>محتوى المنهج ({totalItems} عنصر)</h3>
              <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }} onClick={addModule}>+ وحدة جديدة</button>
            </div>

            <div style={{ padding: '12px' }}>
              {modules.map(module => (
                <div key={module.id} style={{ marginBottom: 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
                  {/* Module header */}
                  <div
                    style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.04)', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => toggleModule(module.id)}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.4)', transform: module.expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: 12 }}>▼</span>
                    <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700 }}>{module.title}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{module.items.length} عناصر</span>
                    <span style={{ cursor: 'grab', color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>⋮⋮</span>
                  </div>

                  {/* Items */}
                  {module.expanded && (
                    <div style={{ padding: '6px 8px' }}>
                      {module.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 10, marginBottom: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.08)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
                        >
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>⠿</span>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${typeConfig[item.type].color}22`, border: `1px solid ${typeConfig[item.type].color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                            {typeConfig[item.type].icon}
                          </div>
                          <span style={{ flex: 1, fontSize: 13.5 }}>{item.title}</span>
                          {item.duration && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>⏱ {item.duration}</span>}
                          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>✎</button>
                        </div>
                      ))}

                      {/* Add item buttons */}
                      <div style={{ display: 'flex', gap: 8, padding: '8px 6px' }}>
                        {(['lesson', 'quiz', 'assignment'] as const).map(type => (
                          <button key={type}
                            onClick={() => addItem(module.id, type)}
                            style={{ flex: 1, padding: '7px', borderRadius: 9, border: `1px dashed ${typeConfig[type].color}55`, background: `${typeConfig[type].color}08`, color: typeConfig[type].color, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                            + {type === 'lesson' ? 'درس' : type === 'quiz' ? 'اختبار' : 'واجب'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>ملخص الكورس</h3>
            {[
              ['📦', 'الوحدات', `${modules.length}`],
              ['▶', 'الدروس', `${totalLessons}`],
              ['📝', 'الاختبارات', `${modules.reduce((a, m) => a + m.items.filter(i => i.type === 'quiz').length, 0)}`],
              ['📋', 'الواجبات', `${modules.reduce((a, m) => a + m.items.filter(i => i.type === 'assignment').length, 0)}`],
            ].map(([icon, label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13.5 }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', display: 'flex', gap: 8 }}><span>{icon}</span><span>{label}</span></span>
                <span style={{ fontWeight: 700 }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Upload zone */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>📤 رفع فيديو</h3>
            <div style={{ border: '2px dashed rgba(124,58,237,0.35)', borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>ارفع فيديو الدرس</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>MP4, MOV — حتى 2GB</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
