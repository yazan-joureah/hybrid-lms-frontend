import { useState } from 'react'
import { useNav } from '../../context/NavContext'

const allCourses = [
  { id: 1, title: 'React المتقدم وإدارة الحالة', instructor: 'محمد الخالدي', category: 'تطوير', level: 'متقدم', duration: '32 ساعة', students: 120, rating: 5, price: '349 ر.س', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=320&h=180&fit=crop&auto=format', enrolled: false },
  { id: 2, title: 'Python للتحليل المالي والخوارزمي', instructor: 'أحمد عبدالله', category: 'بيانات', level: 'متوسط', duration: '28 ساعة', students: 85, rating: 4, price: '299 ر.س', img: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=320&h=180&fit=crop&auto=format', enrolled: false },
  { id: 3, title: 'تصميم UI/UX بـ Figma من الصفر', instructor: 'سارة الأحمد', category: 'تصميم', level: 'مبتدئ', duration: '20 ساعة', students: 200, rating: 5, price: '199 ر.س', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=320&h=180&fit=crop&auto=format', enrolled: true },
  { id: 4, title: 'تعلم الآلة مع TensorFlow', instructor: 'ليلى الكندي', category: 'بيانات', level: 'متقدم', duration: '45 ساعة', students: 67, rating: 5, price: '449 ر.س', img: 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?w=320&h=180&fit=crop&auto=format', enrolled: false },
  { id: 5, title: 'Node.js وبناء REST APIs', instructor: 'عمر الشافعي', category: 'تطوير', level: 'متوسط', duration: '24 ساعة', students: 150, rating: 4, price: '279 ر.س', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=320&h=180&fit=crop&auto=format', enrolled: false },
  { id: 6, title: 'أساسيات التسويق الرقمي', instructor: 'نور الرشيد', category: 'أعمال', level: 'مبتدئ', duration: '18 ساعة', students: 310, rating: 4, price: '179 ر.س', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=320&h=180&fit=crop&auto=format', enrolled: false },
]

const categories = ['الكل', 'تطوير', 'تصميم', 'بيانات', 'أعمال', 'تسويق']
const levels = ['الكل', 'مبتدئ', 'متوسط', 'متقدم']

export default function CourseCatalog() {
  const { navigate } = useNav()
  const [activeCat, setActiveCat] = useState('الكل')
  const [activeLevel, setActiveLevel] = useState('الكل')
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<typeof allCourses[0] | null>(null)

  const filtered = allCourses.filter(c => {
    const matchCat = activeCat === 'الكل' || c.category === activeCat
    const matchLevel = activeLevel === 'الكل' || c.level === activeLevel
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.includes(search)
    return matchCat && matchLevel && matchSearch
  })

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">استعراض الكورسات</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>اكتشف مئات الكورسات من خبراء المجال</p>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-input" style={{ flex: '0 0 260px', paddingTop: 9, paddingBottom: 9 }} placeholder="🔍 ابحث عن كورس..." value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCat(c)}
                style={{ padding: '7px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: activeCat === c ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.07)', color: '#fff' }}>
                {c}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {levels.map(l => (
              <button key={l} onClick={() => setActiveLevel(l)}
                style={{ padding: '7px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 500, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: activeLevel === l ? 'rgba(124,58,237,0.2)' : 'transparent', borderColor: activeLevel === l ? '#7c3aed' : 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>
        عُثر على <span style={{ color: '#a855f7', fontWeight: 600 }}>{filtered.length}</span> كورس
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>لم يتم العثور على كورسات</div>
          <div style={{ fontSize: 13.5 }}>حاول تغيير كلمة البحث أو الفلاتر</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
          {filtered.map(c => (
            <div key={c.id} className="course-card" onClick={() => setSelectedCourse(c)}>
              <div style={{ position: 'relative' }}>
                <img src={c.img} alt={c.title} style={{ width: '100%', height: 168, objectFit: 'cover' }} />
                {c.enrolled && (
                  <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(16,185,129,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>مسجّل</span>
                )}
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <span className="badge badge-primary">{c.category}</span>
                  <span className="badge badge-neutral">{c.level}</span>
                </div>
                <h3 style={{ fontSize: 14.5, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.4 }}>{c.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#c4b5fd', border: '1px solid rgba(255,255,255,0.1)' }}>م</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.instructor}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{c.students} طالب • {c.duration}</div>
                  </div>
                  <div className="stars">{'★'.repeat(c.rating)}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#a855f7' }}>{c.price}</span>
                  <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 12.5 }} onClick={(e) => {
                    e.stopPropagation()
                    if (c.enrolled) {
                      navigate('my-courses')
                    } else {
                      navigate(`/student/checkout?courseId=${c.id} `)
                    }
                  }}>
                    {c.enrolled ? 'متابعة التعلم' : 'سجّل الآن'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course detail modal */}
      {selectedCourse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedCourse(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: '32px', maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <img src={selectedCourse.img} alt={selectedCourse.title} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 14, marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <span className="badge badge-primary">{selectedCourse.category}</span>
              <span className="badge badge-neutral">{selectedCourse.level}</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>{selectedCourse.title}</h2>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', marginBottom: 18, lineHeight: 1.6 }}>
              تعلّم أحدث التقنيات والمهارات العملية في هذا الكورس الشامل الذي يقدمه خبير متخصص بأسلوب تفاعلي ومنهجي.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[['👨‍🏫', 'المدرّس', selectedCourse.instructor], ['⏱️', 'المدة', selectedCourse.duration], ['👥', 'الطلاب', `${selectedCourse.students} طالب`], ['📊', 'المستوى', selectedCourse.level]].map(([icon, label, val]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{val}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>محتوى الكورس:</div>
              {['مقدمة وأساسيات المفاهيم', 'الدروس النظرية والتطبيقية', 'مشاريع عملية متكاملة', 'اختبارات وتقييم ختامي'].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13.5 }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#a855f7' }}>{selectedCourse.price}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-outline" style={{ padding: '10px 20px', fontSize: 14 }} onClick={() => setSelectedCourse(null)}>إغلاق</button>
                <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }} onClick={() => {
                  setSelectedCourse(null)
                  if (selectedCourse.enrolled) {
                    navigate('my-courses')
                  } else {
                    navigate(`/student/checkout?courseId=${selectedCourse.id} `)
                  }
                }}>
                  {selectedCourse.enrolled ? 'متابعة التعلم' : 'سجّل الآن'}
                </button> 
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
