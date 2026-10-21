# Free deployment

Yomori Reader is a static website with no backend, database, or application API keys. Both options below provide HTTPS and a free subdomain for PWA installation. You do not need to buy a domain. Free plan limits and policies are subject to each provider's official documentation.

## Option 1: Cloudflare Pages (supports private repositories)

1. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com/), open **Workers & Pages**, and create a **Pages** project connected to a Git repository. Choose the Pages Git deployment flow.
2. Connect GitHub and authorize access to `chenxinhang12345/yomori-reader`, or use your own fork. For a private repository, grant the Cloudflare GitHub App access to that repository.
3. Enter these build settings:

   | Setting | Value |
   | --- | --- |
   | Production branch | `main` |
   | Framework preset | `None` |
   | Build command | `node scripts/build-site.cjs` |
   | Build output directory | `dist` |
   | Root directory | Leave blank (repository root) |

4. Save and deploy, then open the `https://<project-name>.pages.dev` address shown in the dashboard. Future pushes to `main` update the site automatically.

No environment variables or Pages Functions are needed. The build command copies the deployment files using only built-in Node.js modules, with no dependency installation. Cloudflare's build environment includes Node.js; for local use, Node.js 22 or a newer LTS version is recommended.

Cloudflare Pages Free currently allows 500 builds per month and a maximum file size of 25 MiB. The app is small, and imported books stay in the browser rather than becoming deployment files. See the [static HTML deployment guide](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/), [Git integration documentation](https://developers.cloudflare.com/pages/configuration/git-integration/), and [free plan limits](https://developers.cloudflare.com/pages/platform/limits/).

## Option 2: GitHub Pages (for public repositories)

GitHub Free includes Pages for public repositories. Pages for a private repository requires an eligible paid plan. To keep the repository private and use free hosting, choose Cloudflare Pages above. See [GitHub's official requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

1. Make sure the deployment files have been merged into `main`.
2. Open the repository's **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Open **Settings → Secrets and variables → Actions → Variables**, create a repository variable named `ENABLE_GITHUB_PAGES`, and set it to `true`. The workflow skips deployment unless this variable is set.
4. Open **Actions → Deploy GitHub Pages → Run workflow**, select `main`, and run it. If Actions is disabled on your fork, enable it first.
5. Wait for deployment to succeed, then visit the URL shown by the workflow. This repository's default address is `https://chenxinhang12345.github.io/yomori-reader/`; it becomes available only after Pages is enabled and deployment succeeds. Forks use their own username and repository name.

Future pushes to `main` automatically run checks and deploy. The workflow uses permissions granted to GitHub's automatically provided `GITHUB_TOKEN`; no personal access token or repository secrets are needed. A run before Pages is enabled may fail because Pages is not configured. Complete step 2 and rerun the workflow. If an environment protection error appears, check that the `github-pages` environment allows deployment from `main`. If you only use Cloudflare, leave `ENABLE_GITHUB_PAGES` unset. The GitHub Pages jobs will be skipped, and Cloudflare will continue deploying through its own Git integration. Previous failed GitHub Pages runs remain in the workflow history; they do not indicate a Cloudflare deployment failure.

The app uses relative asset paths and supports the `/yomori-reader/` subpath on GitHub Pages. See [pages.yml](.github/workflows/pages.yml) and [GitHub's custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Check the deployment files locally

Run these commands from the repository root:

```sh
node --test test.cjs
node scripts/build-site.cjs
python3 -m http.server 8000 --directory dist
```

On Windows, use `py` if `python3` is unavailable. Open `http://localhost:8000`. Publish only `dist`, rather than the entire working directory. The script regenerates `dist` and copies only app assets and third-party license notices.

## Verify and update the deployed site

- Open the site over HTTPS and check the bookshelf, language switching, TXT / EPUB import, and illustrations.
- Wait for **Offline ready**, disconnect from the internet, and reload to check offline startup. On iPhone, choose **Share → Add to Home Screen** in Safari, then test from the home screen.
- While online, tap an English word to check the external dictionary services. Free hosting does not guarantee their availability or quotas.
- When changing cached app assets, also update the `CACHE` version in `sw.js` (for example, `yomori-v9` → `yomori-v10`) so installed clients receive the new assets.
- Books and progress are stored per browser and site origin. Switching hosting domains, using a preview URL, or clearing browser data will not automatically restore the original site's bookshelf. Keep your original book files.

A private Git repository does not automatically make the deployed website private. The default addresses above are publicly accessible. Book imports still happen only in each user's own browser.
