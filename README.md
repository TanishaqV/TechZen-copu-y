# 🚀 TechZen Community Platform

Official repository package for **TechZen** — Indian Hackathon & Quiz Community Platform.

---

## 📁 Package Contents

This folder contains all essential production source files and configurations required to run and deploy TechZen:

- `src/` — React frontend codebase (Bento Grid layout, Event Catalog, Event Details with Auth Lock Gate, AuthModal, SiteShell navigation)
- `server/` — Express backend API server (`index.js`) for data persistence & auth endpoints
- `public/` — Static assets (logos, images, icons)
- `.env` — Environment variables (Google OAuth Client ID & configuration settings)
- `package.json` & `package-lock.json` — Project dependencies
- `vite.config.js` & `index.html` — Vite build configurations
- `.gitignore` — Production git ignore rules

---

## ⚡ Quick Start Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
- **Frontend Dev Server** (runs on `http://localhost:3000`):
  ```bash
  npm run dev
  ```
- **Backend API Server** (runs on `http://localhost:3001`):
  ```bash
  node server/index.js
  ```

---

## 📦 How to Push to Git

Execute the following commands inside this folder:

```bash
git init
git add .
git commit -m "Initial commit: TechZen platform ready for deployment"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```
