import { appendAutomationLog, SHEET_NAMES, updateRowByLeadId } from './_shared/googleSheets.mjs'
import { AUTOMATION_HEADERS } from './_shared/assessmentSubmission.mjs'
import { json, methodNotAllowed, parseJsonBody } from './_shared/http.mjs'
import { triggerAutomation } from './_shared/automation.mjs'
import { buildReportReadyWhatsappPayload } from './_shared/whatsappMessages.mjs'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return methodNotAllowed(['POST'])
  }

  try {
    const payload = parseJsonBody(event)
    const leadId = String(payload.lead_id || '').trim()

    if (!leadId) {
      return json(422, { success: false, error: 'lead_id is required' })
    }

    await updateRowByLeadId(SHEET_NAMES.leads, leadId, {
      report_pdf_url: payload.report_pdf_url || '',
      report_status: payload.report_status || 'ready',
      last_contact_at: new Date().toISOString(),
    })

    await appendAutomationLog({
      log_id: `${leadId}-report-${Date.now()}`,
      lead_id: leadId,
      event_type: 'report_registered',
      channel: 'system',
      template_name: '',
      payload_json: JSON.stringify(payload),
      status: 'created',
      provider_message_id: '',
      created_at: new Date().toISOString(),
      sent_at: '',
      error_message: '',
    }, AUTOMATION_HEADERS)

    await triggerAutomation('report_registered', {
      ...payload,
      whatsapp: buildReportReadyWhatsappPayload({
        leadId,
        clinicName: payload.clinic_name,
        personName: payload.person_name,
        phoneWhatsappFull: payload.phone_whatsapp_full,
        reportPdfUrl: payload.report_pdf_url,
        scores: payload.scores,
        diagnosis: payload.diagnosis,
        recommendedCourse: payload.recommended_course,
        recommendedBundle: payload.recommended_bundle,
        recommendedConsultation: payload.recommended_consultation,
      }),
    })

    return json(200, { success: true, lead_id: leadId })
  } catch (error) {
    return json(500, {
      success: false,
      error: error.message || 'UNEXPECTED_SERVER_ERROR',
    })
  }
}
