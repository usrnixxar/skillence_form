const fs = require('fs');
const path = require('path');

const baseDir = __dirname;

function findFolder(names) {
  for (const name of names) {
    const full = path.join(baseDir, name);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      return name;
    }
  }
  return null;
}

const productiveFolder = findFolder(['ai productive', 'Ai_Productive', 'Ai productive']) || 'ai productive';
const videosFolder = findFolder(['ai videos', 'Ai_videos', 'Ai videos']) || 'ai videos';

const videoExtensions = new Set(['.mp4', '.webm', '.mov', '.mkv', '.m4v']);

function scanVideos(folderName) {
  const fullPath = path.join(baseDir, folderName);
  if (!fs.existsSync(fullPath)) return [];
  const entries = fs.readdirSync(fullPath);
  const results = [];

  for (const file of entries) {
    const ext = path.extname(file).toLowerCase();
    if (videoExtensions.has(ext)) {
      const nameWithoutExt = path.basename(file, path.extname(file));
      // Format human-friendly title
      const title = nameWithoutExt
        .replace(/[_\-]+/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      results.push({
        src: `${folderName}/${file}`,
        filename: file,
        title: title
      });
    }
  }

  return results;
}

const sampleProjects = [
  {
    type: 'image',
    src: 'assets/student_work/paint_assignment_1.png',
    title: 'MS Paint Precision Art',
    category: 'ADCA+ Fundamental Assignment',
    desc: 'Mouse control and precision color drawing assignment completed by beginner students during computer fundamentals module.'
  },
  {
    type: 'image',
    src: 'assets/student_work/video_color_grading.png',
    title: 'LOG to Rec.709 Color Grade',
    category: 'Video Editing Assignment',
    desc: 'Practical video project demonstrating raw camera footage normalization, Lumetri color scopes, and creative look styling.'
  },
  {
    type: 'image',
    src: 'assets/student_work/web_project_taskapp.jpg',
    title: 'Responsive Interface Build',
    category: 'Web Fundamentals Assignment',
    desc: 'Clean HTML & CSS web layout practice demonstrating modern responsive design and component styling principles.'
  },
  {
    type: 'image',
    src: 'assets/student_work/log_vs_rec709.jpg',
    title: 'Rec.709 LUT Comparison',
    category: 'Video Editing Color Grade',
    desc: 'Direct side-by-side comparison of flat LOG footage vs converted Rec.709 balanced color contrast.'
  },
  {
    type: 'image',
    src: 'assets/student_work/paint_assignment_2.png',
    title: 'Taj Mahal Digital Illustration',
    category: 'ADCA+ Creative Assignment',
    desc: 'Detailed monochrome illustration of the Taj Mahal drawn completely inside MS Paint.'
  }
];

const manifest = {
  aiProductive: scanVideos(productiveFolder),
  aiVideos: scanVideos(videosFolder),
  sampleProjects: sampleProjects,
  generatedAt: new Date().toISOString()
};

const outputPath = path.join(baseDir, 'media-manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log('✅ media-manifest.json generated successfully!');
console.log(`- AI Productive: ${manifest.aiProductive.length} videos found in "${productiveFolder}"`);
console.log(`- AI Videos: ${manifest.aiVideos.length} videos found in "${videosFolder}"`);
console.log(`- Sample Projects: ${manifest.sampleProjects.length} items`);
