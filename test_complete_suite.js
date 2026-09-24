const http = require('http');
const fs = require('fs');

async function runTests() {
  console.log('========================================================');
  console.log(' RUNNING COMPREHENSIVE SKILLENCE ACADEMY VERIFICATION  ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Test 1: Fetch HTML from server
  try {
    const htmlRes = await fetch('http://localhost:8080/');
    assert(htmlRes.status === 200, 'Server responds with status 200 for /');
    const htmlText = await htmlRes.text();
    assert(htmlText.includes('STUDENT WORK &amp; ASSIGNMENT SAMPLES') || htmlText.includes('STUDENT WORK & ASSIGNMENT SAMPLES'), 'HTML contains Student Work section header');
  } catch (err) {
    assert(false, `Server HTTP request failed: ${err.message}`);
  }

  // Test 2: Fetch media manifest
  try {
    const manifestRes = await fetch('http://localhost:8080/media-manifest.json');
    assert(manifestRes.status === 200, 'Server serves media-manifest.json with status 200');
    const manifest = await manifestRes.json();
    assert(Array.isArray(manifest.aiProductive) && manifest.aiProductive.length === 6, `AI Productive playlist has 6 videos (found ${manifest.aiProductive?.length})`);
    assert(Array.isArray(manifest.aiVideos) && manifest.aiVideos.length === 2, `AI Videos playlist has 2 videos (found ${manifest.aiVideos?.length})`);
    assert(Array.isArray(manifest.sampleProjects) && manifest.sampleProjects.length === 5, `Sample Projects has 5 rotating gallery items (found ${manifest.sampleProjects?.length})`);
  } catch (err) {
    assert(false, `Media manifest test failed: ${err.message}`);
  }

  // Test 3: HTTP Range Video Streaming
  try {
    const rangeRes = await fetch('http://localhost:8080/ai%20productive/bag.mp4', {
      headers: { 'Range': 'bytes=0-1023' }
    });
    assert(rangeRes.status === 206, `Video HTTP Range request returns 206 Partial Content (got ${rangeRes.status})`);
    assert(rangeRes.headers.get('content-range') && rangeRes.headers.get('content-range').startsWith('bytes 0-1023/'), `Content-Range header correct (${rangeRes.headers.get('content-range')})`);
  } catch (err) {
    assert(false, `HTTP Range test failed: ${err.message}`);
  }

  // Test 4: Leads API Submission
  try {
    const testLead = {
      name: 'Verification Lead',
      phone: '9060828274',
      course: 'Tally with GST',
      email: 'lead@skillence.test',
      message: 'Comprehensive verification test enquiry'
    };
    const leadRes = await fetch('http://localhost:8080/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testLead)
    });
    assert(leadRes.status === 200, `POST /api/leads returns status 200 (got ${leadRes.status})`);
    const leadJson = await leadRes.json();
    assert(leadJson.success === true, `POST /api/leads response success is true (${JSON.stringify(leadJson)})`);

    // Verify lead stored in leads.json
    const rawLeads = fs.readFileSync('./leads.json', 'utf8').replace(/^\uFEFF/, '');
    const leadsOnDisk = JSON.parse(rawLeads);
    const matched = Array.isArray(leadsOnDisk) && leadsOnDisk.some(l => l.name === 'Verification Lead' && l.course === 'Tally with GST');
    assert(matched, 'Submitted lead is persisted in leads.json with all fields');
  } catch (err) {
    assert(false, `Leads API test failed: ${err.message}`);
  }

  // Test 5: Verify index.html requirements
  const html = fs.readFileSync('./index.html', 'utf8');

  // Exact Media Card Titles
  assert(html.includes('AI Productive'), 'HTML includes title "AI Productive"');
  assert(html.includes('AI Videos'), 'HTML includes title "AI Videos"');
  assert(html.includes('Sample Projects'), 'HTML includes title "Sample Projects"');

  // Video popup modal & Admission Enquiry modal
  assert(html.includes('id="video-player-modal"'), 'HTML contains Video Player modal (#video-player-modal)');
  assert(html.includes('id="modal-video-element"'), 'HTML contains modal video element (#modal-video-element)');
  assert(html.includes('id="admission-enquiry-modal"'), 'HTML contains shared Admission Enquiry modal (#admission-enquiry-modal)');
  assert(html.includes('id="popup-admission-form"'), 'HTML contains popup admission form (#popup-admission-form)');

  // Form Fields in Admission Enquiry Modal
  assert(html.includes('id="popup-enquiry-name"'), 'Modal contains Full Name field');
  assert(html.includes('id="popup-enquiry-phone"'), 'Modal contains Mobile Number field');
  assert(html.includes('id="popup-enquiry-email"'), 'Modal contains Email field');
  assert(html.includes('id="popup-enquiry-course"'), 'Modal contains Course field');
  assert(html.includes('id="popup-enquiry-message"'), 'Modal contains Message field');
  assert(html.includes('id="popup-submit-btn"'), 'Modal contains Submit button');

  // Course Options
  const courseOptions = ['ADCA+ with AI', 'Tally with GST', 'Video Editing', 'CSC Advance'];
  courseOptions.forEach(opt => {
    assert(html.includes(`<option value="${opt}">${opt}</option>`), `Modal course select contains option "${opt}"`);
  });

  // Verify All 4 Contact Buttons in Order
  const ctaSectionMatch = html.match(/<div class="cta-buttons-row">([\s\S]*?)<\/div>/);
  if (ctaSectionMatch) {
    const ctaHtml = ctaSectionMatch[1];
    const callIdx = ctaHtml.indexOf('tel:+919060828274');
    const waIdx = ctaHtml.indexOf('https://wa.me/919060828274');
    const instaIdx = ctaHtml.indexOf('https://www.instagram.com/skillence1?stkn=MTM0b3E3dnlkZzF3aw==');
    const ytIdx = ctaHtml.indexOf('https://youtube.com/@skillence1?si=Eb8UMnWVQGnXLkxM');

    assert(callIdx !== -1, 'Call Now button exists with tel:+919060828274');
    assert(waIdx !== -1, 'Chat on WhatsApp button exists with https://wa.me/919060828274');
    assert(instaIdx !== -1, 'Follow on Instagram button exists with exact requested URL');
    assert(ytIdx !== -1, 'Subscribe on YouTube button exists with exact requested URL');
    assert(callIdx < waIdx && waIdx < instaIdx && instaIdx < ytIdx, 'All 4 CTA buttons appear in the exact required order: 1. Call, 2. WhatsApp, 3. Instagram, 4. YouTube');
  } else {
    assert(false, 'cta-buttons-row not found in HTML');
  }

  // Test 6: Verify CSS for 9:16 aspect ratio & responsive rules
  const css = fs.readFileSync('./style.css', 'utf8');
  assert(css.includes('aspect-ratio: 9 / 16'), 'style.css defines 9:16 portrait aspect ratio for media cards');
  assert(css.includes('.student-media-grid'), 'style.css defines .student-media-grid');
  assert(css.includes('.video-modal-backdrop') && css.includes('.video-modal-dialog'), 'style.css defines Video Player Modal centered styling');
  assert(css.includes('.btn-instagram') && css.includes('.btn-youtube'), 'style.css defines Instagram and YouTube button styling');

  console.log('\n========================================================');
  console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
