# Rotaract Club of SIES Sion East (District 3141) - Backend & Web Architecture

This repository contains the complete web application and resilient backend architecture for the **Rotaract Club of SIES Sion East**, operating under the official theme **द्रोणाचार्य**.

---

## 🏛️ System Architecture Overview

```
rotract/
├── rotaract_club_of_sies_sion_east.html   # Modern responsive frontend client
├── server.js                              # Crash-proof Express & Node.js backend server
├── package.json                           # NPM configuration, dependencies & scripts
├── .env                                   # Active environment configuration
├── .env.example                           # Example environment template
├── .gitignore                             # Git ignore rules
├── data/                                  # Resilient JSON data storage
│   ├── inquiries.json                     # Received connect form submissions
│   └── subscribers.json                   # Received newsletter subscriptions
└── README.md                              # Complete architecture & run guide
```

---

## 🛡️ Resilience & Crash-Proof Standards

The backend server has been engineered to maintain continuous 24/7 uptime without terminating on runtime errors:

1. **Process-Level Error Traps**:
   - `uncaughtException`: Intercepts and logs critical unhandled process exceptions without an abrupt crash.
   - `unhandledRejection`: Captures unhandled asynchronous Promise rejections.
2. **Safe Request & Body Parsing**:
   - Configured with `express.json({ limit: '50kb' })` to mitigate oversized payload attacks.
   - Includes custom middleware that intercepts malformed JSON syntax errors and returns an HTTP 400 response instead of terminating the process.
3. **CORS Flexibility**:
   - Pre-configured using the `cors` package to allow local development ports (`3000`, `5000`, `5500`, `8080`) and `null` origin (when opening the HTML file directly via `file:///` protocol).
4. **Resilient Data Persistence**:
   - Employs an in-memory cache with fallback synchronous disk persistence to `data/inquiries.json` and `data/subscribers.json`. If filesystem operations fail, the server remains operational using memory storage.
5. **Global Express Error Middleware**:
   - Sits as the final error barrier in Express to intercept any runtime exceptions thrown inside asynchronous or synchronous handlers.
6. **Live Frontend Health Detection**:
   - The frontend automatically polls `/api/health` and provides a visual status indicator (Green dot when server is online, Amber dot when offline).

---

## 🚀 Quick Start Guide

### 1. Requirements
- Node.js (v18+ or v24 LTS)
- npm (v9+)

### 2. Install Dependencies (Already performed)
```bash
npm install
```

### 3. Boot the Server

You have multiple stability and supervision options:

#### Option A: Native Auto-Restart Watch Mode (Recommended for Development)
Node.js 24 provides built-in file watching with zero external process overhead:
```bash
npm run dev
```
*(Equivalent to: `node --watch server.js`)*

#### Option B: Standard Production Boot
```bash
npm start
```
*(Equivalent to: `node server.js`)*

#### Option C: Nodemon Supervision
```bash
npm run nodemon
```

#### Option D: PM2 Enterprise Process Supervision
For production background execution with automatic restarts on crash:
```bash
npm run supervise
```

---

## 🌐 Accessing the Application

Once the server is booted:
- **Main Web Application**: [http://localhost:5000](http://localhost:5000)
- **Inquiries & Subscribers Dashboard**: [http://localhost:5000/admin](http://localhost:5000/admin)
- **Health Check API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Upcoming & Past Events API**: [http://localhost:5000/api/events](http://localhost:5000/api/events)
- **Admin Data API**: [http://localhost:5000/api/admin/data](http://localhost:5000/api/admin/data)

---

## 💾 Where All Submitted Data is Stored

1. **Form Queries & Event Registrations**:
   - Whenever someone fills out the **"Send Us a Message"** form, their data is saved to:
     `c:\Users\user\Downloads\rotract\data\inquiries.json`
   - Contains: `name`, `email`, `phone`, `interest`, `message`, `submittedAt`, and `clientIp`.

2. **Newsletter / Updates Emails**:
   - Whenever someone enters their email under **"Receive updates from Rotaract"**, their email is saved to:
     `c:\Users\user\Downloads\rotract\data\subscribers.json`
   - Contains: `id`, `email`, and `subscribedAt`.

3. **Visual Dashboard**:
   - You can view and manage all inquiries and subscribers live in your browser at [http://localhost:5000/admin](http://localhost:5000/admin).

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin` | Visual dashboard for viewing inquiries and subscribers | None |
| `GET` | `/api/admin/data` | JSON data of all inquiries and subscribers | None |
| `GET` | `/api/health` | Server uptime, status, and theme info | None |
| `GET` | `/api/events` | List of upcoming events and past projects | None |
| `POST` | `/api/connect` | Submit contact form / event registration | `{"name":"A","email":"a@b.com","interest":"...","message":"..."}` |
| `POST` | `/api/newsletter` | Subscribe email for updates | `{"email":"subscriber@example.com"}` |

---

## 🔄 Interactive Frontend Wiring

1. **Header "Connect" Button & Mobile CTA**:
   - Smoothly scrolls the viewport to the interactive Connection form and highlights the container with an animated gold glow effect.
2. **Flagship Project Action Buttons**:
   - Each of the 5 project cards (LinkedIn & CV Session, IPR Law Event, Whisper and Lies, Beach Volleyball, One Prompt Many Stories) features a "Connect for this Project" button that pre-selects that specific event in the form.
3. **Connect Form**:
   - Executes asynchronous `fetch('/api/connect')` with loading state, button disabling, error alerts, and animated toast feedback.
4. **Newsletter Subscription Bar**:
   - Executes asynchronous `fetch('/api/newsletter')` with real-time feedback.
5. **Live Health Badge**:
   - Real-time indicator displaying whether the backend API is reachable.
