# API Documentation: AI-Based Budget Utilization Monitoring System

Base URL: `http://localhost:5000/api`

---

## 1. System Health

### `GET /health`
* **Description**: Returns system availability, uptime, and status.
* **Auth**: Public
* **Response (200 OK)**:
```json
{
  "status": "ok",
  "service": "budget-monitoring-api",
  "timestamp": "2026-09-07T15:30:00.000Z",
  "uptime": 124.5
}
```

---

## 2. Authentication & Profile

### `POST /auth/login`
* **Description**: Authenticate user and issue JWT token.
* **Auth**: Public
* **Body**:
```json
{
  "email": "admin@gov.in",
  "password": "Admin@123"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "64f1...",
      "name": "Rajiv Malhotra",
      "email": "admin@gov.in",
      "role": "ADMIN",
      "department": null,
      "lastLogin": "2026-09-07T15:30:00.000Z"
    }
  }
}
```

### `GET /auth/me`
* **Description**: Retrieve active user profile.
* **Auth**: Bearer Token
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "64f1...",
    "name": "Sneha Kulkarni",
    "email": "finance@gov.in",
    "role": "FINANCE_OFFICER"
  }
}
```

---

## 3. Executive Dashboard

### `GET /dashboard/summary`
* **Description**: Returns 8 core financial KPIs.
* **Auth**: Bearer Token
* **Query Params**: `financialYear` (optional), `departmentId` (optional)
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "totalBudget": 583000000,
    "totalApproved": 583000000,
    "totalSpent": 243200000,
    "remainingBudget": 339800000,
    "utilizationPercentage": 41.72,
    "utilizationBand": "NORMAL",
    "utilizationBandLabel": "Normal Utilization (40% - 79%)",
    "totalDepartments": 5,
    "activeAlerts": 3,
    "criticalAlerts": 1,
    "totalAnomalies": 3,
    "underUtilizedCount": 1,
    "overspendingCount": 1
  }
}
```

### `GET /dashboard/trends`
* **Description**: Monthly expenditure time series for charts.
* **Auth**: Bearer Token
* **Query Params**: `financialYear`, `departmentId`

### `GET /dashboard/departments`
* **Description**: Department-wise allocation, expenditure, and utilization rates.
* **Auth**: Bearer Token

---

## 4. Budget Management

### `GET /budgets`
* **Description**: List all budgets with pagination, search, and utilization metrics.
* **Auth**: Bearer Token
* **Query Params**: `page`, `limit`, `financialYear`, `quarter`, `departmentId`, `status`, `search`

### `POST /budgets`
* **Description**: Create new budget allocation.
* **Auth**: Bearer Token (`ADMIN`, `FINANCE_OFFICER`)
* **Body**:
```json
{
  "projectScheme": "AI Compute Cluster",
  "department": "64f1...",
  "financialYear": "2025-26",
  "quarter": "ANNUAL",
  "allocatedAmount": 100000000,
  "approvedAmount": 100000000,
  "status": "ALLOCATED",
  "description": "High performance server compute nodes."
}
```

---

## 5. Expenditure Ledger

### `GET /expenditures`
* **Description**: Fetch disbursements with category and department filtering.
* **Auth**: Bearer Token

### `POST /expenditures`
* **Description**: Record expenditure transaction with optional document attachment (`multipart/form-data`).
* **Auth**: Bearer Token (`ADMIN`, `FINANCE_OFFICER`, `DEPARTMENT_HEAD`)

---

## 6. Anomaly Detection & Alerts

### `GET /alerts`
* **Description**: List detected financial irregularities.
* **Auth**: Bearer Token
* **Query Params**: `status`, `severity`, `alertType`, `departmentId`

### `PUT /alerts/:id/acknowledge`
* **Description**: Acknowledge an open anomaly alert.
* **Auth**: Bearer Token

### `PUT /alerts/:id/resolve`
* **Description**: Mark alert resolved with mandatory resolution notes.
* **Auth**: Bearer Token (`ADMIN`, `FINANCE_OFFICER`)
* **Body**:
```json
{
  "resolutionNotes": "Supplementary grant approved by Ministry Directorate."
}
```

### `POST /alerts/scan`
* **Description**: Manually trigger complete anomaly detection scan.
* **Auth**: Bearer Token (`ADMIN`, `FINANCE_OFFICER`)

---

## 7. Reports

### `GET /reports/budget?format=pdf`
* **Description**: Generates and streams a formal Budget Summary PDF or CSV.

### `GET /reports/expenditure?format=csv`
* **Description**: Streams Expenditure transaction ledger in CSV format.

### `GET /reports/anomalies?format=pdf`
* **Description**: Streams Anomaly & Irregularities audit document in PDF.
