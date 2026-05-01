function safeText(value) {
  return String(value || '').trim()
}

function joinChallenges(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join('، ')
  return safeText(value)
}

export function buildAssessmentSubmittedWhatsappPayload({
  leadId,
  clinicName,
  personName,
  phoneWhatsappFull,
  country,
  city,
  scores,
  diagnosis,
  supportRecommendation,
  recommendedCourse,
}) {
  const recipientName = safeText(personName) || 'عميلنا العزيز'
  const place = [safeText(country), safeText(city)].filter(Boolean).join(' - ')

  const text = [
    `مرحبًا ${recipientName}`,
    '',
    `شكرًا لإكمال تقييم DBD لعيادة ${safeText(clinicName) || 'عيادتكم'}.`,
    `النتيجة الحالية: ${scores?.overall ?? ''}%`,
    `أكبر أولوية الآن: ${safeText(diagnosis?.weakestLabel)}`,
    '',
    safeText(diagnosis?.explanation),
    '',
    safeText(supportRecommendation?.body),
    '',
    recommendedCourse?.titleAr ? `أول ترشيح مناسب لك الآن: ${recommendedCourse.titleAr}` : '',
    place ? `الفرع المسجل: ${place}` : '',
    '',
    'سيصلك التقرير النهائي فور تفعيل رابط التقرير القابل للمشاركة.',
    `Lead ID: ${safeText(leadId)}`,
  ].filter(Boolean).join('\n')

  return {
    channel: 'whatsapp',
    type: 'text',
    to: phoneWhatsappFull,
    lead_id: leadId,
    message_text: text,
  }
}

export function buildReportReadyWhatsappPayload({
  leadId,
  clinicName,
  personName,
  phoneWhatsappFull,
  reportPdfUrl,
  scores,
  diagnosis,
  recommendedCourse,
  recommendedBundle,
  recommendedConsultation,
}) {
  const recipientName = safeText(personName) || 'عميلنا العزيز'
  const ctaParts = []

  if (recommendedCourse?.titleAr) ctaParts.push(`الكورس الأنسب لك الآن: ${recommendedCourse.titleAr}`)
  if (recommendedBundle?.titleAr) ctaParts.push(`والحل الشامل: ${recommendedBundle.titleAr}`)
  if (recommendedConsultation?.titleAr) ctaParts.push(`أو ${recommendedConsultation.titleAr}`)

  const text = [
    `مرحبًا ${recipientName}`,
    '',
    `تقرير DBD الخاص بعيادة ${safeText(clinicName) || 'عيادتكم'} أصبح جاهزًا.`,
    `النتيجة الحالية: ${scores?.overall ?? ''}%`,
    `أولوية التحسين الأولى: ${safeText(diagnosis?.weakestLabel)}`,
    '',
    safeText(diagnosis?.explanation),
    '',
    reportPdfUrl ? `رابط التقرير: ${reportPdfUrl}` : '',
    ctaParts.length > 0 ? ctaParts.join('\n') : '',
    '',
    'إذا أحببت، يمكننا مساعدتك في اختيار المسار الأنسب والبدء فورًا.',
    `Lead ID: ${safeText(leadId)}`,
  ].filter(Boolean).join('\n')

  return {
    channel: 'whatsapp',
    type: 'text_with_report_link',
    to: phoneWhatsappFull,
    lead_id: leadId,
    report_pdf_url: reportPdfUrl,
    message_text: text,
  }
}

export function buildManualFollowupWhatsappPayload({
  leadId,
  clinicName,
  personName,
  phoneWhatsappFull,
  weakestLabel,
  challenges,
  reportPdfUrl,
}) {
  const recipientName = safeText(personName) || 'عميلنا العزيز'
  const challengeSummary = joinChallenges(challenges)

  const text = [
    `مرحبًا ${recipientName}`,
    '',
    `نراجع معك تقييم DBD الخاص بعيادة ${safeText(clinicName) || 'عيادتكم'}.`,
    weakestLabel ? `ما زالت الأولوية الحالية هي: ${weakestLabel}` : '',
    challengeSummary ? `أهم التحديات المسجلة: ${challengeSummary}` : '',
    reportPdfUrl ? `رابط التقرير: ${reportPdfUrl}` : '',
    '',
    'إذا أحببت، نستطيع مساعدتك في الخطوة التالية المناسبة سواء كورس أو استشارة أو البرنامج الكامل.',
    `Lead ID: ${safeText(leadId)}`,
  ].filter(Boolean).join('\n')

  return {
    channel: 'whatsapp',
    type: 'followup',
    to: phoneWhatsappFull,
    lead_id: leadId,
    report_pdf_url: reportPdfUrl,
    message_text: text,
  }
}
