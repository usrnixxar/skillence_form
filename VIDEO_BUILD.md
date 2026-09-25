# Video delivery

Production is built into `dist/` and served by Vercel. Edit `src/`, then run
`npm ci`, `npm run build`, and `npm run test:video`.

Original videos remain in Git LFS. Run `git lfs pull` before a local build;
keep Vercel's Git LFS setting enabled. Builds fail clearly if originals are
missing. For an alternate local source directory, set `MEDIA_SOURCE_DIR`.

The build creates, for each original:
- An 8-second, silent, 480px-wide preview, loaded only when its card is visible.
- A thumbnail shown before playback begins.
- A complete H.264/AAC video fitted within 720 x 1280, with audio and faststart,
  loaded when the user opens the popup.

Paths are hashed from the original content and encoder settings version, so
Vercel can cache generated media for one year. Increment `ENCODER_VERSION` in
`optimize-media.js` when encoding settings change. `dist/media-report.json`
records original and generated sizes. The build encodes videos automatically;
allow several minutes for deployment. Never commit generated `dist/` files.

`npm run test:video` tests the built player lifecycle with simulated media
and viewport events. Also verify actual playback in a browser after deployment.
