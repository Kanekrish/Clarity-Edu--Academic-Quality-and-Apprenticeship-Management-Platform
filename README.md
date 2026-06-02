# <div align="center">🎓 CLARITY</div>

<div align="center">

### Ofsted Readiness Platform for Degree Apprenticeships

<br>

<img src="https://img.shields.io/badge/React-TypeScript-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
<img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white"/>
<img src="https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>

<br>
<br>

> Modern Full-Stack Academic Management Platform for Degree Apprenticeships

</div>

---

# 📖 Overview

**Clarity** is a modern full-stack web application developed to support:

* 📊 Ofsted readiness monitoring
* 👨‍🎓 Learner management
* 🧑‍🏫 Academic oversight
* 🏢 Employer engagement
* 📁 Evidence tracking
* 🔐 Secure role-based access

The platform combines a **React + TypeScript frontend** with a **Node.js + Express backend** powered by **SQLite**.

---

# 🏗️ Project Structure

```text
clarity/
│
├── frontend/          # React + TypeScript + Vite
├── backend/           # Node.js + Express API
├── backend/src/db/    # SQLite schema and database setup
└── package.json       # Root workspace configuration
```

---

# ⚡ Quick Start

## 1️⃣ Open Project in VS Code

Open the extracted `clarity/` folder as the workspace root.

> Ensure you are inside the correct root folder before running commands.

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

## 3️⃣ Start Development Environment

```bash
npm run dev
```

---

# 🌐 Local Development URLs

| Service     | URL                     |
| ----------- | ----------------------- |
| Frontend    | `http://localhost:5173` |
| Backend API | `http://localhost:3000` |

> The Vite development server automatically proxies `/api/*` requests to the backend.

---

# 📜 Available Commands

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start frontend and backend together |
| `npm run dev:backend`  | Start backend only using Nodemon    |
| `npm run dev:frontend` | Start frontend only using Vite      |
| `npm run build`        | Create production frontend build    |
| `npm run install:all`  | Install all project dependencies    |

---

# 🔐 Environment Variables

## Backend Environment

### `backend/.env`

```env
PORT=3000
JWT_SECRET=clarity_secret_key_2026
NODE_ENV=development
```

---

## Frontend Environment

### `frontend/.env`

```env
VITE_API_BASE_URL=/api
```

---

> ⚠️ Replace the `JWT_SECRET` with a secure production secret before deployment.

---

# 🗄️ Database

The application uses **SQLite** as the primary database engine.

## Database Location

```text
backend/clarity.db
```

## Database Schema

```text
backend/src/db/schema.sql
```

---

## Database Tables

| Tables       |
| ------------ |
| users        |
| learners     |
| employers    |
| modules      |
| enrolments   |
| assessments  |
| ksb_mappings |
| schedules    |
| evidence     |
| feedback     |

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

| Role                 | Email               | Password     |
| -------------------- | ------------------- | ------------ |
| Programme Leader     | `lead@uni.com`      | `clarity123` |
| Academic Staff       | `academic@uni.com`  | `clarity123` |
| Apprenticeship Coach | `coach@uni.com`     | `clarity123` |
| Employer / Mentor    | `mentor@uni.com`    | `clarity123` |
| Ofsted Inspector     | `inspector@uni.com` | `clarity123` |
| Administrator        | `admin@clarity.com` | `clarity123` |

---

# 🔒 Security Features

* JWT Authentication
* Role-Based Authorization
* Protected API Endpoints
* Secure Environment Configuration
* Backend API Proxying

---

# 🚀 Development Stack

| Layer          | Technology             |
| -------------- | ---------------------- |
| Frontend       | React + TypeScript     |
| Backend        | Node.js + Express      |
| Database       | SQLite                 |
| Authentication | JWT                    |
| Build Tool     | Vite                   |
| Development    | Nodemon + Concurrently |

---

# 📌 Notes

* SQLite database initializes automatically on startup.
* Frontend requests are proxied to the backend during development.
* No CORS setup is required locally.

---

# 👨‍💻 Development Team

<div align="center">

### Clarity Project Team

Enterprise Academic Management Platform
| Team member   |                     |
| --------------| --------------------|
| Krishna       | Project Manager     |
| Larisa        |                     |
| Alin          |                     |
| Ashik         |                     |

</div>

---

# 📄 License

This project is intended for:

* Academic use
* Educational demonstrations
* Research purposes

---

<div align="center">

## ⭐ Support The Project

If you found this project useful, consider giving it a star.

</div>
