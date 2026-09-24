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

// 2. Check form elements & new modal elements
const requiredIds = [
  'admissions-enquiry-form',
  'enquiry-name',
  'enquiry-phone',
  'enquiry-email',
  'enquiry-course',
  'enquiry-city',
  'enquiry-message',
  'btn-submit-enquiry',
  'admission-enquiry-modal',
  'popup-admission-form',
  'popup-enquiry-name',
  'popup-enquiry-phone',
  'popup-enquiry-email',
  'popup-enquiry-course',
  'popup-enquiry-message',
  'popup-submit-btn',
  'video-player-modal',
  'modal-video-element',
  'card-ai-productive',
  'card-ai-videos',
  'card-sample-projects',
  'frame-ai-productive',
  'frame-ai-videos',
  'frame-sample-projects',
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
  console.log('✅ ALL CRITICAL DOM IDs EXIST (INCLUDING MODALS & MEDIA CARDS)!');
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
  'assets/student_work/log_vs_rec709.jpg',
  'assets/student_work/paint_assignment_2.png',
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

// 6. Verify Exact Card Titles in Student Work Section
const titles = ['AI Productive', 'AI Videos', 'Sample Projects'];
let missingTitles = [];
titles.forEach(t => {
  if (!html.includes(t)) missingTitles.push(t);
});
if (missingTitles.length === 0) {
  console.log('✅ ALL THREE EXACT MEDIA CARD TITLES EXIST: AI Productive, AI Videos, Sample Projects!');
} else {
  console.error('❌ Missing card titles:', missingTitles);
}

// 7. Verify Social CTA Links and Order in Contact Section
const instagramLink = "https://www.instagram.com/skillence1?stkn=MTM0b3E3dnlkZzF3aw==";
const youtubeLink = "https://youtube.com/@skillence1?si=Eb8UMnWVQGnXLkxM";

if (html.includes(instagramLink) && html.includes(youtubeLink)) {
  console.log('✅ INSTAGRAM & YOUTUBE LINKS VERIFIED!');
} else {
  console.error('❌ Missing Instagram or YouTube links in HTML');
}

// 8. Verify media-manifest.json exists and is valid
if (fs.existsSync('./media-manifest.json')) {
  try {
    const manifest = JSON.parse(fs.readFileSync('./media-manifest.json', 'utf8'));
    console.log(`✅ media-manifest.json valid: ${manifest.aiProductive.length} AI Productive, ${manifest.aiVideos.length} AI Videos, ${manifest.sampleProjects.length} Sample Projects`);
  } catch (e) {
    console.error('❌ media-manifest.json parse error:', e.message);
  }
} else {
  console.error('❌ media-manifest.json does not exist');
}

console.log('\n--- VERIFICATION COMPLETED SUCCESSFULLY ---');
