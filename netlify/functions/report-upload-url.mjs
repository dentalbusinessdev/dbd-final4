import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { json, methodNotAllowed, parseJsonBody } from './_shared/http.mjs'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL

function getR2Client() {
  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_BASE_URL) {
    throw new Error('R2_UPLOAD_NOT_CONFIGURED')
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

function sanitizeSegment(value, fallback) {
  const cleaned = String(value || fallback || '')
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return cleaned || fallback
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return methodNotAllowed(['POST'])
  }

  try {
    const payload = parseJsonBody(event)
    const leadId = sanitizeSegment(payload.lead_id || 'lead', 'lead')
    const filename = sanitizeSegment((payload.filename || 'report').replace(/\.pdf$/i, ''), 'report')
    const objectKey = `reports/${leadId}/${filename}.pdf`

    const client = getR2Client()
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: 'application/pdf',
    })

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 })
    const publicUrl = `${R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${objectKey}`

    return json(200, {
      success: true,
      upload_url: uploadUrl,
      public_url: publicUrl,
      object_key: objectKey,
      expires_in: 600,
    })
  } catch (error) {
    return json(500, {
      success: false,
      error: error.message || 'REPORT_UPLOAD_URL_FAILED',
    })
  }
}
