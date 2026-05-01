import { getGoogleAccessToken } from './googleAuth.mjs'

const SHEET_ID = process.env.GOOGLE_SHEET_ID
const DEFAULT_SHEETS = {
  leads: process.env.GOOGLE_SHEET_LEADS_TAB || 'Leads',
  rawAnswers: process.env.GOOGLE_SHEET_RAW_TAB || 'Answers_Raw',
  diagnosis: process.env.GOOGLE_SHEET_DIAGNOSIS_TAB || 'Scores_And_Diagnosis',
  automationLog: process.env.GOOGLE_SHEET_AUTOMATION_TAB || 'Automation_Log',
}

function ensureSheetId() {
  if (!SHEET_ID) {
    throw new Error('GOOGLE_SHEET_ID_MISSING')
  }
}

function buildSheetsUrl(path) {
  ensureSheetId()
  return `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`
}

async function googleSheetsFetch(path, options = {}) {
  const accessToken = await getGoogleAccessToken()
  const response = await fetch(buildSheetsUrl(path), {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GOOGLE_SHEETS_REQUEST_FAILED: ${text}`)
  }

  if (response.status === 204) return null
  return response.json()
}

function quoteSheetName(name) {
  return `'${String(name).replace(/'/g, "''")}'`
}

export async function getHeaderRow(sheetName) {
  const range = `${quoteSheetName(sheetName)}!1:1`
  const data = await googleSheetsFetch(`/values/${encodeURIComponent(range)}`)
  return data.values?.[0] || []
}

export async function ensureHeaders(sheetName, headers) {
  const existingHeaders = await getHeaderRow(sheetName)
  if (existingHeaders.length > 0) return existingHeaders

  const range = `${quoteSheetName(sheetName)}!A1`
  await googleSheetsFetch(`/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ values: [headers] }),
  })

  return headers
}

export async function appendRow(sheetName, headers, rowObject) {
  const actualHeaders = await ensureHeaders(sheetName, headers)
  const values = actualHeaders.map((header) => rowObject[header] ?? '')
  const range = `${quoteSheetName(sheetName)}!A1`

  await googleSheetsFetch(`/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values: [values] }),
  })
}

export async function findRowNumberByLeadId(sheetName, leadId) {
  const range = `${quoteSheetName(sheetName)}!A:A`
  const data = await googleSheetsFetch(`/values/${encodeURIComponent(range)}`)
  const rows = data.values || []
  const index = rows.findIndex((row) => row[0] === leadId)
  return index === -1 ? null : index + 1
}

function getColumnLetter(columnIndex) {
  let dividend = columnIndex
  let columnName = ''

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26
    columnName = String.fromCharCode(65 + modulo) + columnName
    dividend = Math.floor((dividend - modulo) / 26)
  }

  return columnName
}

export async function updateRowByLeadId(sheetName, leadId, fields) {
  const rowNumber = await findRowNumberByLeadId(sheetName, leadId)
  if (!rowNumber) {
    throw new Error(`LEAD_ROW_NOT_FOUND:${leadId}`)
  }

  const headers = await getHeaderRow(sheetName)
  const updates = Object.entries(fields).filter(([, value]) => value !== undefined)

  await Promise.all(updates.map(async ([field, value]) => {
    const columnIndex = headers.indexOf(field)
    if (columnIndex === -1) return
    const cellRange = `${quoteSheetName(sheetName)}!${getColumnLetter(columnIndex + 1)}${rowNumber}`
    await googleSheetsFetch(`/values/${encodeURIComponent(cellRange)}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ values: [[value]] }),
    })
  }))
}

export async function appendAutomationLog(rowObject, headers) {
  await appendRow(DEFAULT_SHEETS.automationLog, headers, rowObject)
}

export async function verifyGoogleSheetsAccess() {
  const checks = {}

  for (const [key, sheetName] of Object.entries(DEFAULT_SHEETS)) {
    checks[key] = {
      sheet: sheetName,
      headers: await getHeaderRow(sheetName),
    }
  }

  return {
    sheetId: SHEET_ID,
    checks,
  }
}

export const SHEET_NAMES = DEFAULT_SHEETS
