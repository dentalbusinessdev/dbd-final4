import { appendAutomationLog, appendRow, SHEET_NAMES } from './_shared/googleSheets.mjs'
import {
  AUTOMATION_HEADERS,
  buildSubmissionRecord,
  DIAGNOSIS_HEADERS,
  LEADS_HEADERS,
  RAW_HEADERS,
} from './_shared/assessmentSubmission.mjs'
import { json, methodNotAllowed, parseJsonBody } from './_shared/http.mjs'
import { triggerAutomation } from './_shared/automation.mjs'
import { buildAssessmentSubmittedWhatsappPayload } from './_shared/whatsappMessages.mjs'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return methodNotAllowed(['POST'])
  }

  try {
    const payload = parseJsonBody(event)
    const submission = buildSubmissionRecord(payload)

    await appendRow(SHEET_NAMES.leads, LEADS_HEADERS, submission.leadsRow)
    await appendRow(SHEET_NAMES.rawAnswers, RAW_HEADERS, submission.rawAnswersRow)
    await appendRow(SHEET_NAMES.diagnosis, DIAGNOSIS_HEADERS, submission.diagnosisRow)
    await appendAutomationLog(submission.automationLogRow, AUTOMATION_HEADERS)

    const automationResult = await triggerAutomation('assessment_submitted', {
      lead_id: submission.meta.leadId,
      created_at_utc: submission.meta.createdAtUtc,
      phone_whatsapp_full: submission.leadsRow.phone_whatsapp_full,
      clinic_name: submission.answers.clinic_name,
      person_name: submission.answers.person_name,
      country: submission.answers.country,
      city: submission.answers.city,
      scores: submission.scores,
      diagnosis: submission.diagnosis,
      support_recommendation: submission.supportRecommendation,
      recommended_course: submission.solutionSet.course,
      recommended_bundle: submission.solutionSet.bundle,
      recommended_consultation: submission.solutionSet.consultation,
      whatsapp: buildAssessmentSubmittedWhatsappPayload({
        leadId: submission.meta.leadId,
        clinicName: submission.answers.clinic_name,
        personName: submission.answers.person_name,
        phoneWhatsappFull: submission.leadsRow.phone_whatsapp_full,
        country: submission.answers.country,
        city: submission.answers.city,
        scores: submission.scores,
        diagnosis: submission.diagnosis,
        supportRecommendation: submission.supportRecommendation,
        recommendedCourse: submission.solutionSet.course,
      }),
    })

    return json(200, {
      success: true,
      lead_id: submission.meta.leadId,
      overall_score: submission.scores.overall,
      weakest_area: submission.diagnosis.weakestLabel,
      whatsapp_status: automationResult.queued ? 'queued' : 'pending',
    })
  } catch (error) {
    if (error.message === 'ASSESSMENT_VALIDATION_FAILED') {
      return json(422, {
        success: false,
        error: error.message,
        details: error.details || [],
      })
    }

    return json(500, {
      success: false,
      error: error.message || 'UNEXPECTED_SERVER_ERROR',
    })
  }
}
