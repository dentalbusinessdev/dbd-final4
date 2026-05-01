import crypto from 'node:crypto'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function signJwt(unsignedToken, privateKey) {
  return crypto.createSign('RSA-SHA256').update(unsignedToken).end().sign(privateKey, 'base64url')
}

function normalizePrivateKey(privateKey) {
  return String(privateKey || '').replace(/\\n/g, '\n')
}

export async function getGoogleAccessToken() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY)

  if (!clientEmail || !privateKey) {
    throw new Error('GOOGLE_SHEETS_CONFIG_MISSING')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: clientEmail,
    scope: GOOGLE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  }

  const encodedHeader = base64Url(JSON.stringify(header))
  const encodedPayload = base64Url(JSON.stringify(payload))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`
  const signature = signJwt(unsignedToken, privateKey)
  const assertion = `${unsignedToken}.${signature}`

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GOOGLE_TOKEN_REQUEST_FAILED: ${text}`)
  }

  const data = await response.json()
  return data.access_token
}
