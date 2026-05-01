import { verifyGoogleSheetsAccess } from './_shared/googleSheets.mjs'
import { json, methodNotAllowed } from './_shared/http.mjs'

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return methodNotAllowed(['GET'])
  }

  try {
    const googleSheets = await verifyGoogleSheetsAccess()

    return json(200, {
      success: true,
      runtime: 'netlify-functions',
      env: {
        google_service_account_email: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
        google_private_key: Boolean(process.env.GOOGLE_PRIVATE_KEY),
        google_sheet_id: Boolean(process.env.GOOGLE_SHEET_ID),
        automation_webhook_url: Boolean(process.env.AUTOMATION_WEBHOOK_URL),
        r2_account_id: Boolean(process.env.R2_ACCOUNT_ID),
        r2_bucket_name: Boolean(process.env.R2_BUCKET_NAME),
        r2_access_key_id: Boolean(process.env.R2_ACCESS_KEY_ID),
        r2_secret_access_key: Boolean(process.env.R2_SECRET_ACCESS_KEY),
        r2_public_base_url: Boolean(process.env.R2_PUBLIC_BASE_URL),
        vite_r2_public_base_url: Boolean(process.env.VITE_R2_PUBLIC_BASE_URL),
      },
      google_sheets: {
        connected: true,
        sheet_id: googleSheets.sheetId,
        tabs: Object.fromEntries(
          Object.entries(googleSheets.checks).map(([key, value]) => [
            key,
            {
              sheet: value.sheet,
              has_headers: value.headers.length > 0,
              header_count: value.headers.length,
            },
          ]),
        ),
      },
    })
  } catch (error) {
    return json(500, {
      success: false,
      runtime: 'netlify-functions',
      error: error.message || 'BACKEND_STATUS_FAILED',
      env: {
        google_service_account_email: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
        google_private_key: Boolean(process.env.GOOGLE_PRIVATE_KEY),
        google_sheet_id: Boolean(process.env.GOOGLE_SHEET_ID),
        automation_webhook_url: Boolean(process.env.AUTOMATION_WEBHOOK_URL),
        r2_account_id: Boolean(process.env.R2_ACCOUNT_ID),
        r2_bucket_name: Boolean(process.env.R2_BUCKET_NAME),
        r2_access_key_id: Boolean(process.env.R2_ACCESS_KEY_ID),
        r2_secret_access_key: Boolean(process.env.R2_SECRET_ACCESS_KEY),
        r2_public_base_url: Boolean(process.env.R2_PUBLIC_BASE_URL),
        vite_r2_public_base_url: Boolean(process.env.VITE_R2_PUBLIC_BASE_URL),
      },
    })
  }
}
