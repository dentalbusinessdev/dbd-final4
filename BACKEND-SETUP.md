# DBD Backend Setup

## What is implemented

- `POST /api/assessment/submit`
- `POST /api/report/register`
- `POST /api/webhooks/whatsapp-status`
- `GET /api/backend/status`
- Netlify Functions scaffold
- Hostinger-compatible Node server in `server.mjs`
- Google Sheets append/update layer
- Server-side validation
- Server-side score recomputation
- Lead + raw answers + diagnosis logging
- Automation webhook trigger point

## Required environment variables

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
GOOGLE_SHEET_LEADS_TAB=Leads
GOOGLE_SHEET_RAW_TAB=Answers_Raw
GOOGLE_SHEET_DIAGNOSIS_TAB=Scores_And_Diagnosis
GOOGLE_SHEET_AUTOMATION_TAB=Automation_Log
AUTOMATION_WEBHOOK_URL=
PORT=3000
```

## Google Sheet tabs

- `Leads`
- `Answers_Raw`
- `Scores_And_Diagnosis`
- `Automation_Log`

The backend auto-creates header rows if the sheet tabs already exist and row 1 is empty.

## Hostinger deployment mode

This project can now run on Hostinger as a Node.js app:

- build command: `npm run build`
- start command: `npm start`
- application root: project root

The Node app:
- serves `dist`
- exposes the same API routes used by the frontend
- supports SPA fallback for React routes

## Netlify compatibility

Netlify Functions still remain in the project.
If you deploy on Netlify, they can still be used.
If you deploy on Hostinger, use `server.mjs`.

## Important deployment note

Plain static upload is not enough if you want:
- Google Sheets submission
- follow-up automation
- WhatsApp workflow

For the full sales machine, deploy it as a real Node.js app.

## Recommended next implementation steps

1. Create the Google Sheet with the four tabs above.
2. Add Hostinger or Netlify environment variables.
3. Connect `AUTOMATION_WEBHOOK_URL` to `n8n` or `Make`.
4. Add PDF upload/storage and call `POST /api/report/register`.
5. Add WhatsApp template flow in automation.

## Quick verification endpoint

After adding environment variables and redeploying, verify:

- `GET /api/backend/status`

It checks:
- env variable presence
- Google Sheets accessibility
- whether each expected tab is reachable
