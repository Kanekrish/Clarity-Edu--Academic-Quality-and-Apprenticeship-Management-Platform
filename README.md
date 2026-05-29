````md
<div align="center">

# 🎓 Clarity
### Ofsted Readiness Platform for Degree Apprenticeships

<img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
<img src="https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />

<br/>
<br/>

> A modern full-stack platform designed to support degree apprenticeship management and Ofsted readiness.

</div>

---

# 📚 Table of Contents

- [✨ Features](#-features)
- [⚙️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📜 Available Commands](#-available-commands)
- [🔐 Environment Variables](#-environment-variables)
- [🗄️ Database](#️-database)
- [👥 User Roles](#-user-roles)
- [🔑 Demo Login Credentials](#-demo-login-credentials)

---

# ✨ Features

✅ Apprenticeship Management  
✅ Ofsted Readiness Tracking  
✅ Learner & Employer Management  
✅ Assessment Monitoring  
✅ Evidence Collection System  
✅ Role-Based Authentication  
✅ Modern Responsive Dashboard  
✅ SQLite Database Integration  

---

# ⚙️ Tech Stack

| Frontend | Backend | Database | Tools |
|---|---|---|---|
| React + TypeScript | Node.js + Express | SQLite | Vite |
| Tailwind CSS | JWT Authentication | SQL Schema | Concurrently |

---

# 🚀 Quick Start

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/clarity.git
cd clarity
````

---

## 2️⃣ Install Dependencies

```bash
npm run install:all
```

This command installs:

* Root dependencies
* Backend dependencies
* Frontend dependencies

---

## 3️⃣ Start Development Servers

```bash
npm run dev
```

### 🌐 Application URLs

| Service      | URL                   |
| ------------ | --------------------- |
| Backend API  | http://localhost:3000 |
| Frontend App | http://localhost:5173 |

> ⚡ The Vite development server automatically proxies `/api/*` requests to the backend.

---

# 📜 Available Commands

<div align="center">

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Run frontend + backend together  |
| `npm run dev:backend`  | Start backend only               |
| `npm run dev:frontend` | Start frontend only              |
| `npm run build`        | Create production frontend build |
| `npm run install:all`  | Install all dependencies         |

</div>

---

# 🔐 Environment Variables

## Backend `.env`

```env
PORT=3000
JWT_SECRET=clarity_secret_key_2026
NODE_ENV=development
```

---

## Frontend `.env`

```env
VITE_API_BASE_URL=/api
```

> ⚠️ Change `JWT_SECRET` before deploying to production.

---

# 🗄️ Database

The SQLite database file is automatically created on first startup.

### 📂 Database Location

```bash
backend/clarity.db
```

### 📄 Schema File

```bash
backend/src/db/schema.sql
```

---

## 📊 Database Tables

```text
users
learners
employers
modules
enrolments
assessments
ksb_mappings
schedules
evidence
feedback
```

---

# 👥 User Roles

| Role                 | Database Value     |
| -------------------- | ------------------ |
| Programme Leader     | `programme_lead`   |
| Academic Staff       | `academic_staff`   |
| Apprenticeship Coach | `coach`            |
| Employer / Mentor    | `employer`         |
| Ofsted Inspector     | `ofsted_inspector` |
| System Administrator | `system_admin`     |

---

# 🔑 Demo Login Credentials

<div align="center">

| Role                 | Email               | Password     |
| -------------------- | ------------------- | ------------ |
| Programme Leader     | `lead@uni.com`      | `clarity123` |
| Academic Staff       | `academic@uni.com`  | `clarity123` |
| Apprenticeship Coach | `coach@uni.com`     | `clarity123` |
| Employer / Mentor    | `mentor@uni.com`    | `clarity123` |
| Ofsted Inspector     | `inspector@uni.com` | `clarity123` |
| Administrator        | `admin@clarity.com` | `clarity123` |

</div>

---

# 🛡️ Security Notice

* Never expose production secrets publicly.
* Use secure JWT secrets in production.
* Configure HTTPS in deployment environments.

---

# 👨‍💻 Development Team

<div align="center">

### 🚀 Clarity Development Team

Built with dedication using modern web technologies.

</div>

---

# 📄 License

This project is for academic and educational purposes.

---

<div align="center">

## ⭐ If you like this project, consider giving it a star!

</div>
```
