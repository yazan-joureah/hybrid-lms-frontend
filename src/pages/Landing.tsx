import { useRef, useState } from 'react'
import { useNav } from '../context/NavContext'
import EdujarLogo from '../components/EdujarLogo'

const allCourses = [
  { id: 1, img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=220&fit=crop&auto=format', category: 'التطوير', level: 'متوسط', title: 'Python للتحليل المالي والتداول الخوارزمي', instructor: 'أحمد عبدالله', students: '+50', rating: 4, price: '299 ر.س' },
  { id: 2, img: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=220&fit=crop&auto=format', category: 'التصميم', level: 'مبتدئ', title: 'تصميم واجهات المستخدم بـ Figma من الصفر', instructor: 'سارة الأحمد', students: '+80', rating: 5, price: '199 ر.س' },
  { id: 3, img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=220&fit=crop&auto=format', category: 'التطوير', level: 'متقدم', title: 'React المتقدم وإدارة الحالة بـ Redux', instructor: 'محمد الخالدي', students: '+120', rating: 5, price: '349 ر.س' },
  { id: 4, img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=220&fit=crop&auto=format', category: 'الأعمال', level: 'مبتدئ', title: 'إدارة المشاريع باحترافية', instructor: 'ليلى الكندي', students: '+60', rating: 4, price: '249 ر.س' },
  { id: 5, img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=220&fit=crop&auto=format', category: 'علم البيانات', level: 'متوسط', title: 'تعلم الآلة بـ Python من الصفر', instructor: 'عمر التقني', students: '+90', rating: 5, price: '399 ر.س' },
  { id: 6, img: 'https://images.unsplash.com/photo-1561089489-f13d5e730d72?w=400&h=220&fit=crop&auto=format', category: 'التصميم', level: 'متقدم', title: 'تجربة المستخدم المتقدمة (UX Research)', instructor: 'نور الرشيد', students: '+45', rating: 5, price: '279 ر.س' },
  { id: 7, img: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&h=220&fit=crop&auto=format', category: 'التسويق', level: 'مبتدئ', title: 'التسويق الرقمي الشامل', instructor: 'دانة العمري', students: '+70', rating: 4, price: '179 ر.س' },
  { id: 8, img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=220&fit=crop&auto=format', category: 'الأعمال', level: 'متقدم', title: 'ريادة الأعمال وبناء الشركات الناشئة', instructor: 'خالد السعيد', students: '+35', rating: 5, price: '449 ر.س' },
  { id: 9, img: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=220&fit=crop&auto=format', category: 'علم البيانات', level: 'متقدم', title: 'الشبكات العصبية وتعلم العمق', instructor: 'يوسف الأحمد', students: '+55', rating: 5, price: '499 ر.س' },
]

const categories = ['الكل', 'التطوير', 'التصميم', 'الأعمال', 'علم البيانات', 'التسويق']

const features = [
  { icon: '📡', title: 'حصص مباشرة', desc: 'شارك في دروس مباشرة تفاعلية مع خبراء الصناعة' },
  { icon: '📝', title: 'اختبارات تفاعلية', desc: 'اختبر معرفتك وتتبع تقدمك بالاختبارات الذكية' },
  { icon: '👥', title: 'مراجعة الأقران', desc: 'احصل على تغذية راجعة بنّاءة من زملائك' },
  { icon: '🤖', title: 'مساعد الذكاء الاصطناعي', desc: 'احصل على إجابات فورية ومخصصة بمساعد الذكاء الاصطناعي' },
]

const partners = [
  { name: 'HubSpot', initial: 'H', color: '#f97316' },
  { name: 'GitLab', initial: 'G', color: '#fc6d26' },
  { name: 'Loom', initial: 'L', color: '#625df5' },
  { name: 'LiveChat', initial: 'LC', color: '#0db9f0' },
  { name: 'monday', initial: 'M', color: '#ff3d57' },
  { name: 'Notion', initial: 'N', color: '#fff' },
]

function IconX() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
}
function IconInstagram() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
}
function IconFacebook() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
}
function IconLinkedIn() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
}
function IconYouTube() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" /></svg>
}

const socialLinks = [
  { label: 'X', icon: <IconX />, href: '#', color: '#1d9bf0' },
  { label: 'Instagram', icon: <IconInstagram />, href: '#', color: '#e1306c' },
  { label: 'Facebook', icon: <IconFacebook />, href: '#', color: '#1877f2' },
  { label: 'LinkedIn', icon: <IconLinkedIn />, href: '#', color: '#0a66c2' },
  { label: 'YouTube', icon: <IconYouTube />, href: '#', color: '#ff0000' },
]

export default function Landing() {
  const { navigate } = useNav()
  const [activeCategory, setActiveCategory] = useState('الكل')

  const heroRef    = useRef<HTMLDivElement>(null)
  const coursesRef = useRef<HTMLDivElement>(null)
  const aboutRef   = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) =>
    ref.current?.scrollIntoView({ behavior: 'smooth' })

  const filteredCourses = activeCategory === 'الكل'
    ? allCourses.slice(0, 6)
    : allCourses.filter(c => c.category === activeCategory)

  const navItems = [
    { label: 'الرئيسية',    ref: heroRef },
    { label: 'من نحن',      ref: aboutRef },
    { label: 'الكورسات',   ref: coursesRef },
    { label: 'تواصل معنا', ref: contactRef },
  ]

  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', background: 'var(--gradient-bg)', overflowX: 'hidden' }}>

      {/* BG orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)' }} />
      </div>


    {/* ── Navbar ── */}
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,2,22,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: 'auto', cursor: 'pointer', height: '40px' }} onClick={() => scrollTo(heroRef)}>
         <EdujarLogo width={140} height={38} />
        </div>




      {/* ── Navbar ── */}
      {/* <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,2,22,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: 'auto', cursor: 'pointer' }} onClick={() => scrollTo(heroRef)}>
            <EdujarLogo width={130} height={35} />
          </div> */}

          <div style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
            {navItems.map(item => (
              <button key={item.label} onClick={() => scrollTo(item.ref)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 15px', borderRadius: 8, fontSize: 14.5, color: 'rgba(255,255,255,0.72)', fontFamily: 'inherit', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.72)')}
              >{item.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0, marginRight: 'auto' }}>
            <button onClick={() => navigate('login')}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.32)', borderRadius: 9999, padding: '8px 22px', color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)')}
            >تسجيل الدخول</button>
            <button onClick={() => navigate('register')}
              style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', border: 'none', borderRadius: 9999, padding: '8px 22px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.4)', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(124,58,237,0.4)')}
            >ابدأ الآن</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '70px 32px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 9999, padding: '5px 14px', marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>موثوق من أكثر من 50,000 متعلم</span>
            </div>
            <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.18, margin: '0 0 18px', letterSpacing: '-1px' }}>
              <span style={{ color: '#c4b5fd' }}>أفضل الكورسات</span><br />
              <span style={{ color: '#fff' }}>في انتظارك لإثراء</span><br />
              <span style={{ color: '#fff' }}>مهاراتك</span>
              <span style={{ color: '#f59e0b', fontSize: 30, marginRight: 10 }}> +++ </span>
            </h1>
            <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 460, marginBottom: 38 }}>
              تزودك بأحدث أنظمة التعلم عبر الإنترنت والمواد التي تساعدك على النمو المعرفي.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 9999, overflow: 'hidden', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}>
              <span style={{ padding: '0 14px', color: 'rgba(0,0,0,0.35)', fontSize: 16, display: 'flex', alignItems: 'center' }}>🔍</span>
              <input style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '13px 4px', fontSize: 14, color: '#111', fontFamily: 'inherit', direction: 'rtl' }} placeholder="ماذا تريد أن تتعلم؟" />
              <button onClick={() => scrollTo(coursesRef)} style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', border: 'none', borderRadius: 9999, margin: 5, padding: '10px 22px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>استكشف</button>
            </div>
            <div style={{ display: 'flex', gap: 32, marginTop: 36 }}>
              {[['50K+', 'طالب'], ['200+', 'كورس'], ['98%', 'معدل النجاح']].map(([num, label]) => (
                <div key={label}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{num}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: '0 0 420px', position: 'relative', height: 420 }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 380, height: 380, borderRadius: '50%', border: '1.5px dashed rgba(168,85,247,0.35)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 300, height: 300, borderRadius: '50%', border: '1.5px dashed rgba(168,85,247,0.2)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #5b21b6 0%, #3b0764 60%, #1e0440 100%)', boxShadow: '0 0 60px rgba(124,58,237,0.5), 0 0 120px rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
                <polygon points="50,8 95,32 50,56 5,32" fill="none" stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
                <line x1="95" y1="32" x2="95" y2="55" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M22 44 L22 62 C22 68 35 74 50 74 C65 74 78 68 78 62 L78 44" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ position: 'absolute', top: 60, right: 10, zIndex: 3, background: '#059669', borderRadius: 9999, padding: '7px 14px', display: 'flex', gap: 7, alignItems: 'center', boxShadow: '0 4px 14px rgba(5,150,105,0.5)' }}>
              <span className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>مباشر الآن</span>
            </div>
            <div style={{ position: 'absolute', top: '38%', left: -10, zIndex: 3, background: '#d97706', borderRadius: 9999, padding: '7px 14px', display: 'flex', gap: 7, alignItems: 'center', boxShadow: '0 4px 14px rgba(217,119,6,0.5)' }}>
              <span style={{ fontSize: 13 }}>⭐</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>الأعلى تقييماً</span>
            </div>
            <div style={{ position: 'absolute', bottom: 70, right: 5, zIndex: 3, background: 'rgba(109,40,217,0.9)', border: '1px solid rgba(168,85,247,0.4)', borderRadius: 9999, padding: '7px 14px', display: 'flex', gap: 7, alignItems: 'center', backdropFilter: 'blur(10px)', boxShadow: '0 4px 14px rgba(109,40,217,0.4)' }}>
              <span style={{ fontSize: 13 }}>🎓</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>معتمد رسمياً</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partners ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 32px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '3px', marginBottom: 24 }}>شركاؤنا الموثوقون</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {partners.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '10px 20px', transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)' }}
              >
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `${p.color}20`, border: `1px solid ${p.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: p.color, flexShrink: 0 }}>{p.initial}</div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses with filter ── */}
      <section ref={coursesRef} style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '20px 32px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>
              الكورسات <span className="gradient-text">الأكثر شعبية</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', fontSize: 14 }}>اختر من مئات الكورسات المتاحة</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 30, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 18px', borderRadius: 9999, fontSize: 13.5, fontWeight: 600,
                border: `1px solid ${activeCategory === cat ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                background: activeCategory === cat ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                boxShadow: activeCategory === cat ? '0 4px 14px rgba(124,58,237,0.35)' : 'none',
              }}
            >{cat} {activeCategory === cat && cat !== 'الكل' && <span style={{ opacity: 0.7, fontSize: 12 }}>({allCourses.filter(c => c.category === cat).length})</span>}</button>
          ))}
        </div>

        {filteredCourses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
            لا توجد كورسات في هذا التصنيف حالياً
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {filteredCourses.map(c => (
              <div key={c.id} className="course-card">
                <img src={c.img} alt={c.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                <div style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span className="badge badge-primary">{c.category}</span>
                    <span className="badge badge-neutral">{c.level}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.4 }}>{c.title}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#c4b5fd', border: '1px solid rgba(255,255,255,0.1)' }}>م</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{c.instructor}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{c.students} طالب</div>
                      </div>
                    </div>
                    <div className="stars">{'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#a855f7' }}>{c.price}</span>
                    <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => navigate('login')}>سجّل الآن</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button className="btn-outline" style={{ padding: '12px 36px' }} onClick={() => navigate('login')}>
            استعراض جميع الكورسات ←
          </button>
        </div>
      </section>

      {/* ── About ── */}
      <section ref={aboutRef} style={{ position: 'relative', zIndex: 1, background: 'rgba(124,58,237,0.05)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 9999, padding: '4px 14px', marginBottom: 20, fontSize: 13, color: '#c4b5fd' }}>من نحن</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, margin: '0 0 18px', lineHeight: 1.25 }}>
              منصة تعليمية بُنيت<br />
              <span className="gradient-text">بشغف حقيقي</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15.5, lineHeight: 1.8, margin: '0 0 22px' }}>
              Edujar منصة تعليمية عربية متكاملة تهدف إلى تمكين المتعلمين العرب من الوصول إلى محتوى تعليمي عالي الجودة، بأسعار في متناول الجميع وبأساليب تفاعلية مبتكرة.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14.5, lineHeight: 1.8, margin: '0 0 30px' }}>
              نؤمن بأن التعليم حق للجميع. لذلك نعمل مع نخبة من أفضل المدرسين والخبراء لتقديم محتوى يلبّي احتياجات سوق العمل الحديث.
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              {[['٢٠٢١', 'سنة التأسيس'], ['١٢+', 'دولة عربية'], ['٥٠٠+', 'مدرّس خبير']].map(([v, l]) => (
                <div key={l} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '14px 18px' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#a855f7' }}>{v}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { icon: '🎯', title: 'رسالتنا', desc: 'جعل التعليم المتميز متاحاً لكل متعلم عربي أينما كان' },
              { icon: '🌟', title: 'رؤيتنا', desc: 'أن نكون المنصة التعليمية العربية الأولى بحلول ٢٠٣٠' },
              { icon: '🤝', title: 'قيمنا', desc: 'الجودة، الشفافية، الابتكار، والتمكين المستمر' },
              { icon: '🏆', title: 'إنجازاتنا', desc: 'جائزة أفضل منصة تعليمية عربية لعامَي ٢٠٢٤ و٢٠٢٥' },
            ].map(item => (
              <div key={item.title} style={{ background: 'rgba(30,12,80,0.5)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '20px' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px' }}>لماذا <span className="gradient-text">Edujar؟</span></h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>كل ما تحتاجه لتجربة تعليمية استثنائية</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'rgba(30,12,80,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, padding: '28px 20px', textAlign: 'center', transition: 'transform 0.2s, border-color 0.2s', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)' }}
            >
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px' }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(168,85,247,0.2) 100%)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 24, padding: '52px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(124,58,237,0.2)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(168,85,247,0.2)', filter: 'blur(50px)' }} />
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 14px', position: 'relative' }}>ابدأ رحلتك التعليمية <span className="gradient-text">اليوم</span></h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, margin: '0 0 32px', position: 'relative' }}>انضم إلى أكثر من 50,000 طالب وطوّر مهاراتك مع أفضل المدرسين</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', position: 'relative' }}>
            <button className="btn-primary" style={{ padding: '14px 36px', fontSize: 16 }} onClick={() => navigate('register')}>ابدأ مجاناً الآن</button>
            <button className="btn-outline" style={{ padding: '13px 36px', fontSize: 16 }} onClick={() => navigate('login')}>تسجيل الدخول</button>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section ref={contactRef} style={{ position: 'relative', zIndex: 1, background: 'rgba(124,58,237,0.04)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px' }}><span className="gradient-text">تواصل معنا</span></h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>فريقنا جاهز للرد على استفساراتك</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>
            {/* Form */}
            <div style={{ background: 'rgba(20,8,60,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="form-label">الاسم</label>
                  <input className="form-input" placeholder="محمد أحمد" />
                </div>
                <div>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input className="form-input" type="email" placeholder="name@example.com" style={{ direction: 'ltr' }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">الموضوع</label>
                <input className="form-input" placeholder="كيف يمكننا مساعدتك؟" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">الرسالة</label>
                <textarea className="form-input" rows={4} placeholder="اكتب رسالتك هنا..." style={{ resize: 'none' }} />
              </div>
              <button className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: 15 }}>إرسال الرسالة ✉️</button>
            </div>

            {/* Contact info — simplified */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '📞', label: 'اتصل بنا', value: '+963 11 234 5678' },
                { icon: '📧', label: 'البريد الإلكتروني', value: 'support@edujar.com' },
                { icon: '📍', label: 'موقعنا', value: 'دمشق، سوريا' },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(20,8,60,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{item.value}</div>
                  </div>
                </div>
              ))}

              {/* Social */}
              <div style={{ background: 'rgba(20,8,60,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>تابعنا على مواقع التواصل</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {socialLinks.map(s => (
                    <a key={s.label} href={s.href} title={s.label}
                      style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'all 0.18s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${s.color}22`; (e.currentTarget as HTMLElement).style.borderColor = `${s.color}66`; (e.currentTarget as HTMLElement).style.color = s.color }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
                    >{s.icon}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer — simplified ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '40px 32px 28px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Main footer row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 28, marginBottom: 28 }}>
            {/* Contact info */}
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {[['📞', '+963 11 234 5678'], ['📧', 'support@edujar.com'], ['📍', 'دمشق، سوريا']].map(([icon, val]) => (
                <div key={val} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: 9 }}>
              {socialLinks.map(s => (
                <a key={s.label} href={s.href} title={s.label}
                  style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'all 0.18s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${s.color}22`; (e.currentTarget as HTMLElement).style.borderColor = `${s.color}55`; (e.currentTarget as HTMLElement).style.color = s.color }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
                >{s.icon}</a>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              {/* Privacy + copyright stacked on the left */}
              <div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 5 }}>
                  {['سياسة الخصوصية', 'شروط الخدمة', 'ملفات الارتباط'].map(l => (
                    <button key={l} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0, transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                    >{l}</button>
                  ))}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12.5, margin: 0 }}>© 2026 Edujar. جميع الحقوق محفوظة.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <EdujarLogo width={80} height={22} />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}