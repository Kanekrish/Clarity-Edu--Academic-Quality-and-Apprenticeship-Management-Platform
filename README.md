# Clarity 🎓
**Ofsted Readiness Platform for Degree Apprenticeships**

A full-stack web application with a React + TypeScript frontend (Vite) and a Node.js + Express backend using SQLite.

---

## Quick Start

### 1. Clone / open in VSCode
Open the `clarity/` folder as your workspace root(after unzip be sure you are in the right folder when starting the app.).

### 2. Install all dependencies
```bash
npm run install:all
```
This installs the root `concurrently`, then `backend/` deps, then `frontend/` deps.

### 3. Run the full stack in development
```bash
npm run dev
```
- **Backend** → [http://localhost:3000](http://localhost:3000)
- **Frontend** → [http://localhost:5173](http://localhost:5173)

The frontend Vite dev server proxies all `/api/*` requests to the backend automatically — no CORS issues.

---

## Individual Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start both frontend + backend |
| `npm run dev:backend` | Backend only (nodemon, auto-restart) |
| `npm run dev:frontend` | Frontend only (Vite HMR) |
| `npm run build` | Production build of the frontend |
| `npm run install:all` | Install all dependencies in one go |

---

## Environment Variables
**`backend/.env`**
```
PORT=3000
JWT_SECRET=clarity_secret_key_2026
NODE_ENV=development
```

**`frontend/.env`**
```
VITE_API_BASE_URL=/api
```

>  Change `JWT_SECRET` to a long random string before deploying to production.

---

## Database

SQLite file lives at `backend/clarity.db` (auto-created on first run).  
Schema is defined in `backend/src/db/schema.sql` and applied automatically at startup.

**Tables:** `users`, `learners`, `employers`, `modules`, `enrolments`, `assessments`, `ksb_mappings`, `schedules`, `evidence`, `feedback`

---

## User Roles

| Role | Value in DB |
|---|---|
| Programme Leader | `programme_lead` |
| Academic Staff | `academic_staff` |
| Apprenticeship Coach | `coach` |
| Employer / Mentor | `employer` |
| Ofsted Inspector | `ofsted_inspector` |
| Admin | `system_admin` |

## User LogIn

| Role | User email | User password
|---|---|---|
| Programme Leader | `programme_lead` | lead@uni.com | clarity123 |
| Academic Staff | `academic_staff` | academic@uni.com | clarity123 |
| Apprenticeship Coach | `coach` | coach@uni.com | clarity123 |
| Employer / Mentor | `employer` | mentor@uni.com | clarity123 |
| Ofsted Inspector | `ofsted_inspector` | inspector@uni.com |  clarity123 |
| Admin | `system_admin` | admin@clarity.com |  clarity123 |
