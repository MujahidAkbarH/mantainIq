# MaintainIQ Backend API Reference Documentation

All endpoints are hosted relative to the base URL (local: `http://localhost:5000`). Private endpoints require an `Authorization` header with a valid Bearer JWT.

---

## 🔑 Authentication Endpoints

### 1. Register Account
* **Endpoint:** `POST /api/auth/register`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@maintainiq.com",
    "password": "securepassword123",
    "role": "Technician" 
  }
  ```
  *(Allowed roles: `Admin`, `Technician`. Default: `Technician`)*
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "6a7cc3d3826d...",
      "name": "Jane Doe",
      "email": "jane@maintainiq.com",
      "role": "Technician",
      "createdAt": "2026-08-13T00:05:00.000Z"
    }
  }
  ```

### 2. Authenticate & Log In
* **Endpoint:** `POST /api/auth/login`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "email": "jane@maintainiq.com",
    "password": "securepassword123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "6a7cc3d3826d...",
      "name": "Jane Doe",
      "email": "jane@maintainiq.com",
      "role": "Technician"
    }
  }
  ```

### 3. Fetch Registered Technicians
* **Endpoint:** `GET /api/auth/technicians`
* **Access:** Private (Admin Only)
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "technicians": [
      {
        "_id": "6a7cc3d3826d...",
        "name": "P7 Tech",
        "email": "tech@maintainiq.com",
        "role": "Technician"
      }
    ]
  }
  ```

---

## 📦 Asset Management Endpoints

### 1. Register New Equipment Asset
* **Endpoint:** `POST /api/assets`
* **Access:** Private (Admin / Technician)
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "name": "AC Unit A",
    "uniqueCode": "AST-HVAC-1092",
    "category": "HVAC / Cooling",
    "location": "First Floor Main Office",
    "condition": "Good",
    "status": "Operational"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Asset created successfully with generated QR Code",
    "asset": {
      "_id": "6a7cc3d3826d...",
      "name": "AC Unit A",
      "uniqueCode": "AST-HVAC-1092",
      "category": "HVAC / Cooling",
      "location": "First Floor Main Office",
      "condition": "Good",
      "status": "Operational",
      "qrDataUrl": "data:image/png;base64,...",
      "publicUrl": "http://localhost:3000/p/AST-HVAC-1092"
    }
  }
  ```

### 2. Fetch Assets Catalog
* **Endpoint:** `GET /api/assets`
* **Access:** Private (Admin / Technician)
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:** `search` (Search name/code), `status` (Operational/Reported/etc)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "assets": [...]
  }
  ```

### 3. Public Asset Safe Lookup (QR Scanners)
* **Endpoint:** `GET /api/public/assets/:uniqueCode`
* **Access:** Public (No Auth Required)
* **Response (200 OK):**
  * *Notes: Strips private/sensitive fields like internal notes or technician database records. Includes projected timeline logs.*
  ```json
  {
    "success": true,
    "asset": {
      "id": "6a7cc3d3826d...",
      "name": "AC Unit A",
      "uniqueCode": "AST-HVAC-1092",
      "category": "HVAC / Cooling",
      "location": "First Floor Main Office",
      "condition": "Good",
      "status": "Operational",
      "publicUrl": "http://localhost:3000/p/AST-HVAC-1092"
    },
    "history": [
      {
        "action": "Asset Registered",
        "createdAt": "2026-08-13T00:05:00.000Z"
      }
    ]
  }
  ```

### 4. Fetch Asset Complete Timeline Logs
* **Endpoint:** `GET /api/assets/:uniqueCode/history`
* **Access:** Private (Admin / Technician)
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 2,
    "history": [
      {
        "_id": "6a7cc3d382...",
        "assetId": "6a7cc3d382...",
        "actor": "P7 Admin",
        "action": "Asset Registered",
        "createdAt": "2026-08-13T00:05:00.000Z"
      }
    ]
  }
  ```

---

## 🛠 Maintenance & Issue Endpoints

### 1. Perform Natural Language AI Triage
* **Endpoint:** `POST /api/public/ai-triage`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "complaint": "The generator smells like burning rubber and cooling is failing.",
    "assetContext": {
      "name": "Generator 01",
      "category": "Electrical & Generator",
      "location": "Powerhouse Block"
    }
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "triage": {
      "title": "Generator Overheating & Burning Smell",
      "category": "Electrical & Generator",
      "priority": "Critical",
      "possibleCauses": ["Worn drive belt friction", "Coolant pump blockage"],
      "initialChecks": ["Inspect belt tension", "Check coolant fluid levels"]
    }
  }
  ```

### 2. Submit Public Issue ticket
* **Endpoint:** `POST /api/public/issues`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "uniqueCode": "AST-HVAC-1092",
    "title": "AC dripping water on office desk",
    "description": "Condensed water is leaking out of the filter grille casing.",
    "priority": "Medium",
    "category": "HVAC / Cooling",
    "reporterName": "John Doe",
    "reporterContact": "john@office.com"
  }
  ```
* **Response (210 Created):**
  * *Notes: Updates associated Asset status to 'Issue Reported' automatically.*
  ```json
  {
    "success": true,
    "message": "Issue ISS-4912 reported successfully. Asset status updated to 'Issue Reported'.",
    "issue": {
      "id": "6a7cc3d3826d...",
      "issueNumber": "ISS-4912",
      "title": "AC dripping water on office desk",
      "status": "Reported",
      "createdAt": "2026-08-13T00:08:00.000Z"
    },
    "updatedAssetStatus": "Issue Reported"
  }
  ```

### 3. Assign ticket to Technician
* **Endpoint:** `PATCH /api/issues/:id/assign`
* **Access:** Private (Admin Only)
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "technicianId": "6a7cc3d3826dtechid"
  }
  ```
* **Response (200 OK):**
  * *Notes: Transitions issue status to 'Assigned'.*
  ```json
  {
    "success": true,
    "message": "Issue successfully assigned to Tech. Status updated to 'Assigned'.",
    "issue": {
      "_id": "6a7cc3d3826d...",
      "issueNumber": "ISS-4912",
      "status": "Assigned",
      "assignedTechnicianId": {
        "_id": "6a7cc3d3826dtechid",
        "name": "Jane Tech"
      }
    }
  }
  ```

### 4. Progress Issue status
* **Endpoint:** `PATCH /api/issues/:id/status`
* **Access:** Private (Technician Only - Assigned Tech only)
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "status": "Inspection Started" 
  }
  ```
  *(Allowed values: `Inspection Started`, `Maintenance In Progress`, `Waiting for Parts`)*
* **Response (200 OK):**
  * *Notes: Synces asset status to 'Under Inspection' or 'Under Maintenance'.*
  ```json
  {
    "success": true,
    "message": "Issue status updated to 'Inspection Started'.",
    "issue": {
      "_id": "6a7cc3d3826d...",
      "status": "Inspection Started"
    },
    "assetStatus": "Under Inspection"
  }
  ```

### 5. Resolve Issue & Log Record
* **Endpoint:** `POST /api/issues/:id/resolve`
* **Access:** Private (Technician Only - Assigned Tech only)
* **Headers:** `Authorization: Bearer <token>`
* **Request Content-Type:** `multipart/form-data` (Supports uploader parsed via Multer)
* **Request Body Fields:**
  * `notes` (String, Required): Text describing repair action.
  * `cost` (Number, Required, >= 0): Repair costs.
  * `finalCondition` (String, Required): Post-service condition (`Good`, `Fair`, `Poor`, etc.)
  * `partsReplaced` (String, Optional): Comma-separated parts replaced.
  * `evidence` (File, Optional): Evidence photo or video upload.
* **Response (200 OK):**
  * *Notes: Updates Asset status back to 'Operational' and logs a MaintenanceRecord.*
  ```json
  {
    "success": true,
    "message": "Issue successfully resolved. Asset returned to Operational status.",
    "issue": {
      "_id": "6a7cc3d3826d...",
      "status": "Resolved",
      "maintenanceCost": 150.00
    },
    "maintenanceRecord": {
      "_id": "6a7cc3d3826drecordid",
      "notes": "Replaced clogged drainage filter panel.",
      "cost": 150.00,
      "evidenceUrl": "https://res.cloudinary.com/..."
    },
    "assetStatus": "Operational"
  }
  ```
