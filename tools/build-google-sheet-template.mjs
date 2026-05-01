import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const outputDir = path.join(projectRoot, 'outputs')
const outputPath = path.join(outputDir, 'dbd-google-sheets-template.xlsx')

const REQUIRED_TABS = [
  'Leads',
  'Answers_Raw',
  'Scores_And_Diagnosis',
  'Automation_Log',
]

const RECOMMENDED_TABS = [
  'Question_Bank',
  'Lookup_Statuses',
  'Sales_Notes',
  'Manual_WhatsApp',
  'Instructions',
]

const LEADS_HEADERS = [
  'lead_id',
  'created_at_utc',
  'created_at_cairo',
  'source',
  'app_version',
  'clinic_name',
  'person_name',
  'person_role_display',
  'person_role_json',
  'country',
  'city',
  'city_is_custom',
  'phone_country_code',
  'phone_number',
  'phone_whatsapp_full',
  'clinic_type',
  'clinic_years',
  'chairs',
  'services_display',
  'services_json',
  'primary_challenge_display',
  'primary_challenge_json',
  'marketing_plan',
  'lead_source',
  'marketing_roi',
  'scheduling',
  'no_show',
  'kpis',
  'monthly_revenue',
  'budget',
  'fin_challenge',
  'case_acceptance',
  'installments',
  'insurance_model',
  'gulf_pricing_mix',
  'team_size',
  'delegation_layer',
  'vision',
  'leadership',
  'feedback',
  'loyalty',
  'notes',
  'marketing_score',
  'operations_score',
  'finance_score',
  'team_score',
  'patient_score',
  'overall_score',
  'weakest_key',
  'weakest_label',
  'diagnosis_explanation',
  'support_recommendation_title',
  'support_recommendation_body',
  'recommended_course_id',
  'recommended_course_title',
  'recommended_bundle_id',
  'recommended_bundle_title',
  'recommended_consultation_id',
  'recommended_consultation_title',
  'report_pdf_url',
  'report_status',
  'whatsapp_status',
  'first_followup_status',
  'sales_status',
  'owner',
  'last_contact_at',
  'next_followup_at',
  'tags',
  'internal_notes',
]

const RAW_HEADERS = [
  'lead_id',
  'submitted_at',
  'clinic_name',
  'person_name',
  'person_role',
  'country',
  'city',
  'phone_country_code',
  'phone_number',
  'clinic_type',
  'clinic_years',
  'chairs',
  'services',
  'primary_challenge',
  'marketing_plan',
  'lead_source',
  'marketing_roi',
  'scheduling',
  'no_show',
  'kpis',
  'monthly_revenue',
  'budget',
  'fin_challenge',
  'case_acceptance',
  'installments',
  'insurance_model',
  'gulf_pricing_mix',
  'team_size',
  'delegation_layer',
  'vision',
  'leadership',
  'feedback',
  'loyalty',
  'notes',
  'raw_payload_json',
]

const DIAGNOSIS_HEADERS = [
  'lead_id',
  'marketing_score',
  'operations_score',
  'finance_score',
  'team_score',
  'patient_score',
  'overall_score',
  'weakest_key',
  'weakest_label',
  'diagnosis_explanation',
  'clinic_context_notes_json',
  'execution_plan_json',
  'free_action_plan_json',
  'support_recommendation_title',
  'support_recommendation_body',
  'recommended_course_json',
  'recommended_bundle_json',
  'recommended_consultation_json',
]

const AUTOMATION_HEADERS = [
  'log_id',
  'lead_id',
  'event_type',
  'channel',
  'template_name',
  'payload_json',
  'status',
  'provider_message_id',
  'created_at',
  'sent_at',
  'error_message',
]

const SALES_NOTES_HEADERS = [
  'note_id',
  'lead_id',
  'sales_rep',
  'status_before',
  'status_after',
  'note',
  'created_at',
]

const MANUAL_WHATSAPP_HEADERS = [
  'lead_id',
  'clinic_name',
  'person_name',
  'phone_whatsapp_full',
  'overall_score',
  'weakest_label',
  'recommended_course_title',
  'recommended_bundle_title',
  'recommended_consultation_title',
  'report_pdf_url',
  'message_1',
  'send_1',
  'message_2',
  'send_2',
  'message_3',
  'send_3',
]

const LOOKUP_ROWS = [
  ['group_name', 'key', 'label'],
  ['report_status', 'pending', 'Pending'],
  ['report_status', 'ready', 'Ready'],
  ['report_status', 'failed', 'Failed'],
  ['whatsapp_status', 'queued', 'Queued'],
  ['whatsapp_status', 'sent', 'Sent'],
  ['whatsapp_status', 'delivered', 'Delivered'],
  ['whatsapp_status', 'read', 'Read'],
  ['whatsapp_status', 'failed', 'Failed'],
  ['sales_status', 'new', 'New'],
  ['sales_status', 'contacted', 'Contacted'],
  ['sales_status', 'interested_course', 'Interested Course'],
  ['sales_status', 'interested_bundle', 'Interested Bundle'],
  ['sales_status', 'interested_consultation', 'Interested Consultation'],
  ['sales_status', 'won', 'Won'],
  ['sales_status', 'lost', 'Lost'],
  ['sales_status', 'no_response', 'No Response'],
]

function csvLineToCells(line) {
  const cells = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current)
  return cells
}

async function readQuestionBankRows() {
  const csvText = await fs.readFile(path.join(projectRoot, 'google-sheet-question-bank.csv'), 'utf8')
  return csvText
    .split(/\r?\n/)
    .filter(Boolean)
    .map(csvLineToCells)
}

function applyHeaderStyle(range) {
  range.format = {
    fill: '#0F172A',
    font: { bold: true, color: '#FFFFFF', size: 10 },
    horizontalAlignment: 'center',
    verticalAlignment: 'center',
    wrapText: true,
  }
}

function applyBodyStyle(range) {
  range.format = {
    verticalAlignment: 'top',
    wrapText: true,
    font: { color: '#0F172A', size: 10 },
  }
}

function formatSheetFrame(sheet, usedRange) {
  sheet.freezePanes.freezeRows(1)
  sheet.showGridLines = false
  usedRange.format.autofitColumns()
  usedRange.format.autofitRows()
}

function columnLetter(index) {
  let dividend = index
  let columnName = ''

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26
    columnName = String.fromCharCode(65 + modulo) + columnName
    dividend = Math.floor((dividend - modulo) / 26)
  }

  return columnName
}

function addHeaderOnlySheet(workbook, name, headers, description = '') {
  const sheet = workbook.worksheets.add(name)
  sheet.getRange(`A1:${columnLetter(headers.length)}1`).values = [headers]
  applyHeaderStyle(sheet.getRange(`A1:${columnLetter(headers.length)}1`))
  if (description) {
    sheet.getRange('A2').values = [[description]]
    sheet.getRange('A2').format = {
      font: { italic: true, color: '#475569' },
    }
  }
  formatSheetFrame(sheet, sheet.getUsedRange())
  return sheet
}

function addManualWhatsAppSheet(workbook) {
  const sheet = workbook.worksheets.add('Manual_WhatsApp')
  sheet.getRange(`A1:${columnLetter(MANUAL_WHATSAPP_HEADERS.length)}1`).values = [MANUAL_WHATSAPP_HEADERS]
  applyHeaderStyle(sheet.getRange(`A1:${columnLetter(MANUAL_WHATSAPP_HEADERS.length)}1`))

  const maxRows = 1000
  for (let row = 2; row <= maxRows; row += 1) {
    const rowFormulas = [[
      `=IF(Leads!A${row}="","",Leads!A${row})`,
      `=IF(Leads!F${row}="","",Leads!F${row})`,
      `=IF(Leads!G${row}="","",Leads!G${row})`,
      `=IF(Leads!O${row}="","",Leads!O${row})`,
      `=IF(Leads!AV${row}="","",Leads!AV${row})`,
      `=IF(Leads!AX${row}="","",Leads!AX${row})`,
      `=IF(Leads!BC${row}="","",Leads!BC${row})`,
      `=IF(Leads!BE${row}="","",Leads!BE${row})`,
      `=IF(Leads!BG${row}="","",Leads!BG${row})`,
      `=IF(Leads!BH${row}="","",Leads!BH${row})`,
      `=IF(A${row}="","","مرحبًا "&C${row}&CHAR(10)&CHAR(10)&"شكرًا لإتمام تقييم DBD الخاص بعيادة "&B${row}&"."&CHAR(10)&"نتيجتكم الحالية: "&E${row}&"%."&CHAR(10)&"أولوية التحسين الأولى: "&F${row}&"."&IF(J${row}<>"",CHAR(10)&CHAR(10)&"رابط التقرير: "&J${row},"")&CHAR(10)&CHAR(10)&"إذا أحببت، يمكننا مساعدتك في فهم التقرير وتحديد أفضل خطوة تالية لعيادتكم.")`,
      `=IF(D${row}="","",HYPERLINK("https://wa.me/"&REGEXREPLACE(D${row},"[^\\d]","")&"?text="&ENCODEURL(K${row}),"واتساب 1"))`,
      `=IF(A${row}="","","مرحبًا "&C${row}&CHAR(10)&CHAR(10)&"بناءً على نتيجة تقييم عيادة "&B${row}&"، فإن الترشيح الأقوى لكم الآن هو: "&G${row}&"."&CHAR(10)&"هذا الخيار يساعدكم في معالجة أكبر فجوة حالية بشكل عملي ومباشر."&IF(J${row}<>"",CHAR(10)&CHAR(10)&"رابط التقرير: "&J${row},"")&CHAR(10)&CHAR(10)&"إذا رغبت، يمكننا توضيح لماذا هذا الكورس هو الأنسب لكم الآن.")`,
      `=IF(D${row}="","",HYPERLINK("https://wa.me/"&REGEXREPLACE(D${row},"[^\\d]","")&"?text="&ENCODEURL(M${row}),"واتساب 2"))`,
      `=IF(A${row}="","","مرحبًا "&C${row}&CHAR(10)&CHAR(10)&"إذا كانت التحديات لديكم تحتاج حلًا أشمل، فالبرنامج الكامل المناسب لكم هو: "&H${row}&"."&IF(I${row}<>"",CHAR(10)&"كما يمكنكم أيضًا حجز: "&I${row}&".","")&IF(J${row}<>"",CHAR(10)&CHAR(10)&"رابط التقرير: "&J${row},"")&CHAR(10)&CHAR(10)&"يسعدنا مساعدتكم في اختيار المسار الأنسب حسب وضع العيادة الحالي.")`,
      `=IF(D${row}="","",HYPERLINK("https://wa.me/"&REGEXREPLACE(D${row},"[^\\d]","")&"?text="&ENCODEURL(O${row}),"واتساب 3"))`,
    ]]

    sheet.getRange(`A${row}:P${row}`).formulas = rowFormulas
  }

  applyBodyStyle(sheet.getRange(`A2:P${maxRows}`))
  sheet.getRange(`A${maxRows + 2}`).values = [['This tab creates manual WhatsApp-ready messages and click-to-send links based on Leads data.']]
  sheet.getRange(`A${maxRows + 2}`).format = {
    font: { italic: true, color: '#475569' },
  }

  formatSheetFrame(sheet, sheet.getUsedRange())
  return sheet
}

async function buildWorkbook() {
  const workbook = Workbook.create()

  const instructions = workbook.worksheets.add('Instructions')
  instructions.getRange('A1:E1').merge()
  instructions.getRange('A1').values = [['DBD Google Sheets Template']]
  instructions.getRange('A1').format = {
    fill: '#111827',
    font: { bold: true, color: '#FFFFFF', size: 16 },
    horizontalAlignment: 'center',
    verticalAlignment: 'center',
  }
  instructions.getRange('A3:B13').values = [
    ['Section', 'Details'],
    ['Required tabs', REQUIRED_TABS.join(' | ')],
    ['Recommended tabs', RECOMMENDED_TABS.join(' | ')],
    ['Leads', 'Main CRM view for your sales and operations team'],
    ['Answers_Raw', 'Exact user answers stored with raw payload'],
    ['Scores_And_Diagnosis', 'Server-side analysis and recommendation output'],
    ['Automation_Log', 'WhatsApp and automation event tracking'],
    ['Manual_WhatsApp', 'Ready-made manual WhatsApp messages and click-to-send links'],
    ['Question_Bank', 'Reference sheet for all questions and possible answers'],
    ['Important note', 'Do not rename the 4 required tabs used by the backend'],
    ['Google Sheet setup guide', 'See GOOGLE-SHEET-BLUEPRINT.md in the project root'],
  ]
  applyHeaderStyle(instructions.getRange('A3:B3'))
  applyBodyStyle(instructions.getRange('A4:B13'))
  instructions.getRange('A14:B18').values = [
    ['Status endpoint', '/api/backend/status'],
    ['Submit endpoint', '/api/assessment/submit'],
    ['Report endpoint', '/api/report/register'],
    ['Webhook endpoint', '/api/webhooks/whatsapp-status'],
    ['Best usage', 'Import this workbook to Google Sheets, then connect Netlify env vars'],
  ]
  applyHeaderStyle(instructions.getRange('A14:B14'))
  applyBodyStyle(instructions.getRange('A15:B18'))
  formatSheetFrame(instructions, instructions.getUsedRange())

  addHeaderOnlySheet(workbook, 'Leads', LEADS_HEADERS)
  addHeaderOnlySheet(workbook, 'Answers_Raw', RAW_HEADERS)
  addHeaderOnlySheet(workbook, 'Scores_And_Diagnosis', DIAGNOSIS_HEADERS)
  addHeaderOnlySheet(workbook, 'Automation_Log', AUTOMATION_HEADERS)
  addHeaderOnlySheet(workbook, 'Sales_Notes', SALES_NOTES_HEADERS, 'Manual sales follow-up notes can be added here by your team.')
  addManualWhatsAppSheet(workbook)

  const questionBankRows = await readQuestionBankRows()
  const questionBank = workbook.worksheets.add('Question_Bank')
  const questionBankCols = questionBankRows[0].length
  questionBank.getRange(`A1:${columnLetter(questionBankCols)}${questionBankRows.length}`).values = questionBankRows
  applyHeaderStyle(questionBank.getRange(`A1:${columnLetter(questionBankCols)}1`))
  applyBodyStyle(questionBank.getRange(`A2:${columnLetter(questionBankCols)}${questionBankRows.length}`))
  formatSheetFrame(questionBank, questionBank.getUsedRange())

  const lookup = workbook.worksheets.add('Lookup_Statuses')
  lookup.getRange(`A1:C${LOOKUP_ROWS.length}`).values = LOOKUP_ROWS
  applyHeaderStyle(lookup.getRange('A1:C1'))
  applyBodyStyle(lookup.getRange(`A2:C${LOOKUP_ROWS.length}`))
  formatSheetFrame(lookup, lookup.getUsedRange())

  return workbook
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true })
  const workbook = await buildWorkbook()

  await workbook.inspect({
    kind: 'sheet,table',
    maxChars: 3000,
    tableMaxRows: 10,
    tableMaxCols: 10,
  })

  await workbook.render({ sheetName: 'Instructions', autoCrop: 'all', scale: 1, format: 'png' })
  await workbook.render({ sheetName: 'Question_Bank', range: 'A1:F18', scale: 1, format: 'png' })

  const output = await SpreadsheetFile.exportXlsx(workbook)
  await output.save(outputPath)

  console.log(outputPath)
}

await main()
