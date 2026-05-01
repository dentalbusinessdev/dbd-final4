# DBD Frontend Production-Ready Plan

## What was done

- Split the old monolithic `src/DBDApp.jsx` into clear modules:
  - `src/components/`
  - `src/data/`
  - `src/lib/`
  - `src/screens/`
- Moved static business content out of the app shell:
  - countries, cities, and assessment config
  - courses, consultation, and articles
- Moved pure business logic out of UI files:
  - assessment scoring
  - dynamic question visibility
  - report diagnosis and recommendation logic
- Separated the heavy report screen from the light content screens.
- Added lazy loading for screens so the app does not load all views upfront.
- Optimized the Vite build with chunk splitting for:
  - charts
  - icons
  - motion
  - PDF generation
  - canvas export

## Current architecture

- `src/DBDApp.jsx`
  - app shell
  - tab routing
  - lazy screen loading
- `src/data/assessment.js`
  - form configuration
  - countries and cities
  - static options
- `src/data/content.js`
  - articles
  - courses
  - consultation offers
- `src/lib/assessment.js`
  - answer helpers
  - section builder
  - score engine
- `src/lib/report.js`
  - diagnosis
  - action plans
  - offer matching
  - support recommendation
- `src/screens/`
  - onboarding
  - home
  - assessment
  - dashboard
  - courses
  - insights
  - result

## Why this is better

- Easier to maintain and safer to edit.
- Frontend logic is now reusable for backend validation later.
- The report screen is isolated, which makes future API integration easier.
- Bundle loading is now more production-friendly.
- The codebase is ready for adding:
  - API layer
  - analytics
  - persistence
  - automation hooks

## Next backend integration steps

### Phase 1: Data capture

- Create one backend endpoint:
  - `POST /api/assessments`
- Save:
  - clinic info
  - contact info
  - answers
  - computed score snapshot
  - generated report metadata
- Also append the same payload to your Excel/Google Sheet automation layer.

### Phase 2: Report workflow

- On assessment submit:
  1. save payload
  2. generate report record
  3. queue WhatsApp delivery job
  4. optionally email internal team copy

### Phase 3: Automation

- Trigger automation after successful submission:
  - generate final PDF
  - upload file to storage
  - send WhatsApp message with file or report link
- Recommended queue/event names:
  - `assessment.completed`
  - `report.generated`
  - `whatsapp.delivery.requested`

## Recommended backend payload shape

```json
{
  "clinic": {
    "name": "string",
    "type": "string",
    "country": "string",
    "city": "string",
    "yearsOperating": "string",
    "chairs": "string"
  },
  "contact": {
    "name": "string",
    "roles": ["string"],
    "phoneCountryCode": "string",
    "phoneNumber": "string"
  },
  "assessment": {
    "answers": {},
    "scores": {
      "marketing": 0,
      "operations": 0,
      "finance": 0,
      "team": 0,
      "patient": 0,
      "overall": 0
    }
  },
  "meta": {
    "submittedAt": "ISO date",
    "source": "web",
    "version": "frontend-v1"
  }
}
```

## Before launch checklist

- Add frontend form validation for:
  - required text fields
  - phone formatting
  - max 3 challenge selections
- Add error boundary around lazy screens.
- Add submission loading state and submit lock.
- Add success/failure state after sending assessment data.
- Add environment-based API config.
- Add analytics events:
  - onboarding completed
  - assessment started
  - assessment completed
  - PDF downloaded
  - WhatsApp share clicked
- Add tests for:
  - scoring logic
  - dynamic Gulf questions
  - team-size question branching
  - city custom entry flow

## Suggested next coding tasks

1. Add `src/lib/api.js` for backend communication.
2. Add `src/lib/validation.js` for centralized validation.
3. Add `src/context/AppContext.jsx` or a small store if state grows.
4. Add unit tests for `scoreAssessment` and `buildAssessmentSections`.
5. Connect final submission to sheet automation and WhatsApp workflow.
