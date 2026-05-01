const SYNC_STORAGE_KEY = 'dbd-lead-sync-v1'

function buildFingerprint(answers) {
  return JSON.stringify(answers || {})
}

function readSyncState() {
  try {
    const raw = window.localStorage.getItem(SYNC_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSyncState(state) {
  try {
    window.localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage issues to keep UX uninterrupted.
  }
}

export function getCachedLeadSync(answers) {
  const state = readSyncState()
  const fingerprint = buildFingerprint(answers)
  if (state?.fingerprint === fingerprint && state?.leadId) {
    return state
  }
  return null
}

export async function submitAssessmentLead(answers, clientScores, options = {}) {
  const fingerprint = buildFingerprint(answers)
  const cached = readSyncState()
  if (cached?.fingerprint === fingerprint && cached?.leadId) {
    return { success: true, cached: true, lead_id: cached.leadId }
  }

  const payload = {
    meta: {
      submitted_at: new Date().toISOString(),
      app_version: options.appVersion || 'frontend-v1',
      source: options.source || 'netlify-web',
      locale: navigator.language || 'ar-EG',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo',
      user_agent: navigator.userAgent,
    },
    answers,
    client_scores: clientScores,
  }

  const response = await fetch('/api/assessment/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'ASSESSMENT_SUBMIT_FAILED')
  }

  writeSyncState({
    fingerprint,
    leadId: data.lead_id,
    overallScore: data.overall_score,
    weakestArea: data.weakest_area,
    syncedAt: new Date().toISOString(),
  })

  return data
}

export async function registerReportUrl(payload) {
  const response = await fetch('/api/report/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'REPORT_REGISTER_FAILED')
  }

  return data
}
