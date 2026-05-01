# Google Sheet Blueprint

This blueprint gives you a production-friendly Google Sheets structure for the DBD Assessment App.

## Final Recommended Tabs

Create these 5 business tabs:

1. `Leads`
2. `Answers_Raw`
3. `Scores_And_Diagnosis`
4. `Automation_Log`
5. `Sales_Notes`

Important:

- The backend currently writes automatically to the first 4 tabs.
- `Sales_Notes` is for your team to use manually.
- `report_pdf_url` is supported in the backend, but it is **not populated automatically yet** because the app does not upload the PDF to public storage yet.

## Recommended Extra Reference Tabs

These are optional helper tabs:

6. `Question_Bank`
7. `Countries_Cities`
8. `Lookup_Statuses`
9. `Manual_WhatsApp`

## Tab 1: Leads

Use this tab as the CRM-facing summary. One row per lead.

Headers:

```text
lead_id,created_at_utc,created_at_cairo,source,app_version,clinic_name,person_name,person_role_display,person_role_json,country,city,city_is_custom,phone_country_code,phone_number,phone_whatsapp_full,clinic_type,clinic_years,chairs,services_display,services_json,primary_challenge_display,primary_challenge_json,marketing_plan,lead_source,marketing_roi,scheduling,no_show,kpis,monthly_revenue,budget,fin_challenge,case_acceptance,installments,insurance_model,gulf_pricing_mix,team_size,delegation_layer,vision,leadership,feedback,loyalty,notes,marketing_score,operations_score,finance_score,team_score,patient_score,overall_score,weakest_key,weakest_label,diagnosis_explanation,support_recommendation_title,support_recommendation_body,recommended_course_id,recommended_course_title,recommended_bundle_id,recommended_bundle_title,recommended_consultation_id,recommended_consultation_title,report_pdf_url,report_status,whatsapp_status,first_followup_status,sales_status,owner,last_contact_at,next_followup_at,tags,internal_notes
```

Purpose of important groups:

- Identity and contact: `clinic_name`, `person_name`, `person_role_*`, `country`, `city`, `phone_*`
- Business profile: `clinic_type`, `clinic_years`, `chairs`, `services_*`, `primary_challenge_*`
- Operational answers summary: `marketing_plan` through `notes`
- Computed diagnosis: `marketing_score` through `overall_score`, `weakest_*`
- Commercial recommendations: `support_recommendation_*`, `recommended_*`
- Sales follow-up: `report_status`, `whatsapp_status`, `sales_status`, `owner`, `next_followup_at`

## Tab 2: Answers_Raw

Use this tab for exact stored answers from the user.

Headers:

```text
lead_id,submitted_at,clinic_name,person_name,person_role,country,city,phone_country_code,phone_number,clinic_type,clinic_years,chairs,services,primary_challenge,marketing_plan,lead_source,marketing_roi,scheduling,no_show,kpis,monthly_revenue,budget,fin_challenge,case_acceptance,installments,insurance_model,gulf_pricing_mix,team_size,delegation_layer,vision,leadership,feedback,loyalty,notes,raw_payload_json
```

Notes:

- Multi-select values are stored as JSON strings:
  - `person_role`
  - `services`
  - `primary_challenge`
- `raw_payload_json` keeps the full original payload for debugging and audit.

## Tab 3: Scores_And_Diagnosis

Use this tab for the server-side analysis output.

Headers:

```text
lead_id,marketing_score,operations_score,finance_score,team_score,patient_score,overall_score,weakest_key,weakest_label,diagnosis_explanation,clinic_context_notes_json,execution_plan_json,free_action_plan_json,support_recommendation_title,support_recommendation_body,recommended_course_json,recommended_bundle_json,recommended_consultation_json
```

Use cases:

- dashboard charts
- filtering by weakest area
- tracking recommendation quality
- feeding n8n / WhatsApp logic

## Tab 4: Automation_Log

Use this tab to track system and automation events.

Headers:

```text
log_id,lead_id,event_type,channel,template_name,payload_json,status,provider_message_id,created_at,sent_at,error_message
```

Suggested event types:

- `assessment_submitted`
- `report_registered`
- `whatsapp_initial_sent`
- `whatsapp_report_sent`
- `whatsapp_followup_day_1`
- `whatsapp_followup_day_3`
- `whatsapp_followup_day_7`

Suggested statuses:

- `created`
- `queued`
- `sent`
- `delivered`
- `read`
- `failed`

## Tab 5: Sales_Notes

Use this tab for manual sales follow-up.

Suggested headers:

```text
note_id,lead_id,sales_rep,status_before,status_after,note,created_at
```

Typical use:

- call notes
- WhatsApp follow-up summary
- who handled the lead
- sales stage change

## Tab 6: Question_Bank

This is the most useful tab for your team. It documents every assessment field and all possible answers.

Suggested headers:

```text
section,question_id,question_label_ar,input_type,required,multi_select,max_selections,conditional_rule,stores_as,allowed_values_ar,notes
```

I generated a ready-to-paste CSV file for this tab here:

[google-sheet-question-bank.csv](C:\Users\omare\Desktop\chat%20gpt\version%202\dbd-app-final-updated\dbd-app\google-sheet-question-bank.csv)

## Tab 7: Countries_Cities

Optional but useful for operations and QA.

Suggested headers:

```text
country,dial_code,is_gulf,city
```

Use this for:

- validating imported data
- reviewing custom city entries
- later connecting to dropdown dashboards

## Tab 8: Lookup_Statuses

Optional reference tab for sales and automation.

Suggested headers:

```text
group_name,key,label
```

Recommended groups:

- `report_status`
- `whatsapp_status`
- `sales_status`
- `event_type`

Suggested values:

- `report_status`: `pending`, `ready`, `failed`
- `whatsapp_status`: `queued`, `sent`, `delivered`, `read`, `failed`
- `sales_status`: `new`, `contacted`, `interested_course`, `interested_bundle`, `interested_consultation`, `won`, `lost`, `no_response`

## Tab 9: Manual_WhatsApp

Use this tab for manual WhatsApp follow-up from inside the sheet itself.

Suggested headers:

```text
lead_id,clinic_name,person_name,phone_whatsapp_full,overall_score,weakest_label,recommended_course_title,recommended_bundle_title,recommended_consultation_title,report_pdf_url,message_1,send_1,message_2,send_2,message_3,send_3
```

What this tab does:

- pulls the latest lead data from `Leads`
- creates 3 ready-made WhatsApp messages
- creates 3 `Click to Send` links using `wa.me`
- includes `report_pdf_url` whenever it exists

Important:

- this is a **manual** sending helper
- if `report_pdf_url` is empty, the messages still work but without a report link
- to make the report link appear automatically, you later need to upload the PDF to public storage and call `/api/report/register`

## Assessment Field Rules

### Always required

- `clinic_name`
- `person_name`
- `person_role`
- `country`
- `city`
- `phone_number`
- `clinic_type`
- `clinic_years`
- `chairs`
- `services`
- `primary_challenge`
- `marketing_plan`
- `lead_source`
- `marketing_roi`
- `scheduling`
- `no_show`
- `kpis`
- `monthly_revenue`
- `budget`
- `fin_challenge`
- `case_acceptance`
- `installments`
- `team_size`
- `vision`
- `leadership`
- `feedback`
- `loyalty`

### Conditionally required

- `insurance_model`
  Required only when `country` is one of the Gulf countries:
  `السعودية`, `الإمارات`, `قطر`, `الكويت`, `البحرين`, `عمان`
- `gulf_pricing_mix`
  Same Gulf-only rule
- `delegation_layer`
  Required only when `chairs` is `4–6` or `7+`

### Optional

- `notes`

## Data Storage Notes

- Use `person_role_display` for easy reading by humans.
- Use `person_role_json` for exact structured values.
- Use `services_display` and `primary_challenge_display` for sales visibility.
- Use the JSON fields for automation and analytics.
- Use `city_is_custom` to identify manually typed cities.

## Best Practical Setup

If you want the cleanest working CRM:

- backend writes only to the 4 required tabs
- your team reads mostly from `Leads`
- `Question_Bank` is documentation
- `Lookup_Statuses` is for consistency
- `Countries_Cities` helps with QA and reporting
