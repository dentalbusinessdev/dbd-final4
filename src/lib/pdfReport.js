const PDF_PAGE_WIDTH_MM = 210
const PDF_PAGE_HEIGHT_MM = 297
const PAGE_WIDTH_PX = 794
const PAGE_HEIGHT_PX = 1123
const PAGE_RENDER_SCALE = 1.35
const CHART_RENDER_SCALE = 1.6

const BRAND = {
  navy: '#0f172a',
  indigo: '#4338ca',
  blue: '#1d4ed8',
  green: '#0f766e',
  red: '#b91c1c',
  amber: '#b45309',
  slate: '#334155',
  light: '#f8fafc',
  border: '#dbe4f0',
}

// Generate a professional multi-page PDF report from structured DOM pages.
// We use jsPDF for the final file and html2canvas only to render each report page
// because browser rendering gives us correct Arabic shaping and RTL layout.
export async function generateProfessionalPdfReport({
  clinicName,
  answers,
  scores,
  diagnosis,
  solutionSet,
  executionPlan,
  clinicContextNotes,
  supportRecommendation,
  reportDate,
  radarElement,
  onProgress,
  saveFile = true,
}) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  onProgress?.(8, 'جاري تجهيز صفحات التقرير')

  const chartImage = radarElement ? await captureRadarChart(radarElement, html2canvas, onProgress) : null
  const exportRoot = buildPdfExportRoot({
    clinicName,
    answers,
    scores,
    diagnosis,
    solutionSet,
    executionPlan,
    clinicContextNotes,
    supportRecommendation,
    reportDate,
    chartImage,
  })

  document.body.appendChild(exportRoot)

  try {
    await waitForImages(exportRoot)

    const pages = Array.from(exportRoot.querySelectorAll('.pdf-report-page'))
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true })

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index]
      onProgress?.(20 + Math.round((index / Math.max(pages.length, 1)) * 70), `جاري إنشاء صفحة ${toArabicNumber(index + 1)}`)

      const canvas = await html2canvas(page, {
        scale: PAGE_RENDER_SCALE,
        backgroundColor: '#ffffff',
        useCORS: true,
        windowWidth: PAGE_WIDTH_PX,
        windowHeight: PAGE_HEIGHT_PX,
        logging: false,
      })

      const imageData = canvas.toDataURL('image/jpeg', 0.84)

      if (index > 0) {
        pdf.addPage()
      }

      pdf.addImage(imageData, 'JPEG', 0, 0, PDF_PAGE_WIDTH_MM, PDF_PAGE_HEIGHT_MM, undefined, 'FAST')
      attachPageLinks(pdf, page)
    }

    onProgress?.(95, 'جاري حفظ التقرير')

    const safeName = sanitizeFilename(clinicName || 'DBD-Clinic-Report')
    const filename = `${safeName}-DBD-Professional-Report.pdf`
    const blob = pdf.output('blob')

    if (saveFile) {
      pdf.save(filename)
    }

    return { blob, filename }
  } finally {
    exportRoot.remove()
  }
}

async function captureRadarChart(radarElement, html2canvas, onProgress) {
  onProgress?.(14, 'جاري تجهيز مخطط الأداء')

  const canvas = await html2canvas(radarElement, {
    scale: CHART_RENDER_SCALE,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  })

  return canvas.toDataURL('image/png')
}

function buildPdfExportRoot(data) {
  const root = document.createElement('div')
  root.className = 'pdf-export-shell'
  root.style.position = 'fixed'
  root.style.left = '-20000px'
  root.style.top = '0'
  root.style.width = `${PAGE_WIDTH_PX}px`
  root.style.background = '#ffffff'
  root.style.zIndex = '-1'
  root.innerHTML = `
    <style>
      .pdf-export-shell, .pdf-export-shell * {
        box-sizing: border-box;
        font-family: Tahoma, Arial, sans-serif;
        text-shadow: none !important;
      }
      .pdf-report-page {
        width: ${PAGE_WIDTH_PX}px;
        height: ${PAGE_HEIGHT_PX}px;
        padding: 56px 56px 48px;
        background: #ffffff;
        color: ${BRAND.navy};
        position: relative;
        overflow: hidden;
        direction: rtl;
      }
      .pdf-page-cover {
        background:
          radial-gradient(circle at top right, rgba(67,56,202,.08), transparent 30%),
          radial-gradient(circle at bottom left, rgba(15,118,110,.07), transparent 34%),
          #ffffff;
      }
      .pdf-cover-logo {
        width: 124px;
        height: auto;
        display: block;
        margin-inline-start: auto;
        margin-bottom: 36px;
      }
      .pdf-cover-kicker {
        color: ${BRAND.indigo};
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 18px;
      }
      .pdf-cover-title {
        font-size: 33px;
        line-height: 1.35;
        margin: 0 0 14px;
        font-weight: 700;
        color: ${BRAND.navy};
      }
      .pdf-cover-subtitle {
        font-size: 19px;
        color: ${BRAND.slate};
        margin: 0 0 34px;
      }
      .pdf-hero-grid, .pdf-meta-grid, .pdf-results-grid, .pdf-course-grid {
        display: grid;
        gap: 16px;
      }
      .pdf-hero-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .pdf-meta-grid, .pdf-results-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .pdf-course-grid {
        grid-template-columns: 1fr;
      }
      .pdf-stat-card, .pdf-panel, .pdf-course-card, .pdf-summary-card {
        border: 1px solid ${BRAND.border};
        border-radius: 24px;
        background: #ffffff;
        padding: 18px 20px;
      }
      .pdf-stat-card {
        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
      }
      .pdf-stat-label {
        font-size: 14px;
        color: ${BRAND.slate};
        margin-bottom: 8px;
        font-weight: 600;
      }
      .pdf-stat-value {
        font-size: 29px;
        font-weight: 700;
        color: ${BRAND.navy};
      }
      .pdf-title {
        font-size: 26px;
        font-weight: 700;
        margin: 0 0 12px;
        color: ${BRAND.navy};
      }
      .pdf-subtitle {
        font-size: 15px;
        color: ${BRAND.slate};
        margin: 0 0 18px;
        line-height: 1.9;
      }
      .pdf-overall-score {
        font-size: 58px;
        font-weight: 700;
        color: ${BRAND.indigo};
        line-height: 1;
        margin: 0 0 8px;
      }
      .pdf-status-pill {
        display: inline-block;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 16px;
      }
      .pdf-list, .pdf-numbered-list {
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .pdf-list li, .pdf-numbered-list li {
        font-size: 14px;
        line-height: 1.9;
        color: ${BRAND.navy};
        margin-bottom: 10px;
        padding: 10px 12px;
        border-radius: 16px;
        background: ${BRAND.light};
      }
      .pdf-numbered-list li::before {
        content: attr(data-step);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        margin-inline-start: 10px;
        border-radius: 999px;
        background: ${BRAND.navy};
        color: white;
        font-size: 12px;
        font-weight: 700;
      }
      .pdf-chart-box {
        border: 1px solid ${BRAND.border};
        border-radius: 24px;
        background: #ffffff;
        padding: 20px;
        text-align: center;
      }
      .pdf-chart-image {
        width: 100%;
        max-width: 300px;
        height: auto;
      }
      .pdf-score-table {
        width: 100%;
        border-collapse: collapse;
      }
      .pdf-score-table th,
      .pdf-score-table td {
        border-bottom: 1px solid ${BRAND.border};
        padding: 10px 0;
        text-align: right;
        font-size: 14px;
        color: ${BRAND.navy};
        vertical-align: top;
      }
      .pdf-score-table th {
        color: ${BRAND.slate};
        font-size: 13px;
        font-weight: 700;
      }
      .pdf-score-badge {
        display: inline-block;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 700;
      }
      .pdf-gap {
        font-size: 13px;
        color: ${BRAND.slate};
        line-height: 1.8;
      }
      .pdf-recommendation-card {
        border: 1px solid ${BRAND.border};
        background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
        border-radius: 22px;
        padding: 16px 18px;
        margin-bottom: 12px;
      }
      .pdf-recommendation-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
      }
      .pdf-recommendation-title {
        font-size: 18px;
        font-weight: 700;
        color: ${BRAND.navy};
      }
      .pdf-recommendation-meta {
        font-size: 12px;
        color: ${BRAND.indigo};
        font-weight: 700;
      }
      .pdf-recommendation-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px 16px;
      }
      .pdf-field-label {
        font-size: 12px;
        color: ${BRAND.slate};
        font-weight: 700;
        margin-bottom: 4px;
      }
      .pdf-field-copy {
        font-size: 13px;
        color: ${BRAND.navy};
        line-height: 1.8;
      }
      .pdf-course-card {
        background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
      }
      .pdf-course-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 10px;
      }
      .pdf-course-title {
        font-size: 18px;
        font-weight: 700;
        color: ${BRAND.navy};
        margin-bottom: 4px;
      }
      .pdf-course-subtitle {
        font-size: 13px;
        color: ${BRAND.slate};
        line-height: 1.8;
      }
      .pdf-course-price {
        font-size: 13px;
        color: ${BRAND.green};
        font-weight: 700;
      }
      .pdf-course-copy {
        font-size: 13px;
        color: ${BRAND.navy};
        line-height: 1.9;
        margin: 0 0 10px;
      }
      .pdf-course-benefits {
        margin: 0 0 12px;
        padding: 0;
        list-style: none;
      }
      .pdf-course-benefits li {
        font-size: 13px;
        color: ${BRAND.slate};
        margin-bottom: 6px;
      }
      .pdf-link {
        color: ${BRAND.blue};
        text-decoration: underline;
        font-size: 13px;
        font-weight: 700;
      }
      .pdf-action-plan {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .pdf-action-card {
        border-radius: 20px;
        border: 1px solid ${BRAND.border};
        background: #ffffff;
        padding: 16px;
      }
      .pdf-action-phase {
        color: ${BRAND.indigo};
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 10px;
      }
      .pdf-footer {
        position: absolute;
        right: 56px;
        left: 56px;
        bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        border-top: 1px solid ${BRAND.border};
        padding-top: 10px;
        font-size: 11px;
        color: ${BRAND.slate};
      }
      .pdf-footer-left {
        direction: ltr;
      }
      .pdf-divider {
        height: 1px;
        background: ${BRAND.border};
        margin: 16px 0;
      }
    </style>
    ${buildCoverPage(data)}
    ${buildExecutiveSummaryPage(data)}
    ${buildDetailedResultsPage(data)}
    ${buildRecommendationsPage(data)}
    ${buildCoursesPage(data)}
    ${buildActionPlanPage(data)}
    ${buildClosingCtaPage(data)}
  `

  return root
}

function buildCoverPage(data) {
  const doctorName = data.answers.person_name ? escapeHtml(data.answers.person_name) : 'غير محدد'
  const dateText = escapeHtml(toArabicDate(data.reportDate))
  const clinic = escapeHtml(data.clinicName)
  const logoUrl = `${window.location.origin}/dbd-logo.png`

  return `
    <section class="pdf-report-page pdf-page-cover">
      <img class="pdf-cover-logo" src="${escapeHtml(logoUrl)}" alt="DBD Logo" />
      <div class="pdf-cover-kicker">DBD Clinic Assessment Report</div>
      <h1 class="pdf-cover-title">${clinic}</h1>
      <p class="pdf-cover-subtitle">Your Path to Excellence</p>
      <div class="pdf-hero-grid">
        <div class="pdf-stat-card">
          <div class="pdf-stat-label">اسم الطبيب / المسؤول</div>
          <div class="pdf-stat-value" style="font-size:22px">${doctorName}</div>
        </div>
        <div class="pdf-stat-card">
          <div class="pdf-stat-label">تاريخ التقرير</div>
          <div class="pdf-stat-value" style="font-size:22px">${dateText}</div>
        </div>
      </div>
      <div style="margin-top:42px" class="pdf-panel">
        <h2 class="pdf-title" style="font-size:22px">نظرة سريعة</h2>
        <p class="pdf-subtitle">
          هذا التقرير يضع صورة واضحة لوضع العيادة الحالي، ويحدد أكبر فجوة مؤثرة على النمو،
          ويقترح خطوات عملية وبرامج تعليمية وروابط مباشرة للتنفيذ.
        </p>
      </div>
      ${buildFooter(1, toArabicDate(data.reportDate))}
    </section>
  `
}

function buildExecutiveSummaryPage(data) {
  const status = getOverallStatus(data.scores.overall)
  const findings = buildKeyFindings(data)
  const actions = buildRecommendedActions(data)

  return `
    <section class="pdf-report-page">
      <h2 class="pdf-title">Executive Summary</h2>
      <div class="pdf-summary-card" style="margin-bottom:18px">
        <div class="pdf-overall-score">${toArabicNumber(data.scores.overall)}%</div>
        <div class="pdf-status-pill" style="background:${status.background};color:${status.color}">
          ${escapeHtml(status.label)}
        </div>
        <p class="pdf-subtitle" style="margin-bottom:0">
          ${escapeHtml(`أكبر أولوية حالية هي ${data.diagnosis.weakestLabel}، والتحسن في هذا الجانب سيرفع استقرار الأداء العام.`)}
        </p>
      </div>
      <div class="pdf-results-grid">
        <div class="pdf-panel">
          <h3 class="pdf-title" style="font-size:20px">Key Findings</h3>
          <ul class="pdf-list">
            ${findings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
        <div class="pdf-panel">
          <h3 class="pdf-title" style="font-size:20px">Recommended Actions</h3>
          <ul class="pdf-list">
            ${actions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      </div>
      ${buildFooter(2, toArabicDate(data.reportDate))}
    </section>
  `
}

function buildDetailedResultsPage(data) {
  const rows = buildScoreRows(data)
  const chartBlock = data.chartImage
    ? `<div class="pdf-chart-box"><img class="pdf-chart-image" src="${data.chartImage}" alt="Radar Chart" /></div>`
    : `<div class="pdf-chart-box"><div class="pdf-subtitle" style="margin:0">Radar chart unavailable</div></div>`

  return `
    <section class="pdf-report-page">
      <h2 class="pdf-title">Detailed Results</h2>
      <div class="pdf-results-grid" style="align-items:start">
        <div>${chartBlock}</div>
        <div class="pdf-panel">
          <table class="pdf-score-table">
            <thead>
              <tr>
                <th>القسم</th>
                <th>النسبة</th>
                <th>الحالة</th>
                <th>الفجوة</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
      ${buildFooter(3, toArabicDate(data.reportDate))}
    </section>
  `
}

function buildRecommendationsPage(data) {
  const recommendations = buildPriorityRecommendations(data)

  return `
    <section class="pdf-report-page">
      <h2 class="pdf-title">Recommendations</h2>
      <p class="pdf-subtitle">التوصيات التالية مرتبة حسب الأولوية، مع توضيح السبب والحل والتأثير المتوقع والإطار الزمني.</p>
      ${recommendations.map((item, index) => `
        <div class="pdf-recommendation-card">
          <div class="pdf-recommendation-head">
            <div class="pdf-recommendation-title">${escapeHtml(item.problem)}</div>
            <div class="pdf-recommendation-meta">الأولوية ${toArabicNumber(index + 1)}</div>
          </div>
          <div class="pdf-recommendation-grid">
            <div>
              <div class="pdf-field-label">السبب</div>
              <div class="pdf-field-copy">${escapeHtml(item.reason)}</div>
            </div>
            <div>
              <div class="pdf-field-label">الحل</div>
              <div class="pdf-field-copy">${escapeHtml(item.solution)}</div>
            </div>
            <div>
              <div class="pdf-field-label">التأثير المتوقع</div>
              <div class="pdf-field-copy">${escapeHtml(item.impact)}</div>
            </div>
            <div>
              <div class="pdf-field-label">الإطار الزمني</div>
              <div class="pdf-field-copy">${escapeHtml(item.timeline)}</div>
            </div>
          </div>
        </div>
      `).join('')}
      ${buildFooter(4, toArabicDate(data.reportDate))}
    </section>
  `
}

function buildCoursesPage(data) {
  const offerings = [
    { ...data.solutionSet.course, tag: 'Most Recommended' },
    { ...data.solutionSet.bundle, tag: 'Bundle 6 Courses Online' },
    { ...data.solutionSet.consultation, tag: 'Direct Consultation' },
  ]

  return `
    <section class="pdf-report-page">
      <h2 class="pdf-title">Recommended Courses</h2>
      <p class="pdf-subtitle">جميع الروابط التالية قابلة للنقر مباشرة من داخل ملف PDF.</p>
      <div class="pdf-course-grid">
        ${offerings.map((item) => `
          <div class="pdf-course-card">
            <div class="pdf-course-head">
              <div>
                <div class="pdf-course-title">${escapeHtml(item.title)}</div>
                <div class="pdf-course-subtitle">${escapeHtml(item.titleAr || '')}</div>
              </div>
              <div class="pdf-course-price">${escapeHtml(item.tag)}</div>
            </div>
            <p class="pdf-course-copy">${escapeHtml(item.benefit || item.description || '')}</p>
            <ul class="pdf-course-benefits">
              ${(item.outcome || []).map((point) => `<li>• ${escapeHtml(point)}</li>`).join('')}
            </ul>
            <div class="pdf-divider"></div>
            <div class="pdf-course-head" style="align-items:center;margin-bottom:0">
              <div class="pdf-course-price">${escapeHtml(item.priceLabel || item.lectures || '')}</div>
              <a class="pdf-link" href="${escapeHtml(item.link)}" data-pdf-link="${escapeHtml(item.link)}">${escapeHtml(item.link)}</a>
            </div>
          </div>
        `).join('')}
      </div>
      ${buildFooter(5, toArabicDate(data.reportDate))}
    </section>
  `
}

function buildActionPlanPage(data) {
  const plan = buildActionPhases(data.executionPlan)

  return `
    <section class="pdf-report-page">
      <h2 class="pdf-title">Action Plan</h2>
      <p class="pdf-subtitle">خطة تنفيذ مختصرة على 4 أسابيع ثم شهري 2 و3 مع ناتج قابل للقياس.</p>
      <div class="pdf-action-plan">
        ${plan.map((item) => `
          <div class="pdf-action-card">
            <div class="pdf-action-phase">${escapeHtml(item.phase)}</div>
            <div class="pdf-field-copy">${escapeHtml(item.step)}</div>
            <div class="pdf-divider"></div>
            <div class="pdf-field-label">Measurable Outcome</div>
            <div class="pdf-field-copy">${escapeHtml(item.outcome)}</div>
          </div>
        `).join('')}
      </div>
      ${buildFooter(6, toArabicDate(data.reportDate))}
    </section>
  `
}

function buildClosingCtaPage(data) {
  const whatsappLink = 'https://wa.link/6gp7kv'

  return `
    <section class="pdf-report-page pdf-page-cover">
      <div class="pdf-panel" style="margin-top:90px; text-align:center; padding:32px 28px">
        <div class="pdf-cover-kicker">DBD Exclusive Offer</div>
        <h2 class="pdf-cover-title" style="font-size:30px; margin-bottom:18px">الخطوة التالية مع DBD</h2>
        <p class="pdf-cover-subtitle" style="margin-bottom:28px">
          تواصل على الواتساب واحصل على خصم خاص على
          <strong> Bundle 6 Courses Full DBD Program</strong>
        </p>
        <div style="display:inline-block; padding:16px 22px; border-radius:18px; background:${BRAND.navy};">
          <a
            class="pdf-link"
            href="${escapeHtml(whatsappLink)}"
            data-pdf-link="${escapeHtml(whatsappLink)}"
            style="color:#ffffff; text-decoration:none; font-size:16px;"
          >
            تواصل معنا الآن عبر واتساب
          </a>
        </div>
      </div>
      ${buildFooter(7, toArabicDate(data.reportDate))}
    </section>
  `
}

function buildFooter(pageNumber, reportDate) {
  const currentYear = new Date().getFullYear()
  return `
    <footer class="pdf-footer">
      <div>© DBD ${currentYear} | Dentalbusinessdevelopment.net</div>
      <div>${escapeHtml(reportDate)}</div>
      <div class="pdf-footer-left">Page ${pageNumber}</div>
    </footer>
  `
}

function buildKeyFindings(data) {
  const items = [
    `الدرجة الكلية الحالية هي ${toArabicNumber(data.scores.overall)}% مع فجوة أوضح في ${data.diagnosis.weakestLabel}.`,
    data.diagnosis.explanation,
    getOverallSummary(data.scores.overall),
  ]

  return [...items, ...data.clinicContextNotes].slice(0, 5)
}

function buildRecommendedActions(data) {
  const actions = [
    data.executionPlan[0],
    data.executionPlan[1],
    data.supportRecommendation.body,
  ].filter(Boolean)

  return actions.slice(0, 4)
}

function buildScoreRows(data) {
  const scoreLabels = {
    marketing: 'التسويق',
    operations: 'التشغيل',
    finance: 'المال',
    team: 'الفريق',
    patient: 'تجربة المريض',
  }

  return data.diagnosis.ordered.map(([key, value]) => {
    const status = getSectionStatus(value)
    return `
      <tr>
        <td>${escapeHtml(scoreLabels[key])}</td>
        <td>${toArabicNumber(value)}%</td>
        <td><span class="pdf-score-badge" style="background:${status.background};color:${status.color}">${escapeHtml(status.label)}</span></td>
        <td class="pdf-gap">${escapeHtml(getSectionGapMessage(key, value, data.diagnosis.weakestKey))}</td>
      </tr>
    `
  }).join('')
}

function buildPriorityRecommendations(data) {
  const weakest = data.diagnosis.weakestLabel
  const reasons = [
    data.diagnosis.explanation,
    getOverallSummary(data.scores.overall),
    data.supportRecommendation.body,
  ]

  return data.executionPlan.slice(0, 3).map((step, index) => ({
    problem: index === 0 ? `الأولوية الأساسية: ${weakest}` : `خطوة تحسين ${toArabicNumber(index + 1)}`,
    reason: reasons[index] || reasons[0],
    solution: step,
    impact: index === 0 ? 'رفع الاستقرار والنتائج في المحور الأضعف خلال فترة قصيرة.' : 'تحسين تدريجي وقابل للقياس في الأداء العام.',
    timeline: index === 0 ? 'أول 30 يوم' : index === 1 ? '30 - 60 يوم' : '60 - 90 يوم',
  }))
}

function buildActionPhases(executionPlan) {
  const phases = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Month 2', 'Month 3']

  return phases.map((phase, index) => ({
    phase,
    step: executionPlan[index % executionPlan.length] || 'ابدأ بخطوة تشغيلية واضحة وراجع أثرها أسبوعيًا.',
    outcome: index < 4 ? 'وضوح أكبر في التنفيذ وقياس أولي للنتائج.' : 'تحسن ملموس في الاستقرار والنمو والقدرة على اتخاذ القرار.',
  }))
}

function attachPageLinks(pdf, pageElement) {
  const pageRect = pageElement.getBoundingClientRect()
  const links = Array.from(pageElement.querySelectorAll('[data-pdf-link]'))

  links.forEach((element) => {
    const url = element.getAttribute('data-pdf-link')
    if (!url) return

    const rect = element.getBoundingClientRect()
    const x = ((rect.left - pageRect.left) / pageRect.width) * PDF_PAGE_WIDTH_MM
    const y = ((rect.top - pageRect.top) / pageRect.height) * PDF_PAGE_HEIGHT_MM
    const width = (rect.width / pageRect.width) * PDF_PAGE_WIDTH_MM
    const height = (rect.height / pageRect.height) * PDF_PAGE_HEIGHT_MM

    pdf.link(x, y, width, height, { url })
  })
}

async function waitForImages(root) {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve()
    return new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true })
      image.addEventListener('error', resolve, { once: true })
    })
  }))
}

function getOverallStatus(score) {
  if (score >= 80) return { label: 'Excellent', background: '#dcfce7', color: '#166534' }
  if (score >= 60) return { label: 'Good', background: '#dbeafe', color: '#1d4ed8' }
  return { label: 'Needs Improvement', background: '#fee2e2', color: '#b91c1c' }
}

function getSectionStatus(score) {
  if (score >= 80) return { label: 'قوي', background: '#dcfce7', color: '#166534' }
  if (score >= 60) return { label: 'متوسط', background: '#fef3c7', color: '#92400e' }
  return { label: 'ضعيف', background: '#fee2e2', color: '#b91c1c' }
}

function getSectionGapMessage(key, score, weakestKey) {
  if (key === weakestKey && score < 60) {
    return 'هذا المحور يحتاج أولوية فورية لأنه الأكثر تأثيرًا على استقرار النمو الحالي.'
  }

  if (score >= 95) {
    return 'الأداء هنا ممتاز جدًا، والأولوية هي الحفاظ على هذا المستوى وتثبيت الممارسات الحالية.'
  }

  if (score >= 80) {
    return 'هذا المحور قوي حاليًا، ويحتاج فقط إلى متابعة ذكية وتحسينات دقيقة عند الحاجة.'
  }

  if (score >= 60) {
    return 'يوجد أساس جيد هنا، لكن ما زالت هناك فرصة واضحة لرفع الكفاءة والنتيجة.'
  }

  if (score >= 40) {
    return 'هذا المحور دون المستوى المطلوب ويحتاج إلى خطة تحسين مركزة خلال الفترة القادمة.'
  }

  return 'هذا المحور يمثل فجوة مؤثرة حاليًا ويحتاج تدخلًا مباشرًا وسريعًا.'
}

function getOverallSummary(score) {
  if (score >= 80) return 'العيادة لديها أساس قوي، وتحتاج إلى تحسينات دقيقة لتسريع النمو.'
  if (score >= 60) return 'العيادة في وضع جيد نسبيًا لكن ما زالت تحتاج إلى ضبط الأولويات وبناء نظام أكثر ثباتًا.'
  return 'العيادة تحتاج إلى تدخل منظم وسريع لمعالجة الفجوات الأساسية المؤثرة على النمو والربحية.'
}

function toArabicDate(value) {
  const date = value instanceof Date ? value : new Date()
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function toArabicNumber(value) {
  return Number(value).toLocaleString('ar-EG')
}

function sanitizeFilename(value) {
  return String(value).replace(/[\\/:*?"<>|]/g, '-').trim() || 'DBD-Clinic-Report'
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
