import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, TriangleAlert } from 'lucide-react'
import SearchableSelect from '../components/SearchableSelect'
import { Badge, Button, Card, CardContent, Input, Progress, Textarea } from '../components/ui'
import { arabCountries, countryMap } from '../data/assessment'
import { buildAssessmentSections, getQuestionValue, isQuestionAnswered } from '../lib/assessment'

export default function AssessmentScreen({ answers, setAnswers, onFinish }) {
  const [index, setIndex] = useState(0)
  const visibleSections = useMemo(() => buildAssessmentSections(answers), [answers])
  const allQuestions = useMemo(() => visibleSections.flatMap((section) => section.questions.map((question) => ({ ...question, sectionId: section.id }))), [visibleSections])
  const current = allQuestions[index]
  const selectedCountry = countryMap[answers.country]
  const cityOptions = selectedCountry?.cities || []

  useEffect(() => {
    if (index > allQuestions.length - 1) {
      setIndex(Math.max(0, allQuestions.length - 1))
    }
  }, [allQuestions.length, index])

  if (!current) return null

  const currentSectionIndex = visibleSections.findIndex((section) => section.id === current.sectionId)
  const currentSection = visibleSections[currentSectionIndex]
  const sectionQuestionCount = currentSection.questions.length
  const answeredInSection = currentSection.questions.findIndex((question) => question.id === current.id) + 1
  const progress = Math.round(((index + 1) / allQuestions.length) * 100)
  const value = getQuestionValue(answers, current)
  const canContinue = isQuestionAnswered(current, value)
  const hint = Array.isArray(value) ? undefined : current.hintMap?.[value]

  const updateAnswer = (questionId, nextValue) => {
    setAnswers((previous) => {
      const nextAnswers = { ...previous, [questionId]: nextValue }

      if (questionId === 'country') {
        nextAnswers.city = ''
        nextAnswers.phone_country_code = countryMap[nextValue]?.dialCode || ''
      }

      if (questionId === 'phone_number' && !nextAnswers.phone_country_code) {
        nextAnswers.phone_country_code = selectedCountry?.dialCode || ''
      }

      return nextAnswers
    })
  }

  const toggleMultiOption = (questionId, option) => {
    const currentValues = Array.isArray(answers[questionId]) ? answers[questionId] : []
    const maxSelections = current.maxSelections || Infinity
    const nextValues = currentValues.includes(option)
      ? currentValues.filter((item) => item !== option)
      : currentValues.length >= maxSelections
        ? [...currentValues.slice(1), option]
        : [...currentValues, option]

    updateAnswer(questionId, nextValues)
  }

  return (
    <div className="stack-4">
      <Card><CardContent>
        <div className="row-between" style={{ marginBottom: 16 }}>
          <Badge>{currentSection.title}</Badge>
          <span className="small muted">{answeredInSection} / {sectionQuestionCount}</span>
        </div>

        <Progress value={progress} />

        <div className="section-tabs" style={{ marginTop: 16, marginBottom: 18 }}>
          {visibleSections.map((section, sectionIndex) => (
            <div key={section.id} className={`section-tab ${sectionIndex === currentSectionIndex ? 'active' : sectionIndex < currentSectionIndex ? 'done' : ''}`}>{section.title}</div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={current.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h3 style={{ fontSize: 24, lineHeight: 1.6, margin: '0 0 8px' }}>{current.label}</h3>
            {!current.subtitle && !current.hint && !hint && <p className="small muted" style={{ marginBottom: 16 }}>كل إجابة تساعد في تكوين تشخيص أدق للعيادة.</p>}
            {current.subtitle && <p className="small muted" style={{ marginTop: 0, marginBottom: 16, lineHeight: 1.7 }}>{current.subtitle}</p>}
            {current.hint && <p className="small muted" style={{ marginTop: 0, marginBottom: 16, lineHeight: 1.7 }}>{current.hint}</p>}

            <div className="stack-3">
              {current.type === 'text' && <Input value={value} onChange={(event) => updateAnswer(current.id, event.target.value)} placeholder="اكتب هنا" />}
              {current.type === 'textarea' && <Textarea value={value} onChange={(event) => updateAnswer(current.id, event.target.value)} placeholder="اكتب هنا" />}

              {current.type === 'country' && (
                <SearchableSelect
                  value={value}
                  onSelect={(option) => updateAnswer(current.id, option)}
                  options={arabCountries.map((country) => country.name)}
                  placeholder={current.placeholder}
                />
              )}

              {current.type === 'city' && (
                <SearchableSelect
                  value={value}
                  onSelect={(option) => updateAnswer(current.id, option)}
                  options={cityOptions}
                  placeholder={current.placeholder}
                  disabled={!selectedCountry}
                  emptyMessage={selectedCountry ? 'لا توجد مدينة مطابقة' : 'اختر الدولة أولًا'}
                  allowCustom
                  customLabel="إضافة المدينة"
                />
              )}

              {current.type === 'phone' && (
                <div className="stack-2">
                  <div className="phone-field">
                    <div className={`phone-code ${selectedCountry ? 'active' : ''}`}>{selectedCountry?.dialCode || 'اختر الدولة'}</div>
                    <Input
                      value={value}
                      onChange={(event) => updateAnswer(current.id, event.target.value.replace(/[^\d\s-]/g, ''))}
                      placeholder={current.placeholder}
                      inputMode="tel"
                      dir="ltr"
                    />
                  </div>
                  {String(value).replace(/[^\d]/g, '').length > 0 && String(value).replace(/[^\d]/g, '').length < 8 && (
                    <p className="small muted" style={{ margin: 0 }}>
                      أدخل رقم واتساب صحيح من 8 أرقام أو أكثر.
                    </p>
                  )}
                </div>
              )}

              {current.type === 'single' && current.options.map((option) => (
                <button key={option} className={`option ${value === option ? 'selected' : ''}`} onClick={() => updateAnswer(current.id, option)}>
                  {value === option ? <CheckCircle2 size={18} /> : <span style={{ width: 18, height: 18, borderRadius: 99, border: '1px solid #d1d5db', display: 'inline-block' }} />}
                  <span style={{ width: '100%', fontSize: 14 }}>{option}</span>
                </button>
              ))}

              {current.type === 'multi' && (
                <div className="stack-2">
                  <div className="chip-grid">
                    {current.options.map((option) => {
                      const selected = Array.isArray(value) && value.includes(option)
                      return (
                        <button
                          key={option}
                          type="button"
                          className={`chip-option ${selected ? 'selected' : ''}`}
                          onClick={() => toggleMultiOption(current.id, option)}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>

                  {current.maxSelections && (
                    <p className="small muted" style={{ margin: 0 }}>
                      يمكنك اختيار حتى {current.maxSelections} خيارات.
                    </p>
                  )}
                </div>
              )}
            </div>

            {hint && (
              <div style={{ marginTop: 16, borderRadius: 18, padding: 12, background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309' }}>
                <div className="row-between" style={{ justifyContent: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <TriangleAlert size={16} />
                  <strong>ملاحظة</strong>
                </div>
                <div className="small">{hint}</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="grid-2 assessment-actions" style={{ marginTop: 20 }}>
          <Button className="nav-action-btn nav-action-btn-next" disabled={!canContinue} style={{ opacity: canContinue ? 1 : 0.5 }} onClick={() => index === allQuestions.length - 1 ? onFinish() : setIndex((currentIndex) => currentIndex + 1)}>
            {index === allQuestions.length - 1 ? 'عرض النتيجة' : 'التالي'} <ArrowLeft size={18} />
          </Button>
          <Button className="nav-action-btn nav-action-btn-prev" variant="outline" disabled={index === 0} onClick={() => setIndex((currentIndex) => Math.max(0, currentIndex - 1))}>
            <ArrowRight size={18} /> السابق
          </Button>
        </div>
      </CardContent></Card>
    </div>
  )
}
