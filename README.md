# Employee-Management System

A full-stack Employee Management application built with **Angular** (Frontend) and **NestJS (Backend).  
This project is organized as a **monorepo** with separate folders for frontend and backend.

---

## 🏗️ Project Structure

Employee-Management/
├─ backend/ # NestJS backend
│ ├─ src/
│ ├─ package.json
│ └─ tsconfig.json
├─ frontend/ # Angular frontend
│ ├─ src/
│ ├─ package.json
│ └─ angular.json
└─ README.md


- **backend/** → RESTful API, business logic, database connection  
- **frontend/** → Angular SPA, calls backend APIs, handles UI/UX  

---

## ⚡ Features

### Backend (NestJS)
- Employee CRUD (Create, Read, Update, Delete)
- Department management
- User authentication & role-based authorization
- Soft delete and audit logs
- Database: PostgreSQL (or any relational DB)
- Environment variables support (`.env`)

### Frontend (Angular)
- SPA dashboard for employees and departments
- Employee list, detail, create & update forms
- Reactive forms + validation
- Connects to NestJS backend APIs
- Environment configuration for API URLs

---

## 💻 Prerequisites

- Node.js >= 18
- npm >= 9
- Angular CLI (for frontend)
- NestJS CLI (for backend)
- PostgreSQL (or other relational DB)

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/<Lambouhg>/Employee-Management.git
cd Employee-Management

2. Setup Backend:

cd backend
npm install
# Configure your database in .env file
npm run start:dev   # Run NestJS backend in dev mode

3. Setup Frontend:

cd frontend
npm install
ng serve

⚙️ Scripts:
Backend (backend/package.json) 

| Command             | Description             |
| ------------------- | ----------------------- |
| `npm run start`     | Run NestJS server       |
| `npm run start:dev` | Run in dev mode (watch) |
| `npm run build`     | Build for production    |

Frontend (frontend/package.json)

| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `ng serve`      | Run Angular dev server                    |
| `npm run build` | Build production assets (`dist/frontend`) |

🌐 Environment Variables:



