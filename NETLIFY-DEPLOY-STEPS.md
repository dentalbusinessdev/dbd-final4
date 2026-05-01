# Netlify Deploy Steps

## 1. Prepare the project for GitHub

Upload this project to a GitHub repository with these files and folders:

- `src/`
- `public/`
- `netlify/`
- `tools/`
- `package.json`
- `vite.config.js`
- `netlify.toml`
- `server.mjs`
- `.npmrc`
- `.gitignore`
- `GOOGLE-SHEET-BLUEPRINT.md`
- `NETLIFY-GOOGLE-SHEETS-SETUP.md`
- `BACKEND-SETUP.md`
- `outputs/dbd-google-sheets-template.xlsx`

Do not upload:

- `node_modules/`
- `dist/`

## 2. Create a new Netlify project from GitHub

In Netlify:

1. `Add new project`
2. `Import an existing project`
3. Choose `GitHub`
4. Select your repo

## 3. Build settings

Use these exact values:

- `Branch to deploy`: `main`
- `Base directory`: leave empty
- `Build command`: `npm run build`
- `Publish directory`: `dist`
- `Functions directory`: `netlify/functions`

## 4. Environment variables

Add these variables:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=YOUR_REAL_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n
GOOGLE_SHEET_ID=YOUR_GOOGLE_SHEET_ID
GOOGLE_SHEET_LEADS_TAB=Leads
GOOGLE_SHEET_RAW_TAB=Answers_Raw
GOOGLE_SHEET_DIAGNOSIS_TAB=Scores_And_Diagnosis
GOOGLE_SHEET_AUTOMATION_TAB=Automation_Log
```

Optional later:

```env
AUTOMATION_WEBHOOK_URL=
```

## 5. Deploy

Click `Deploy`.

After deploy succeeds, open:

```text
https://YOUR-SITE.netlify.app/api/backend/status
```

Expected:

- `success: true`
- `google_sheets.connected: true`

## 6. Test one lead

1. Open the live site
2. Complete one assessment
3. Reach the final result screen

The app should automatically call:

```text
POST /api/assessment/submit
```

Then verify rows were added to:

- `Leads`
- `Answers_Raw`
- `Scores_And_Diagnosis`
- `Automation_Log`

## 7. Connect the custom subdomain

In Netlify:

1. Open `Domain management`
2. Add custom domain:
   - `assessment.dentalbusinessdevelopment.net`

Netlify will give you a DNS target.

In Hostinger DNS:

1. Add a `CNAME`
2. Host: `assessment`
3. Value/Target: your Netlify target

Wait for SSL provisioning.

