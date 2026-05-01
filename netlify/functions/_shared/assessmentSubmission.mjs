import crypto from 'node:crypto'
import { assessmentSections, countryMap } from '../../../src/data/assessment.js'
import { buildAssessmentSections, getQuestionValue, isQuestionAnswered, scoreAssessment } from '../../../src/lib/assessment.js'
import {
  buildClinicContext,
  buildDiagnosis,
  getExecutionPlan,
  getFreeActionPlan,
  getRecommendedSolutionSet,
  getSupportRecommendation,
} from '../../../src/lib/report.js'

const RAW_QUESTION_IDS = assessmentSections.flatMap((section) => section.questions.map((question) => question.id))

export const LEADS_HEADERS = [
  'lead_id',
  'created_at_utc',
  'created_at_cairo',
  'source',
  'app_version',
  'clinic_name',
  'person_name',
  'person_role_display',
  'person_role_json',
  'country',
  'city',
  'city_is_custom',
  'phone_country_code',
  'phone_number',
  'phone_whatsapp_full',
  'clinic_type',
  'clinic_years',
  'chairs',
  'services_display',
  'services_json',
  'primary_challenge_display',
  'primary_challenge_json',
  'marketing_plan',
  'lead_source',
  'marketing_roi',
  'scheduling',
  'no_show',
  'kpis',
  'monthly_revenue',
  'budget',
  'fin_challenge',
  'case_acceptance',
  'installments',
  'insurance_model',
  'gulf_pricing_mix',
  'team_size',
  'delegation_layer',
  'vision',
  'leadership',
  'feedback',
  'loyalty',
  'notes',
  'marketing_score',
  'operations_score',
  'finance_score',
  'team_score',
  'patient_score',
  'overall_score',
  'weakest_key',
  'weakest_label',
  'diagnosis_explanation',
  'support_recommendation_title',
  'support_recommendation_body',
  'recommended_course_id',
  'recommended_course_title',
  'recommended_bundle_id',
  'recommended_bundle_title',
  'recommended_consultation_id',
  'recommended_consultation_title',
  'report_pdf_url',
  'report_status',
  'whatsapp_status',
  'first_followup_status',
  'sales_status',
  'owner',
  'last_contact_at',
  'next_followup_at',
  'tags',
  'internal_notes',
]

export const RAW_HEADERS = [
  'lead_id',
  'submitted_at',
  'clinic_name',
  'person_name',
  'person_role',
  'country',
  'city',
  'phone_country_code',
  'phone_number',
  'clinic_type',
  'clinic_years',
  'chairs',
  'services',
  'primary_challenge',
  'marketing_plan',
  'lead_source',
  'marketing_roi',
  'scheduling',
  'no_show',
  'kpis',
  'monthly_revenue',
  'budget',
  'fin_challenge',
  'case_acceptance',
  'installments',
  'insurance_model',
  'gulf_pricing_mix',
  'team_size',
  'delegation_layer',
  'vision',
  'leadership',
  'feedback',
  'loyalty',
  'notes',
  'raw_payload_json',
]

export const DIAGNOSIS_HEADERS = [
  'lead_id',
  'marketing_score',
  'operations_score',
  'finance_score',
  'team_score',
  'patient_score',
  'overall_score',
  'weakest_key',
  'weakest_label',
  'diagnosis_explanation',
  'clinic_context_notes_json',
  'execution_plan_json',
  'free_action_plan_json',
  'support_recommendation_title',
  'support_recommendation_body',
  'recommended_course_json',
  'recommended_bundle_json',
  'recommended_consultation_json',
]

export const AUTOMATION_HEADERS = [
  'log_id',
  'lead_id',
  'event_type',
  'channel',
  'template_name',
  'payload_json',
  'status',
  'provider_message_id',
  'created_at',
  'sent_at',
  'error_message',
]

function toCairoTimestamp(date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date).replace(' ', 'T')
}

export function buildLeadId(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `DBD-${day}-${suffix}`
}

function normalizeArray(value, maxLength = Infinity) {
  if (Array.isArray(value)) return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))].slice(0, maxLength)
  if (typeof value === 'string' && value.trim()) return [value.trim()].slice(0, maxLength)
  return []
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

function buildNormalizedAnswers(rawAnswers = {}) {
  return {
    ...rawAnswers,
    clinic_name: normalizeText(rawAnswers.clinic_name),
    person_name: normalizeText(rawAnswers.person_name),
    person_role: normalizeArray(rawAnswers.person_role),
    country: normalizeText(rawAnswers.country),
    city: normalizeText(rawAnswers.city),
    phone_country_code: normalizeText(rawAnswers.phone_country_code || countryMap[rawAnswers.country]?.dialCode || ''),
    phone_number: normalizeText(rawAnswers.phone_number).replace(/[^\d]/g, ''),
    clinic_type: normalizeText(rawAnswers.clinic_type),
    clinic_years: normalizeText(rawAnswers.clinic_years),
    chairs: normalizeText(rawAnswers.chairs),
    services: normalizeArray(rawAnswers.services),
    primary_challenge: normalizeArray(rawAnswers.primary_challenge, 3),
    marketing_plan: normalizeText(rawAnswers.marketing_plan),
    lead_source: normalizeText(rawAnswers.lead_source),
    marketing_roi: normalizeText(rawAnswers.marketing_roi),
    scheduling: normalizeText(rawAnswers.scheduling),
    no_show: normalizeText(rawAnswers.no_show),
    kpis: normalizeText(rawAnswers.kpis),
    monthly_revenue: normalizeText(rawAnswers.monthly_revenue),
    budget: normalizeText(rawAnswers.budget),
    fin_challenge: normalizeText(rawAnswers.fin_challenge),
    case_acceptance: normalizeText(rawAnswers.case_acceptance),
    installments: normalizeText(rawAnswers.installments),
    insurance_model: normalizeText(rawAnswers.insurance_model),
    gulf_pricing_mix: normalizeText(rawAnswers.gulf_pricing_mix),
    team_size: normalizeText(rawAnswers.team_size),
    delegation_layer: normalizeText(rawAnswers.delegation_layer),
    vision: normalizeText(rawAnswers.vision),
    leadership: normalizeText(rawAnswers.leadership),
    feedback: normalizeText(rawAnswers.feedback),
    loyalty: normalizeText(rawAnswers.loyalty),
    notes: normalizeText(rawAnswers.notes),
  }
}

export function validateAssessmentPayload(payload) {
  const answers = buildNormalizedAnswers(payload?.answers || {})
  const visibleSections = buildAssessmentSections(answers)
  const allVisibleQuestions = visibleSections.flatMap((section) => section.questions)
  const errors = []

  allVisibleQuestions.forEach((question) => {
    const value = getQuestionValue(answers, question)
    if (!isQuestionAnswered(question, value)) {
      errors.push({ field: question.id, message: `${question.id} is required or invalid` })
    }
  })

  if (!answers.phone_country_code) {
    errors.push({ field: 'phone_country_code', message: 'phone_country_code is required' })
  }

  if (answers.primary_challenge.length > 3) {
    errors.push({ field: 'primary_challenge', message: 'primary_challenge supports up to 3 values' })
  }

  if (errors.length > 0) {
    const error = new Error('ASSESSMENT_VALIDATION_FAILED')
    error.details = errors
    throw error
  }

  return answers
}

export function buildSubmissionRecord(payload) {
  const now = new Date()
  const answers = validateAssessmentPayload(payload)
  const scores = scoreAssessment(answers)
  const diagnosis = buildDiagnosis(scores)
  const solutionSet = getRecommendedSolutionSet(diagnosis, scores)
  const supportRecommendation = getSupportRecommendation(scores)
  const clinicContextNotes = buildClinicContext(answers)
  const executionPlan = getExecutionPlan(diagnosis.weakestKey)
  const freeActionPlan = getFreeActionPlan(diagnosis.weakestKey)
  const leadId = buildLeadId(now)
  const phoneWhatsappFull = `${answers.phone_country_code}${answers.phone_number}`
  const cityOptions = countryMap[answers.country]?.cities || []
  const cityIsCustom = answers.city ? !cityOptions.includes(answers.city) : false

  const meta = {
    leadId,
    createdAtUtc: now.toISOString(),
    createdAtCairo: toCairoTimestamp(now),
    source: payload?.meta?.source || 'netlify-web',
    appVersion: payload?.meta?.app_version || 'unknown',
  }

  const leadsRow = {
    lead_id: leadId,
    created_at_utc: meta.createdAtUtc,
    created_at_cairo: meta.createdAtCairo,
    source: meta.source,
    app_version: meta.appVersion,
    clinic_name: answers.clinic_name,
    person_name: answers.person_name,
    person_role_display: answers.person_role.join(' | '),
    person_role_json: JSON.stringify(answers.person_role),
    country: answers.country,
    city: answers.city,
    city_is_custom: cityIsCustom ? 'yes' : 'no',
    phone_country_code: answers.phone_country_code,
    phone_number: answers.phone_number,
    phone_whatsapp_full: phoneWhatsappFull,
    clinic_type: answers.clinic_type,
    clinic_years: answers.clinic_years,
    chairs: answers.chairs,
    services_display: answers.services.join(' | '),
    services_json: JSON.stringify(answers.services),
    primary_challenge_display: answers.primary_challenge.join(' | '),
    primary_challenge_json: JSON.stringify(answers.primary_challenge),
    marketing_plan: answers.marketing_plan,
    lead_source: answers.lead_source,
    marketing_roi: answers.marketing_roi,
    scheduling: answers.scheduling,
    no_show: answers.no_show,
    kpis: answers.kpis,
    monthly_revenue: answers.monthly_revenue,
    budget: answers.budget,
    fin_challenge: answers.fin_challenge,
    case_acceptance: answers.case_acceptance,
    installments: answers.installments,
    insurance_model: answers.insurance_model,
    gulf_pricing_mix: answers.gulf_pricing_mix,
    team_size: answers.team_size,
    delegation_layer: answers.delegation_layer,
    vision: answers.vision,
    leadership: answers.leadership,
    feedback: answers.feedback,
    loyalty: answers.loyalty,
    notes: answers.notes,
    marketing_score: scores.marketing,
    operations_score: scores.operations,
    finance_score: scores.finance,
    team_score: scores.team,
    patient_score: scores.patient,
    overall_score: scores.overall,
    weakest_key: diagnosis.weakestKey,
    weakest_label: diagnosis.weakestLabel,
    diagnosis_explanation: diagnosis.explanation,
    support_recommendation_title: supportRecommendation.title,
    support_recommendation_body: supportRecommendation.body,
    recommended_course_id: solutionSet.course?.id || '',
    recommended_course_title: solutionSet.course?.title || '',
    recommended_bundle_id: solutionSet.bundle?.id || '',
    recommended_bundle_title: solutionSet.bundle?.title || '',
    recommended_consultation_id: solutionSet.consultation?.id || '',
    recommended_consultation_title: solutionSet.consultation?.title || '',
    report_pdf_url: '',
    report_status: 'pending',
    whatsapp_status: 'queued',
    first_followup_status: 'pending',
    sales_status: 'new',
    owner: '',
    last_contact_at: '',
    next_followup_at: '',
    tags: '',
    internal_notes: '',
  }

  const rawAnswersRow = {
    lead_id: leadId,
    submitted_at: meta.createdAtUtc,
    clinic_name: answers.clinic_name,
    person_name: answers.person_name,
    person_role: JSON.stringify(answers.person_role),
    country: answers.country,
    city: answers.city,
    phone_country_code: answers.phone_country_code,
    phone_number: answers.phone_number,
    clinic_type: answers.clinic_type,
    clinic_years: answers.clinic_years,
    chairs: answers.chairs,
    services: JSON.stringify(answers.services),
    primary_challenge: JSON.stringify(answers.primary_challenge),
    marketing_plan: answers.marketing_plan,
    lead_source: answers.lead_source,
    marketing_roi: answers.marketing_roi,
    scheduling: answers.scheduling,
    no_show: answers.no_show,
    kpis: answers.kpis,
    monthly_revenue: answers.monthly_revenue,
    budget: answers.budget,
    fin_challenge: answers.fin_challenge,
    case_acceptance: answers.case_acceptance,
    installments: answers.installments,
    insurance_model: answers.insurance_model,
    gulf_pricing_mix: answers.gulf_pricing_mix,
    team_size: answers.team_size,
    delegation_layer: answers.delegation_layer,
    vision: answers.vision,
    leadership: answers.leadership,
    feedback: answers.feedback,
    loyalty: answers.loyalty,
    notes: answers.notes,
    raw_payload_json: JSON.stringify(payload || {}),
  }

  const diagnosisRow = {
    lead_id: leadId,
    marketing_score: scores.marketing,
    operations_score: scores.operations,
    finance_score: scores.finance,
    team_score: scores.team,
    patient_score: scores.patient,
    overall_score: scores.overall,
    weakest_key: diagnosis.weakestKey,
    weakest_label: diagnosis.weakestLabel,
    diagnosis_explanation: diagnosis.explanation,
    clinic_context_notes_json: JSON.stringify(clinicContextNotes),
    execution_plan_json: JSON.stringify(executionPlan),
    free_action_plan_json: JSON.stringify(freeActionPlan),
    support_recommendation_title: supportRecommendation.title,
    support_recommendation_body: supportRecommendation.body,
    recommended_course_json: JSON.stringify(solutionSet.course || {}),
    recommended_bundle_json: JSON.stringify(solutionSet.bundle || {}),
    recommended_consultation_json: JSON.stringify(solutionSet.consultation || {}),
  }

  const automationLogRow = {
    log_id: `${leadId}-submitted`,
    lead_id: leadId,
    event_type: 'assessment_submitted',
    channel: 'system',
    template_name: '',
    payload_json: JSON.stringify({
      answers,
      scores,
      diagnosis,
      source: meta.source,
    }),
    status: 'created',
    provider_message_id: '',
    created_at: meta.createdAtUtc,
    sent_at: '',
    error_message: '',
  }

  return {
    meta,
    answers,
    scores,
    diagnosis,
    solutionSet,
    supportRecommendation,
    clinicContextNotes,
    executionPlan,
    leadsRow,
    rawAnswersRow,
    diagnosisRow,
    automationLogRow,
  }
}

export function listAllQuestionIds() {
  return [...RAW_QUESTION_IDS, 'phone_country_code']
}
