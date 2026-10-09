// Paste into Extensions > Apps Script in the prepared Google Sheet.
const SPREADSHEET_ID = '17lDzT0uOyIsGEQlP3I5fYjYPQLcZG6cUdNfNxXmcgSM';
const TAB_NAME = 'Enquiries';
const HEADERS = ['Received At (IST)', 'Student Name', 'Mobile', 'Email', 'Course', 'Message', 'Status', 'Source', 'Submission ID'];

// Run once and approve Google access. Copy the secret from the execution log
// into Vercel's GOOGLE_SHEETS_SECRET environment variable, never into GitHub.
function setup() {
  const book = SpreadsheetApp.openById(SPREADSHEET_ID);
  book.setSpreadsheetTimeZone('Asia/Kolkata');
  const sheet = book.getSheetByName(TAB_NAME);
  if (!sheet || JSON.stringify(sheet.getRange(1, 1, 1, 9).getValues()[0]) !== JSON.stringify(HEADERS)) {
    throw new Error('Expected Enquiries sheet and headers are missing.');
  }
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('INTEGRATION_SECRET')) {
    props.setProperty('INTEGRATION_SECRET', Utilities.getUuid() + Utilities.getUuid());
  }
  console.log('GOOGLE_SHEETS_SECRET: ' + props.getProperty('INTEGRATION_SECRET'));
}

function jsonOutput(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

// Store user text literally, including spreadsheet formula prefixes.
function literal(value) {
  const text = String(value || '');
  return /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
}

function doPost(e) {
  let lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 12000) throw new Error();
    const data = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('INTEGRATION_SECRET');
    if (!secret || data.secret !== secret) return jsonOutput({ success: false });
    const limits = { name: 120, phone: 10, email: 254, course: 80, message: 2000 };
    Object.keys(limits).forEach(function (key) {
      if (typeof data[key] !== 'string' || data[key].length > limits[key]) throw new Error();
    });
    if (data.name.trim().length < 2 || !/^\d{10}$/.test(data.phone) ||
        !['ADCA+ with AI', 'Tally with GST', 'Video Editing', 'CSC Advance'].includes(data.course) ||
        (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) ||
        typeof data.submissionId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(data.submissionId)) throw new Error();
    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TAB_NAME);
    if (!sheet || JSON.stringify(sheet.getRange(1, 1, 1, 9).getValues()[0]) !== JSON.stringify(HEADERS)) throw new Error();
    const lastRow = sheet.getLastRow();
    const existing = lastRow > 1 && sheet.getRange(2, 9, lastRow - 1, 1)
      .createTextFinder(data.submissionId).matchEntireCell(true).useRegularExpression(false).findNext();
    if (!existing) {
      const row = lastRow + 1;
      // Explicit text formatting preserves phone numbers and prevents formula execution.
      sheet.getRange(row, 2, 1, 8).setNumberFormat('@');
      sheet.getRange(row, 1).setNumberFormat('dd/mm/yyyy hh:mm:ss');
      const date = new Date();
      sheet.getRange(row, 1, 1, 9).setValues([[
        date, literal(data.name), data.phone, literal(data.email), data.course,
        literal(data.message), 'New', 'Skillence Form Website', data.submissionId
      ]]);
      SpreadsheetApp.flush();
    }
    return jsonOutput({ success: true, submissionId: data.submissionId });
  } catch (_) {
    return jsonOutput({ success: false });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
