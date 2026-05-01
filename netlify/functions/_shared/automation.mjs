export async function triggerAutomation(eventName, payload) {
  const webhookUrl = process.env.AUTOMATION_WEBHOOK_URL
  if (!webhookUrl) {
    return { queued: false, skipped: true }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      event: eventName,
      payload,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`AUTOMATION_WEBHOOK_FAILED: ${text}`)
  }

  return { queued: true, skipped: false }
}
