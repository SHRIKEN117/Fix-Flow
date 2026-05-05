# FixFlow — Deployment & Installation Manual

**Version:** 1.0.0  
**Stack:** MongoDB · Express.js · React · Node.js (MERN) + TypeScript  
**Architecture:** Monorepo with separate `/client` (Vite/React) and `/server` (Node.js/Express) packages

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Requirements](#2-system-requirements)
3. [Prerequisites — Software Installation](#3-prerequisites--software-installation)
4. [Database Setup — MongoDB Atlas](#4-database-setup--mongodb-atlas)
5. [Cloning the Repository](#5-cloning-the-repository)
6. [Environment Configuration](#6-environment-configuration)
7. [Installing Dependencies](#7-installing-dependencies)
8. [Seeding the Database](#8-seeding-the-database)
9. [Running the Application](#9-running-the-application)
10. [Default Login Credentials](#10-default-login-credentials)
11. [Optional Features](#11-optional-features)
12. [Troubleshooting](#12-troubleshooting)
13. [Project Structure Reference](#13-project-structure-reference)

---

## 1. Introduction

Welcome to the FixFlow deployment manual. FixFlow is a full-stack maintenance management system that allows organizations to submit, track, and resolve maintenance tickets with role-based access for Admins, Technicians, and Users. It includes real-time updates via Socket.io, estimate and invoice workflows, SLA policy enforcement, and optional AI-powered ticket analysis.

This manual covers everything needed to run FixFlow in a local development environment. It is intended for developers, system administrators, and advanced users.

Topics covered:

1. **System Requirements** — hardware and software needed to run the project
2. **Installation Procedures** — step-by-step setup from scratch
3. **Environment Configuration** — all required and optional environment variables
4. **Database Seeding** — pre-populate the database with test accounts
5. **Troubleshooting** — common issues and how to resolve them

---

## 2. System Requirements

### Hardware Requirements

| Component | Minimum |
|-----------|---------|
| CPU | Dual-core 2.0 GHz (Intel Core i3 / AMD Ryzen 3 / Apple M1 or newer) |
| RAM | 8 GB |
| Storage | 2 GB free disk space |
| Network | Stable internet connection (required for MongoDB Atlas) |
| Screen Resolution | 1280 × 720 or higher |

### Software Requirements

| Software | Supported Versions |
|----------|-------------------|
| **Operating System** | Windows 10/11 · macOS Monterey/Ventura/Sonoma · Ubuntu 20.04/22.04/24.04 |
| **Node.js** | v20 LTS (recommended) · v18 LTS (minimum) |
| **npm** | v9 or higher (bundled with Node.js) |
| **Git** | v2.30 or higher |
| **Web Browser** | Chrome 110+ · Firefox 110+ · Safari 16+ · Edge 110+ |
| **Code Editor** | Visual Studio Code (recommended) |
| **MongoDB** | MongoDB Atlas (cloud, free tier supported) or MongoDB Community Server 7.0+ (local) |

> **Note:** Node.js v20 LTS is strongly recommended. Avoid Node.js v21+ in production as it is not LTS.

---

## 3. Prerequisites — Software Installation

### 3.1 Install Visual Studio Code

1. Visit https://code.visualstudio.com/
2. Download the installer for your operating system
3. Run the installer and follow the on-screen steps
4. Launch VS Code from your applications menu

**Recommended VS Code extensions:**
- ESLint
- Prettier – Code formatter
- TypeScript Vue Plugin (Volar) or TypeScript Importer
- MongoDB for VS Code (optional)

### 3.2 Install Node.js and npm

1. Visit https://nodejs.org/
2. Download the **LTS** version (v20.x)
3. Run the installer and follow the on-screen steps
4. Verify installation by opening a terminal and running:

```bash
node --version
# Expected output: v20.x.x

npm --version
# Expected output: 10.x.x or 9.x.x
```

### 3.3 Install Git

1. Visit https://git-scm.com/downloads
2. Download and install Git for your operating system
3. Verify installation:

```bash
git --version
# Expected output: git version 2.x.x
```

---

## 4. Database Setup — MongoDB Atlas

FixFlow uses MongoDB as its database. The easiest option is MongoDB Atlas (free tier available).

### 4.1 Create a MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click **Try Free** and create an account
3. Choose **Free Tier (M0)** cluster when prompted

### 4.2 Create a Cluster

1. Select **Create a deployment**
2. Choose **M0 Free** tier
3. Select any cloud provider and region closest to you
4. Name your cluster (e.g., `fixflow-cluster`)
5. Click **Create Deployment**

### 4.3 Create a Database User

1. In the Atlas dashboard, go to **Database Access** → **Add New Database User**
2. Choose **Password authentication**
3. Enter a username (e.g., `fixflow_admin`) and a strong password
4. Set role to **Atlas admin** or **readWriteAnyDatabase**
5. Click **Add User**

### 4.4 Whitelist Your IP Address

1. Go to **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** for local development (`0.0.0.0/0`)
3. Click **Confirm**

### 4.5 Get the Connection String

1. Go to **Database** → **Connect** → **Drivers**
2. Select **Node.js** and copy the connection string. It looks like:

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=<cluster>
```

3. Replace `<username>` and `<password>` with your database user credentials
4. Keep this string — it goes into `MONGODB_URI` in the next step

---

## 5. Cloning the Repository

### 5.1 Open a Terminal

- **Windows:** Search for "Command Prompt" or "PowerShell" or use the VS Code integrated terminal
- **macOS / Linux:** Open "Terminal" from your applications

### 5.2 Navigate to Your Desired Directory

```bash
cd ~/Documents
# or any folder where you want to place the project
```

### 5.3 Clone the Repository

```bash
git clone <your-repository-url>
cd Fix-Flow
```

> Replace `<your-repository-url>` with the actual Git remote URL of the repository.

### 5.4 Open in VS Code

```bash
code .
```

Your VS Code workspace should show two main folders: `client/` and `server/`.

---

## 6. Environment Configuration

FixFlow requires environment variables for both the server and client. These are **never committed to Git** — you must create them manually.

### 6.1 Server Environment File

Navigate to the `server/` directory and create a `.env` file:

```bash
cd server
# macOS / Linux:
cp .env.example .env
# Windows:
copy .env.example .env
```

Open `server/.env` and fill in the values:

```env
# ── Required ──────────────────────────────────────────────
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/fixflow?retryWrites=true&w=majority&appName=<cluster>
JWT_SECRET=replace_with_a_long_random_string_min_32_chars
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
NODE_ENV=development
UPLOAD_DIR=./uploads

# ── Optional: Email Notifications (SMTP) ──────────────────
# Leave blank to disable email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# ── Optional: AI Ticket Analysis (Anthropic Claude) ───────
# Leave blank / false to disable AI analysis on ticket images
ANTHROPIC_API_KEY=sk-ant-...
AI_ANALYSIS_ENABLED=false
```

**Generating a secure `JWT_SECRET`:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as the value of `JWT_SECRET`.

### 6.2 Client Environment File

Navigate to the `client/` directory and create a `.env` file:

```bash
cd ../client
# macOS / Linux:
cp .env.example .env
# Windows:
copy .env.example .env
```

Open `client/.env` and set:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> **Important:** `VITE_API_BASE_URL` must point to your running server. For local development this is always `http://localhost:5000/api`.

### 6.3 Environment Variable Reference

#### Server (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Port the Express server listens on |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas (or local) connection string |
| `JWT_SECRET` | **Yes** | — | Secret key for signing JWT tokens. Use a random 64-char hex string |
| `JWT_EXPIRES_IN` | No | `8h` | JWT token expiry duration |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend URL (used for CORS and Socket.io) |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `UPLOAD_DIR` | No | `./uploads` | Local directory for file attachment storage |
| `SMTP_HOST` | No | — | SMTP server host for email notifications |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | — | SMTP username / email address |
| `SMTP_PASS` | No | — | SMTP password or app password |
| `ANTHROPIC_API_KEY` | No | — | Anthropic Claude API key for AI ticket analysis |
| `AI_ANALYSIS_ENABLED` | No | `false` | Set to `true` to enable AI image analysis on ticket creation |

#### Client (`client/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | **Yes** | — | Full URL of the backend API including `/api` path |

---

## 7. Installing Dependencies

FixFlow has separate `node_modules` for the server and client. Both must be installed.

### 7.1 Install Server Dependencies

```bash
cd /path/to/Fix-Flow/server
npm install
```

Expected output ends with something like:
```
added 312 packages, and audited 313 packages in 12s
```

### 7.2 Install Client Dependencies

```bash
cd /path/to/Fix-Flow/client
npm install
```

Expected output ends with something like:
```
added 504 packages, and audited 505 packages in 18s
```

> If you see `npm warn` messages, these are usually safe to ignore. Only `npm error` messages require action.

---

## 8. Seeding the Database

The seed script creates three default user accounts and default SLA policies in MongoDB. Run it once after setting up your `.env` file.

```bash
cd /path/to/Fix-Flow/server
npm run seed
```

Expected output:

```
🔌 Connected to MongoDB for seeding...

✅ Created admin:        admin@fixflow.com
✅ Created technician:   tech@fixflow.com
✅ Created user:         user@fixflow.com
✅ Created SLA policies: critical(4h), high(8h), medium(24h), low(72h)

🌱 Seed complete.
```

> The seed script is **idempotent** — safe to run multiple times. It clears existing seed data and re-creates it.

---

## 9. Running the Application

You need **two terminal windows** open simultaneously — one for the server, one for the client.

### 9.1 Start the Backend Server

Open Terminal 1:

```bash
cd /path/to/Fix-Flow/server
npm run dev
```

Expected output:

```
🔌 MongoDB connected: <cluster>.mongodb.net
📧 SMTP not configured — email notifications disabled
🚀 FixFlow server running on port 5000 [development]
```

The server is now running at: `http://localhost:5000`

### 9.2 Start the Frontend Client

Open Terminal 2:

```bash
cd /path/to/Fix-Flow/client
npm run dev
```

Expected output:

```
  VITE v5.x.x  ready in 500ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

The application is now accessible at: **http://localhost:5173**

### 9.3 Accessing the Application

Open your web browser and navigate to:

```
http://localhost:5173
```

You should see the FixFlow login page.

---

## 10. Default Login Credentials

After seeding (Step 8), the following accounts are available:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@fixflow.com` | `FixFlow@2025` |
| **Technician** | `tech@fixflow.com` | `FixFlow@2025` |
| **User** | `user@fixflow.com` | `FixFlow@2025` |

**Role capabilities:**

- **Admin** — full system access: manage users, approve/reject tickets, manage SLA policies, view analytics, manage invoices and payments
- **Technician** — view assigned tickets, update ticket status, create and submit estimates, manage attachments
- **User** — submit new tickets, track their own tickets, view ticket history

> **Security Note:** Change these passwords immediately if deploying to any shared or production environment.

---

## 11. Optional Features

### 11.1 Email Notifications (SMTP)

FixFlow sends email notifications when ticket status changes. To enable:

1. Obtain SMTP credentials from your email provider
2. **For Gmail:** enable 2FA on your Google account, then generate an App Password at https://myaccount.google.com/apppasswords
3. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in `server/.env`
4. Restart the server

If SMTP is not configured, the server starts normally and skips email sending silently.

### 11.2 AI Ticket Analysis (Anthropic Claude)

When a user attaches an image to a new ticket, FixFlow can use Claude to automatically analyze the image and suggest a category and priority.

To enable:

1. Create an account at https://www.anthropic.com/
2. Generate an API key in the Anthropic Console
3. Set `ANTHROPIC_API_KEY=sk-ant-...` in `server/.env`
4. Set `AI_ANALYSIS_ENABLED=true` in `server/.env`
5. Restart the server

---

## 12. Troubleshooting

### `Error: Missing required environment variable: MONGODB_URI`

**Cause:** The `server/.env` file is missing or `MONGODB_URI` is not set.  
**Fix:** Verify `server/.env` exists and contains a valid `MONGODB_URI` value. Check for typos and ensure the MongoDB Atlas user and IP whitelist are configured (see Section 4).

---

### `MongoServerError: bad auth : Authentication failed`

**Cause:** Wrong MongoDB username or password in the connection string.  
**Fix:** Go to MongoDB Atlas → Database Access → edit the user password, then update `MONGODB_URI` in `server/.env`.

---

### `ECONNREFUSED` when opening the frontend

**Cause:** The backend server is not running or running on a different port.  
**Fix:** Make sure `npm run dev` is running in the `server/` directory and no errors were printed. Verify `VITE_API_BASE_URL` in `client/.env` matches the server port.

---

### Port already in use: `Error: listen EADDRINUSE :::5000`

**Cause:** Another process is using port 5000.  
**Fix:**

```bash
# macOS / Linux — find and kill the process:
lsof -i :5000
kill -9 <PID>

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

Alternatively, change `PORT=5001` in `server/.env` and update `VITE_API_BASE_URL=http://localhost:5001/api` in `client/.env`.

---

### `npm install` fails with `EACCES permission denied`

**Cause:** npm global permissions issue (common on macOS/Linux).  
**Fix:** Do **not** use `sudo npm install`. Instead, fix npm permissions:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
# Then add to ~/.zshrc or ~/.bashrc:
export PATH=~/.npm-global/bin:$PATH
```

---

### Frontend shows blank page or routing errors after refresh

**Cause:** Vite dev server handles client-side routing. This is expected in dev mode.  
**Fix:** In development this is not an issue. For production builds, configure your web server (Nginx/Apache) to redirect all routes to `index.html`.

---

### TypeScript compilation errors on `npm run dev`

**Cause:** Node.js version mismatch or missing type definitions.  
**Fix:** Ensure Node.js v20 LTS is installed (`node --version`). Then run `npm install` again inside both `server/` and `client/`.

---

## 13. Project Structure Reference

```
Fix-Flow/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── api/                # Axios API clients
│   │   ├── components/         # Reusable UI components
│   │   │   ├── dashboard/
│   │   │   ├── layout/         # Sidebar, Topbar, AppShell
│   │   │   ├── tickets/
│   │   │   └── ui/             # shadcn/ui base components
│   │   ├── context/            # React contexts (Auth, Socket)
│   │   ├── hooks/              # TanStack Query hooks
│   │   ├── pages/              # Page-level components
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── finance/        # Estimates, Invoices, Payments
│   │   │   ├── tickets/
│   │   │   └── admin/
│   │   ├── router/             # React Router config
│   │   ├── types/              # TypeScript interfaces
│   │   └── lib/                # Utilities, constants, validators
│   ├── public/                 # Static assets (logo, favicon)
│   ├── .env                    # Client environment variables (create manually)
│   └── package.json
│
├── server/                     # Node.js/Express backend
│   ├── src/
│   │   ├── config/             # DB connection, env validation
│   │   ├── controllers/        # Route handler logic
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Socket.io service
│   │   ├── utils/              # Helpers (email, SLA, audit log)
│   │   ├── validations/        # Joi request schemas
│   │   ├── jobs/               # SLA cron job
│   │   ├── scripts/            # Database seed script
│   │   └── index.ts            # Server entry point
│   ├── uploads/                # File attachment storage (auto-created)
│   ├── .env                    # Server environment variables (create manually)
│   ├── .env.example            # Environment variable template
│   └── package.json
│
├── DEPLOYMENT.md               # This file
└── README.md
```

---

## Support

For issues or questions, open an issue in the project repository or contact the development team.
