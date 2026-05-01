# Netlify + Google Sheets Setup

## Goal

Connect the deployed assessment app on Netlify to:

- Google Sheets
- automation webhook
- later WhatsApp follow-up

## 1. Create the Google Sheet

Create one Google Sheet and add these tabs exactly:

- `Leads`
- `Answers_Raw`
- `Scores_And_Diagnosis`
- `Automation_Log`

Leave row 1 empty if you want the backend to create the headers automatically.

## 2. Create a Google Cloud project

Inside Google Cloud:

1. Create a new project
2. Enable:
   - `Google Sheets API`
3. Go to:
   - `APIs & Services`
   - `Credentials`
4. Create:
   - `Service Account`

## 3. Create service account credentials

After creating the service account:

1. Open the service account
2. Go to `Keys`
3. Create a new `JSON` key
4. Download the JSON file

You will need from this file:

- `client_email`
- `private_key`

## 4. Share the Google Sheet with the service account

Open your Google Sheet and click `Share`.

Share it with:

- the `client_email` from the JSON file

Give it:

- `Editor` access

This step is critical.
Without it, the backend cannot write to the sheet.

## 5. Copy the Google Sheet ID

From the Google Sheet URL:

```text
https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
```

Copy the `SHEET_ID`.

## 6. Add environment variables in Netlify

In Netlify:

1. Open your site
2. Go to `Site configuration`
3. Go to `Environment variables`
4. Add these variables:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_SHEET_LEADS_TAB=Leads
GOOGLE_SHEET_RAW_TAB=Answers_Raw
GOOGLE_SHEET_DIAGNOSIS_TAB=Scores_And_Diagnosis
GOOGLE_SHEET_AUTOMATION_TAB=Automation_Log
AUTOMATION_WEBHOOK_URL=https://your-automation-webhook-url
```

## 7. Redeploy the site

After saving the environment variables:

1. Trigger a new deploy
2. Wait until the deploy completes

## 8. Test backend connectivity

Open this URL:

```text
/api/backend/status
```

Example:

```text
https://assessment.dentalbusinessdevelopment.net/api/backend/status
```

Expected success:

- `success: true`
- `google_sheets.connected: true`

If it fails:

- check that the sheet is shared with the service account
- check `GOOGLE_PRIVATE_KEY`
- check `GOOGLE_SHEET_ID`

## 9. Test lead creation

After backend status succeeds:

1. Open the app
2. Complete one assessment
3. Reach the result page

The frontend will automatically call:

- `/api/assessment/submit`

Then check the Google Sheet:

- `Leads`
- `Answers_Raw`
- `Scores_And_Diagnosis`
- `Automation_Log`

## 10. Automation webhook

`AUTOMATION_WEBHOOK_URL` is optional at first.

If added, the backend will send:

- `assessment_submitted`
- `report_registered`

to your automation layer.

## 11. Suggested next step after Sheets

After Google Sheets works:

1. Connect `AUTOMATION_WEBHOOK_URL` to `n8n`
2. Build WhatsApp follow-up flow
3. Add report upload + `/api/report/register`
