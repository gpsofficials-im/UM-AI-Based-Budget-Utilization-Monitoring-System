# Deployment Guide: Firebase & GitHub Pages Architecture

This document provides end-to-end instructions for deploying the **AI-Based Budget Utilization Monitoring System** using **Firebase Serverless Architecture** (Authentication, Cloud Firestore, Firebase Storage, Cloud Functions) and **GitHub Pages / Firebase Hosting**.

---

## 1. Prerequisites & CLI Setup

1. **Node.js**: v18 or higher (Recommended: v20 or v22)
2. **Angular CLI**: v19 (`npm install -g @angular/cli`)
3. **Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```
4. **Firebase Login**:
   ```bash
   firebase login
   ```

---

## 2. Firebase Project Configuration

### Step 1: Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `ai-budget-monitoring-system` (or your preferred name).
3. Enable **Google Analytics** (optional) and create the project.

### Step 2: Enable Firebase Services
1. **Firebase Authentication**:
   - Go to **Build > Authentication > Get Started**.
   - Enable **Email/Password** provider (Email link is optional, Email/Password is required).
2. **Cloud Firestore**:
   - Go to **Build > Firestore Database > Create Database**.
   - Start in **Production mode** (Security rules are provided in `firestore.rules`).
   - Select your preferred region (e.g., `asia-south1` or `us-central1`).
3. **Firebase Storage**:
   - Go to **Build > Storage > Get Started**.
   - Start in **Production mode** (Security rules are provided in `storage.rules`).
4. **Cloud Functions**:
   - Upgrade your Firebase project to the **Blaze (Pay as you go)** plan (required for Cloud Functions).

### Step 3: Configure Frontend Environments
1. In Firebase Console, go to **Project Settings** > **General** > **Your apps** > Add Web App (`</>`).
2. Copy the `firebaseConfig` object and paste it into:
   - `frontend/src/environments/environment.ts` (Development)
   - `frontend/src/environments/environment.prod.ts` (Production)

Example format:
```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: "AIzaSy...",
    authDomain: "ai-budget-monitoring-system.firebaseapp.com",
    projectId: "ai-budget-monitoring-system",
    storageBucket: "ai-budget-monitoring-system.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef"
  }
};
```

---

## 3. Deploying Firebase Rules, Indexes & Cloud Functions

### Step 1: Link Local Repository to Firebase Project
```bash
# In the project root directory
firebase use ai-budget-monitoring-system
```

### Step 2: Build Cloud Functions
```bash
cd functions
npm install
npm run build
cd ..
```

### Step 3: Deploy Firestore Security Rules & Indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Step 4: Deploy Storage Security Rules
```bash
firebase deploy --only storage
```

### Step 5: Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### Step 6: Seed Initial Demonstration Data
You can seed demonstration data either via the Cloud Function endpoint or by calling the `seedInitialData` callable function:
```bash
# Via Firebase CLI or by executing the seed function
firebase functions:shell
> seedInitialData()
```

---

## 4. Frontend Deployment Options

### Option A: Deploy to GitHub Pages (Automated CI/CD via GitHub Actions)

The repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. **Repository Settings**:
   - In your GitHub repository, go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Migrate budget monitoring system to Firebase"
   git push origin main
   ```
3. GitHub Actions will automatically:
   - Install dependencies (`npm ci --legacy-peer-deps`).
   - Build Angular with `--base-href /UM-AI-Based-Budget-Utilization-Monitoring-System/`.
   - Ensure `404.html` SPA fallback routing is in place.
   - Deploy build artifacts to GitHub Pages at:
     `https://gpsofficials-im.github.io/UM-AI-Based-Budget-Utilization-Monitoring-System/`

#### Manual Build for GitHub Pages:
```bash
cd frontend
npm install --legacy-peer-deps
npx ng build --configuration production --base-href /UM-AI-Based-Budget-Utilization-Monitoring-System/
# Deploy output from dist/ai-budget-monitoring-frontend/browser
```

---

### Option B: Deploy to Firebase Hosting

Firebase Hosting provides zero-config SSL, CDN caching, and built-in SPA URL rewriting:

1. Build production frontend:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
3. Your application will be live at:
   `https://ai-budget-monitoring-system.web.app`

---

## 5. Local Development with Firebase Emulators

Run the entire stack locally without touching production databases:

```bash
# Start Firebase Local Emulator Suite (Firestore, Auth, Storage, Functions)
firebase emulators:start

# In a separate terminal, launch the Angular development server:
cd frontend
npm start
```
- Emulator UI: `http://localhost:4000`
- Angular App: `http://localhost:4200`

