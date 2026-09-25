const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

(async () => {
  // Exercise the built page with controlled media/viewport events, without downloads.
  const dom = new JSDOM(fs.readFileSync('dist/index.html', 'utf8'), {
    url: 'https://skillence.test/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const { window } = dom;
  const document = window.document;
  const observers = [];
  const errors = [];
  window.addEventListener('error', event => errors.push(event.error));
  window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia = () => ({ matches: false, addEventListener() {} });
  window.fetch = () => { throw new Error('Embedded manifest must avoid a second fetch'); };
  window.HTMLMediaElement.prototype.load = function () { this.currentTime = 0; };
  window.HTMLMediaElement.prototype.play = function () { this._playing = true; return Promise.resolve(); };
  window.HTMLMediaElement.prototype.pause = function () { this._playing = false; };
  Object.defineProperty(window.HTMLMediaElement.prototype, 'duration', { get: () => 8 });
  await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  window.eval(fs.readFileSync('dist/main.js', 'utf8'));
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  assert.deepEqual(errors, []);
  const cards = [...document.querySelectorAll('.portrait-video-element')];
  const popup = document.querySelector('#modal-video-element');
  const mediaObserver = observers.find(observer => observer.targets.some(target => target.id === 'card-ai-productive'));
  const manifest = JSON.parse(document.querySelector('#media-manifest').textContent);
  assert.equal(cards.length, 4);
  assert(cards.every(video => !video.hasAttribute('src')), 'No card downloads before entering viewport');
  assert(!popup.hasAttribute('src'));
  assert(cards.filter(video => video.poster).length === 2, 'Both cards have thumbnail posters');
  function visible(value) {
    mediaObserver.callback(mediaObserver.targets.map(target => ({ target, isIntersecting: value })));
  }
  visible(true);
  let loaded = cards.filter(video => video.hasAttribute('src'));
  assert.equal(loaded.length, 2);
  assert(loaded.every(video => video.getAttribute('src').endsWith('-preview.mp4')));
  loaded.forEach(video => video.dispatchEvent(new window.Event('canplay')));
  await Promise.resolve();
  assert(loaded.every(video => video._playing));
  const frame = document.querySelector('#frame-ai-productive');
  const selectedPreview = frame.querySelector('video.active').getAttribute('src');
  const selected = manifest.aiProductive.find(item => item.previewSrc === selectedPreview);
  frame.click();
  assert.equal(popup.getAttribute('src'), selected.src, 'Popup loads the matching complete HD video');
  assert.equal(popup.currentTime, 0);
  assert.equal(popup.muted, false);
  assert(cards.every(video => !video.hasAttribute('src')), 'Popup stops both card downloads');
  document.querySelector('#video-modal-close-btn').click();
  assert(!popup.hasAttribute('src'));
  loaded = cards.filter(video => video.hasAttribute('src'));
  assert.equal(loaded.length, 2, 'Visible previews resume after closing');
  loaded.forEach(video => video.dispatchEvent(new window.Event('canplay')));
  const old = frame.querySelector('video.active');
  old.dispatchEvent(new window.Event('ended'));
  const next = [...frame.querySelectorAll('video')].find(video => video !== old);
  assert(next.getAttribute('src').endsWith('-preview.mp4'));
  assert.notEqual(next.getAttribute('src'), selectedPreview, 'Shuffle advances without immediate repeat');
  next.dispatchEvent(new window.Event('canplay'));
  assert(next.classList.contains('active'));
  assert(!old.hasAttribute('src'));
  visible(false);
  assert(cards.every(video => !video.hasAttribute('src')), 'Offscreen cards release their downloads');
  assert.deepEqual(errors, []);
  dom.window.close();
  console.log('PASS: deferred loading, posters, HD popup, release/resume, and shuffled previews');
})().catch(error => { console.error(error); process.exit(1); });
