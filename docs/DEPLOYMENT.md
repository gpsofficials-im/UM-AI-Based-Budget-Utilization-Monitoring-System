# Git & GitHub Deployment Guide

This document provides complete instructions for deploying the **AI-Based Budget Utilization Monitoring System** using **Git**, **GitHub Actions (CI/CD)**, **GitHub Pages**, and **Git-based Server Hooks**.

---

## 1. Git Repository Initialization & Setup

### Step 1: Initialize Git Repository
Initialize the repository locally and commit project assets:
```bash
git init
git add .
git commit -m "feat: initial commit of AI Budget Utilization Monitoring System"
```

### Step 2: Link Remote GitHub Repository
Create a repository on [GitHub](https://github.com/new) and link your local working tree:
```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

---

## 2. Automated CI/CD Deployment via GitHub Actions

The repository includes a ready-to-use GitHub Actions workflow located at [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml).

### Workflow Triggers
Whenever code is pushed or merged into `main` / `master`, GitHub Actions automatically:
1. **Backend Pipeline**:
   - Checks out the repository via Git.
   - Installs Node.js dependencies (`npm install`).
   - Runs automated Jest verification tests (`npm test`).
   - Compiles TypeScript to production JavaScript (`npm run build`).
2. **Frontend Pipeline**:
   - Checks out the repository via Git.
   - Installs Angular frontend dependencies (`npm install`).
   - Builds optimized Angular production bundles (`npm run build`).

### Configuring GitHub Secrets & Variables
To provide database and authentication credentials securely in GitHub:
1. Navigate to your GitHub Repository **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret** and add:
   - `MONGODB_URI`: MongoDB connection string (e.g. `mongodb+srv://<user>:<password>@cluster0.mongodb.net/ai_budget_monitoring`)
   - `JWT_SECRET`: Secure random JWT secret key (min 32 characters)
   - `CLIENT_URL`: Domain URL of the client frontend
   - `NODE_ENV`: `production`

---

## 3. Frontend Deployment to GitHub Pages

You can host the Angular single-page frontend directly on **GitHub Pages**:

### Option A: Using Angular CLI Deploy to GitHub Pages
```bash
cd frontend
# Build with GitHub Pages base-href
npx ng build --configuration production --base-href /<your-repo-name>/

# Deploy using angular-cli-ghpages
npx angular-cli-ghpages --dir=dist/ai-budget-monitoring-frontend/browser
```

### Option B: Automated GitHub Pages via GitHub Actions
Add the GitHub Pages deployment step to `.github/workflows/deploy.yml` with the built `dist/ai-budget-monitoring-frontend/browser` folder.

---

## 4. Git-Based Server Deployment (Self-Hosted / VPS with Git Hooks)

For deploying backend and frontend on your server using Git:

### Step 1: Clone Repository on the Server
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git /var/www/budget-system
cd /var/www/budget-system
```

### Step 2: Automated Deployment Script (`deploy.sh`)
```bash
#!/bin/bash
set -e

echo "📥 Pulling latest changes from Git repository..."
git pull origin main

echo "⚙️ Building Backend..."
cd backend
npm install --production=false
npm run build
pm2 restart budget-backend || pm2 start dist/server.js --name "budget-backend"

echo "🎨 Building Frontend..."
cd ../frontend
npm install
npm run build

echo "✅ Git deployment complete!"
```

### Step 3: Git Post-Receive Hook (Instant Push-to-Deploy)
Set up a bare Git repository on your server with a `post-receive` hook to trigger automatic updates whenever you run `git push live main`:
```bash
#!/bin/bash
GIT_WORK_TREE=/var/www/budget-system git checkout -f
cd /var/www/budget-system
bash deploy.sh
```

---

## 5. Database Connection: MongoDB Atlas / Local MongoDB
1. Create a database on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or run a local instance.
2. Ensure network access whitelists your server IP.
3. Configure `MONGODB_URI` in your backend `.env` or GitHub Secrets.
4. Populate demonstration data:
   ```bash
   cd backend
   npm run seed
   ```

