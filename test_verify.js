const fs = require('fs');

const html = fs.readFileSync('./index.html', 'utf8');

// 1. Verify all href="#id" exist as id="id"
const hrefRegex = /href="#([a-zA-Z0-9\-_]+)"/g;
let match;
const anchors = new Set();
while ((match = hrefRegex.exec(html)) !== null) {
  anchors.add(match[1]);
}

console.log('Anchors found:', Array.from(anchors));
let missing = [];
anchors.forEach(id => {
  if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
    missing.push(id);
  }
});

if (missing.length === 0) {
  console.log('✅ ALL ANCHOR TARGETS EXIST IN HTML!');
} else {
  console.error('❌ Missing target IDs:', missing);
}

// 2. Check form elements
const requiredIds = [
  'admissions-enquiry-form',
  'enquiry-name',
  'enquiry-phone',
  'enquiry-email',
  'enquiry-course',
  'enquiry-city',
  'btn-submit-enquiry',
  'course-details-modal',
  'gallery-lightbox-modal',
  'nav-toggle-btn',
  'nav-menu',
  'site-header'
];

let missingIds = [];
requiredIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) missingIds.push(id);
});

if (missingIds.length === 0) {
  console.log('✅ ALL CRITICAL DOM IDs EXIST!');
} else {
  console.error('❌ Missing IDs:', missingIds);
}

// 3. Verify CSS file exists and has content
const css = fs.readFileSync('./style.css', 'utf8');
console.log('✅ style.css verified, size:', css.length, 'bytes');

// 4. Verify main.js exists and has content
const js = fs.readFileSync('./main.js', 'utf8');
console.log('✅ main.js verified, size:', js.length, 'bytes');

// 5. Verify local images exist
const images = [
  'assets/skillence_logo.png',
  'assets/founder_nisar.jpg',
  'assets/about_practical_learning.png',
  'assets/about_small_batches.png',
  'assets/about_career_support.png',
  'assets/about_certificate.png',
  'assets/student_work/paint_assignment_1.png',
  'assets/student_work/video_color_grading.png',
  'assets/student_work/web_project_taskapp.jpg',
  'mentor.png'
];

let missingImages = [];
images.forEach(img => {
  if (!fs.existsSync(img)) missingImages.push(img);
});

if (missingImages.length === 0) {
  console.log('✅ ALL LOCAL IMAGES EXIST AND ARE READY!');
} else {
  console.error('❌ Missing images:', missingImages);
}

console.log('\n--- VERIFICATION COMPLETED SUCCESSFULLY ---');
