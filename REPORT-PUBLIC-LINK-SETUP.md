# Public Report Link Setup with Cloudflare R2

This project now supports:

1. Generating the PDF report in the browser
2. Downloading it for the user
3. Uploading the same file to Cloudflare R2
4. Saving the public report URL to Google Sheets through `/api/report/register`

## Final flow

When the user clicks `تنزيل التقرير PDF`:

1. the PDF is generated locally
2. the PDF downloads locally
3. the frontend requests a presigned upload URL from Netlify
4. the PDF is uploaded to R2
5. the public URL is sent to `/api/report/register`
6. the backend writes the URL to `Leads.report_pdf_url`

That URL can then be used in:

- `Manual_WhatsApp`
- future n8n automation
- manual follow-up

## 1. Cloudflare R2 values you already chose

- Bucket name: `dbd-reports`
- Access mode: `r2.dev`

## 2. What you need from Cloudflare

From Cloudflare R2, collect these values:

- `Account ID`
- `R2 Access Key ID`
- `R2 Secret Access Key`
- `Public base URL`

Examples:

```text
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=dbd-reports
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_PUBLIC_BASE_URL=https://pub-xxxxxxxxxxxxxxxxxxxxxxxx.r2.dev
```

## 3. CORS on the bucket

In your R2 bucket settings, add a CORS policy like this:

```json
[
  {
    "AllowedOrigins": [
      "https://assessmentdbd.netlify.app",
      "https://assessment.dentalbusinessdevelopment.net"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

If you test locally, also add:

```json
"http://localhost:4173"
```

## 4. Netlify environment variables

Add these in Netlify:

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_BUCKET_NAME=dbd-reports
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_PUBLIC_BASE_URL=https://your-public-r2-url
VITE_R2_PUBLIC_BASE_URL=https://your-public-r2-url
```

Notes:

- `R2_*` variables are used by Netlify Functions
- `VITE_R2_PUBLIC_BASE_URL` is used by the frontend only to know upload is configured
- both public URL values should be the same

## 5. Deploy after adding variables

After adding them:

1. open Netlify
2. go to `Deploys`
3. click `Trigger deploy`
4. click `Clear cache and deploy site`

## 6. How to verify

### Check A

Complete one assessment and click `تنزيل التقرير PDF`.

If setup is correct:

- the PDF downloads
- the app shows success
- a new card appears with `رابط التقرير العام`

### Check B

Open Google Sheet `Leads` tab and confirm:

- `report_pdf_url` is filled

### Check C

Open `Manual_WhatsApp` and confirm:

- the messages now include the report link

## 7. Related files

- `src/lib/pdfReport.js`
- `src/lib/reportStorage.js`
- `src/lib/backendClient.js`
- `src/screens/ResultScreen.jsx`
- `netlify/functions/report-upload-url.mjs`
- `netlify/functions/report-register.mjs`
