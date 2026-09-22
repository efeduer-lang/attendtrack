# School Attendance System - Django Backend

A robust Django REST Framework backend service for the School Attendance System.

## Technology Stack
- **Framework**: Django 6.1.1
- **API Framework**: Django REST Framework (DRF) 3.18.1
- **Cross-Origin**: `django-cors-headers` 4.9.0 (configured with full CORS support)
- **Database**: SQLite3 (`backend/db.sqlite3`)
- **Python**: 3.13+

---

## Quick Start Guide

### 1. Activate Virtual Environment
From the project root:
```powershell
# Windows PowerShell
.\backend\venv\Scripts\Activate.ps1
```
Or run directly using `.\backend\venv\Scripts\python.exe`.

### 2. Apply Migrations (if needed)
```powershell
python manage.py migrate
```

### 3. Seed Sample Database
Populate classes, students, and realistic attendance data:
```powershell
python manage.py seed_data
```
Or trigger via API: `POST /api/demo/` with body `{"action": "reset"}`.

### 4. Run Development Server
```powershell
python manage.py runserver 8000
```
The server will run at: **`http://127.0.0.1:8000/`**

---

## Default Superuser / Admin Access

- **Admin URL**: `http://127.0.0.1:8000/admin/`
- **Username**: `admin`
- **Password**: `admin1234`

Registered admin modules:
- School Classes (with enrolled student counts)
- Students (searchable by name, ID, and class filter)
- Attendance Records (filterable by status, class, and date hierarchy)
- School Settings (singleton management)

---

## Automated Verification & Testing

### Run All Unit Tests
```powershell
python manage.py test
```
Runs 25 comprehensive automated tests covering all CRUD operations, partial PATCH updates, validation rules, cascading rules, and edge cases.

### Run End-to-End Endpoint Verification
```powershell
python verify_backend.py
```
Performs a live system check, inspects database counts, and executes test requests across all endpoints with timing and HTTP status validations.

---

## REST API Specification

### Base URL: `http://127.0.0.1:8000/api/`

| Endpoint | Method | Description |
|---|---|---|
| `/` | `GET` | Service index & status |
| `/api/` | `GET` | API resource directory / discovery |
| `/api/classes/` | `GET` | List all school classes |
| `/api/classes/` | `POST` | Create new class `{"name": "...", "teacher": "..."}` |
| `/api/classes/<id>/` | `GET` | Retrieve class by ID |
| `/api/classes/<id>/` | `PUT` / `PATCH` | Update / partially update class details |
| `/api/classes/<id>/` | `DELETE` | Delete class (protected if students enrolled) |
| `/api/students/` | `GET` | List students (filters: `?classId=...`, `?search=...`) |
| `/api/students/` | `POST` | Create student `{"studentId": "...", "name": "...", "classId": "...", "gender": "..."}` |
| `/api/students/<id>/` | `GET` | Retrieve student details |
| `/api/students/<id>/` | `PUT` / `PATCH` | Update / partially update student |
| `/api/students/<id>/` | `DELETE` | Delete student and their attendance history |
| `/api/attendance/` | `GET` | Query attendance (filters: `?date=YYYY-MM-DD`, `?classId=...`, `?studentId=...`, `?month=YYYY-MM`) |
| `/api/attendance/` | `POST` | Bulk record attendance `{"date": "YYYY-MM-DD", "classId": "...", "records": [{"studentId": "...", "status": "Present"}]}` |
| `/api/attendance/<id>/` | `GET` | Retrieve single attendance record |
| `/api/attendance/<id>/` | `PUT` / `PATCH` | Update attendance status (`Present`, `Absent`, `Late`, `Excused`) or date |
| `/api/attendance/<id>/` | `DELETE` | Delete specific attendance record |
| `/api/dashboard/` | `GET` | Dashboard stats & class summaries (supports optional `?date=YYYY-MM-DD`) |
| `/api/reports/` | `GET` | Monthly attendance report (supports `?month=YYYY-MM` and `?classId=...`) |
| `/api/settings/` | `GET` | Retrieve school settings |
| `/api/settings/` | `POST` / `PUT` / `PATCH` | Update school settings `{"schoolName": "...", "academicSession": "...", "term": "..."}` |
| `/api/demo/` | `GET` | View database counts and demo reset actions |
| `/api/demo/` | `POST` | Reset sample data `{"action": "reset"}` or clear database `{"action": "clear"}` |

---

## Example cURL Requests

### Record Attendance:
```bash
curl -X POST http://127.0.0.1:8000/api/attendance/ \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-09-22",
    "classId": "1",
    "records": [
      {"studentId": "1", "status": "Present"},
      {"studentId": "2", "status": "Late"}
    ]
  }'
```

### Fetch Dashboard Stats:
```bash
curl http://127.0.0.1:8000/api/dashboard/
```

### Generate Monthly Report:
```bash
curl "http://127.0.0.1:8000/api/reports/?month=2026-09"
```
