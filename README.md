# PassGuard — Visitor Pass Management System

PassGuard is a full-stack **Visitor Pass Management System** built using the MERN stack with TypeScript. It helps organizations manage visitor registration, employee approvals, visitor check-in/check-out, visitor history, reports, and activity tracking.

The application provides role-based access for **Administrators, Receptionists, and Employees**, with protected frontend routes and backend APIs.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* Secure user login
* Role-based session verification
* Protected frontend routes
* Protected backend APIs
* Role-based access control
* Automatic role-based navigation
* Password hashing using Node.js Built-in Crypto (HMAC SHA-256)
* Server-side password pepper support
* Session/user context management

### 👥 User Roles

PassGuard supports three primary roles.

#### Administrator

* View overall dashboard
* Manage employees
* Manage application user accounts
* View visitor reports
* View activity history
* Monitor application/database health

#### Receptionist

* Register visitors
* Create visitor requests
* View visitor records
* Check in approved visitors
* Check out visitors
* Search and filter visitor history

#### Employee

* View pending visitor requests
* Approve visitor requests
* Reject visitor requests
* Add remarks
* View relevant visitor information

---

## 📊 Role-Based Dashboards

Each role receives a dashboard containing information relevant to its responsibilities.

### Administrator Dashboard

* Total visitors
* Today's visitors
* Visitors currently inside
* Pending requests
* Total employees
* Approved/rejected visits
* Recent activity

### Receptionist Dashboard

* Today's visitors
* Pending requests
* Approved visitors
* Visitors currently inside
* Completed visits

### Employee Dashboard

* Pending visitor requests
* Approved requests
* Rejected requests
* Today's scheduled visitors
* Visitors currently inside

---

# 🔄 Visitor Workflow

The application follows the following visitor workflow:

```text
Receptionist
     │
     ▼
Create Visitor Request
     │
     ▼
Employee Reviews Request
     │
     ├───────────────┐
     ▼               ▼
  APPROVED        REJECTED
     │
     ▼
Receptionist Checks In Visitor
     │
     ▼
Visitor Currently Inside
     │
     ▼
Receptionist Checks Out Visitor
     │
     ▼
Visitor History + Activity Log
```

---

# 📋 Visitor Registration

Receptionists can create visitor requests containing relevant visitor and visit information.

### Visitor information

* Visitor name
* Phone number
* Email
* Company/organization
* Employee/host to visit
* Visit date
* Expected arrival time
* Purpose of visit

After registration, the request is placed in a **PENDING** state and becomes available to the selected employee for approval.

---

# 🧠 Business Rules

The application implements the required visitor management business rules on the **backend**.

### Rule 1 — Active Visit

A visitor cannot have more than one active visit at the same time.

### Rule 2 — Duplicate Registration

The same visitor cannot be registered more than once for the same date.

### Rule 3 — Visit Date

A visit date cannot be earlier than the current date.

### Rule 4 — Expected Arrival Time

For today's visits, the expected arrival time cannot be earlier than the current time.

### Rule 5 — Pending Request Limit

An employee cannot have more than three pending visitor requests awaiting approval.

### Rule 6 — Approval Required

A visitor can only be checked in after the visit has been approved by the employee.

### Rule 7 — Duplicate Check-In Prevention

A visitor who is already checked in cannot be checked in again until they have been checked out.

### Rule 8 — Check-Out Validation

The check-out time must always be later than the check-in time.

### Rule 9 — Rejected Requests

Rejected visitor requests cannot be checked in.

### Rule 10 — Cancelled Visits

Cancelled visits are excluded from active visitor lists.

---

# 🔎 Search & Filtering

Visitor records can be searched and filtered using combinations of:

* Visitor name
* Employee/host name
* Visit date
* Visitor status
* Employee ID

Supported visitor statuses include:

```text
PENDING
APPROVED
REJECTED
CHECKED_IN
CHECKED_OUT
CANCELLED
```

---

# 📈 Reports

The reporting module provides visitor statistics using configurable date filters.

Supported filters include:

* Today
* This Week
* Custom Date Range

Reports can provide statistics such as:

* Total visitors
* Pending requests
* Approved visits
* Rejected visits
* Checked-in visitors
* Checked-out visitors
* Currently active visitors

---

# 📝 Activity History

PassGuard maintains an activity history for important visitor actions.

Tracked activities include:

```text
CREATED
APPROVED
REJECTED
CHECKED_IN
CHECKED_OUT
CANCELLED
```

Each activity records:

* Action performed
* Date and time
* User who performed the action
* Related visitor/visit

This provides an audit-friendly history of visitor activity.

---

# 🛠️ Technology Stack

## Frontend

* React.js (v19)
* TypeScript
* Vite
* Tailwind CSS (v4)
* Reusable React components

## Backend

* Node.js
* Express.js
* TypeScript
* HMAC SHA-256 Password Cryptography
* REST APIs

## Database

* MongoDB
* Mongoose
* MongoDB Atlas

## Development & Deployment

* Git
* GitHub
* Vercel / Netlify
* MongoDB Atlas

---

# 📁 Project Structure

```text
passguard/
│
├── src/                      # React Frontend Source Code
│   ├── components/           # Reusable components (layout, visitor forms, common)
│   ├── context/              # Toast & Authentication React Contexts
│   ├── pages/                # Main workspace views (Admin, Host Approvals, Receptionist Hub)
│   ├── services/             # Frontend api clients
│   ├── types/                # TypeScript shared interfaces
│   ├── utils/                # Helper utility formatters
│   ├── App.tsx               # Primary React entry routing wrapper
│   └── main.tsx              # SPA mount script
│
├── server/                   # Express Backend Source Code
│   ├── models/               # Mongoose DB collection schemas
│   ├── routes/               # API route controllers (auth, visitors, employees, users, activities)
│   ├── utils/                # Secure hashing & cryptography helpers
│   ├── db.ts                 # Database persistence controller & local JSON sync logic
│   └── seed.ts               # Core persona initial database seeder
│
├── data/                     # Local Persistence Engine
│   └── db_store.json         # Fail-safe local database JSON file backup
│
├── .env.example              # Environment variables template
├── .gitignore                # Source control filters
├── package.json              # Main project scripts and dependency manifest
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite bundler parameters
└── server.ts                 # Main unified full-stack server entry
```

---

# ⚙️ Environment Configuration

Create a `.env` file from the provided `.env.example`.

```bash
cp .env.example .env
```

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### Environment Variables

| Variable          | Description                            | Example                                                     |
| ----------------- | -------------------------------------- | ----------------------------------------------------------- |
| `MONGODB_URI`     | MongoDB connection string              | `mongodb+srv://user:password@cluster.mongodb.net/passguard` |
| `PORT`            | Backend/server port                    | `3000`                                                      |
| `NODE_ENV`        | Application environment                | `development`                                               |
| `PASSWORD_PEPPER` | Additional server-side password pepper | `your-secure-pepper`                                        |

### Example `.env`

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/passguard
PORT=3000
NODE_ENV=development
PASSWORD_PEPPER=replace_with_a_secure_random_pepper
```

> Never commit the `.env` file or production secrets to GitHub.

---

# 📦 Installation

### Prerequisites

Make sure the following are installed:

* Node.js 18+
* npm
* MongoDB Atlas account or local MongoDB
* Git

Check Node.js:

```bash
node --version
```

Check npm:

```bash
npm --version
```

---

# 🚀 Local Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

```bash
cd passguard
```

### 2. Install dependencies

```bash
npm install
```

---

# 🌱 Database Seeding

Initialize the default users and required initial data:

```bash
npm run seed
```

The seed process creates the required application users and initial configuration.

### Demo Administrator

```text
Email: admin@company.com
Password: Admin@123
Role: Administrator
```

> Change demo credentials before using the application in a real production environment.

Additional demo users can be created through the administrator user-management module.

---

# ▶️ Running the Application

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

# 🏗️ Production Build

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

# 🔌 API Documentation

All API endpoints use the `/api` prefix.

---

## 🔐 Authentication

### Login

```http
POST /api/auth/login
```

Authenticates a user and returns the authenticated session.

### Get Current User

```http
GET /api/auth/me
```

Returns the currently authenticated user's information.

---

# 👤 Visitor APIs

### Get Visitors

```http
GET /api/visitors
```

Returns visitor/visit records.

### Supported Query Parameters

```text
search
status
employeeId
visitDate
```

Example:

```http
GET /api/visitors?search=John&status=PENDING
```

---

### Register Visitor

```http
POST /api/visitors
```

Creates a new visitor request.

Example request:

```json
{
  "visitorName": "John Doe",
  "visitorPhone": "9876543210",
  "visitorEmail": "john@example.com",
  "visitorCompany": "Example Technologies",
  "employeeId": "emp-01",
  "visitDate": "2026-10-10",
  "expectedArrivalTime": "10:30",
  "purpose": "Business Meeting"
}
```

The backend validates the required business rules before creating the request.

---

### Update Visitor Status

```http
PUT /api/visitors/:id/status
```

Updates a visit status. Enforces strict transitions and business rules.

#### Request Body Parameters:
* `action` (`APPROVE` | `REJECT` | `CHECK_IN` | `CHECK_OUT` | `CANCEL`)
* `remarks` (Reason code or instructions)

---

# 👥 Employee APIs

### Get Employees

```http
GET /api/employees
```

Returns available employees/hosts.

### Create Employee

```http
POST /api/employees
```

Creates an employee/host profile.

### Delete Employee

```http
DELETE /api/employees/:id
```

Deletes an employee profile.

**Authorization:** Administrator

---

# 👤 User Management APIs

### Get Users

```http
GET /api/users
```

Returns application user accounts.

**Authorization:** Administrator

### Create User

```http
POST /api/users
```

Creates an application user.

Supported roles:

```text
ADMIN
RECEPTIONIST
EMPLOYEE
```

### Toggle User Status

```http
POST /api/users/:id
```

Enables or disables a user account.

**Authorization:** Administrator

### Delete User

```http
DELETE /api/users/:id
```

Deletes a user account.

**Authorization:** Administrator

---

# 📊 Dashboard & Reports

### Visitor Summary

```http
GET /api/visitors/metrics/summary
```

Returns visitor statistics used by dashboards.

### Reports

```http
GET /api/visitors/reports
```

Supports date-based reporting.

Example:

```http
GET /api/visitors/reports?period=custom&startDate=2026-10-01&endDate=2026-10-06
```

---

# 📝 Activity APIs

### Activity Logs

```http
GET /api/activity/logs
```

Returns visitor activity history.

---

# 💓 Health & Database Status

### Application Health

```http
GET /api/health
```

Returns the general application health status.

### Database Status

```http
GET /api/database/status
```

Returns database connection information required for application diagnostics.

---

# 🔒 Authorization Model

PassGuard uses role-based authorization.

| Feature             | Administrator | Receptionist | Employee |
| ------------------- | :-----------: | :----------: | :------: |
| Dashboard           |       ✅       |       ✅      |     ✅    |
| Register Visitor    |       ❌       |       ✅      |     ❌    |
| Approve Visitor     |       ❌       |       ❌      |     ✅    |
| Reject Visitor      |       ❌       |       ❌      |     ✅    |
| Check In            |       ❌       |       ✅      |     ❌    |
| Check Out           |       ❌       |       ✅      |     ❌    |
| Visitor History     |       ✅       |       ✅      | Relevant |
| Employee Management |       ✅       |       ❌      |     ❌    |
| User Management     |       ✅       |       ❌      |     ❌    |
| Reports             |       ✅       |   Optional   | Optional |
| Activity History    |       ✅       |   Optional   | Optional |

Backend authorization is enforced independently of frontend navigation.

---

# 🗄️ Data Models

The application uses separate collections/entities for users, employees, visitors/visits, and activity logs.

### User

```text
id
name
email
password
role
isActive
createdAt
```

### Employee

```text
id
name
email
department
designation
isActive
createdAt
```

### Visitor / Visit

```text
id
passNumber
visitorId
employeeId
visitDate
expectedArrivalTime
purpose
status
remarks
checkInTime
checkOutTime
createdAt
updatedAt
```

### Activity Log

```text
id
visitId
action
performedBy
createdAt
```

---

# 🧪 Validation & Error Handling

The application performs validation on both frontend and backend.

The API returns appropriate HTTP status codes and error messages for invalid requests.

---

# 📱 Responsive Design

The interface is designed to work across desktop, laptop, tablet, and mobile displays using Tailwind responsive layouts.

---

# 🧩 Code Quality

The project follows a modular architecture with:

* Reusable React components
* Separation of frontend and backend responsibilities
* Controller/route separation
* Centralized API services
* Authentication check helpers
* Role authorization checking
* TypeScript types/interfaces
* Environment-based configuration
* Consistent error handling

---

# 🛡️ Security Considerations

The application includes:

* Role-based session control
* Password hashing using Node.js Built-in Crypto (HMAC SHA-256)
* Server-side password pepper
* Protected backend routes
* Role-based authorization
* Input validation
* Environment variables for sensitive configuration
* No secrets committed to source control

---

# 🌐 Deployment

The application is prepared for seamless production deployments on cloud-ready static hosts and server runtime nodes.

---

# 📌 Important Notes

* MongoDB is the primary persistence layer.
* Local JSON persistence is built as an active fail-safe fallback mechanism for local testing.
* Production deployments should use MongoDB Atlas.
* Demo credentials are provided only for evaluation/testing.
* Secrets and `.env` files must not be committed to GitHub.
* Backend validation is authoritative; frontend validation is used for user experience.

---

# 📸 Screens / Modules

The application includes the following primary screens:

```text
Login
│
├── Administrator Dashboard
│   ├── Employee Management
│   ├── User Management
│   ├── Visitor Reports
│   └── Activity History
│
├── Receptionist Dashboard
│   ├── Register Visitor
│   ├── Visitor List
│   ├── Check In
│   ├── Check Out
│   └── Visitor History
│
└── Employee Dashboard
    ├── Pending Requests
    ├── Approve Request
    ├── Reject Request
    └── Visitor Requests
```

---

# 📄 Assessment Requirements Coverage

| Requirement          | Implementation                   |
| -------------------- | -------------------------------- |
| Authentication       | Secure session authentication    |
| Role-based access    | Admin, Receptionist, Employee    |
| Protected pages      | React route protection           |
| Protected APIs       | Backend authorization checks     |
| Visitor registration | Receptionist module              |
| Employee approval    | Employee module                  |
| Check-in             | Receptionist module              |
| Check-out            | Receptionist module              |
| Visitor history      | Visitor management               |
| Search               | Visitor search                   |
| Filtering            | Status/date/employee filters     |
| Reports              | Date-based visitor reports       |
| Activity history     | Activity log                     |
| Input validation     | Frontend + backend               |
| Error handling       | API + UI                         |
| Responsive UI        | Tailwind responsive layouts      |
| MongoDB              | Mongoose/MongoDB Atlas           |
| API documentation    | Included in README               |

---

# 👨💻 Author

**Sanjay**

Full Stack Developer | MERN Stack

Built as a Full-Stack Developer assessment project demonstrating:

* React
* TypeScript
* Node.js
* Express.js
* MongoDB
* REST API development
* Authentication
* Role-based authorization
* Business logic
* Responsive UI development

---

# 📜 License

This project was created for evaluation and demonstration purposes.
