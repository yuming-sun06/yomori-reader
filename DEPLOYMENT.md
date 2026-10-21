# 免费部署

Yomori Reader 是纯静态网页，不需要后端、数据库或应用 API 密钥。以下两种方案都提供 HTTPS 和免费子域名，可以安装为 PWA。无需购买域名；平台免费额度和政策以官方说明为准。

## 方案一：Cloudflare Pages（适合保留私有仓库）

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)，进入 **Workers & Pages**，创建 **Pages** 项目并选择连接 Git 仓库。请选 Pages 的 Git 部署流程。
2. 连接 GitHub，并授权访问 `chenxinhang12345/yomori-reader`（也可以使用自己的 Fork）。私有仓库需要向 Cloudflare GitHub App 授予仓库访问权限。
3. 填写以下构建设置：

   | 设置 | 值 |
   | --- | --- |
   | Production branch / 生产分支 | `main` |
   | Framework preset / 框架 | `None` |
   | Build command / 构建命令 | `node scripts/build-site.cjs` |
   | Build output directory / 输出目录 | `dist` |
   | Root directory / 根目录 | 留空（仓库根目录） |

4. 保存并部署，完成后打开控制台给出的 `https://<项目名>.pages.dev` 地址。以后推送到 `main` 会自动更新。

项目不需要环境变量，也不使用 Pages Functions。构建命令只用 Node.js 内置功能复制发布文件，不安装依赖。Cloudflare 构建环境自带 Node.js；本地执行建议使用 Node.js 22 或更新的 LTS 版本。

Cloudflare Pages Free 当前每月允许 500 次构建，单文件最大 25 MiB；应用本身很小，导入的书籍留在浏览器，不计入部署文件。详见 [静态 HTML 部署说明](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)、[Git 集成](https://developers.cloudflare.com/pages/configuration/git-integration/)和[免费额度](https://developers.cloudflare.com/pages/platform/limits/)。

## 方案二：GitHub Pages（适合公开仓库）

GitHub Free 支持公开仓库的 Pages。私有仓库使用 Pages 需要符合条件的付费套餐；想保留私有仓库且免费托管，可使用上面的 Cloudflare Pages。参见 [GitHub 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

1. 确认本次新增的文件已合并到 `main`。
2. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 打开 **Actions → Deploy GitHub Pages → Run workflow**，选择 `main` 并运行。Fork 后如 Actions 被禁用，先启用它。
4. 等待部署成功，访问工作流显示的网址。本仓库的默认地址为 `https://chenxinhang12345.github.io/yomori-reader/`，仅在启用并成功部署后可用；Fork 的地址使用自己的用户名和仓库名。

以后推送到 `main` 会自动检查并部署。工作流使用 GitHub 自动提供的 `GITHUB_TOKEN` 权限，无需创建 PAT 或添加 Secrets。首次启用 Pages 前的运行可能因未配置 Pages 而失败，完成第 2 步后重新运行即可。如果提示环境保护规则错误，检查 `github-pages` 环境是否允许从 `main` 部署。仅使用 Cloudflare 时，可在 Actions 页面禁用 **Deploy GitHub Pages** 工作流。

应用使用相对资源路径，支持 GitHub Pages 的 `/yomori-reader/` 子路径。工作流见 [pages.yml](.github/workflows/pages.yml)，配置依据 [GitHub 自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 本地检查发布文件

在仓库根目录执行：

```sh
node --test test.cjs
node scripts/build-site.cjs
python3 -m http.server 8000 --directory dist
```

Windows 如没有 `python3` 命令，可使用 `py`。打开 `http://localhost:8000`。部署时仅发布 `dist`，不要上传整个工作目录。脚本会重新生成 `dist`，仅复制应用资源和第三方许可证。

## 上线后验证与更新

- 用 HTTPS 打开网站，确认书架、语言切换、TXT / EPUB 导入和插图显示正常。
- 等待 **Offline ready** 后，断网刷新检查离线启动。iPhone 在 Safari 中选择 **分享 → 添加到主屏幕**，再从主屏幕测试。
- 在线点击英文单词，检查外部词典是否可用。免费托管不保证外部词典的可用性或额度。
- 修改被缓存的应用资源时，同时更新 `sw.js` 中的 `CACHE` 版本（例如 `yomori-v9` → `yomori-v10`），使已安装的客户端取得新资源。
- 书籍和进度按浏览器与网站来源保存。切换托管域名、使用预览地址或清除浏览器数据后，不会自动带回原网站的书架，请保留原始书籍文件。

私有 Git 仓库不会使部署出来的网站自动变为私有；以上默认网址均为公开访问。书籍导入仍只发生在各用户自己的浏览器中。
