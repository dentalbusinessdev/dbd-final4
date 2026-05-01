import { appendAutomationLog } from './_shared/googleSheets.mjs'
import { AUTOMATION_HEADERS } from './_shared/assessmentSubmission.mjs'
import { json, methodNotAllowed, parseJsonBody } from './_shared/http.mjs'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return methodNotAllowed(['POST'])
  }

  try {
    const payload = parseJsonBody(event)
    const leadId = String(payload.lead_id || '').trim()

    await appendAutomationLog({
      log_id: `${leadId || 'unknown'}-whatsapp-${Date.now()}`,
      lead_id: leadId,
      event_type: 'whatsapp_status_callback',
      channel: 'whatsapp',
      template_name: payload.template_name || '',
      payload_json: JSON.stringify(payload),
      status: payload.status || 'received',
      provider_message_id: payload.provider_message_id || '',
      created_at: new Date().toISOString(),
      sent_at: payload.sent_at || '',
      error_message: payload.error_message || '',
    }, AUTOMATION_HEADERS)

    return json(200, { success: true })
  } catch (error) {
    return json(500, {
      success: false,
      error: error.message || 'UNEXPECTED_SERVER_ERROR',
    })
  }
}
