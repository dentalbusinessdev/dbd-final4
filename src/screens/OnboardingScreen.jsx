import React from 'react'
import { motion } from 'framer-motion'
import { Badge, Button } from '../components/ui'

const slides = [
  {
    title: 'حلل عيادتك بشكل احترافي',
    desc: 'تشخيص واضح لأهم نقاط الضعف في التسويق والتشغيل والمال والفريق وتجربة المريض.',
    symbol: 'تحليل',
  },
  {
    title: 'اعرف أولوياتك الحقيقية',
    desc: 'بدل تشتيت الجهد، يحدد DBD القسم الأهم الذي يجب أن تبدأ به الآن.',
    symbol: 'أولوية',
  },
  {
    title: 'انتقل من التشخيص إلى الحل',
    desc: 'بعد النتيجة ستحصل على توصيات ومحتوى مناسب وكورسات مسجلة تساعدك على التنفيذ.',
    symbol: 'تنفيذ',
  },
]

export default function OnboardingScreen({ onNext }) {
  const [index, setIndex] = React.useState(0)
  const item = slides[index]

  return (
    <div className="page onboarding-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ paddingTop: 16, textAlign: 'right' }}>
        <Badge>مرحبًا بك في DBD</Badge>
        <motion.div key={index} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className={`onboarding-visual ${index === 1 ? 'onboarding-visual-cards' : index === 2 ? 'onboarding-visual-flow' : ''}`}>
            <div className="onboarding-surface surface-a" />
            <div className="onboarding-surface surface-b" />
            <div className="onboarding-frame frame-a" />
            <div className="onboarding-frame frame-b" />
            <div className="onboarding-visual-tag">{item.symbol}</div>
            <div className="onboarding-notion-card notion-card-main">
              <div className="vector-line vector-line-lg" />
              <div className="vector-line vector-line-sm" />
              <div className="vector-line vector-line-lg" />
            </div>
            <div className="onboarding-notion-card notion-card-side">
              <div className="vector-line vector-line-lg" />
              <div className="vector-line vector-line-sm" />
            </div>
          </div>
          <h2 style={{ fontSize: 34, margin: '0 0 12px' }}>{item.title}</h2>
          <p className="muted" style={{ lineHeight: 1.9 }}>{item.desc}</p>
        </motion.div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {slides.map((_, slideIndex) => (
            <div key={slideIndex} style={{ width: slideIndex === index ? 32 : 8, height: 8, borderRadius: 99, background: slideIndex === index ? '#111827' : '#d1d5db' }} />
          ))}
        </div>

        {index < slides.length - 1 ? (
          <div className="stack-3">
            <Button onClick={() => setIndex((currentIndex) => currentIndex + 1)}>التالي</Button>
            <Button variant="outline" onClick={onNext}>تخطي</Button>
          </div>
        ) : (
          <Button onClick={onNext}>ابدأ الآن</Button>
        )}
      </div>
    </div>
  )
}
