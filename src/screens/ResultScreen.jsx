import { useEffect, useMemo, useRef, useState } from 'react'
import { Award, CheckCircle2, ExternalLink, PhoneCall, Target, TriangleAlert } from 'lucide-react'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { Badge, Button, Card, CardContent, Progress } from '../components/ui'
import { countryMap } from '../data/assessment'
import { scoreAssessment } from '../lib/assessment'
import { getCachedLeadSync, registerReportUrl, submitAssessmentLead } from '../lib/backendClient'
import { generateProfessionalPdfReport } from '../lib/pdfReport'
import { isReportUploadConfigured, uploadReportPdf } from '../lib/reportStorage'
import {
  buildClinicContext,
  buildDiagnosis,
  getExecutionPlan,
  getFreeActionPlan,
  getImpactMessage,
  getPriority,
  getRecommendedSolutionSet,
  getReportDate,
  getSupportRecommendation,
  getUrgencyMessage,
} from '../lib/report'

const scoreLabels = {
  marketing: 'التسويق',
  operations: 'التشغيل',
  finance: 'المال',
  team: 'الفريق',
  patient: 'تجربة المريض',
}

export default function ResultScreen({ answers }) {
  const reportRef = useRef(null)
  const chartRef = useRef(null)
  const autoUploadStartedRef = useRef(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [exportProgress, setExportProgress] = useState({ value: 0, message: '' })
  const [toast, setToast] = useState(null)
  const [leadSync, setLeadSync] = useState(() => getCachedLeadSync(answers))
  const [lastReportUrl, setLastReportUrl] = useState('')

  const scores = useMemo(() => scoreAssessment(answers), [answers])
  const diagnosis = useMemo(() => buildDiagnosis(scores), [scores])
  const solutionSet = useMemo(() => getRecommendedSolutionSet(diagnosis, scores), [diagnosis, scores])
  const selectedCountry = countryMap[answers.country]
  const clinicContextNotes = useMemo(() => buildClinicContext(answers), [answers])
  const executionPlan = useMemo(() => getExecutionPlan(diagnosis.weakestKey), [diagnosis.weakestKey])
  const supportRecommendation = useMemo(() => getSupportRecommendation(scores), [scores])
  const clinicName = answers.clinic_name || 'العيادة'
  const reportDate = getReportDate()
  const phoneLabel = [answers.phone_country_code || selectedCountry?.dialCode, answers.phone_number].filter(Boolean).join(' ')

  const radarData = [
    { subject: 'التسويق', score: scores.marketing },
    { subject: 'التشغيل', score: scores.operations },
    { subject: 'المال', score: scores.finance },
    { subject: 'الفريق', score: scores.team },
    { subject: 'المريض', score: scores.patient },
  ]

  const showToast = (type, text) => {
    setToast({ type, text })
    window.setTimeout(() => setToast(null), 3600)
  }

  useEffect(() => {
    let cancelled = false

    const syncLead = async () => {
      if (leadSync?.leadId) return

      try {
        const result = await submitAssessmentLead(answers, scores, { appVersion: 'v13-final', source: 'netlify-web' })
        if (!cancelled) {
          setLeadSync({
            leadId: result.lead_id,
            overallScore: result.overall_score,
            weakestArea: result.weakest_area,
          })
        }
      } catch (error) {
        console.warn('Lead sync skipped:', error.message)
      }
    }

    syncLead()
    return () => {
      cancelled = true
    }
  }, [answers, leadSync?.leadId, scores])

  useEffect(() => {
    let cancelled = false

    const uploadReportInBackground = async () => {
      if (!leadSync?.leadId) return
      if (!isReportUploadConfigured()) return
      if (lastReportUrl) return
      if (autoUploadStartedRef.current) return

      autoUploadStartedRef.current = true
      setIsExportingPdf(true)
      setExportProgress({ value: 5, message: 'جارٍ تجهيز التقرير وربطه تلقائيًا' })

      try {
        const { blob, filename } = await generateProfessionalPdfReport({
          clinicName,
          answers,
          scores,
          diagnosis,
          solutionSet,
          executionPlan,
          clinicContextNotes,
          supportRecommendation,
          reportDate: new Date(),
          radarElement: chartRef.current,
          onProgress: (value, message) => {
            if (!cancelled) {
              setExportProgress({ value, message })
            }
          },
          saveFile: false,
        })

        if (cancelled) return

        setExportProgress({ value: 97, message: 'جارٍ رفع التقرير وإنشاء رابط عام' })

        const uploadedReport = await uploadReportPdf({
          fileBlob: blob,
          filename,
          leadId: leadSync.leadId,
        })

        await registerReportUrl({
          lead_id: leadSync.leadId,
          clinic_name: clinicName,
          person_name: answers.person_name || '',
          phone_whatsapp_full: phoneLabel,
          report_pdf_url: uploadedReport.url,
          report_status: 'ready',
          scores: { ...scores },
          diagnosis: {
            weakestKey: diagnosis.weakestKey,
            weakestLabel: diagnosis.weakestLabel,
            explanation: diagnosis.explanation,
          },
          recommended_course: solutionSet.course,
          recommended_bundle: solutionSet.bundle,
          recommended_consultation: solutionSet.consultation,
        })

        if (!cancelled) {
          setLastReportUrl(uploadedReport.url)
          setLeadSync((current) => ({
            ...(current || {}),
            reportPdfUrl: uploadedReport.url,
          }))
          showToast('success', 'تم رفع رابط التقرير تلقائيًا وحفظه في الشيت.')
        }
      } catch (error) {
        console.error(error)
        autoUploadStartedRef.current = false
        if (!cancelled) {
          showToast('error', 'تعذر رفع رابط التقرير تلقائيًا. يمكنك إعادة المحاولة من خلال تنزيل التقرير.')
        }
      } finally {
        if (!cancelled) {
          setExportProgress({ value: 0, message: '' })
          setIsExportingPdf(false)
        }
      }
    }

    uploadReportInBackground()

    return () => {
      cancelled = true
    }
  }, [
    answers,
    clinicContextNotes,
    clinicName,
    diagnosis,
    executionPlan,
    lastReportUrl,
    leadSync?.leadId,
    phoneLabel,
    scores,
    solutionSet,
    supportRecommendation,
  ])

  const downloadPDF = async () => {
    if (isExportingPdf) return

    setIsExportingPdf(true)
    setExportProgress({ value: 5, message: 'جارٍ تجهيز بيانات التقرير' })

    try {
      const { blob, filename } = await generateProfessionalPdfReport({
        clinicName,
        answers,
        scores,
        diagnosis,
        solutionSet,
        executionPlan,
        clinicContextNotes,
        supportRecommendation,
        reportDate: new Date(),
        radarElement: chartRef.current,
        onProgress: (value, message) => setExportProgress({ value, message }),
        saveFile: true,
      })

      if (leadSync?.leadId && isReportUploadConfigured() && !lastReportUrl) {
        setExportProgress({ value: 97, message: 'جارٍ رفع التقرير وإنشاء رابط عام' })

        const uploadedReport = await uploadReportPdf({
          fileBlob: blob,
          filename,
          leadId: leadSync.leadId,
        })

        await registerReportUrl({
          lead_id: leadSync.leadId,
          clinic_name: clinicName,
          person_name: answers.person_name || '',
          phone_whatsapp_full: phoneLabel,
          report_pdf_url: uploadedReport.url,
          report_status: 'ready',
          scores: { ...scores },
          diagnosis: {
            weakestKey: diagnosis.weakestKey,
            weakestLabel: diagnosis.weakestLabel,
            explanation: diagnosis.explanation,
          },
          recommended_course: solutionSet.course,
          recommended_bundle: solutionSet.bundle,
          recommended_consultation: solutionSet.consultation,
        })

        setLastReportUrl(uploadedReport.url)
        setLeadSync((current) => ({
          ...(current || {}),
          reportPdfUrl: uploadedReport.url,
        }))
        showToast('success', 'تم إنشاء التقرير ورفعه وتسجيل رابطه في الشيت بنجاح.')
      } else if (leadSync?.leadId) {
        showToast('success', lastReportUrl ? 'تم تنزيل التقرير بنجاح.' : 'تم إنشاء التقرير بنجاح. فعّل إعداد رفع التقارير لإضافة الرابط تلقائيًا إلى الشيت.')
      } else {
        showToast('success', 'تم إنشاء التقرير الاحترافي بنجاح.')
      }
    } catch (error) {
      console.error(error)
      showToast('error', 'حدثت مشكلة أثناء إنشاء أو رفع ملف PDF. حاول مرة أخرى.')
    } finally {
      setExportProgress({ value: 0, message: '' })
      setIsExportingPdf(false)
    }
  }

  const whatsappText = encodeURIComponent(`تقرير DBD الخاص بـ ${clinicName} جاهز. يمكنك تنزيله ومراجعته ثم اتخاذ الخطوة التالية المناسبة.`)

  return (
    <div className="stack-4">
      {isExportingPdf && (
        <Card className="export-status-card">
          <CardContent className="stack-2">
            <div className="row-between">
              <strong>جارٍ إنشاء التقرير الاحترافي</strong>
              <span className="small muted">{exportProgress.value}%</span>
            </div>
            <div className="progress-wrap">
              <div className="progress-bar" style={{ width: `${exportProgress.value}%` }} />
            </div>
            <p className="small muted" style={{ margin: 0 }}>{exportProgress.message || 'جارٍ المعالجة...'}</p>
          </CardContent>
        </Card>
      )}

      {toast && <div className={`report-toast report-toast-${toast.type}`}>{toast.text}</div>}

      {lastReportUrl && (
        <Card>
          <CardContent className="stack-2">
            <strong>رابط التقرير العام</strong>
            <p className="small muted" style={{ margin: 0 }}>
              يمكنك فتح رابط التقرير مباشرة ومشاركته أو الرجوع إليه في أي وقت عند الحاجة.
            </p>
            <a className="btn btn-outline linkish" href={lastReportUrl} target="_blank" rel="noreferrer">
              فتح رابط التقرير <ExternalLink size={16} />
            </a>
          </CardContent>
        </Card>
      )}

      <div className="grid-2">
        <Button variant="outline" onClick={downloadPDF} disabled={isExportingPdf}>
          {isExportingPdf ? 'جارٍ تجهيز PDF...' : 'تنزيل التقرير PDF'}
        </Button>
        <a className="btn btn-outline linkish" href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noreferrer">
          مشاركة عبر واتساب
        </a>
      </div>

      <div ref={reportRef} className="report-frame stack-4 report-print-surface">
        <Card className="card-dark">
          <CardContent>
            <div className="row-between" style={{ marginBottom: 12 }}>
              <Badge dark>تقرير التقييم</Badge>
              <Award size={18} />
            </div>
            <h2 className="report-main-score" style={{ margin: '0 0 8px', fontSize: 28 }}>تقييم عيادتك: {scores.overall}%</h2>
            <p style={{ color: '#d1d5db', margin: 0, lineHeight: 1.8 }}>
              العيادة لديها فرصة واضحة للتحسين، والبداية الصحيحة يجب أن تكون من: {diagnosis.weakestLabel}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="report-details-grid">
              <div className="report-detail-item">
                <div className="report-detail-label">اسم العيادة</div>
                <div className="report-detail-value">{clinicName}</div>
              </div>
              <div className="report-detail-item">
                <div className="report-detail-label">الشخص المسؤول</div>
                <div className="report-detail-value">{answers.person_name || 'غير محدد'}</div>
              </div>
              <div className="report-detail-item">
                <div className="report-detail-label">الدور</div>
                <div className="report-detail-value">
                  {Array.isArray(answers.person_role) && answers.person_role.length > 0 ? answers.person_role.join(' - ') : 'غير محدد'}
                </div>
              </div>
              {answers.country && (
                <div className="report-detail-item">
                  <div className="report-detail-label">الدولة / المدينة</div>
                  <div className="report-detail-value">{answers.country}{answers.city ? ` - ${answers.city}` : ''}</div>
                </div>
              )}
              {phoneLabel && (
                <div className="report-detail-item">
                  <div className="report-detail-label">رقم التواصل</div>
                  <div className="report-detail-value" dir="ltr">{phoneLabel}</div>
                </div>
              )}
              <div className="report-detail-item">
                <div className="report-detail-label">تاريخ إنشاء التقرير</div>
                <div className="report-detail-value">{reportDate}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="stack-3">
            <h3 className="report-section-title" style={{ margin: 0, fontSize: 18 }}>أكبر نقطة ضعف حالية</h3>
            <div className="report-callout report-callout-danger">
              <div className="row-between report-callout-title report-callout-title-danger" style={{ justifyContent: 'flex-start', gap: 8, marginBottom: 8 }}>
                <TriangleAlert size={16} />
                <strong>الأولوية رقم 1: {diagnosis.weakestLabel}</strong>
              </div>
              <p className="report-callout-copy">{diagnosis.explanation}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="stack-3">
            <h3 className="report-section-title" style={{ margin: 0, fontSize: 18 }}>التأثير الحالي</h3>
            <div className="report-callout report-callout-warning">
              <p className="report-callout-copy report-callout-copy-warning">{getImpactMessage(diagnosis.weakestKey)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="stack-3">
            <h3 className="report-section-title" style={{ margin: 0, fontSize: 18 }}>سبب أهمية التحرك الآن</h3>
            <div className="report-callout report-callout-danger">
              <p className="report-callout-copy report-callout-copy-danger">{getUrgencyMessage(diagnosis.weakestKey)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="stack-3">
            <h3 style={{ margin: 0, fontSize: 18 }}>خريطة الأداء</h3>
            <div ref={chartRef} style={{ height: 280, background: '#ffffff' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar dataKey="score" stroke="#111827" fill="#111827" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="stack-3">
          {diagnosis.ordered.map(([key, value]) => {
            const priority = getPriority(value)
            return (
              <Card key={key}>
                <CardContent>
                  <div className="row-between" style={{ marginBottom: 8 }}>
                    <span className="badge badge-soft" style={{ background: priority.tone.background, color: priority.tone.color, borderColor: priority.tone.border }}>
                      {priority.label}
                    </span>
                    <h3 style={{ margin: 0, fontSize: 17 }}>{scoreLabels[key]}</h3>
                  </div>
                  <div className="report-score-value" style={{ fontSize: 28, marginBottom: 10 }}>{value}%</div>
                  <Progress value={value} />
                </CardContent>
              </Card>
            )
          })}
        </div>

        {clinicContextNotes.length > 0 && (
          <Card>
            <CardContent className="stack-3">
              <h3 style={{ margin: 0, fontSize: 18 }}>قراءة مخصصة لوضع العيادة</h3>
              {clinicContextNotes.map((item) => (
                <div key={item} className="row-between" style={{ justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, background: '#f8fafc', borderRadius: 18, padding: 12 }}>
                  <TriangleAlert size={16} style={{ marginTop: 4 }} />
                  <p style={{ margin: 0, lineHeight: 1.8, fontSize: 14 }}>{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="stack-3">
            <h3 style={{ margin: 0, fontSize: 18 }}>خطوات مجانية تبدأ بها من اليوم</h3>
            <p className="small muted" style={{ margin: 0 }}>
              هذه خطوات أولية عملية يمكنك تنفيذها مباشرة قبل شراء أي كورس أو حجز استشارة.
            </p>
            {getFreeActionPlan(diagnosis.weakestKey).map((item, index) => (
              <div key={`${diagnosis.weakestKey}-${index}`} className="row-between" style={{ justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, background: '#f8fafc', borderRadius: 18, padding: 12 }}>
                <CheckCircle2 size={16} style={{ marginTop: 4 }} />
                <p style={{ margin: 0, lineHeight: 1.8, fontSize: 14 }}>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="stack-3">
            <h3 style={{ margin: 0, fontSize: 18 }}>خطة تنفيذ عملية 30 / 60 / 90 يوم</h3>
            <p className="small muted" style={{ margin: 0 }}>
              هذه الخطة مبنية على أضعف محور في التقييم حتى يكون التحرك مركزًا وقابلًا للتنفيذ.
            </p>
            {executionPlan.map((item) => (
              <div key={item} className="row-between" style={{ justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, background: '#f9fafb', borderRadius: 18, padding: 12 }}>
                <Target size={16} style={{ marginTop: 4 }} />
                <p style={{ margin: 0, lineHeight: 1.8, fontSize: 14 }}>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="stack-3">
            <h3 style={{ margin: 0, fontSize: 18 }}>{supportRecommendation.title}</h3>
            <div className="report-support-box">
              <p style={{ margin: 0, lineHeight: 1.9, color: '#1e3a8a' }}>{supportRecommendation.body}</p>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              يمكننا مساعدتك في التنفيذ من خلال استشارة مخصصة، أو كورس متخصص، أو البرنامج الكامل إذا كانت التحديات متداخلة.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="stack-3">
            <h3 style={{ margin: 0, fontSize: 18 }}>أفضل الخطوات المقترحة لك الآن</h3>
            <p className="small muted" style={{ margin: 0 }}>
              هذه التوصيات مرتبة لتسهيل القرار: كورس متخصص للمشكلة الرئيسية، ثم البرنامج الكامل، ثم الاستشارة إذا كنت تريد توجيهًا مباشرًا.
            </p>
            {solutionSet.course && (
              <div className="report-offer-card report-offer-card-primary">
                <div className="row-between" style={{ alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{solutionSet.course.title}</div>
                    <div className="report-offer-subtitle">{solutionSet.course.titleAr}</div>
                  </div>
                  <Badge style={{ background: '#4f46e5', color: 'white' }}>الترشيح الأقوى</Badge>
                </div>
                <p className="report-offer-text">{solutionSet.course.description}</p>
                <p className="report-offer-benefit"><strong>حجم الاستفادة:</strong> {solutionSet.course.benefit}</p>
                <div className="stack-2" style={{ marginBottom: 12 }}>
                  {solutionSet.course.outcome.map((outcome) => (
                    <div key={outcome} className="row-between" style={{ justifyContent: 'flex-start', gap: 8 }}>
                      <CheckCircle2 size={16} />
                      <span className="small">{outcome}</span>
                    </div>
                  ))}
                </div>
                <div className="row-between small muted" style={{ marginBottom: 14 }}>
                  <span>{solutionSet.course.lectures}</span>
                  <span>{solutionSet.course.duration}</span>
                </div>
                <div>
                  <button type="button" className="btn btn-primary linkish" data-pdf-link={solutionSet.course.link} onClick={() => openExternalUrl(solutionSet.course.link)}>
                    {solutionSet.course.cta} <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="stack-3">
            <h3 style={{ margin: 0, fontSize: 18 }}>البرنامج الكامل والاستشارة</h3>
            <p className="small muted" style={{ margin: 0 }}>
              إذا كانت المشكلة أوسع من محور واحد أو كنت تريد قرارًا أسرع، فهذا هو المسار المناسب بعد قراءة التقرير.
            </p>

            <div className="report-offer-card report-offer-card-bundle" style={{ marginBottom: 14 }}>
              <div className="row-between" style={{ alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{solutionSet.bundle.title}</div>
                  <div className="report-offer-subtitle">{solutionSet.bundle.titleAr}</div>
                </div>
                <Badge style={{ background: '#6d28d9', color: 'white' }}>   Bundle 6 Courses • خصم 60% </Badge>
              </div>
              <p className="report-offer-text">{solutionSet.bundle.description}</p>
              <p className="report-offer-benefit"><strong>حجم الاستفادة:</strong> {solutionSet.bundle.benefit}</p>
              <div className="stack-2" style={{ marginBottom: 12 }}>
                {solutionSet.bundle.outcome.map((outcome) => (
                  <div key={outcome} className="row-between" style={{ justifyContent: 'flex-start', gap: 8 }}>
                    <CheckCircle2 size={16} />
                    <span className="small">{outcome}</span>
                  </div>
                ))}
              </div>
              <div>
                <button type="button" className="btn btn-primary linkish" style={{ background: '#6d28d9' }} data-pdf-link={solutionSet.bundle.link} onClick={() => openExternalUrl(solutionSet.bundle.link)}>
                  {solutionSet.bundle.cta} <ExternalLink size={16} />
                </button>
              </div>
            </div>

            <div className="report-offer-card report-offer-card-consultation">
              <div className="row-between" style={{ alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{solutionSet.consultation.title}</div>
                  <div className="report-offer-subtitle">{solutionSet.consultation.titleAr}</div>
                </div>
                <Badge style={{ background: '#0f766e', color: 'white' }}>استشارة</Badge>
              </div>
              <p className="report-offer-text">{solutionSet.consultation.description}</p>
              <p className="report-offer-benefit"><strong>حجم الاستفادة:</strong> {solutionSet.consultation.benefit}</p>
              <div className="stack-2" style={{ marginBottom: 12 }}>
                {solutionSet.consultation.outcome.map((outcome) => (
                  <div key={outcome} className="row-between" style={{ justifyContent: 'flex-start', gap: 8 }}>
                    <CheckCircle2 size={16} />
                    <span className="small">{outcome}</span>
                  </div>
                ))}
              </div>
              <div>
                <button type="button" className="btn btn-primary linkish" style={{ background: '#0f766e' }} data-pdf-link={solutionSet.consultation.link} onClick={() => openExternalUrl(solutionSet.consultation.link)}>
                  {solutionSet.consultation.cta} <PhoneCall size={16} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function openExternalUrl(url) {
  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  if (popup) return

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.location.assign(url)
    }
  }, 400)
}
