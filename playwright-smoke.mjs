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
const page = await browser.newPage({ viewport: { width: 1280, height: 1800 } })

page.on('pageerror', (error) => {
  console.error('PAGE_ERROR', error)
})

try {
  await page.addInitScript(() => {
    window.localStorage.clear()
  })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  const visibleButtons = page.locator('button:visible')
  await visibleButtons.filter({ hasText: 'التالي' }).first().click()
  await visibleButtons.filter({ hasText: 'التالي' }).first().click()
  await visibleButtons.filter({ hasText: 'ابدأ الآن' }).first().click()

  const startAssessmentButton = visibleButtons.filter({ hasText: 'ابدأ التقييم الآن' }).first()
  await startAssessmentButton.waitFor({ state: 'visible' })
  await startAssessmentButton.click()

  const clinicQuestion = page.locator('text=اسم العيادة أو المركز').first()
  await clinicQuestion.waitFor({ state: 'visible' })

  await page.addInitScript((answers) => {
    window.localStorage.setItem('dbd-app-state-v1', JSON.stringify({
      appStage: 'main',
      tab: 'result',
      answers,
    }))
  }, sampleAnswers)

  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  await page.locator('text=تقرير التقييم').first().waitFor({ state: 'visible' })
  await page.locator('[data-pdf-link]').first().waitFor({ state: 'visible' })

  console.log('PLAYWRIGHT_SMOKE_PASS')
} catch (error) {
  await page.screenshot({
    path: 'C:/Users/omare/Documents/Codex/2026-04-21-files-mentioned-by-the-user-dbd/playwright-smoke-failure.png',
    fullPage: true,
  })
  console.error('PLAYWRIGHT_SMOKE_FAIL')
  console.error(error)
  process.exitCode = 1
} finally {
  await browser.close()
}
