import { useState } from 'react'
import { BarChart3, CheckCircle2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { Badge, Button, Card, CardContent } from '../components/ui'
import { articles, companyProfile, consultation, courses } from '../data/content'
import { scoreAssessment } from '../lib/assessment'

export function CoursesScreen() {
  const allOffers = [...courses, consultation]

  return (
    <div className="stack-4">
      <div className="stack-2">
        <Badge>الكورسات</Badge>
        <h2 style={{ fontSize: 32, margin: 0 }}>الكورسات والاستشارة</h2>
        <p className="small muted">عروض تعليمية وتنفيذية مرتبطة مباشرة بالمشكلات التي يكشفها التقييم.</p>
      </div>

      {allOffers.map((course) => (
        <Card key={course.id}>
          <CardContent className="stack-3">
            <div className="row-between" style={{ alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{course.title}</div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{course.titleAr}</div>
              </div>
              <Badge>{course.type === 'consultation' ? 'استشارة' : course.type === 'bundle' ? 'برنامج كامل' : 'كورس أونلاين'}</Badge>
            </div>

            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: '#374151' }}>{course.description}</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: '#4b5563' }}><strong>مناسب لك لأن:</strong> {course.reason}</p>

            <div className="stack-2">
              {course.outcome.map((outcome) => (
                <div key={outcome} className="row-between" style={{ justifyContent: 'flex-start', gap: 8 }}>
                  <CheckCircle2 size={16} />
                  <span className="small">{outcome}</span>
                </div>
              ))}
            </div>

            <div className="row-between small muted">
              <span>{course.lectures}</span>
              <span>{course.duration}</span>
            </div>

            <a href={course.link} target="_blank" rel="noreferrer" className="btn btn-primary linkish">
              {course.cta} <ExternalLink size={16} />
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AboutScreen() {
  return (
    <div className="stack-4">
      <div className="stack-2">
        <Badge>عنا</Badge>
        <h2 style={{ fontSize: 32, margin: 0 }}>{companyProfile.name}</h2>
        <p className="small muted" style={{ lineHeight: 1.9 }}>{companyProfile.heroTitle}</p>
      </div>

      <Card>
        <CardContent className="stack-4">
          <div className="stack-2">
            <h3 style={{ margin: 0, fontSize: 20 }}>عن الشركة</h3>
            <p style={{ margin: 0, lineHeight: 1.9, color: '#374151' }}>{companyProfile.companySummary}</p>
            <div className="offer-card">
              <div className="offer-card-strip" />
              <div className="stack-2">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>رؤيتنا</div>
                  <p style={{ margin: 0, lineHeight: 1.9, color: '#475569' }}>{companyProfile.vision}</p>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>مهمتنا</div>
                  <p style={{ margin: 0, lineHeight: 1.9, color: '#475569' }}>{companyProfile.mission}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="stack-2">
            <h3 style={{ margin: 0, fontSize: 20 }}>عن المؤسس</h3>
            <div className="offer-card">
              <div className="stack-2">
                <div style={{ fontSize: 20, fontWeight: 700 }}>{companyProfile.founder.name}</div>
                <div style={{ fontSize: 14, color: '#4f46e5', fontWeight: 700 }}>{companyProfile.founder.title}</div>
                <p style={{ margin: 0, lineHeight: 1.9, color: '#374151' }}>{companyProfile.founder.bio}</p>
              </div>
            </div>
          </div>

          <div className="stack-2">
            <h3 style={{ margin: 0, fontSize: 20 }}>خدماتنا</h3>
            <div className="stack-2">
              {companyProfile.services.map((service) => (
                <div key={service} className="row-between" style={{ justifyContent: 'flex-start', gap: 8, background: '#f8fafc', borderRadius: 18, padding: 12 }}>
                  <CheckCircle2 size={16} />
                  <span style={{ lineHeight: 1.8, color: '#334155' }}>{service}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stack-2">
            <h3 style={{ margin: 0, fontSize: 20 }}>لماذا DBD؟</h3>
            <div className="stack-2">
              {companyProfile.strengths.map((item) => (
                <div key={item} className="row-between" style={{ justifyContent: 'flex-start', gap: 8, background: '#f8fafc', borderRadius: 18, padding: 12 }}>
                  <CheckCircle2 size={16} />
                  <span style={{ lineHeight: 1.8, color: '#334155' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <a href={companyProfile.whatsapp} target="_blank" rel="noreferrer" className="btn btn-primary linkish" style={{ width: '100%' }}>
              تواصل معنا عبر واتساب <ExternalLink size={16} />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function InsightsScreen({ onStartAssessment }) {
  const [expandedArticleId, setExpandedArticleId] = useState(null)

  return (
    <div className="stack-4">
      <div className="stack-2">
        <Badge>المقالات</Badge>
        <h2 style={{ fontSize: 32, margin: 0 }}>المقالات والأخبار</h2>
        <p className="small muted">مقالات عملية تشرح المشكلة بوضوح وتعطيك خطوات واقعية يمكنك تطبيقها داخل العيادة.</p>
      </div>

      {articles.map((article) => {
        const isExpanded = expandedArticleId === article.id

        return (
          <Card key={article.id}>
            <CardContent className="stack-3 article-card">
              <div className="article-index">#{article.id}</div>
              <h3 style={{ margin: 0, fontSize: 20 }}>{article.title}</h3>
              <p style={{ margin: 0, lineHeight: 1.8, fontSize: 14, color: '#4b5563' }}>{article.excerpt}</p>

              {isExpanded && (
                <div className="stack-3" style={{ background: '#f8fafc', borderRadius: 22, padding: 16 }}>
                  <div className="stack-2">
                    {article.body.map((paragraph) => (
                      <p key={paragraph} style={{ margin: 0, lineHeight: 1.9, fontSize: 14, color: '#334155' }}>{paragraph}</p>
                    ))}
                  </div>

                  <div className="stack-2">
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>أهم النقاط العملية</div>
                    {article.takeaways.map((item) => (
                      <div key={item} className="row-between" style={{ justifyContent: 'flex-start', gap: 8, alignItems: 'flex-start' }}>
                        <CheckCircle2 size={16} style={{ marginTop: 3 }} />
                        <span style={{ fontSize: 14, lineHeight: 1.8, color: '#334155' }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>{article.action}</div>
                  </div>
                </div>
              )}

              <div className="row-between" style={{ gap: 12 }}>
                <Button
                  variant="outline"
                  onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
                >
                  {isExpanded ? 'إخفاء التفاصيل' : article.readMoreLabel}
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
                <Button onClick={onStartAssessment}>{article.cta}</Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function DashboardScreen({ answers, onResumeAssessment, onSeeResult }) {
  const hasAssessment = Object.keys(answers).length > 0
  const scores = hasAssessment ? scoreAssessment(answers) : null

  return (
    <div className="stack-4">
      <div className="stack-2">
        <Badge>لوحة التحكم</Badge>
        <h2 style={{ fontSize: 32, margin: 0 }}>لوحة التحكم</h2>
        <p className="small muted">كل ما يخص نمو عيادتك في مكان واحد.</p>
      </div>
      {!hasAssessment ? (
        <Card>
          <CardContent className="center">
            <BarChart3 size={40} style={{ marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 8px' }}>لا يوجد تقييم مكتمل بعد</h3>
            <p className="small muted" style={{ marginBottom: 16 }}>ابدأ التقييم للحصول على تقرير احترافي وتوصيات مخصصة.</p>
            <Button onClick={onResumeAssessment}>ابدأ التقييم</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="card-dark">
            <CardContent>
              <h3 style={{ margin: '0 0 8px' }}>نتيجتك الحالية</h3>
              <div className="kpi">{scores.overall}%</div>
              <p style={{ color: '#d1d5db' }}>يمكنك مراجعة التقرير أو إعادة التقييم لاحقًا.</p>
            </CardContent>
          </Card>
          <Button onClick={onSeeResult}>عرض التقرير</Button>
        </>
      )}
    </div>
  )
}
