# Security and privacy

This static application does not need a GitHub token, hosting credential, API key, or secret in its source. Never add credentials to HTML, JavaScript, the web manifest, or Git history. Use the hosting provider's secret manager for any future server-side integrations.

The client stores imported books and reading progress in the browser. Never commit personal book files, browser storage exports, account cookies, or deployment credentials.

The bundled EPUB importer removes scripts, executable embedded content, external image sources, and imported attributes before rendering. This filtering is not a guarantee that every possible hostile document is safe. Only import files you trust. Encrypted EPUB files are currently rejected.

Dictionary queries send only the selected word to the configured public services. Responses are escaped before rendering. Word lookup can be disabled in reading settings.

The initial repository upload is a clean source snapshot. Hosting-provider metadata, credential files, and the original Git history are excluded. A pattern scan was performed before upload, but pattern matching cannot prove the absence of every possible secret.
