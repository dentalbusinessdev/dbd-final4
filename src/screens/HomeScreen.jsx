import { BookOpen, CheckCircle2, Newspaper, Sparkles } from 'lucide-react'
import { Badge, Button, Card, CardContent } from '../components/ui'

export default function HomeScreen({ onStartAssessment, onBrowseCourses, onBrowseInsights }) {
  return (
    <div className="stack-4">
      <Card className="card-dark">
        <CardContent>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <Badge dark>DBD</Badge>
            <Sparkles size={18} />
          </div>
          <h1 style={{ fontSize: 32, lineHeight: 1.25, margin: '0 0 12px' }}>اعرف مستوى عيادتك في 5 دقائق</h1>
          <p className="muted" style={{ color: '#d1d5db', lineHeight: 1.8, marginBottom: 18 }}>
            تحليل احترافي ونقاط ضعف واضحة وخطة عملية تساعدك تعرف أين تبدأ قبل أن تضيع وقتًا أو ميزانية.
          </p>
          <Button className="btn-hero" onClick={onStartAssessment}>ابدأ التقييم الآن</Button>
        </CardContent>
      </Card>

      <div className="grid-3">
        {[
          ['+2000', 'طبيب جرب التقييم'],
          ['5 دقائق', 'مدة التقييم'],
          ['90 يوم', 'خطة تطوير'],
        ].map(([value, label]) => (
          <Card key={label}>
            <CardContent className="center">
              <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
              <div className="small muted">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="stack-3">
          <h3 style={{ margin: 0, fontSize: 18 }}>ما الذي ستحصل عليه بعد التقييم؟</h3>
          {[
            'تقييم شامل لوضع العيادة الحالي',
            'تحديد أضعف قسم يحتاج أولوية',
            'خريطة أداء توضح القوة والضعف',
            'خطة تطوير عملية لمدة 90 يوم',
          ].map((item) => (
            <div key={item} className="row-between" style={{ background: '#f9fafb', padding: 12, borderRadius: 18 }}>
              <CheckCircle2 size={18} />
              <span style={{ width: '100%', fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid-2">
        <Card onClick={onBrowseCourses} style={{ cursor: 'pointer' }}>
          <CardContent>
            <BookOpen size={24} style={{ marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 4px' }}>الكورسات المسجلة</h3>
            <p className="small muted" style={{ margin: 0 }}>حلول تنفيذية حسب المشكلة</p>
          </CardContent>
        </Card>
        <Card onClick={onBrowseInsights} style={{ cursor: 'pointer' }}>
          <CardContent>
            <Newspaper size={24} style={{ marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 4px' }}>المقالات</h3>
            <p className="small muted" style={{ margin: 0 }}>محتوى عملي يقودك للحل</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
