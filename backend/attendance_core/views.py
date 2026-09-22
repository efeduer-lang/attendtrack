from datetime import date, datetime
from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import SchoolClass, Student, Attendance, SchoolSettings
from .serializers import (
    SchoolClassSerializer,
    StudentSerializer,
    AttendanceRecordSerializer,
    SchoolSettingsSerializer,
)


class ApiRootView(APIView):
    """
    API Root endpoint providing discovery for all School Attendance System endpoints.
    """
    def get(self, request):
        return Response({
            "success": True,
            "system": "School Attendance System API",
            "version": "1.0.0",
            "status": "ready",
            "endpoints": {
                "classes": "/api/classes/",
                "class_detail": "/api/classes/<int:id>/",
                "students": "/api/students/",
                "student_detail": "/api/students/<int:id>/",
                "attendance": "/api/attendance/",
                "attendance_detail": "/api/attendance/<int:id>/",
                "dashboard": "/api/dashboard/",
                "reports": "/api/reports/",
                "settings": "/api/settings/",
                "demo": "/api/demo/",
                "admin": "/admin/",
            },
        })


class ClassListCreateView(APIView):
    def get(self, request):
        classes = SchoolClass.objects.all().order_by("name")
        serializer = SchoolClassSerializer(classes, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        name = request.data.get("name", "").strip()
        teacher = request.data.get("teacher", "").strip()

        if not name:
            return Response({"success": False, "error": "Class name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not teacher:
            return Response({"success": False, "error": "Teacher name is required."}, status=status.HTTP_400_BAD_REQUEST)

        if SchoolClass.objects.filter(name__iexact=name).exists():
            return Response({"success": False, "error": f"Class '{name}' already exists."}, status=status.HTTP_400_BAD_REQUEST)

        school_class = SchoolClass.objects.create(name=name, teacher=teacher)
        serializer = SchoolClassSerializer(school_class)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_201_CREATED)


class ClassDetailView(APIView):
    def get(self, request, pk):
        try:
            school_class = SchoolClass.objects.get(pk=pk)
        except (SchoolClass.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Class not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SchoolClassSerializer(school_class)
        return Response({"success": True, "data": serializer.data})

    def put(self, request, pk):
        try:
            school_class = SchoolClass.objects.get(pk=pk)
        except (SchoolClass.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Class not found."}, status=status.HTTP_404_NOT_FOUND)

        name = request.data.get("name")
        teacher = request.data.get("teacher")

        if name is not None:
            name = name.strip()
            if not name:
                return Response({"success": False, "error": "Class name cannot be blank."}, status=status.HTTP_400_BAD_REQUEST)
            if SchoolClass.objects.filter(name__iexact=name).exclude(pk=pk).exists():
                return Response({"success": False, "error": f"Another class named '{name}' already exists."}, status=status.HTTP_400_BAD_REQUEST)
            school_class.name = name

        if teacher is not None:
            teacher = teacher.strip()
            if not teacher:
                return Response({"success": False, "error": "Teacher name cannot be blank."}, status=status.HTTP_400_BAD_REQUEST)
            school_class.teacher = teacher

        school_class.save()
        serializer = SchoolClassSerializer(school_class)
        return Response({"success": True, "data": serializer.data})

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        try:
            school_class = SchoolClass.objects.get(pk=pk)
        except (SchoolClass.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Class not found."}, status=status.HTTP_404_NOT_FOUND)

        if school_class.students.exists():
            return Response(
                {
                    "success": False,
                    "error": "Cannot delete a class that has enrolled students. Reassign or remove students first.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        school_class.delete()
        return Response({"success": True, "message": "Class deleted successfully."})


class StudentListCreateView(APIView):
    def get(self, request):
        class_id = request.query_params.get("classId")
        search_query = request.query_params.get("search")

        students = Student.objects.select_related("school_class").all().order_by("name")

        if class_id and class_id != "all":
            students = students.filter(school_class_id=class_id)

        if search_query:
            q = search_query.strip()
            students = students.filter(Q(name__icontains=q) | Q(student_id__icontains=q))

        serializer = StudentSerializer(students, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        student_id = request.data.get("studentId", "").strip().upper()
        name = request.data.get("name", "").strip()
        class_id = request.data.get("classId")
        gender = request.data.get("gender", "Other")

        if not name:
            return Response({"success": False, "error": "Student name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not student_id:
            return Response({"success": False, "error": "Student ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not class_id:
            return Response({"success": False, "error": "Class selection is required."}, status=status.HTTP_400_BAD_REQUEST)

        if Student.objects.filter(student_id__iexact=student_id).exists():
            return Response(
                {"success": False, "error": f"Student ID '{student_id}' is already assigned to another student."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            school_class = SchoolClass.objects.get(pk=class_id)
        except (SchoolClass.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Selected class does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        student = Student.objects.create(
            student_id=student_id,
            name=name,
            school_class=school_class,
            gender=gender if gender in ["Male", "Female", "Other"] else "Other",
        )
        serializer = StudentSerializer(student)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_201_CREATED)


class StudentDetailView(APIView):
    def get(self, request, pk):
        try:
            student = Student.objects.select_related("school_class").get(pk=pk)
        except (Student.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = StudentSerializer(student)
        return Response({"success": True, "data": serializer.data})

    def put(self, request, pk):
        try:
            student = Student.objects.get(pk=pk)
        except (Student.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        student_id = request.data.get("studentId")
        name = request.data.get("name")
        class_id = request.data.get("classId")
        gender = request.data.get("gender")

        if student_id is not None:
            student_id = student_id.strip().upper()
            if not student_id:
                return Response({"success": False, "error": "Student ID cannot be blank."}, status=status.HTTP_400_BAD_REQUEST)
            if Student.objects.filter(student_id__iexact=student_id).exclude(pk=pk).exists():
                return Response({"success": False, "error": f"Student ID '{student_id}' is already assigned."}, status=status.HTTP_400_BAD_REQUEST)
            student.student_id = student_id

        if name is not None:
            name = name.strip()
            if not name:
                return Response({"success": False, "error": "Student name cannot be blank."}, status=status.HTTP_400_BAD_REQUEST)
            student.name = name

        if class_id is not None:
            try:
                student.school_class = SchoolClass.objects.get(pk=class_id)
            except (SchoolClass.DoesNotExist, ValueError):
                return Response({"success": False, "error": "Selected class does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        if gender is not None and gender in ["Male", "Female", "Other"]:
            student.gender = gender

        student.save()
        serializer = StudentSerializer(student)
        return Response({"success": True, "data": serializer.data})

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        try:
            student = Student.objects.get(pk=pk)
        except (Student.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        student.delete()
        return Response({"success": True, "message": "Student deleted successfully."})


class AttendanceView(APIView):
    def get(self, request):
        date_str = request.query_params.get("date")
        class_id = request.query_params.get("classId")
        month_str = request.query_params.get("month")
        student_id = request.query_params.get("studentId")

        records = Attendance.objects.select_related("student", "school_class").all()

        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                records = records.filter(date=target_date)
            except ValueError:
                pass

        if class_id and class_id != "all":
            records = records.filter(school_class_id=class_id)

        if student_id:
            s_id = str(student_id).strip()
            if s_id.isdigit():
                records = records.filter(Q(student_id=int(s_id)) | Q(student__student_id__iexact=s_id))
            else:
                records = records.filter(student__student_id__iexact=s_id)

        if month_str:
            try:
                year, month = map(int, month_str.split("-"))
                records = records.filter(date__year=year, date__month=month)
            except ValueError:
                pass

        serializer = AttendanceRecordSerializer(records, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        date_str = request.data.get("date")
        class_id = request.data.get("classId")
        records_data = request.data.get("records")

        # Support single-object format or list format
        if records_data is None:
            if "studentId" in request.data:
                records_data = [{"studentId": request.data.get("studentId"), "status": request.data.get("status", "Present")}]
            else:
                records_data = []

        if not date_str or not class_id or not isinstance(records_data, list):
            return Response(
                {"success": False, "error": "date, classId, and records list are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"success": False, "error": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            school_class = SchoolClass.objects.get(pk=class_id)
        except (SchoolClass.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Selected class does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        valid_statuses = {"Present", "Absent", "Late", "Excused"}
        saved_count = 0

        with transaction.atomic():
            for item in records_data:
                student_id = item.get("studentId")
                status_val = item.get("status", "Present")

                if not student_id or status_val not in valid_statuses:
                    continue

                try:
                    student = Student.objects.get(pk=student_id)
                except (Student.DoesNotExist, ValueError):
                    try:
                        student = Student.objects.get(student_id__iexact=str(student_id).strip())
                    except Student.DoesNotExist:
                        continue

                Attendance.objects.update_or_create(
                    student=student,
                    date=target_date,
                    defaults={
                        "school_class": school_class,
                        "status": status_val,
                    },
                )
                saved_count += 1

        return Response({
            "success": True,
            "message": f"Successfully recorded attendance for {saved_count} students.",
            "data": {"savedCount": saved_count},
        })


class AttendanceDetailView(APIView):
    """
    CRUD endpoint for individual attendance records by primary key.
    """
    def get(self, request, pk):
        try:
            record = Attendance.objects.select_related("student", "school_class").get(pk=pk)
        except (Attendance.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Attendance record not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AttendanceRecordSerializer(record)
        return Response({"success": True, "data": serializer.data})

    def put(self, request, pk):
        try:
            record = Attendance.objects.select_related("student", "school_class").get(pk=pk)
        except (Attendance.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Attendance record not found."}, status=status.HTTP_404_NOT_FOUND)

        valid_statuses = {"Present", "Absent", "Late", "Excused"}
        status_val = request.data.get("status")
        date_str = request.data.get("date")

        if status_val is not None:
            if status_val not in valid_statuses:
                return Response(
                    {"success": False, "error": f"Invalid status '{status_val}'. Allowed: {', '.join(sorted(valid_statuses))}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            record.status = status_val

        if date_str is not None:
            try:
                new_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                if Attendance.objects.filter(student=record.student, date=new_date).exclude(pk=pk).exists():
                    return Response(
                        {"success": False, "error": f"Attendance for this student on {new_date} already exists."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                record.date = new_date
            except ValueError:
                return Response({"success": False, "error": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        record.save()
        serializer = AttendanceRecordSerializer(record)
        return Response({"success": True, "data": serializer.data})

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        try:
            record = Attendance.objects.get(pk=pk)
        except (Attendance.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Attendance record not found."}, status=status.HTTP_404_NOT_FOUND)

        record.delete()
        return Response({"success": True, "message": "Attendance record deleted successfully."})


class DashboardView(APIView):
    def get(self, request):
        date_param = request.query_params.get("date")
        if date_param:
            try:
                target_date = datetime.strptime(date_param, "%Y-%m-%d").date()
            except ValueError:
                target_date = date.today()
        else:
            target_date = date.today()

        today_str = target_date.strftime("%Y-%m-%d")

        total_students = Student.objects.count()
        total_classes = SchoolClass.objects.count()

        day_records = Attendance.objects.filter(date=target_date)
        present_today = day_records.filter(status="Present").count()
        absent_today = day_records.filter(status="Absent").count()

        rate = round((present_today / total_students) * 100) if total_students > 0 else 0

        classes = SchoolClass.objects.all().prefetch_related("students")
        class_summaries = []

        # Count attendance by class
        attendance_by_class = {}
        for rec in day_records:
            cid = rec.school_class_id
            if cid not in attendance_by_class:
                attendance_by_class[cid] = {"Present": 0, "Absent": 0}
            if rec.status in attendance_by_class[cid]:
                attendance_by_class[cid][rec.status] += 1

        for c in classes:
            class_student_count = c.students.count()
            counts = attendance_by_class.get(c.id, {"Present": 0, "Absent": 0})
            c_present = counts["Present"]
            c_absent = counts["Absent"]
            c_pct = round((c_present / class_student_count) * 100) if class_student_count > 0 else 0

            class_summaries.append({
                "classId": str(c.id),
                "className": c.name,
                "teacher": c.teacher,
                "totalStudents": class_student_count,
                "presentToday": c_present,
                "absentToday": c_absent,
                "percentage": c_pct,
            })

        return Response({
            "success": True,
            "data": {
                "stats": {
                    "totalStudents": total_students,
                    "totalClasses": total_classes,
                    "presentToday": present_today,
                    "absentToday": absent_today,
                    "attendanceRateToday": rate,
                    "todayDate": today_str,
                },
                "classSummaries": class_summaries,
            },
        })


class ReportsView(APIView):
    def get(self, request):
        month_str = request.query_params.get("month")
        class_id = request.query_params.get("classId")

        if not month_str:
            month_str = date.today().strftime("%Y-%m")

        try:
            year, month = map(int, month_str.split("-"))
        except ValueError:
            return Response(
                {"success": False, "error": "Invalid month format. Expected YYYY-MM."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        students = Student.objects.select_related("school_class").all()
        if class_id and class_id != "all":
            students = students.filter(school_class_id=class_id)

        # Prefetch month attendance
        attendance_records = Attendance.objects.filter(
            date__year=year,
            date__month=month
        )

        # Build attendance lookup map: student_id -> list of records
        records_by_student = {}
        for rec in attendance_records:
            records_by_student.setdefault(rec.student_id, []).append(rec)

        report_rows = []
        for student in students:
            stu_records = records_by_student.get(student.id, [])
            present_days = sum(1 for r in stu_records if r.status == "Present")
            absent_days = sum(1 for r in stu_records if r.status == "Absent")
            late_days = sum(1 for r in stu_records if r.status == "Late")
            excused_days = sum(1 for r in stu_records if r.status == "Excused")
            total_days = len(stu_records)
            pct = round((present_days / total_days) * 100) if total_days > 0 else 0

            report_rows.append({
                "studentId": str(student.id),
                "studentCode": student.student_id,
                "studentName": student.name,
                "className": student.school_class.name if student.school_class else "Unassigned",
                "presentDays": present_days,
                "absentDays": absent_days,
                "lateDays": late_days,
                "excusedDays": excused_days,
                "totalDays": total_days,
                "percentage": pct,
            })

        return Response({
            "success": True,
            "data": report_rows,
            "meta": {
                "month": month_str,
                "classId": class_id or "all",
                "totalRecords": len(report_rows),
            },
        })


class SettingsView(APIView):
    def get(self, request):
        settings = SchoolSettings.get_settings()
        serializer = SchoolSettingsSerializer(settings)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        return self._save_settings(request)

    def put(self, request):
        return self._save_settings(request)

    def patch(self, request):
        return self._save_settings(request)

    def _save_settings(self, request):
        settings = SchoolSettings.get_settings()

        school_name = request.data.get("schoolName")
        academic_session = request.data.get("academicSession")
        term = request.data.get("term")

        if school_name is not None:
            settings.school_name = school_name.strip()
        if academic_session is not None:
            settings.academic_session = academic_session.strip()
        if term is not None:
            settings.term = term.strip()

        settings.save()
        serializer = SchoolSettingsSerializer(settings)
        return Response({
            "success": True,
            "message": "Settings updated successfully.",
            "data": serializer.data,
        })


class DemoActionView(APIView):
    def get(self, request):
        return Response({
            "success": True,
            "info": "Demo reset and clear endpoints.",
            "availableActions": {
                "reset": "POST {'action': 'reset'} to populate database with sample data.",
                "clear": "POST {'action': 'clear'} to remove all classes, students, and attendance.",
            },
            "counts": {
                "classes": SchoolClass.objects.count(),
                "students": Student.objects.count(),
                "attendance": Attendance.objects.count(),
            },
        })

    def post(self, request):
        action = request.data.get("action")

        if action == "clear":
            Attendance.objects.all().delete()
            Student.objects.all().delete()
            SchoolClass.objects.all().delete()
            return Response({
                "success": True,
                "message": "Successfully cleared all student, class, and attendance data.",
            })

        if action == "reset":
            from .seed_helper import run_seed_data
            run_seed_data()
            return Response({
                "success": True,
                "message": "Successfully reset database with sample classes, students, and attendance records.",
            })

        return Response({"success": False, "error": "Invalid action. Use 'reset' or 'clear'."}, status=status.HTTP_400_BAD_REQUEST)
