import { assessmentSections, getTeamSizeOptions } from '../data/assessment.js'

export function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase()
}

export function clampScore(value) {
  return Math.max(0, Math.min(100, value))
}

export function getQuestionValue(answers, question) {
  if (question.type === 'multi') {
    if (Array.isArray(answers[question.id])) return answers[question.id]
    if (typeof answers[question.id] === 'string' && answers[question.id].trim()) return [answers[question.id]]
    return []
  }
  return answers[question.id] ?? ''
}

export function isQuestionAnswered(question, value) {
  if (question.optional) return true
  if (question.type === 'multi') return value.length > 0
  if (question.type === 'phone') return String(value).replace(/[^\d]/g, '').length >= 8
  if (question.type === 'text') return String(value).trim().length >= 2
  return String(value).trim() !== ''
}

export function buildAssessmentSections(answers) {
  return assessmentSections.map((section) => ({
    ...section,
    questions: section.questions
      .filter((question) => !question.visibleWhen || question.visibleWhen(answers))
      .map((question) => question.id === 'team_size'
        ? { ...question, options: getTeamSizeOptions(answers.chairs) }
        : question),
  }))
}

export function scoreAssessment(a) {
  const scores = { marketing: 0, operations: 0, finance: 0, team: 0, patient: 0 }

  if (a.marketing_plan === 'نعم') scores.marketing += 40
  else if (a.marketing_plan === 'إلى حد ما') scores.marketing += 20

  if (a.marketing_roi === 'نعم') scores.marketing += 30
  if (a.lead_source === 'مزيج متوازن من أكثر من مصدر') scores.marketing += 30
  else if (a.lead_source === 'إنستجرام / سوشيال ميديا' || a.lead_source === 'الإحالات (Referrals)') scores.marketing += 15

  if (a.scheduling === 'لدينا نظام آلي مدعوم بالذكاء الاصطناعي') scores.operations += 40
  else if (a.scheduling === 'لدينا برنامج إدارة مواعيد') scores.operations += 20
  if (a.kpis === 'نعم') scores.operations += 35
  if (a.no_show === 'منخفضة جدًا') scores.operations += 25
  else if (a.no_show === 'متوسطة') scores.operations += 10

  if (a.budget === 'نعم') scores.finance += 35
  if (a.monthly_revenue === 'جيد ومستقر') scores.finance += 30
  else if (a.monthly_revenue === 'مقبول لكنه غير مستقر') scores.finance += 15
  else if (a.monthly_revenue === 'لا أستطيع التقييم بدقة') scores.finance += 5
  if (a.fin_challenge === 'التسعير') scores.finance += 15
  else if (a.fin_challenge === 'ارتفاع المصروفات') scores.finance += 10
  if (a.case_acceptance === 'مرتفعة') scores.finance += 50
  else if (a.case_acceptance === 'متوسطة') scores.finance += 25
  if (a.installments === 'نعم بشكل واضح') scores.finance += 15
  else if (a.installments === 'بشكل محدود') scores.finance += 8
  if (a.insurance_model === 'نعم بشكل أساسي') scores.finance += 10
  else if (a.insurance_model === 'جزئيًا') scores.finance += 6
  if (a.gulf_pricing_mix === 'نعم وواضح') scores.finance += 15
  else if (a.gulf_pricing_mix === 'جزئيًا') scores.finance += 7

  if (['أكثر من 20 فردًا', '11–20 فردًا', '8–12 فردًا', '6–10 أفراد', 'أكثر من 12 فردًا', 'أكثر من 6 أفراد'].includes(a.team_size)) scores.team += 30
  else if (['4–7 أفراد', '4–6 أفراد', '3–4 أفراد'].includes(a.team_size)) scores.team += 22
  else if (['1–5 أفراد', '1–3 أفراد', '1–2 فرد'].includes(a.team_size)) scores.team += 15
  if (a.vision === 'نعم') scores.team += 30
  if (a.leadership === 'عالي') scores.team += 40
  else if (a.leadership === 'متوسط') scores.team += 20
  if (a.delegation_layer === 'نعم') scores.team += 15
  else if (a.delegation_layer === 'جزئيًا') scores.team += 7

  if (a.feedback === 'بشكل منتظم') scores.patient += 45
  else if (a.feedback === 'أحيانًا') scores.patient += 20
  if (a.loyalty === 'نعم') scores.patient += 55
  else if (a.loyalty === 'يحتاج تطوير') scores.patient += 25

  const challengeAdjustments = {
    'زيادة عدد المرضى الجدد': { marketing: -20 },
    'الاحتفاظ بالمرضى الحاليين': { patient: -20 },
    'إدارة المال والتدفق النقدي': { finance: -20 },
    'توظيف فريق قوي والحفاظ عليه': { team: -20 },
    'تحسين التشغيل والكفاءة': { operations: -20 },
    'زيادة الإيراد لكل مريض': { finance: -12, patient: -8 },
    'التميّز عن المنافسين': { marketing: -15, patient: -5 },
    'التوسع وفتح فروع جديدة': { operations: -10, team: -10 },
  }

  const selectedChallenges = Array.isArray(a.primary_challenge) ? a.primary_challenge.slice(0, 3) : (a.primary_challenge ? [a.primary_challenge] : [])
  selectedChallenges.forEach((challenge, index) => {
    const weight = index === 0 ? 1 : index === 1 ? 0.7 : 0.5
    Object.entries(challengeAdjustments[challenge] || {}).forEach(([key, delta]) => {
      scores[key] = clampScore(scores[key] + Math.round(delta * weight))
    })
  })

  const clinicAgePenaltyMap = {
    'أقل من سنة': 0,
    '1–3 سنوات': 4,
    '3–7 سنوات': 10,
    'أكثر من 7 سنوات': 16,
  }

  const lowRevenuePenaltyMap = {
    'أقل من المتوقع بوضوح': 1,
    'مقبول لكنه غير مستقر': 0.55,
    'جيد ومستقر': 0,
    'لا أستطيع التقييم بدقة': 0.2,
  }

  if (a.monthly_revenue && a.clinic_years) {
    const basePenalty = clinicAgePenaltyMap[a.clinic_years] || 0
    const multiplier = lowRevenuePenaltyMap[a.monthly_revenue] ?? 0
    const ageRevenuePenalty = Math.round(basePenalty * multiplier)
    scores.finance = clampScore(scores.finance - ageRevenuePenalty)
    if (ageRevenuePenalty >= 8) scores.operations = clampScore(scores.operations - 5)
    if (ageRevenuePenalty >= 10) scores.marketing = clampScore(scores.marketing - 5)
  }

  if (a.chairs === '7+' && ['لا يوجد فريق واضح', '1–5 أفراد', '1–3 أفراد', '1–2 فرد'].includes(a.team_size)) {
    scores.team = clampScore(scores.team - 18)
    scores.operations = clampScore(scores.operations - 8)
  }

  if (a.chairs === '4–6' && ['لا يوجد فريق واضح', '1–2 فرد'].includes(a.team_size)) {
    scores.team = clampScore(scores.team - 12)
  }

  const overall = Math.round((scores.marketing + scores.operations + scores.finance + scores.team + scores.patient) / 5)
  return { ...scores, overall }
}
