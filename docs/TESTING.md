# Comprehensive Testing Specification & Verification Suite

This document outlines the automated and integration verification tests for the **AI-Based Budget Utilization Monitoring System**.

---

## 1. Automated Test Execution

### Running Backend Tests
From the `backend/` directory:
```bash
npm test
```

### Test Coverage Highlights:
1. **Mathematical Utilization Engine**:
   - Accurately calculates `(Total Expenditure / Allocated Budget) * 100`.
   - Correctly assigns utilization bands (`LOW` < 40%, `NORMAL` 40-79%, `HIGH` 80-99%, `OVERSPENDING` >= 100%).
   - Safeguards against zero division or negative inputs.
   - Calculates financial year elapsed percentages.
2. **Authentication & JWT**:
   - Secure login verification with bcrypt password matching.
   - Rejection of invalid credentials with proper HTTP 401 response codes.
   - JWT issuance and decoding.
3. **Role-Based Access Control (RBAC)**:
   - Verifies `FINANCE_OFFICER` is blocked (403 Forbidden) from administrative user creation/deletion.
   - Verifies `ADMIN` access to audit logs and user management.
   - Enforces department scoping so `DEPARTMENT_HEAD` users are restricted to their assigned department.
4. **Dashboard Aggregations & Health**:
   - Verifies health check returns `status: "ok"`.
   - Verifies dynamic KPI calculations.

---

## 2. End-to-End Workflow Verification

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| **1. Login** | Log in with `admin@gov.in` / `Admin@123` | Redirected to Executive Dashboard with populated KPI cards and 5 dynamic charts. |
| **2. Department Mgmt** | Admin creates a new Department | Department saved in MongoDB and logged in Audit Trail. |
| **3. User Assignment** | Admin creates a `DEPARTMENT_HEAD` account | Officer user created with bcrypt password hash. |
| **4. Budget Allocation** | Finance Officer creates new Budget for 2025-26 | Budget allocated with unique code (e.g. `BDG-202526-001`). |
| **5. Record Expense** | Log an expenditure with receipt attachment | Disbursement recorded, remaining balance reduced. |
| **6. Anomaly Detection**| Trigger high disbursement (e.g. breach budget cap) | Anomaly engine detects overspending and automatically records a `CRITICAL` alert. |
| **7. Department Head** | Log in with `depthead.it@gov.in` | Department head views assigned department and acknowledges alert. |
| **8. Resolution** | Finance Officer marks alert resolved with notes | Status updated to `RESOLVED` and audit log preserved. |
| **9. Report Export** | Click **Export PDF** on Reports page | Formal formatted PDF report is downloaded. |
| **10. Audit Inspection**| Admin views Audit Logs | All activities, state snapshots, and IP addresses displayed. |
