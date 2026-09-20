# AI-Based Budget Utilization Monitoring System

A serverless enterprise web platform built with **Angular 19** and **Firebase** (Firebase Authentication, Cloud Firestore, Cloud Functions, and Firebase Storage) for government ministries, public sector undertakings, and enterprises to track budget allocations, monitor public expenditures, compute utilization bands, execute AI/analytical anomaly detection (under-utilization, overspending, spending spikes, budget deviations), manage alerts, generate audit logs, and export compliance reports in PDF and CSV.

---

## 🌟 Key Features

* **Executive Multi-KPI Dashboard**: 8 real-time KPI metrics & 5 Chart.js dynamic visualizations (Budget vs Expenditure, Department Utilization Rates, Monthly Fiscal Timeline, Disbursement Categories, and Anomaly Severity Distribution).
* **Budget Allocation Management**: Comprehensive Annual and Quarterly (`Q1`, `Q2`, `Q3`, `Q4`) budget allocations with safe financial arithmetic and status lifecycles (`ALLOCATED`, `APPROVED`, `REVISED`, `DRAFT`, `CLOSED`).
* **Expenditure Ledger & Receipt Storage**: Real-time disbursement recording with Firebase Storage document attachment (PDF, JPG, PNG) and budget cap checks.
* **AI & Analytical Anomaly Detection Engine**:
  * **Under-Utilization**: Flags schemes where >= 70% of the financial period has elapsed with < 40% funds deployed.
  * **Overspending**: Critical alert triggered when total actual expenditures breach approved budget caps.
  * **Spending Spike**: Identifies unusual transactions exceeding the historical mean by configured multipliers (e.g. 1.5x - 3.5x).
  * **Budget Deviation**: Detects anomalous variations beyond permitted percentage tolerance buffers.
* **Alert & Remediation Workflow**: Complete acknowledgment and resolution workflows with mandatory resolution remarks.
* **Role-Based Access Control (RBAC)**:
  * `ADMIN`: Full access to users, departments, budgets, audit logs, and anomaly detection thresholds.
  * `FINANCE_OFFICER`: Manages allocations, disbursements, receipts, and resolves financial alerts.
  * `DEPARTMENT_HEAD`: Scoped access strictly to assigned department's budget, expenditures, and alerts.
* **Compliance Reporting**: Live data preview with one-click export to **PDF** (via jsPDF) and **CSV**.
* **Tamper-Evident Audit Logging**: Chronological immutable Firestore collection tracking all logins, allocations, expenditures, and threshold changes.

---

## 🏗️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Angular 19 (Standalone Components, Signals, Reactive Forms), TypeScript, TailwindCSS, Remixicon |
| **Visualizations** | Chart.js |
| **Authentication** | Firebase Authentication (Email/Password & Demo accounts) |
| **Database** | Google Cloud Firestore (NoSQL, Real-time collections, Security Rules) |
| **Storage** | Firebase Storage (Receipt attachments: PDF, PNG, JPG, WebP) |
| **Backend / Functions** | Firebase Cloud Functions (Node.js 20, TypeScript) |
| **Hosting & CI/CD** | GitHub Pages & Firebase Hosting with GitHub Actions CI/CD |

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18+ (Tested on v20 & v22)
* **npm**: v9+
* **Firebase CLI**: `npm install -g firebase-tools`

### 1. Setup Angular Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start        # Launches Angular dev server on http://localhost:4200
```

### 2. Setup Firebase Cloud Functions (Optional / Backend)
```bash
cd functions
npm install
npm run build
```

Open your browser at `http://localhost:4200` to access the portal.

---

## 🔑 Demonstration Accounts

The system comes pre-configured with 5 role-based demonstration accounts for instant testing:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Chief Administrator** | `admin@gov.in` | `Admin@123` | Global System Access, Users, Thresholds, Audit Logs |
| **Chief Financial Officer** | `finance@gov.in` | `Finance@123` | Global Budgets, Expenditures, Anomaly Resolution |
| **Dept Head (IT / MEITY)** | `depthead.it@gov.in` | `Dept@123` | Scoped to Ministry of Electronics & IT |
| **Dept Head (Health / MOHFW)** | `depthead.health@gov.in` | `Dept@123` | Scoped to Dept of Health & Family Welfare (Overspending Demo) |
| **Dept Head (Higher Education)**| `depthead.edu@gov.in` | `Dept@123` | Scoped to Dept of Higher Education (Under-utilization Demo) |

*(Quick-fill demo buttons are available directly on the login screen for 1-click access)*

---

## 📁 Repository Structure

```
ai-budget-monitoring-system/
│
├── .github/
│   └── workflows/deploy.yml # GitHub Actions CI/CD to GitHub Pages
│
├── firebase.json            # Firebase Hosting, Functions, Firestore, Storage, Emulators
├── firestore.rules          # Firestore Security Rules (RBAC, Audit immutability)
├── firestore.indexes.json   # Firestore Composite Indexes
├── storage.rules            # Firebase Storage Security Rules
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # AuthService, FirestoreService, StorageService, ApiService, Guards
│   │   │   ├── shared/      # Navbar, Sidebar, KPI Card, Toast components
│   │   │   ├── features/    # Dashboard, Budgets, Expenditures, Alerts, Departments, Users, Reports, Audit
│   │   │   ├── layout/      # Main responsive layout wrapper
│   │   │   └── app.routes.ts# Angular route definitions
│   │   ├── environments/    # Firebase config environments (dev & prod)
│   │   ├── public/404.html  # SPA routing fallback for GitHub Pages
│   │   └── styles.css       # TailwindCSS and theme styles
│   ├── package.json
│   └── angular.json
│
├── functions/
│   ├── src/
│   │   ├── anomaly/         # Serverless Anomaly Engine (4 analytical rules)
│   │   ├── services/        # Utilization service & Report generator
│   │   ├── seed/            # Firestore dataset seeder
│   │   └── index.ts         # Cloud Function endpoints & callables
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   ├── DEPLOYMENT.md        # Complete Firebase and GitHub Pages deployment guide
│   ├── DATABASE_SCHEMA.md   # Firestore Collections schema & structures
│   └── TESTING.md           # Automated and manual verification guide
│
└── README.md
```

---

## 📜 License
Government Financial Monitoring System &copy; 2026. Built with standard open-source technologies.
