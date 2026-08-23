import EdujarLogo from '../components/EdujarLogo'
import { useNav } from '../context/NavContext'

const allPosts = [
  { id: 1, img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=340&fit=crop&auto=format', category: 'التعلم', date: '٢٥ يوليو ٢٠٢٦', readTime: '٥ دقائق', title: 'كيف تختار الكورس المناسب لمستواك في عام 2026', excerpt: 'دليل شامل يساعدك على اتخاذ القرار الصحيح عند اختيار مسارك التعليمي بما يتوافق مع أهدافك المهنية وإمكانياتك الوقتية.' },
  { id: 2, img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=340&fit=crop&auto=format', category: 'الذكاء الاصطناعي', date: '١٨ يوليو ٢٠٢٦', readTime: '٧ دقائق', title: 'الذكاء الاصطناعي في التعليم: ثورة أم تحدٍّ؟', excerpt: 'نستعرض كيف تُغيّر تقنيات الذكاء الاصطناعي مشهد التعليم الإلكتروني عالمياً، وما يعنيه ذلك للمتعلمين والمدرسين.' },
  { id: 3, img: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=340&fit=crop&auto=format', category: 'نصائح', date: '١٠ يوليو ٢٠٢٦', readTime: '٦ دقائق', title: '١٠ نصائح لتعظيم استفادتك من الدورات الإلكترونية', excerpt: 'استراتيجيات مجرّبة تساعدك على إكمال الكورسات بنجاح والاحتفاظ بما تعلمته على المدى البعيد.' },
  { id: 4, img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=340&fit=crop&auto=format', category: 'التطوير', date: '٣ يوليو ٢٠٢٦', readTime: '٨ دقائق', title: 'React vs Vue في 2026: أيهما تتعلم؟', excerpt: 'مقارنة عملية موضوعية بين أبرز إطارَي عمل JavaScript من حيث سوق العمل، سرعة التعلم، والأداء.' },
  { id: 5, img: 'https://images.unsplash.com/photo-1561089489-f13d5e730d72?w=600&h=340&fit=crop&auto=format', category: 'التصميم', date: '٢٨ يونيو ٢٠٢٦', readTime: '٥ دقائق', title: 'مبادئ تصميم UX التي يجب أن تعرفها في ٢٠٢٦', excerpt: 'أبرز مبادئ تجربة المستخدم الحديثة التي تفرق بين منتج يُحبّه المستخدمون ومنتج يهجرونه.' },
  { id: 6, img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=340&fit=crop&auto=format', category: 'علم البيانات', date: '٢٠ يونيو ٢٠٢٦', readTime: '٩ دقائق', title: 'مسار تعلم علم البيانات من الصفر: دليل ٢٠٢٦', excerpt: 'خارطة طريق واضحة تأخذك من مبادئ Python والإحصاء وصولاً إلى تطبيقات Machine Learning الفعلية.' },
]

const categoryColors: Record<string, string> = {
  'التعلم': '#7c3aed',
  'الذكاء الاصطناعي': '#06b6d4',
  'نصائح': '#f59e0b',
  'التطوير': '#10b981',
  'التصميم': '#ec4899',
  'علم البيانات': '#a855f7',
}

const categories = ['الكل', ...Array.from(new Set(allPosts.map(p => p.category)))]

export default function Blog() {
  const { navigate } = useNav()
  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', background: 'var(--gradient-bg)' }}>
      {/* Minimal header */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,2,22,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <EdujarLogo width={130} height={35} />
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={() => navigate('landing')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9999, padding: '7px 18px', color: 'rgba(255,255,255,0.7)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>← العودة للرئيسية</button>
          <button onClick={() => navigate('login')} style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', border: 'none', borderRadius: 9999, padding: '8px 20px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>ابدأ الآن</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 32px 80px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 9999, padding: '4px 16px', marginBottom: 18, fontSize: 13, color: '#c4b5fd' }}>
            المدوّنة
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-1px' }}>
            أفكار وتجارب من <span style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>مجتمع Edujar</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15.5, maxWidth: 520, margin: '0 auto' }}>
            مقالات تعليمية، نصائح عملية، وأحدث توجهات التعلم الإلكتروني
          </p>
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          {categories.map((cat, i) => {
            const color = categoryColors[cat] || '#7c3aed'
            return (
              <button key={cat} style={{
                padding: '8px 20px', borderRadius: 9999, fontSize: 13.5, fontWeight: 600,
                border: `1px solid ${i === 0 ? 'rgba(124,58,237,0.5)' : `${color}44`}`,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: i === 0 ? 'linear-gradient(135deg, #7c3aed, #9333ea)' : `${color}12`,
                color: i === 0 ? '#fff' : color,
              }}>
                {cat}
              </button>
            )
          })}
        </div>

        {/* Featured post */}
        <div style={{
          background: 'rgba(20,8,60,0.7)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(124,58,237,0.25)', borderRadius: 22,
          overflow: 'hidden', marginBottom: 32,
          display: 'grid', gridTemplateColumns: '1fr 1fr', cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)')}
        >
          <div style={{ position: 'relative', minHeight: 280 }}>
            <img src={allPosts[0].img} alt={allPosts[0].title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(20,8,60,0.4), transparent)' }} />
          </div>
          <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18 }}>
              <span style={{ background: `${categoryColors[allPosts[0].category]}22`, border: `1px solid ${categoryColors[allPosts[0].category]}44`, borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: categoryColors[allPosts[0].category] }}>{allPosts[0].category}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>⭐ مميز</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 14px', lineHeight: 1.4 }}>{allPosts[0].title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, margin: '0 0 22px' }}>{allPosts[0].excerpt}</p>
            <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>
              <span>📅 {allPosts[0].date}</span>
              <span>⏱ {allPosts[0].readTime} قراءة</span>
            </div>
          </div>
        </div>

        {/* Rest of posts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
          {allPosts.slice(1).map(post => {
            const color = categoryColors[post.category] || '#7c3aed'
            return (
              <div key={post.id} style={{
                background: 'rgba(20,8,60,0.7)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden',
                cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = `${color}44` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
              >
                <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                  <img src={post.img} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,8,60,0.5), transparent)' }} />
                  <span style={{
                    position: 'absolute', top: 14, right: 14,
                    background: `${color}cc`, backdropFilter: 'blur(8px)',
                    borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#fff',
                  }}>{post.category}</span>
                </div>
                <div style={{ padding: '18px 20px 22px' }}>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.38)', marginBottom: 10 }}>
                    <span>📅 {post.date}</span>
                    <span>⏱ {post.readTime}</span>
                  </div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.45 }}>{post.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.65, margin: '0 0 16px' }}>{post.excerpt}</p>
                  <span style={{ fontSize: 13, color: color, fontWeight: 600 }}>قراءة المقال ←</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
