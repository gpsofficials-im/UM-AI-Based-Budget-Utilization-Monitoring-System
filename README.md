# AI-Based Budget Utilization Monitoring System

A full-stack **MEAN (MongoDB, Express, Angular, Node.js)** enterprise web platform built for government ministries, public sector undertakings, and enterprises to track budget allocations, monitor public expenditures, compute utilization bands, execute rule-based anomaly detection (under-utilization, overspending, spending spikes, budget deviations), manage alerts, generate audit logs, and export reports in PDF and CSV.

---

## 🌟 Key Features

* **Executive Multi-KPI Dashboard**: 8 real-time KPI metrics & 5 Chart.js dynamic visualizations (Budget vs Expenditure, Department Utilization Rates, Monthly Fiscal Timeline, Disbursement Categories, and Anomaly Severity Distribution).
* **Budget Allocation Management**: Comprehensive Annual and Quarterly (`Q1`, `Q2`, `Q3`, `Q4`) budget allocations with safe financial arithmetic and status lifecycles (`ALLOCATED`, `APPROVED`, `REVISED`, `DRAFT`, `CLOSED`).
* **Expenditure Ledger & Audit Trails**: Real-time disbursement recording with receipt document attachment (PDF, JPG, PNG) and budget cap checks.
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
* **Compliance Reporting**: Live data preview with one-click export to **PDF** and **CSV**.
* **Tamper-Evident Audit Logging**: Chronological immutable tracking of all logins, allocations, expenditures, and threshold changes with state diff snapshots.

---

## 🏗️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Angular 19 (Standalone Components, Signals, Reactive Forms), TypeScript, TailwindCSS, Remixicon |
| **Visualizations** | Chart.js |
| **Backend API** | Node.js, Express.js, TypeScript |
| **Database & ODM** | MongoDB, Mongoose (with embedded MongoMemoryServer fallback for zero-config testing) |
| **Security & Auth** | JWT (JSON Web Tokens), bcryptjs password hashing, Helmet, CORS |
| **File Storage** | Multer |
| **Reporting** | PDFKit (PDF generation), json2csv (CSV generation) |
| **Testing** | Jest, Supertest, ts-jest |

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18+ (Tested on v24.15.0)
* **npm**: v9+

### 1. Clone & Setup Backend
```bash
cd backend
npm install
npm run seed     # Seeds realistic demonstration government datasets & test accounts
npm run dev      # Starts API server on http://localhost:5000
```

### 2. Setup Frontend
```bash
cd ../frontend
npm install
npm start        # Launches Angular dev server on http://localhost:4200
```

Open your browser at `http://localhost:4200` to access the portal.

---

## 🔑 Demonstration Accounts

The database comes pre-seeded with realistic government sample datasets and demonstration accounts:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Chief Administrator** | `admin@gov.in` | `Admin@123` | Global System Access, Users, Thresholds, Audit Logs |
| **Chief Financial Officer** | `finance@gov.in` | `Finance@123` | Global Budgets, Expenditures, Anomaly Resolution |
| **Dept Head (IT / MEITY)** | `depthead.it@gov.in` | `Dept@123` | Scoped to Ministry of Electronics & IT |
| **Dept Head (Health / MOHFW)** | `depthead.health@gov.in` | `Dept@123` | Scoped to Dept of Health & Family Welfare (Overspending Demo) |
| **Dept Head (Higher Education)**| `depthead.edu@gov.in` | `Dept@123` | Scoped to Dept of Higher Education (Under-utilization Demo) |

*(Quick-fill buttons for each role are also available directly on the login page for instant testing)*

---

## 🧪 Running Automated Tests

Run the complete backend test suite:
```bash
cd backend
npm test
```

Build production bundles:
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

---

## 📁 Repository Structure

```
ai-budget-monitoring-system/
│
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection & Multer configuration
│   │   ├── controllers/     # Auth, Dashboard, Budget, Expenditure, Alert, User, Report, Audit
│   │   ├── detection/       # Analytical Anomaly Detection Engine
│   │   ├── middleware/      # Auth, RBAC, Department scope, Audit logger, Error handling
│   │   ├── models/          # Mongoose schemas (User, Dept, Budget, Expenditure, Alert, Audit, Config)
│   │   ├── routes/          # Express API route declarations
│   │   ├── seed/            # Demonstration dataset seeder (npm run seed)
│   │   ├── services/        # Utilization math engine & PDF/CSV report services
│   │   ├── __tests__/       # Jest & Supertest automated verification suites
│   │   └── server.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # Auth, API, Interceptor, Route Guards, Models
│   │   │   ├── shared/      # Navbar, Sidebar, KPI Card, Toast components
│   │   │   ├── features/    # Dashboard, Budgets, Expenditures, Alerts, Departments, Users, Reports, Audit
│   │   │   ├── layout/      # Main responsive layout wrapper
│   │   │   └── app.routes.ts# Angular route definitions
│   │   └── styles.css       # TailwindCSS and theme styles
│   ├── package.json
│   └── angular.json
│
├── docs/
│   ├── API_DOCUMENTATION.md # Complete REST API specifications
│   ├── DATABASE_SCHEMA.md   # Schema tables & entity relationship diagrams
│   ├── DEPLOYMENT.md        # Render, AWS, Azure, Docker deployment instructions
│   └── TESTING.md           # Automated and manual verification guide
│
└── README.md
```

---

## 📜 License
Government Financial Monitoring System &copy; 2026. Built with standard open-source technologies.
