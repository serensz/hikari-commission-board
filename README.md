# 🎮 GameBoost Tracker

Client progress tracker for WuWa, HSR, ZZZ, and Endfield boosting services.

## Features
- **Clients tab** — Add/edit/delete clients with game, status, progress %, deadline, and per-task checkboxes
- **Income tab** — Track payment per client with paid/unpaid status and THB totals
- **Stats tab** — Visual breakdown by game and status
- **Persistent** — All data saved in browser `localStorage`
- **Export / Import** — Backup and restore data as JSON

## Local Dev

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages (Auto)

1. Push this repo to GitHub (any repo name)
2. Go to **Settings → Pages**
3. Set **Source** to `GitHub Actions`
4. Push to `main` — the workflow builds and deploys automatically

Your site will be live at:
`https://<your-username>.github.io/<repo-name>/`

## Manual Deploy (alternative)

```bash
npm install
npm run build
# then upload the /dist folder to any static host
```

## Tech Stack
- **Vanilla TypeScript** + **Vite** — zero framework, fast, easy to maintain
- No external dependencies at runtime
- Single-page app, all state in localStorage
