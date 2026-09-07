# Database Schema & Model Architecture

Database Engine: **MongoDB with Mongoose ODM**

---

## Entity Relationship Overview

```
User (Role: ADMIN, FINANCE_OFFICER, DEPARTMENT_HEAD)
 └── Department (1:N)

Department
 ├── Users (1:N)
 ├── Budgets (1:N)
 ├── Expenditures (1:N)
 └── Alerts (1:N)

Budget (Financial Year, Quarter, Allocated, Approved)
 └── Expenditures (1:N)

Expenditure (Category, Vendor, Amount, Receipt Document)
 └── Budget (N:1)

Alert (Type, Severity, DetectedValue, Threshold, Status)
 └── Department (N:1)

AuditLog (User, Action, EntityType, PreviousValue, NewValue, Timestamp)
```

---

## 1. `User` Schema
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | Max 120 chars |
| `email` | String | Yes | Unique, Lowercase, Regex validated |
| `passwordHash` | String | Yes | bcrypt hashed |
| `role` | String (Enum) | Yes | `ADMIN`, `FINANCE_OFFICER`, `DEPARTMENT_HEAD` |
| `department` | ObjectId (Ref: Department) | No | Required for `DEPARTMENT_HEAD` |
| `status` | String (Enum) | Yes | `ACTIVE`, `INACTIVE` |
| `lastLogin` | Date | No | Timestamp of latest login |

---

## 2. `Department` Schema
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `code` | String | Yes | Unique, Uppercase (e.g. `MEITY`, `MOHFW`) |
| `name` | String | Yes | Full Ministry/Dept Name |
| `description` | String | No | Mission & Scope |
| `headOfDepartment`| String | No | Secretary / Director General |
| `contactEmail` | String | No | Official contact address |
| `status` | String (Enum) | Yes | `ACTIVE`, `INACTIVE` |

---

## 3. `Budget` Schema
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `budgetId` | String | Yes | Unique formatted code (e.g. `BDG-202526-MEITY-001`) |
| `financialYear`| String | Yes | Format `YYYY-YY` (e.g. `2025-26`) |
| `quarter` | String (Enum) | Yes | `ANNUAL`, `Q1`, `Q2`, `Q3`, `Q4` |
| `department` | ObjectId (Ref: Department) | Yes | Indexed |
| `projectScheme`| String | Yes | Name of Government scheme |
| `allocatedAmount`| Number | Yes | Non-negative decimal |
| `approvedAmount` | Number | Yes | Non-negative decimal |
| `status` | String (Enum) | Yes | `ALLOCATED`, `APPROVED`, `REVISED`, `DRAFT`, `CLOSED` |

---

## 4. `Expenditure` Schema
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `transactionId`| String | Yes | Unique formatted code (e.g. `TXN-2025-MEITY-01`) |
| `budget` | ObjectId (Ref: Budget) | Yes | Indexed |
| `department` | ObjectId (Ref: Department) | Yes | Indexed |
| `amount` | Number | Yes | Min: 0.01 |
| `category` | String (Enum) | Yes | `CAPITAL`, `OPERATIONAL`, `PROCUREMENT`, `SALARY`, `INFRASTRUCTURE`, `TRAINING`, `MAINTENANCE`, `OTHER` |
| `transactionDate`| Date | Yes | Default: Now |
| `vendorPayee` | String | Yes | Payee organization name |
| `supportingDocument`| Sub-document | No | `{ originalName, filename, path, mimeType, size }` |
| `status` | String (Enum) | Yes | `RECORDED`, `VERIFIED`, `FLAGGED`, `CANCELLED` |

---

## 5. `Alert` Schema
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `alertId` | String | Yes | Unique ID (e.g. `ALT-928371-102`) |
| `department` | ObjectId (Ref: Department) | Yes | Indexed |
| `budget` | ObjectId (Ref: Budget) | No | Associated Scheme |
| `alertType` | String (Enum) | Yes | `UNDER_UTILIZATION`, `OVERSPENDING`, `SPENDING_SPIKE`, `BUDGET_DEVIATION` |
| `severity` | String (Enum) | Yes | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `title` | String | Yes | Human-readable alert title |
| `description` | String | Yes | Analytical detection narrative |
| `detectedValue`| Number | Yes | Measured metric value |
| `threshold` | Number | Yes | Configured trigger boundary |
| `status` | String (Enum) | Yes | `OPEN`, `ACKNOWLEDGED`, `RESOLVED` |
| `resolutionNotes`| String | No | Remedial actions taken |

---

## 6. `AuditLog` Schema
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `user` | ObjectId (Ref: User) | No | Officer reference |
| `userEmail` | String | Yes | Officer email |
| `userRole` | String | Yes | Active role at time of action |
| `action` | String | Yes | Action code |
| `entityType` | String (Enum) | Yes | `BUDGET`, `EXPENDITURE`, `DEPARTMENT`, `USER`, `ALERT`, `CONFIG`, `AUTH`, `SYSTEM` |
| `previousValue`| Mixed | No | Prior state snapshot |
| `newValue` | Mixed | No | Updated state snapshot |
| `timestamp` | Date | Yes | Immutable event timestamp |
