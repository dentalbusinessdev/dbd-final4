import { chromium } from 'file:///C:/Users/omare/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173'

const sampleAnswers = {
  clinic_name: 'Elite Dental Clinic',
  person_name: 'Ahmed Ali',
  person_role: ['Owner', 'Clinic Manager'],
  country: 'السعودية',
  city: 'الرياض',
  phone_country_code: '+966',
  phone_number: '23456789',
  clinic_years: '3-7 سنوات',
  chairs: '2-3',
  services: ['General Dentistry', 'Cosmetic / Veneers'],
  primary_challenge: ['زيادة عدد المرضى الجدد', 'إدارة المال والتدفق النقدي'],
  lead_source: 'الإحالات (Referrals)',
  marketing_plan: 'إلى حد ما',
  marketing_roi: 'لا',
  scheduling: 'لدينا برنامج إدارة مواعيد',
  monthly_revenue: 'مقبول لكنه غير مستقر',
  budget: 'لا',
  fin_challenge: 'إدارة المال والتدفق النقدي (Cash flow)',
  team_size: '4-6 أفراد',
  vision: 'جزئيًا',
  leadership: 'متوسط',
  feedback: 'أحيانًا',
  loyalty: 'يحتاج تطوير',
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 2200 } })

try {
  await page.addInitScript((answers) => {
    window.localStorage.setItem('dbd-app-state-v1', JSON.stringify({
      appStage: 'main',
      tab: 'result',
      answers,
    }))
  }, sampleAnswers)

  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null)
  const navigationPromise = page.waitForURL(/nzmly\.com/, { timeout: 5000 }).then(() => page.url()).catch(() => null)
  await page.locator('[data-pdf-link]').first().click()
  const popup = await popupPromise
  const navigatedUrl = await navigationPromise

  let openedUrl = navigatedUrl
  if (popup) {
    await popup.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => null)
    openedUrl = popup.url()
  }

  if (!openedUrl || !openedUrl.includes('nzmly.com')) {
    throw new Error(`Course button did not open the expected external URL. Got: ${openedUrl}`)
  }

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const copyButtons = page.locator('button:visible').filter({ hasText: /نسخ الرابط|تم نسخ الرابط/ })
  if (await copyButtons.count()) {
    throw new Error('Copy link buttons are still visible in the report.')
  }

  console.log('PLAYWRIGHT_REPORT_LINKS_PASS')
} catch (error) {
  await page.screenshot({
    path: 'C:/Users/omare/Documents/Codex/2026-04-21-files-mentioned-by-the-user-dbd/playwright-report-links-failure.png',
    fullPage: true,
  })
  console.error('PLAYWRIGHT_REPORT_LINKS_FAIL')
  console.error(error)
  process.exitCode = 1
} finally {
  await browser.close()
}
