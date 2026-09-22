#!/usr/bin/env python
"""
Standalone Backend Verification Script for Django School Attendance System.
Executes end-to-end endpoint checks, system health diagnostics, and CRUD validations.
"""
import os
import sys
import time

# Configure Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_attendance.settings')
import django
django.setup()

from django.core.management import call_command
from rest_framework.test import APIClient
from rest_framework import status
from attendance_core.models import SchoolClass, Student, Attendance, SchoolSettings


def run_verification():
    print("=" * 70)
    print("  SCHOOL ATTENDANCE SYSTEM - BACKEND VERIFICATION SUITE")
    print("=" * 70)

    # 1. System Check
    print("\n[1/3] Running Django System Check...")
    try:
        call_command('check', verbosity=0)
        print("  [PASS] Django system check: 0 issues found.")
    except Exception as e:
        print(f"  [FAIL] System check failed: {e}")
        return False

    # 2. Database Models & Records
    print("\n[2/3] Checking Database Entities...")
    class_count = SchoolClass.objects.count()
    student_count = Student.objects.count()
    attendance_count = Attendance.objects.count()
    settings_count = SchoolSettings.objects.count()

    print(f"  Classes enrolled     : {class_count}")
    print(f"  Students registered  : {student_count}")
    print(f"  Attendance logs      : {attendance_count}")
    print(f"  School settings rows : {settings_count}")
    # Verify database is connected and accessible

    # 3. Endpoint Integration Validation
    print("\n[3/3] Validating API Endpoints via REST Test Client...")
    client = APIClient()

    tests = []

    def verify(name, method, url, data=None, expected_status=200):
        t0 = time.perf_counter()
        try:
            if method == 'GET':
                res = client.get(url)
            elif method == 'POST':
                res = client.post(url, data, format='json')
            elif method == 'PUT':
                res = client.put(url, data, format='json')
            elif method == 'PATCH':
                res = client.patch(url, data, format='json')
            elif method == 'DELETE':
                res = client.delete(url)
            else:
                raise ValueError(f"Unsupported method: {method}")

            dt = (time.perf_counter() - t0) * 1000
            passed = (res.status_code == expected_status)
            tests.append((name, method, url, res.status_code, expected_status, passed, dt, res.data if hasattr(res, 'data') else None))
            status_tag = "PASS" if passed else "FAIL"
            print(f"  [{status_tag}] {method:<6} {url:<35} -> HTTP {res.status_code} ({dt:.1f}ms)")
            return res
        except Exception as err:
            dt = (time.perf_counter() - t0) * 1000
            tests.append((name, method, url, 0, expected_status, False, dt, str(err)))
            print(f"  [FAIL] {method:<6} {url:<35} -> ERROR: {err}")
            return None

    # Verify Root
    verify("Root Service Index", "GET", "/", expected_status=200)

    # Verify API Discovery Root
    verify("API Resource Directory", "GET", "/api/", expected_status=200)

    # Verify Classes
    classes_res = verify("List Classes", "GET", "/api/classes/", expected_status=200)
    created_class_id = None
    # Create temporary class
    new_class_res = verify(
        "Create Class", "POST", "/api/classes/",
        data={"name": f"Verification Class {int(time.time())}", "teacher": "Verification Tester"},
        expected_status=201
    )
    if new_class_res and new_class_res.data.get("data"):
        created_class_id = new_class_res.data["data"]["id"]
        verify("Class Detail", "GET", f"/api/classes/{created_class_id}/", expected_status=200)
        # Partial update class
        verify("Patch Class", "PATCH", f"/api/classes/{created_class_id}/", data={"teacher": "Lead Verifier"}, expected_status=200)

    # Verify Students
    students_res = verify("List Students", "GET", "/api/students/", expected_status=200)
    created_student_id = None
    if created_class_id:
        # Create temporary student
        student_code = f"VER-{int(time.time()) % 10000}"
        new_stu_res = verify(
            "Create Student", "POST", "/api/students/",
            data={
                "studentId": student_code,
                "name": "Integration Test Student",
                "classId": created_class_id,
                "gender": "Other"
            },
            expected_status=201
        )
        if new_stu_res and new_stu_res.data.get("data"):
            created_student_id = new_stu_res.data["data"]["id"]
            verify("Student Detail", "GET", f"/api/students/{created_student_id}/", expected_status=200)
            verify("Patch Student", "PATCH", f"/api/students/{created_student_id}/", data={"name": "Verified Student"}, expected_status=200)

    # Verify Attendance Bulk
    if created_student_id and created_class_id:
        att_save_res = verify(
            "Record Bulk Attendance", "POST", "/api/attendance/",
            data={
                "date": "2026-09-22",
                "classId": created_class_id,
                "records": [
                    {"studentId": created_student_id, "status": "Present"}
                ]
            },
            expected_status=200
        )

        # Filter attendance by date & class
        att_list_res = verify(
            "List Attendance by Class & Date", "GET",
            f"/api/attendance/?classId={created_class_id}&date=2026-09-22",
            expected_status=200
        )

        # Filter attendance by student
        verify(
            "Filter Attendance by Student", "GET",
            f"/api/attendance/?studentId={created_student_id}",
            expected_status=200
        )

        # Retrieve single attendance record
        if att_list_res and att_list_res.data.get("data") and len(att_list_res.data["data"]) > 0:
            att_record_id = att_list_res.data["data"][0]["id"]
            verify("Attendance Detail", "GET", f"/api/attendance/{att_record_id}/", expected_status=200)
            verify("Patch Attendance", "PATCH", f"/api/attendance/{att_record_id}/", data={"status": "Late"}, expected_status=200)
            verify("Delete Attendance", "DELETE", f"/api/attendance/{att_record_id}/", expected_status=200)

        # Clean up student and class
        verify("Delete Student", "DELETE", f"/api/students/{created_student_id}/", expected_status=200)
        verify("Delete Class", "DELETE", f"/api/classes/{created_class_id}/", expected_status=200)

    # Verify Dashboard
    verify("Dashboard Stats", "GET", "/api/dashboard/", expected_status=200)
    verify("Dashboard Date Filter", "GET", "/api/dashboard/?date=2026-09-22", expected_status=200)

    # Verify Reports
    verify("Reports Default Month", "GET", "/api/reports/", expected_status=200)
    verify("Reports Filtered", "GET", "/api/reports/?month=2026-09", expected_status=200)

    # Verify Settings
    verify("Get Settings", "GET", "/api/settings/", expected_status=200)
    verify("Patch Settings", "PATCH", "/api/settings/", data={"schoolName": "School Attendance System"}, expected_status=200)

    # Verify Demo
    verify("Demo Info", "GET", "/api/demo/", expected_status=200)

    # Summary
    total = len(tests)
    passed = sum(1 for t in tests if t[5])
    failed = total - passed

    print("\n" + "=" * 70)
    print(f"  VERIFICATION RESULTS: {passed}/{total} PASSED ({passed/total*100:.1f}%)")
    if failed == 0:
        print("  STATUS: ALL ENDPOINTS ARE FULLY OPERATIONAL AND READY FOR TESTING!")
    else:
        print(f"  STATUS: {failed} ENDPOINT CHECK(S) FAILED.")
    print("=" * 70 + "\n")

    return failed == 0


if __name__ == '__main__':
    success = run_verification()
    sys.exit(0 if success else 1)
