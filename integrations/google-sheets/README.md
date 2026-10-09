# Google Sheets enquiry storage

Website layout, HTML and CSS are unchanged. Both forms POST to `/api/leads`.
The Vercel function validates details and forwards them privately to Apps Script.
Success is returned only after Google confirms the row was saved. Failed requests
keep the form filled and retain the existing retry/WhatsApp options.

## One-time activation

1. Open [Student Enquiries](https://docs.google.com/spreadsheets/d/17lDzT0uOyIsGEQlP3I5fYjYPQLcZG6cUdNfNxXmcgSM/edit).
2. Choose **Extensions > Apps Script**. Replace the starter code with the full
   contents of [Code.gs](./Code.gs), then save.
3. Select **setup** in the function menu, click **Run**, and authorize Google access.
   Copy the generated `GOOGLE_SHEETS_SECRET` value from the execution log directly
   into Vercel > skillence-form > Settings > Environment Variables, for Production.
   Keep this value private; do not commit it or share it in chat.
4. Choose **Deploy > New deployment > Web app**, **Execute as: Me**,
   **Who has access: Anyone**, then Deploy. This publishes the write endpoint;
   the spreadsheet itself stays private and the endpoint requires the secret.
5. Add the copied `/exec` URL in Vercel as `GOOGLE_SHEETS_WEBHOOK_URL` (Production).
6. Redeploy the latest production commit so the two variables take effect.
7. Submit a clearly labelled test enquiry through the website. Confirm the success
   message AND the new row in `Enquiries`. Test the popup and home forms separately.

Google setup documentation: https://developers.google.com/apps-script/guides/web

## Behavior and limits

- Columns: Received At (IST), Student Name, Mobile, Email, Course, Message,
  Status (`New`), Source, Submission ID.
- The received timestamp is written by Google, with the sheet timezone set to India.
- Mobile numbers stay text. Formula-like input is escaped.
- Retries of unchanged details within the current page reuse a submission ID.
  Apps Script serializes writes with a lock and suppresses duplicate IDs.
  Reloading the page creates a new ID; this is not cross-session deduplication.
- Google errors/timeouts or missing configuration never report success.
- Do not rename/reorder the headers. You can edit Status and append your own columns
  to the right. Existing historical data is not imported automatically.
- Public forms can receive spam; origin checks are not bot protection. Apps Script
  quotas apply. For higher traffic, add verified CAPTCHA and durable rate limiting.
- Apps Script edits require **Deploy > Manage deployments > Edit > New version**.
- Never put the shared secret in browser JavaScript or the public repository.
- Test the API locally with `node --test tests/leads.test.js`.

Activation is incomplete until the script is deployed, both Vercel variables are
set, production is redeployed, and a test row is verified in the sheet.
