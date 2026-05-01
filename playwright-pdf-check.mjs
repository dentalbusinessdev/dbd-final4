import fs from 'node:fs/promises'
import { chromium } from 'file:///C:/Users/omare/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import * as pdfjsLib from 'file:///C:/Users/omare/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/legacy/build/pdf.mjs'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 1800 } })

const sampleAnswers = {
  clinic_name: 'عيادة النخبة',
  person_name: 'أحمد علي',
  person_role: ['مدير العيادة'],
  country: 'مصر',
  city: 'القاهرة',
  phone_country_code: '+20',
  phone_number: '1012345678',
  clinic_years: '3–7 سنوات',
  chairs: '2–3',
  services: ['General Dentistry', 'Cosmetic / Veneers'],
  primary_challenge: ['زيادة عدد المرضى الجدد', 'إدارة المال والتدفق النقدي'],
  lead_source: 'الإحالات (Referrals)',
  marketing_plan: 'إلى حد ما',
  marketing_roi: 'لا',
  scheduling: 'لدينا برنامج إدارة مواعيد',
  monthly_revenue: 'مقبول لكنه غير مستقر',
  budget: 'لا',
  fin_challenge: 'إدارة المال والتدفق النقدي (Cash flow)',
  team_size: '4–6 أفراد',
  vision: 'جزئيًا',
  leadership: 'متوسط',
  feedback: 'أحيانًا',
  loyalty: 'يحتاج تطوير',
}

try {
  await page.addInitScript((answers) => {
    window.localStorage.setItem('dbd-app-state-v1', JSON.stringify({
      appStage: 'main',
      tab: 'result',
      answers,
    }))
  }, sampleAnswers)

  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'تنزيل التقرير PDF' }).click()
  const download = await downloadPromise
  const targetPath = 'C:/Users/omare/Documents/Codex/2026-04-21-files-mentioned-by-the-user-dbd/playwright-report-check.pdf'
  await download.saveAs(targetPath)

  const stat = await fs.stat(targetPath)
  if (stat.size < 100000) {
    throw new Error(`Downloaded PDF is unexpectedly small: ${stat.size} bytes`)
  }

  const data = await fs.readFile(targetPath)
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise
  if (pdfDoc.numPages < 2) {
    throw new Error(`Expected at least 2 pages in PDF, got ${pdfDoc.numPages}`)
  }

  const linksPage = await pdfDoc.getPage(pdfDoc.numPages)
  const annotations = await linksPage.getAnnotations()
  const linkUrls = annotations
    .map((annotation) => annotation.url)
    .filter(Boolean)

  if (linkUrls.length < 3) {
    throw new Error(`Expected clickable links on the final PDF page, got ${linkUrls.length}`)
  }

  if (!linkUrls.some((url) => url.includes('nzmly.com'))) {
    throw new Error('PDF annotations do not contain the expected course/consultation links.')
  }

  console.log('PLAYWRIGHT_PDF_PASS')
} catch (error) {
  await page.screenshot({
    path: 'C:/Users/omare/Documents/Codex/2026-04-21-files-mentioned-by-the-user-dbd/playwright-pdf-failure.png',
    fullPage: true,
  })
  console.error('PLAYWRIGHT_PDF_FAIL')
  console.error(error)
  process.exitCode = 1
} finally {
  await browser.close()
}
