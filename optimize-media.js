const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

// Change this version when encoding settings change: URLs are content-addressed.
const ENCODER_VERSION = 'web-video-v1';
function run(ffmpeg, args) {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', ...args], {
    encoding: 'utf8', timeout: 600000, maxBuffer: 4 * 1024 * 1024
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Video encoding failed: ${result.error?.message || result.stderr}`);
  }
}

module.exports = async function optimizeMedia(manifest, outputDir) {
  const ffmpeg = process.env.FFMPEG_PATH || require('ffmpeg-static');
  const sourceRoot = process.env.MEDIA_SOURCE_DIR || __dirname;
  const mediaDir = path.join(outputDir, 'media');
  fs.mkdirSync(mediaDir, { recursive: true });
  const report = [];
  for (const category of ['aiProductive', 'aiVideos']) {
    for (const item of manifest[category]) {
      const input = path.join(sourceRoot, item.src);
      const inputBytes = fs.statSync(input).size;
      if (inputBytes < 1024 && fs.readFileSync(input, 'utf8').includes('git-lfs.github.com/spec')) {
        throw new Error(`Git LFS content is missing for ${item.src}. Enable Git LFS before deploying.`);
      }
      const hash = crypto.createHash('sha256').update(ENCODER_VERSION);
      for await (const chunk of fs.createReadStream(input)) hash.update(chunk);
      const id = hash.digest('hex').slice(0, 20);
      const preview = path.join(mediaDir, `${id}-preview.mp4`);
      const playback = path.join(mediaDir, `${id}-720.mp4`);
      const poster = path.join(mediaDir, `${id}.jpg`);
      console.log(`Optimizing ${item.src} (${(inputBytes / 1e6).toFixed(1)} MB)`);
      // Full video with audio. Fit both portrait and landscape; never stretch.
      run(ffmpeg, ['-i', input, '-map', '0:v:0', '-map', '0:a:0?',
        '-vf', "scale=w='min(720,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,fps=30",
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '25', '-maxrate', '1800k', '-bufsize', '3600k',
        '-pix_fmt', 'yuv420p', '-g', '60', '-threads', '2',
        '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-movflags', '+faststart', playback]);
      // Short silent card preview: a few hundred KB instead of a full original.
      run(ffmpeg, ['-i', input, '-t', '8', '-map', '0:v:0', '-an',
        '-vf', "scale=w='min(480,iw)':h='min(854,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,fps=24",
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '29', '-maxrate', '550k', '-bufsize', '1100k',
        '-pix_fmt', 'yuv420p', '-g', '48', '-threads', '2', '-movflags', '+faststart', preview]);
      run(ffmpeg, ['-i', preview, '-frames:v', '1', '-q:v', '5', '-threads', '1', poster]);
      const original = item.src;
      item.src = `media/${path.basename(playback)}`;
      item.previewSrc = `media/${path.basename(preview)}`;
      item.poster = `media/${path.basename(poster)}`;
      item.previewBytes = fs.statSync(preview).size;
      item.playbackBytes = fs.statSync(playback).size;
      report.push({ original, originalBytes: inputBytes, ...item });
      console.log(`  preview ${(item.previewBytes / 1e3).toFixed(0)} KB; popup ${(item.playbackBytes / 1e6).toFixed(2)} MB`);
    }
  }
  fs.writeFileSync(path.join(outputDir, 'media-report.json'), JSON.stringify(report, null, 2));
  return manifest;
};
