const fs = require('fs');

console.log('========================================================');
console.log(' TESTING BOTH REQUIREMENTS: 1. CLEAN UP & 2. 10-DIGIT PHONE');
console.log('========================================================\n');

let failed = 0;
function assert(condition, desc) {
  if (condition) {
    console.log('  ✅ PASS:', desc);
  } else {
    console.error('  ❌ FAIL:', desc);
    failed++;
  }
}

// ----------------------------------------------------
// REQUIREMENT 1: CLEAN UP VISIBLE IN BROWSER
// ----------------------------------------------------
console.log('\n--- Checking Requirement 1: Browser Assets Clean Up ---');
const html = fs.readFileSync('./index.html', 'utf8');
const css = fs.readFileSync('./style.css', 'utf8');
const js = fs.readFileSync('./main.js', 'utf8');

// 1. Minification check
assert(html.length > 0 && !html.includes('\n\n\n'), 'HTML is minified');
assert(css.length > 0 && !css.includes('\n\n\n'), 'CSS is minified');
assert(js.length > 0 && !js.includes('\n\n\n'), 'JS is minified');

// 2. Developer comments removed
const htmlComments = html.match(/<!--(?!\[if)[\s\S]*?-->/g) || [];
assert(htmlComments.length === 0, `0 HTML developer comments in production build (found ${htmlComments.length})`);

const cssComments = css.match(/\/\*[\s\S]*?\*\//g) || [];
assert(cssComments.length === 0, `0 CSS developer comments in production build (found ${cssComments.length})`);

// 3. Debug console logs removed
const consoleLogs = js.match(/console\.(log|info|debug|warn|error)\s*\(/g) || [];
assert(consoleLogs.length === 0, `0 console logs in production JS (found ${consoleLogs.length})`);

// 4. Source maps disabled
assert(!html.includes('sourceMappingURL'), 'No sourceMappingURL in HTML');
assert(!css.includes('sourceMappingURL'), 'No sourceMappingURL in CSS');
assert(!js.includes('sourceMappingURL'), 'No sourceMappingURL in JS');

// 5. No right-click blocking
assert(!js.includes('preventDefault()') || (!js.includes('contextmenu') && !js.includes('oncontextmenu')), 'No right-click / contextmenu blocking');
assert(!js.includes('keydown') || (!js.includes('F12') && !js.includes('Ctrl+Shift+I')), 'No DevTools shortcut blocking');

// ----------------------------------------------------
// REQUIREMENT 2: EXACTLY 10-DIGIT MOBILE NUMBER
// ----------------------------------------------------
console.log('\n--- Checking Requirement 2: Exactly 10-digit Phone Validation ---');

// Check hero form phone input
const heroPhoneMatch = html.match(/<input[^>]+id=['"]enquiry-phone['"][^>]*>/i);
assert(Boolean(heroPhoneMatch), 'Hero enquiry-phone input found in index.html');
if (heroPhoneMatch) {
  const tag = heroPhoneMatch[0];
  assert(/type=['"]tel['"]/i.test(tag), 'Hero phone input has type="tel"');
  assert(/inputmode=['"]numeric['"]/i.test(tag), 'Hero phone input has inputmode="numeric"');
  assert(/maxlength=['"]10['"]/i.test(tag), 'Hero phone input has maxlength="10"');
  assert(/placeholder=['"]Enter 10-digit mobile number['"]/i.test(tag), 'Hero phone input has placeholder="Enter 10-digit mobile number"');
  assert(/required/i.test(tag), 'Hero phone input has required attribute');
}

// Check popup form phone input
const popupPhoneMatch = html.match(/<input[^>]+id=['"]popup-enquiry-phone['"][^>]*>/i);
assert(Boolean(popupPhoneMatch), 'Popup popup-enquiry-phone input found in index.html');
if (popupPhoneMatch) {
  const tag = popupPhoneMatch[0];
  assert(/type=['"]tel['"]/i.test(tag), 'Popup phone input has type="tel"');
  assert(/inputmode=['"]numeric['"]/i.test(tag), 'Popup phone input has inputmode="numeric"');
  assert(/maxlength=['"]10['"]/i.test(tag), 'Popup phone input has maxlength="10"');
  assert(/placeholder=['"]Enter 10-digit mobile number['"]/i.test(tag), 'Popup phone input has placeholder="Enter 10-digit mobile number"');
  assert(/required/i.test(tag), 'Popup phone input has required attribute');
}

// Check error message text
const expectedErrorMsg = 'Please enter a valid 10-digit mobile number.';
assert(js.includes(expectedErrorMsg), `main.js contains exact error message: "${expectedErrorMsg}"`);

// Check backend server.ps1 validation
const serverPs1 = fs.readFileSync('./server.ps1', 'utf8');
assert(serverPs1.includes('^[0-9]{10}$'), 'server.ps1 contains regex validation for exactly 10 digits ^[0-9]{10}$');
assert(serverPs1.includes(expectedErrorMsg), `server.ps1 returns exact error message: "${expectedErrorMsg}"`);
assert(serverPs1.includes('$response.StatusCode = 400'), 'server.ps1 returns HTTP 400 on invalid phone');
assert(serverPs1.includes('$newLead.phone = $phoneStr'), 'server.ps1 stores phone number as string');

// Check security filter in server.ps1
assert(serverPs1.includes('leads.json') && serverPs1.includes('$response.StatusCode = 403'), 'server.ps1 protects leads.json from browser download (403)');
assert(serverPs1.includes('.map') && serverPs1.includes('$response.StatusCode = 404'), 'server.ps1 disables serving source maps (404)');

console.log('\n========================================================');
console.log(` SUMMARY: ${failed === 0 ? 'ALL TESTS PASSED ✅' : `${failed} TESTS FAILED ❌`}`);
console.log('========================================================\n');

if (failed > 0) process.exit(1);
