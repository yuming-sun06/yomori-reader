# Yomori Reader

An offline-first, browser-local TXT and EPUB reader. The app has an English / Simplified Chinese interface, adjustable typography, saved reading progress, and inline English word lookup.

## Run locally

No build step, package installation, account, API key, or token is required.

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Serve the repository root, which contains `index.html`. Use HTTPS on a remote host to enable service workers and home-screen installation.

## Free deployment

See [Free deployment guide](DEPLOYMENT.md) for step-by-step setup:

- **Cloudflare Pages**: connect a public or private GitHub repository, set the build command to `node scripts/build-site.cjs` and output directory to `dist`. Use the free `pages.dev` address.
- **GitHub Pages**: for a public repository on GitHub Free, choose **Settings → Pages → Source → GitHub Actions**, set the repository Actions variable `ENABLE_GITHUB_PAGES` to `true`, then run the included **Deploy GitHub Pages** workflow. Future pushes to `main` deploy automatically.

Both options provide HTTPS for PWA installation. No backend, database, custom domain, or application secrets are needed. Free plan limits apply; see the linked guide for official sources, verification steps, and private-repository requirements. Node.js is only used to prepare the deployment folder; local reading still needs no build step.

## Features

- Import local TXT and DRM-free EPUB files, including EPUB illustrations.
- Preview TXT before import and choose UTF-8, GB18030 / GBK, Big5, or UTF-16.
- Search the bookshelf and resume from the saved chapter and position.
- Scroll down at the end of a chapter to continue to the next chapter automatically. Scroll up at the start to return to the previous chapter's end. The reading header shows the current chapter title.
- Open reading settings from the bookshelf or reader to adjust font size, font family, line spacing, margins, paragraph spacing, indentation, and background.
- Tap empty reading space to show or hide controls. Open the right-side contents drawer with the menu button.
- Change **Reading settings → Language** between **English** and **简体中文**. The choice is stored on the device; book text is unchanged.
- Tap English words for a Chinese reference translation and English dictionary entries when available. Word lookup can be disabled in reading settings.
- Install as a PWA and cache the app shell for offline use.

## iPhone installation

Open the hosted HTTPS page in Safari, choose **Share → Add to Home Screen**, and launch it from the home screen. Load the app online first and wait for **Offline ready**. Offline startup depends on the browser and hosting authentication; verify it on the target device.

## Data and privacy

Books and reading progress stay in the current browser. Book text and illustrations use IndexedDB. Checkpoints are stored separately, with a small localStorage backup. Interface preferences and successful dictionary results are cached locally.

Word lookup is the only built-in external data request: the selected word is sent to MyMemory for a Chinese reference translation and Free Dictionary API for English definitions. The app does not send the book, surrounding paragraph, or title. New lookups require internet; cached results can be reused offline. External services may be unavailable or rate-limited. Single-word translations may not match the meaning in context.

There is no cross-device synchronization. Browser data removal or storage eviction can remove imported books and progress. Keep the original files.

## Project layout

This is a buildless static app. Files are intentionally stored at the repository root:

- `index.html`, `style.css`: interface and styling
- `app.js`: library, import, reader, and settings behavior
- `ui-language.js`: English / Simplified Chinese interface localization
- `progress-store.js`: independent progress storage and backup
- `reading-tap.js`: touch handling and synthetic-click deduplication
- `word-lookup.js`: inline word marking, dictionary requests, and caching
- `sw.js`, `manifest.webmanifest`: PWA app shell and installation metadata
- `icon.svg`, `icon-*.png`: editable icon source and exported images
- `jszip.min.js`: bundled JSZip distribution for EPUB parsing

The original hosting provider configuration, repository credentials, local runtime files, imported books, and historical Git metadata are excluded from this repository.

## Checks

```sh
node --check app.js
node --check ui-language.js
node --check progress-store.js
node --check reading-tap.js
node --check word-lookup.js
node --check sw.js
node --test test.cjs
```

The unit checks cover encoding handling, gesture filtering, localization, and static asset references.

### End-to-end browser tests

With Node.js 22 or newer installed:

```sh
npm ci
npx playwright install chromium webkit
npm test
npm run test:e2e
```

Playwright starts a local server automatically and tests the actual `dist` deployment files under `/reader/`, including the hosting redirect from `index.html` to the directory URL. Each test uses fresh browser storage and imports a generated TXT fixture; it does not touch your personal library or the production website.

Coverage includes TXT import, wheel navigation in both directions, returning to the previous chapter's end, first/last chapter boundaries, momentum deduplication, chapter titles, contents and navigation buttons, library settings, language and font persistence, saved reading position, and offline reload with imported books. Chromium tests also send native browser touch input to verify swipe navigation and prevent the remaining gesture from scrolling the new chapter. Offline service worker coverage runs in Chromium; the corresponding WebKit case is explicitly skipped.

The suite runs in desktop Chromium, WebKit with a narrow viewport, and a Chromium touch project. WebKit and touch emulation do not replace testing installation, touch behavior, and offline startup on a real iPhone. External dictionary availability is outside this suite.

The **Tests** GitHub Actions workflow runs unit and E2E checks on pull requests and pushes to `main`, independently of the optional GitHub Pages workflow. It uploads an HTML report and failure traces/screenshots for 7 days. Run `npm run test:e2e:report` to open a local report. Cloudflare's existing automatic deployments are independent of these checks; this workflow does not configure merge protection or block deployment.

## Third-party notices

JSZip 3.10.1 is bundled under its MIT license option. Its distribution includes pako under the MIT license. See `LICENSE-JSZIP.txt` and `LICENSE-PAKO.txt`. Copyright notices in the bundled distribution are retained.
# 协同阅读 / Read together

阅读器中的「Read together」支持邀请码房间、实时阅读位置、选中文字和行内评论，并在网络中断后自动重连。双方需在本机导入同一版本的书籍。使用说明、公共信令服务、隐私与网络限制见 [COLLABORATION.md](./COLLABORATION.md)。
