# WhatsApp Automation Next Steps

## Current Status

Already working:

- Netlify deploy
- Netlify Functions
- Google Sheets write
- lead submission
- report registration endpoint

Already prepared in backend:

- `assessment_submitted` automation event
- `report_registered` automation event
- ready-made Arabic WhatsApp payload in the webhook body

## What the backend sends now

### Event 1: assessment_submitted

Triggered after the final result screen is reached and lead data is saved.

Webhook body shape:

```json
{
  "event": "assessment_submitted",
  "payload": {
    "lead_id": "DBD-20260430-ABC123",
    "phone_whatsapp_full": "+2010XXXXXXX",
    "clinic_name": "Clinic Name",
    "person_name": "Person Name",
    "scores": { "overall": 46 },
    "diagnosis": { "weakestLabel": "التسويق" },
    "recommended_course": {},
    "recommended_bundle": {},
    "recommended_consultation": {},
    "whatsapp": {
      "channel": "whatsapp",
      "type": "text",
      "to": "+2010XXXXXXX",
      "lead_id": "DBD-20260430-ABC123",
      "message_text": "..."
    }
  }
}
```

### Event 2: report_registered

Triggered after a public report URL is available.

Webhook body shape:

```json
{
  "event": "report_registered",
  "payload": {
    "lead_id": "DBD-20260430-ABC123",
    "report_pdf_url": "https://public-report-url.pdf",
    "whatsapp": {
      "channel": "whatsapp",
      "type": "text_with_report_link",
      "to": "+2010XXXXXXX",
      "lead_id": "DBD-20260430-ABC123",
      "report_pdf_url": "https://public-report-url.pdf",
      "message_text": "..."
    }
  }
}
```

## Important Reality

Automatic WhatsApp with a report link requires a public report URL.

Right now the app can generate the PDF locally in the browser, but local download links cannot be sent automatically over WhatsApp.

So to complete the automation, you need one extra piece:

- upload the generated PDF to cloud storage
- get a public URL
- call `/api/report/register`

## Best production setup

Use:

- Google Sheets for CRM
- n8n for automation
- WhatsApp Business Cloud in n8n
- public file storage for the PDF

Suggested PDF storage options:

1. Cloudinary
2. Supabase Storage
3. Google Drive public file workflow

## Suggested n8n workflow

### Workflow A: lead submitted

Trigger:

- Webhook node

Input:

- event = `assessment_submitted`

Flow:

1. Webhook
2. IF `event == assessment_submitted`
3. WhatsApp Business Cloud node
4. Send `payload.whatsapp.message_text` to `payload.whatsapp.to`
5. Optional Google Sheets update

### Workflow B: report ready

Trigger:

- Webhook node

Input:

- event = `report_registered`

Flow:

1. Webhook
2. IF `event == report_registered`
3. WhatsApp Business Cloud node
4. Send `payload.whatsapp.message_text` to `payload.whatsapp.to`
5. Include the report link from `payload.whatsapp.report_pdf_url`
6. Optional Google Sheets update to set `whatsapp_status = sent`

## Environment variable still needed later

When your n8n webhook is ready, add:

```env
AUTOMATION_WEBHOOK_URL=https://your-n8n-webhook-url
```

## Recommended Phase 1

Phase 1 automatic message:

- send summary text immediately after assessment
- send report link after PDF URL is available

This is the simplest and strongest commercial flow.

