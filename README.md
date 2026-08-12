# MaintainIQ

MaintainIQ is an AI-powered QR-enabled maintenance tracking and asset lifecycle platform designed for physical facilities. It streamlines reporting, triage, assignment, repair workflows, and historical audits.

---

## 🚀 Core Features

1. **AI-Powered Diagnostics & Triage (Gemini Pro)**
   * Parses natural language complaints submitted by public users or staff.
   * Auto-detects category category, assigns initial hazard priority levels (Low, Medium, High, Critical), and lists possible failure causes.
   * Generates step-by-step diagnostic inspection checklists for responding technicians.
2. **Dynamic QR Asset Labels**
   * Automatically generates high-quality, printable QR codes on asset registration.
   * Codes encode secure, safe public lookups where users scan to view equipment status or file complaints.
3. **Role-Based Workspace Dashboards (JWT)**
   * **Admin View:** Operational metrics dashboard tracking total assets, open issues, and critical/out-of-service hardware. Handles ticket assignment to technicians.
   * **Technician View:** Scoped ticket worklist displaying assigned orders.
4. **Interactive Work Checklist Stepper**
   * Technicians advance status sequentially: `Assigned` ➔ `Inspection Started` ➔ `Maintenance In Progress` ➔ `Resolved`.
   * Synchronization: Moving status to `Inspection Started` or `Maintenance In Progress` automatically syncs associated asset status to `Under Inspection` or `Under Maintenance`.
5. **Secure Cloudinary Evidence Uploads**
   * Upload repair proof (images/videos) directly to Cloudinary.
   * Graceful Catch: If Cloudinary keys are missing or invalid, uploads fail gracefully, logging a system warning, utilizing a safe fallback placeholder, and proceeding to close work orders successfully.
6. **Immutable activity history timeline database**
   * Append-only ledger logging creation, public reporting, assignment, progression, and resolution.
   * Security Projection: Public asset QR lookups strip actor credentials, securing technician names and administrative identities.

---

## 🛠 Tech Stack

* **Frontend:** Next.js 14 (App Router), React, Lucide Icons, Vanilla CSS (Glassmorphism & Dark Palette)
* **Backend:** Node.js, Express, Mongoose, MongoDB
* **Third Party Services:** Google Generative AI (Gemini SDK), Cloudinary SDK (Media Uploads), Multer (Multipart parser)

---

## ⚙️ Environment Configuration

### Backend Setup
Create a `.env` file in the `backend/` directory based on the safe [backend/.env.example](file:///c:/Users/DELL/OneDrive/Desktop/mantainIq/backend/.env.example):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/maintainiq
JWT_SECRET=super_secret_hackathon_key_2026
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# AI & Media Integrations
GEMINI_API_KEY=your_google_gemini_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Frontend Setup
Create a `.env.local` file in the `frontend/` directory based on the safe [frontend/.env.example](file:///c:/Users/DELL/OneDrive/Desktop/mantainIq/frontend/.env.example):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 💻 Local Setup & Execution

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **MongoDB** installed and running locally.

### 2. Run Backend Service
```bash
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### 3. Run Frontend Server
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🔑 Demo Credentials

Judges can register fresh accounts on the register screen (`http://localhost:3000/register`) or use standard test registrations:

### Administrator Account
* **Email:** `admin@maintainiq.com`
* **Password:** `password123`

### Technician Account
* **Email:** `tech@maintainiq.com`
* **Password:** `password123`

---

## 🧪 Running Integration Verifications
You can run automated end-to-end integration tests to verify database collections and controllers by running:
```bash
cd backend
node test_phase7.js
```
