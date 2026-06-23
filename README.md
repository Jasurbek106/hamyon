# Hamyon

AI financial literacy assistant for Uzbek and English speakers. The frontend is static,
but the chat needs a serverless function (in `api/chat.js`) to talk to Claude without
exposing an API key in the browser.

## Repo structure
```
hamyon-repo/
├── index.html       ← the site
└── api/
    └── chat.js       ← serverless function, holds the API key, proxies to Anthropic
```

## Deploy

This repo needs to go to **GitHub first, then Vercel** — GitHub alone (e.g. GitHub Pages)
cannot run the `api/chat.js` function, so the chat won't work without Vercel in the loop.

1. Create a new repo on GitHub (e.g. `hamyon`) and push this folder's contents to it,
   keeping the `api/` folder structure intact.
2. Go to vercel.com → **Add New Project → Import Git Repository** → pick this repo.
   Vercel will auto-detect `api/chat.js` as a serverless function — no extra config needed.
3. Before or after the first deploy, go to **Settings → Environment Variables** and add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your real key from console.anthropic.com (starts with `sk-ant-...`)
4. Redeploy if you added the key after the first deploy (Deployments → ⋯ → Redeploy).
5. Open your `*.vercel.app` URL and test the chat.

See `DEPLOY.md` for troubleshooting common issues (401s, missing key, 404 on /api/chat).
