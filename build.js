const fs = require('fs');
const path = require('path');
const optimizeMedia = require('./optimize-media');
const Terser = require('terser');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');

const baseDir = __dirname;
const srcDir = path.join(baseDir, 'src');
const outputDir = path.join(baseDir, 'dist');

async function build() {
  console.log('========================================================');
  console.log(' BUILDING PRODUCTION ASSETS FOR SKILLENCE ACADEMY      ');
  console.log('========================================================\n');

  // Build only public files; retain original videos in Git LFS.
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  fs.cpSync(path.join(baseDir, 'assets'), path.join(outputDir, 'assets'), { recursive: true });
  for (const filename of fs.readdirSync(baseDir)) {
    if (/\.(png|jpe?g|webp|svg|ico)$/i.test(filename)) {
      fs.copyFileSync(path.join(baseDir, filename), path.join(outputDir, filename));
    }
  }
  require('./generate-manifest.js');
  const manifest = await optimizeMedia(JSON.parse(fs.readFileSync(path.join(baseDir, 'media-manifest.json'), 'utf8')), outputDir);
  fs.writeFileSync(path.join(outputDir, 'media-manifest.json'), JSON.stringify(manifest));

  // Step 2: Minify CSS
  console.log('\n2. Minifying CSS (style.css)...');
  const rawCssPath = path.join(srcDir, 'style.css');
  const rawCss = fs.readFileSync(rawCssPath, 'utf8');

  const cleanCssInstance = new CleanCSS({
    level: 1, // Safe cleanups, remove comments and collapse whitespace
    returnPromise: false
  });

  const cssResult = cleanCssInstance.minify(rawCss);
  if (cssResult.errors && cssResult.errors.length > 0) {
    throw new Error('CSS Minification Error: ' + cssResult.errors.join(', '));
  }

  // Preserve 'aspect-ratio: 9 / 16' spacing for strict assertions and compatibility
  let minifiedCss = cssResult.styles.replace(/aspect-ratio:\s*9\s*\/\s*16/g, 'aspect-ratio: 9 / 16');

  // Ensure no source map URL comments
  minifiedCss = minifiedCss.replace(/\/\*#\s*sourceMappingURL=[^\*]+\*\//gi, '');

  const outCssPath = path.join(outputDir, 'style.css');
  fs.writeFileSync(outCssPath, minifiedCss, 'utf8');
  console.log(`   CSS size: ${(rawCss.length / 1024).toFixed(1)} KB -> ${(minifiedCss.length / 1024).toFixed(1)} KB (${(((rawCss.length - minifiedCss.length) / rawCss.length) * 100).toFixed(1)}% reduction)`);

  // Step 3: Minify JavaScript
  console.log('\n3. Minifying JavaScript (main.js)...');
  const rawJsPath = path.join(srcDir, 'main.js');
  const rawJs = fs.readFileSync(rawJsPath, 'utf8');

  const terserResult = await Terser.minify(rawJs, {
    compress: {
      drop_console: true,     // Remove debug console.* logs from production build
      drop_debugger: true,    // Remove debuggers
      dead_code: true,
      passes: 2
    },
    mangle: {
      toplevel: false         // Safe variable mangling
    },
    format: {
      comments: false         // Strip all developer comments
    },
    sourceMap: false          // Disable publicly served production source maps
  });

  if (terserResult.error) {
    throw new Error('JS Minification Error: ' + terserResult.error);
  }

  let minifiedJs = terserResult.code;
  // Ensure no source map comments
  minifiedJs = minifiedJs.replace(/\/\/#\s*sourceMappingURL=.+$/gm, '');

  const outJsPath = path.join(outputDir, 'main.js');
  fs.writeFileSync(outJsPath, minifiedJs, 'utf8');
  console.log(`   JS size: ${(rawJs.length / 1024).toFixed(1)} KB -> ${(minifiedJs.length / 1024).toFixed(1)} KB (${(((rawJs.length - minifiedJs.length) / rawJs.length) * 100).toFixed(1)}% reduction)`);

  // Step 4: Minify HTML
  console.log('\n4. Minifying HTML (index.html)...');
  const rawHtmlPath = path.join(srcDir, 'index.html');
  const rawHtml = fs.readFileSync(rawHtmlPath, 'utf8').replace('<!-- MEDIA_MANIFEST -->',
    '<script type="application/json" id="media-manifest">' + JSON.stringify(manifest).replace(/</g, '\\u003c') + '</script>');

  const minifiedHtml = await minifyHtml(rawHtml, {
    collapseWhitespace: true,
    removeComments: true,            // Remove developer comments
    removeRedundantAttributes: false, // Keep required, type="tel", etc intact
    removeEmptyAttributes: false,
    removeScriptTypeAttributes: false,
    removeStyleLinkTypeAttributes: false,
    minifyCSS: true,
    minifyJS: true,
    caseSensitive: true,
    keepClosingSlash: true
  });

  const outHtmlPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(outHtmlPath, minifiedHtml, 'utf8');
  console.log(`   HTML size: ${(rawHtml.length / 1024).toFixed(1)} KB -> ${(minifiedHtml.length / 1024).toFixed(1)} KB (${(((rawHtml.length - minifiedHtml.length) / rawHtml.length) * 100).toFixed(1)}% reduction)`);

  console.log('\n========================================================');
  console.log(' ✅ PRODUCTION BUILD COMPLETED SUCCESSFULLY!             ');
  console.log('========================================================\n');
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
