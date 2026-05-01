export function isReportUploadConfigured() {
  // Upload configuration lives on the backend Netlify function.
  // We intentionally do not gate this on frontend env vars so the
  // report upload can work as long as the server-side R2 config exists.
  return true
}

export async function uploadReportPdf({ fileBlob, filename, leadId }) {
  const uploadResponse = await fetch('/api/report-upload-url', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      lead_id: leadId,
      filename,
    }),
  })

  const uploadData = await uploadResponse.json()
  if (!uploadResponse.ok) {
    throw new Error(uploadData.error || 'REPORT_UPLOAD_URL_FAILED')
  }

  const putResponse = await fetch(uploadData.upload_url, {
    method: 'PUT',
    headers: {
      'content-type': 'application/pdf',
    },
    body: fileBlob,
  })

  if (!putResponse.ok) {
    throw new Error('R2_PDF_UPLOAD_FAILED')
  }

  return {
    url: uploadData.public_url,
    objectKey: uploadData.object_key,
  }
}
