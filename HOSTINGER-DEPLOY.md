# Hostinger Deployment Guide

## Project mode

This app is now ready to run on Hostinger as a **Node.js application**.

It includes:

- React frontend build
- Node server in `server.mjs`
- backend APIs:
  - `/api/assessment/submit`
  - `/api/report/register`
  - `/api/webhooks/whatsapp-status`

## Before you deploy

You need:

1. A Hostinger hosting plan that supports Node.js apps
2. A Google Sheet with these tabs:
   - `Leads`
   - `Answers_Raw`
   - `Scores_And_Diagnosis`
   - `Automation_Log`
3. A Google service account with Sheets access
4. Optional automation webhook from `n8n` or `Make`

## Build/start settings on Hostinger

Use these values:

- **Build command:** `npm run build`
- **Start command:** `npm start`
- **Node version:** latest supported stable version
- **App root:** project root

## Environment variables

Add these in Hostinger app settings:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`
- `GOOGLE_SHEET_LEADS_TAB`
- `GOOGLE_SHEET_RAW_TAB`
- `GOOGLE_SHEET_DIAGNOSIS_TAB`
- `GOOGLE_SHEET_AUTOMATION_TAB`
- `AUTOMATION_WEBHOOK_URL`
- `PORT`

Use `.env.hostinger.example` as your reference.

## Upload methods

### Option 1: GitHub

Recommended.

1. Push this project to GitHub
2. In Hostinger hPanel, create a Node.js app
3. Connect the Git repository
4. Set the build/start commands
5. Add environment variables
6. Deploy

### Option 2: ZIP upload

1. Upload the project files
2. Make sure `package.json` and `server.mjs` are in the root
3. Run install/build from Hostinger
4. Start the app with `npm start`

## Domain/subdomain

After deploy:

1. Create/connect the subdomain:
   - `assessment.dentalbusinessdevelopment.net`
2. Point it to the deployed Node.js app from inside Hostinger
3. Wait for SSL provisioning

## Health check

After deployment, test:

- `/health`

Expected response:

```json
{"ok":true}
```

## Notes

- This is no longer dependent on Netlify for production hosting
- Netlify files still exist, but Hostinger should use `server.mjs`
- The frontend auto-submits assessment leads to the backend when the user reaches the result page
