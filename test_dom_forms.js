const fs = require('fs');
const { JSDOM } = require('jsdom');

async function testFormsInDOM() {
  console.log('========================================================');
  console.log(' VERIFYING FORMS IN PRODUCTION DOM (JSDOM ENVIRONMENT) ');
  console.log('========================================================\n');

  const html = fs.readFileSync('./index.html', 'utf8');
  const js = fs.readFileSync('./main.js', 'utf8');

  let passed = 0;
  let failed = 0;
  function assert(cond, msg) {
    if (cond) {
      console.log('  ✅ PASS:', msg);
      passed++;
    } else {
      console.error('  ❌ FAIL:', msg);
      failed++;
    }
  }

  // Set up mock window and document
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost:8080/'
  });

  const { window } = dom;
  const { document } = window;

  // Mock global fetch for lead submission
  let lastFetchCall = null;
  window.fetch = async (url, options) => {
    lastFetchCall = { url, options, body: JSON.parse(options.body) };
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: 'Lead saved successfully' })
    };
  };

  // Mock IntersectionObserver
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Execute production main.js in DOM
  const scriptEl = document.createElement('script');
  scriptEl.textContent = js;
  document.body.appendChild(scriptEl);

  // Allow DOMContentLoaded
  document.dispatchEvent(new window.Event('DOMContentLoaded'));

  console.log('\n--- 1. Testing Hero Admission Form ---');
  const heroPhone = document.getElementById('enquiry-phone');
  const heroName = document.getElementById('enquiry-name');
  const heroCourse = document.getElementById('enquiry-course');
  const heroForm = document.getElementById('admissions-enquiry-form');
  const heroPhoneErr = document.getElementById('error-enquiry-phone');

  assert(Boolean(heroPhone), 'Hero phone element exists');
  assert(heroPhone.getAttribute('type') === 'tel', 'Hero phone has type="tel"');
  assert(heroPhone.getAttribute('inputmode') === 'numeric', 'Hero phone has inputmode="numeric"');
  assert(heroPhone.getAttribute('maxlength') === '10', 'Hero phone has maxlength="10"');
  assert(heroPhone.getAttribute('placeholder') === 'Enter 10-digit mobile number', 'Hero phone has exact placeholder');
  assert(heroPhone.hasAttribute('required'), 'Hero phone has required attribute');

  // Test Non-digit stripping
  heroPhone.value = 'abc!@#';
  heroPhone.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert(heroPhone.value === '', 'Non-digits completely stripped on input');

  // Test extra digits limit to 10
  heroPhone.value = '9876543210999';
  heroPhone.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert(heroPhone.value === '9876543210', 'Phone number strictly capped at 10 digits on typing/input');

  // Test Paste handling
  const pasteEvent = new window.Event('paste', { bubbles: true });
  pasteEvent.clipboardData = {
    getData: () => '+91 (906) 082-8274 ext 99'
  };
  heroPhone.value = '';
  heroPhone.dispatchEvent(pasteEvent);
  assert(heroPhone.value === '9190608282', 'Pasted input stripped to only digits and capped at 10');

  // Test Invalid submission (<10 digits)
  heroName.value = 'Jane Doe';
  heroCourse.value = 'ADCA+ with AI';
  heroPhone.value = '98765'; // 5 digits
  lastFetchCall = null;
  heroForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  assert(heroPhoneErr.textContent === 'Please enter a valid 10-digit mobile number.', 'Hero error shown on <10 digits: "Please enter a valid 10-digit mobile number."');
  assert(lastFetchCall === null, 'Form submission blocked when phone is not 10 digits');

  // Test Valid 10-digit submission
  heroPhone.value = '9060828274';
  heroForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  // Wait a tick for async submit
  await new Promise(r => setTimeout(r, 100));
  assert(lastFetchCall !== null, 'Form submitted when phone is exactly 10 digits');
  assert(lastFetchCall.body.phone === '9060828274', 'Phone number sent as string in payload');
  assert(typeof lastFetchCall.body.phone === 'string', 'Phone payload type is string');

  console.log('\n--- 2. Testing Modal Popup Admission Form ---');
  const popupPhone = document.getElementById('popup-enquiry-phone');
  const popupName = document.getElementById('popup-enquiry-name');
  const popupCourse = document.getElementById('popup-enquiry-course');
  const popupForm = document.getElementById('popup-admission-form');
  const popupPhoneErr = document.getElementById('error-popup-phone');

  assert(Boolean(popupPhone), 'Popup phone element exists');
  assert(popupPhone.getAttribute('type') === 'tel', 'Popup phone has type="tel"');
  assert(popupPhone.getAttribute('inputmode') === 'numeric', 'Popup phone has inputmode="numeric"');
  assert(popupPhone.getAttribute('maxlength') === '10', 'Popup phone has maxlength="10"');
  assert(popupPhone.getAttribute('placeholder') === 'Enter 10-digit mobile number', 'Popup phone has exact placeholder');
  assert(popupPhone.hasAttribute('required'), 'Popup phone has required attribute');

  // Test Non-digit stripping on popup
  popupPhone.value = 'hello 123 world 456';
  popupPhone.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert(popupPhone.value === '123456', 'Popup phone strips non-digits');

  // Test Invalid submission (<10 digits) on popup
  popupName.value = 'Alex Morgan';
  popupCourse.value = 'Tally with GST';
  popupPhone.value = '123456789'; // 9 digits
  lastFetchCall = null;
  popupForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  assert(popupPhoneErr.textContent === 'Please enter a valid 10-digit mobile number.', 'Popup error shown on <10 digits: "Please enter a valid 10-digit mobile number."');
  assert(lastFetchCall === null, 'Popup submission blocked when phone is not 10 digits');

  // Test Valid 10-digit submission on popup
  popupPhone.value = '9876543210';
  popupForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 100));
  assert(lastFetchCall !== null, 'Popup form submitted when phone is exactly 10 digits');
  assert(lastFetchCall.body.phone === '9876543210', 'Popup phone sent as string in payload');
  assert(typeof lastFetchCall.body.phone === 'string', 'Popup phone payload type is string');

  console.log('\n========================================================');
  console.log(` DOM TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

testFormsInDOM().catch(e => {
  console.error('DOM Test Error:', e);
  process.exit(1);
});
