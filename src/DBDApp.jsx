import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { BarChart3, BookOpen, ClipboardCheck, Home, Info, Newspaper, Stethoscope } from 'lucide-react'
import AppErrorBoundary from './components/AppErrorBoundary'

const HomeScreen = lazy(() => import('./screens/HomeScreen'))
const OnboardingScreen = lazy(() => import('./screens/OnboardingScreen'))
const AssessmentScreen = lazy(() => import('./screens/AssessmentScreen'))
const ResultScreen = lazy(() => import('./screens/ResultScreen'))
const CoursesScreen = lazy(() => import('./screens/ContentScreens').then((module) => ({ default: module.CoursesScreen })))
const InsightsScreen = lazy(() => import('./screens/ContentScreens').then((module) => ({ default: module.InsightsScreen })))
const DashboardScreen = lazy(() => import('./screens/ContentScreens').then((module) => ({ default: module.DashboardScreen })))
const AboutScreen = lazy(() => import('./screens/ContentScreens').then((module) => ({ default: module.AboutScreen })))
const STORAGE_KEY = 'dbd-app-state-v1'

const tabs = [
  ['home', Home, 'الرئيسية'],
  ['dashboard', BarChart3, 'لوحتي'],
  ['assessment', ClipboardCheck, 'التقييم'],
  ['courses', BookOpen, 'الكورسات'],
  ['insights', Newspaper, 'المقالات'],
  ['about', Info, 'عنا'],
]

export default function App() {
  const persistedState = useMemo(() => {
    try {
      const rawState = window.localStorage.getItem(STORAGE_KEY)
      return rawState ? JSON.parse(rawState) : null
    } catch {
      return null
    }
  }, [])

  const [appStage, setAppStage] = useState(persistedState?.appStage || 'onboarding')
  const [tab, setTab] = useState(persistedState?.tab || 'home')
  const [answers, setAnswers] = useState(persistedState?.answers || {})

  const startAssessment = () => {
    setAppStage('main')
    setTab('assessment')
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ appStage, tab, answers }))
    } catch {
      // Ignore storage issues and keep the app usable.
    }
  }, [answers, appStage, tab])

  if (appStage === 'onboarding') {
    return (
      <AppErrorBoundary>
        <div className="app-shell">
          <Suspense fallback={<AppFallback />}>
            <OnboardingScreen onNext={() => setAppStage('main')} />
          </Suspense>
        </div>
      </AppErrorBoundary>
    )
  }

  return (
    <AppErrorBoundary>
      <div className="app-shell" dir="rtl">
        <div className="page">
          <div className="row-between" style={{ justifyContent: 'flex-start', marginBottom: 20, gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 18, background: '#111827', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 30 }}>DBD</h1>
              <p className="small muted" style={{ margin: 0 }}>Dental Business Development</p>
            </div>
          </div>

          <Suspense fallback={<AppFallback compact />}>
            {tab === 'home' && <HomeScreen onStartAssessment={startAssessment} onBrowseCourses={() => setTab('courses')} onBrowseInsights={() => setTab('insights')} />}
            {tab === 'dashboard' && <DashboardScreen answers={answers} onResumeAssessment={startAssessment} onSeeResult={() => setTab('result')} />}
            {tab === 'assessment' && <AssessmentScreen answers={answers} setAnswers={setAnswers} onFinish={() => setTab('result')} />}
            {tab === 'result' && <ResultScreen answers={answers} />}
            {tab === 'courses' && <CoursesScreen />}
            {tab === 'insights' && <InsightsScreen onStartAssessment={startAssessment} />}
            {tab === 'about' && <AboutScreen />}
          </Suspense>
        </div>

        <div className="bottom-nav">
          <div className="bottom-nav-inner">
            {tabs.map(([key, Icon, label]) => (
              <button key={key} className={`nav-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Icon size={20} />
                  <span className="nav-label">{label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppErrorBoundary>
  )
}

function AppFallback({ compact = false }) {
  return (
    <div style={{ padding: compact ? '24px 0' : '24px 16px', textAlign: 'center', color: '#6b7280' }}>
      جاري تحميل المحتوى...
    </div>
  )
}
