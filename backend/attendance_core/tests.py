from datetime import date
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from attendance_core.models import SchoolClass, Student, Attendance, SchoolSettings


class ModelsTestCase(TestCase):
    def setUp(self):
        self.school_class = SchoolClass.objects.create(name="Grade 10 - Test", teacher="Mr. Tester")
        self.student = Student.objects.create(
            student_id="TST-001",
            name="Jane Doe",
            gender="Female",
            school_class=self.school_class,
        )

    def test_school_class_str(self):
        self.assertEqual(str(self.school_class), "Grade 10 - Test (Mr. Tester)")

    def test_student_str(self):
        self.assertEqual(str(self.student), "Jane Doe (TST-001) - Grade 10 - Test")

    def test_attendance_str(self):
        att = Attendance.objects.create(
            student=self.student,
            school_class=self.school_class,
            date=date(2026, 9, 22),
            status="Present",
        )
        self.assertEqual(str(att), "2026-09-22 | Jane Doe | Present")

    def test_school_settings_singleton(self):
        settings_1 = SchoolSettings.get_settings()
        settings_2 = SchoolSettings.get_settings()
        self.assertEqual(settings_1.id, settings_2.id)
        self.assertEqual(SchoolSettings.objects.count(), 1)


class ApiRootTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_api_root(self):
        res = self.client.get('/api/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["success"])
        self.assertIn("endpoints", res.data)
        self.assertIn("classes", res.data["endpoints"])
        self.assertIn("attendance_detail", res.data["endpoints"])


class ClassApiTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.class1 = SchoolClass.objects.create(name="Grade 10 - Alpha", teacher="Teacher A")
        self.student = Student.objects.create(
            student_id="STU-001",
            name="Alice",
            gender="Female",
            school_class=self.class1,
        )

    def test_list_classes(self):
        response = self.client.get('/api/classes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["studentCount"], 1)

    def test_create_class(self):
        response = self.client.post('/api/classes/', {"name": "Grade 11 - Beta", "teacher": "Teacher B"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertTrue(SchoolClass.objects.filter(name="Grade 11 - Beta").exists())

    def test_create_class_validation(self):
        # Missing fields
        response = self.client.post('/api/classes/', {"name": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Duplicate class name
        response = self.client.post('/api/classes/', {"name": "grade 10 - alpha", "teacher": "Another"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_class_detail_and_put(self):
        detail_res = self.client.get(f'/api/classes/{self.class1.id}/')
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data["data"]["name"], "Grade 10 - Alpha")

        update_res = self.client.put(f'/api/classes/{self.class1.id}/', {"teacher": "Updated Teacher"}, format="json")
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.class1.refresh_from_db()
        self.assertEqual(self.class1.teacher, "Updated Teacher")

    def test_class_patch(self):
        patch_res = self.client.patch(f'/api/classes/{self.class1.id}/', {"name": "Grade 10 - Renamed"}, format="json")
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.class1.refresh_from_db()
        self.assertEqual(self.class1.name, "Grade 10 - Renamed")

    def test_delete_class_protection(self):
        # Cannot delete class with students
        del_res = self.client.delete(f'/api/classes/{self.class1.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Empty class can be deleted
        empty_class = SchoolClass.objects.create(name="Empty Class", teacher="None")
        del_res2 = self.client.delete(f'/api/classes/{empty_class.id}/')
        self.assertEqual(del_res2.status_code, status.HTTP_200_OK)
        self.assertFalse(SchoolClass.objects.filter(id=empty_class.id).exists())


class StudentApiTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cls = SchoolClass.objects.create(name="Class 1", teacher="Teacher 1")
        self.student = Student.objects.create(
            student_id="STU-001",
            name="Charlie Brown",
            gender="Male",
            school_class=self.cls,
        )

    def test_list_and_filter_students(self):
        res = self.client.get('/api/students/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]), 1)

        # Filter by class
        res_class = self.client.get(f'/api/students/?classId={self.cls.id}')
        self.assertEqual(len(res_class.data["data"]), 1)

        # Search filter
        res_search = self.client.get('/api/students/?search=Charlie')
        self.assertEqual(len(res_search.data["data"]), 1)
        res_empty = self.client.get('/api/students/?search=NonExistent')
        self.assertEqual(len(res_empty.data["data"]), 0)

    def test_create_student(self):
        payload = {
            "name": "Diana Prince",
            "studentId": "STU-002",
            "classId": str(self.cls.id),
            "gender": "Female",
        }
        res = self.client.post('/api/students/', payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Student.objects.filter(student_id="STU-002").exists())

    def test_create_student_duplicate_id(self):
        payload = {
            "name": "Duplicate ID Student",
            "studentId": "STU-001",
            "classId": str(self.cls.id),
            "gender": "Male",
        }
        res = self.client.post('/api/students/', payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_student_put_and_patch(self):
        # Test PUT
        put_res = self.client.put(f'/api/students/{self.student.id}/', {"name": "Charles Brown"}, format="json")
        self.assertEqual(put_res.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.name, "Charles Brown")

        # Test PATCH
        patch_res = self.client.patch(f'/api/students/{self.student.id}/', {"gender": "Other"}, format="json")
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.gender, "Other")

    def test_delete_student(self):
        res = self.client.delete(f'/api/students/{self.student.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Student.objects.filter(id=self.student.id).exists())


class AttendanceApiTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cls = SchoolClass.objects.create(name="Class 1", teacher="Teacher 1")
        self.student1 = Student.objects.create(student_id="STU-001", name="Student 1", school_class=self.cls)
        self.student2 = Student.objects.create(student_id="STU-002", name="Student 2", school_class=self.cls)

    def test_record_and_get_attendance(self):
        payload = {
            "date": "2026-09-22",
            "classId": str(self.cls.id),
            "records": [
                {"studentId": str(self.student1.id), "status": "Present"},
                {"studentId": "STU-002", "status": "Absent"},
            ],
        }
        post_res = self.client.post('/api/attendance/', payload, format="json")
        self.assertEqual(post_res.status_code, status.HTTP_200_OK)
        self.assertEqual(post_res.data["data"]["savedCount"], 2)

        # GET attendance for date and class
        get_res = self.client.get(f'/api/attendance/?classId={self.cls.id}&date=2026-09-22')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.data["data"]), 2)
        record_item = get_res.data["data"][0]
        self.assertIn("studentName", record_item)
        self.assertIn("studentCode", record_item)
        self.assertIn("className", record_item)

    def test_filter_attendance_by_student_id(self):
        Attendance.objects.create(
            student=self.student1,
            school_class=self.cls,
            date=date(2026, 9, 20),
            status="Present",
        )
        Attendance.objects.create(
            student=self.student2,
            school_class=self.cls,
            date=date(2026, 9, 20),
            status="Absent",
        )

        res_by_pk = self.client.get(f'/api/attendance/?studentId={self.student1.id}')
        self.assertEqual(res_by_pk.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_by_pk.data["data"]), 1)
        self.assertEqual(res_by_pk.data["data"][0]["studentId"], str(self.student1.id))

        res_by_code = self.client.get(f'/api/attendance/?studentId=STU-002')
        self.assertEqual(res_by_code.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_by_code.data["data"]), 1)
        self.assertEqual(res_by_code.data["data"][0]["studentId"], str(self.student2.id))

    def test_attendance_detail_crud(self):
        att = Attendance.objects.create(
            student=self.student1,
            school_class=self.cls,
            date=date(2026, 9, 21),
            status="Absent",
        )

        # GET
        get_res = self.client.get(f'/api/attendance/{att.id}/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data["data"]["status"], "Absent")

        # PATCH
        patch_res = self.client.patch(f'/api/attendance/{att.id}/', {"status": "Present"}, format="json")
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        att.refresh_from_db()
        self.assertEqual(att.status, "Present")

        # DELETE
        del_res = self.client.delete(f'/api/attendance/{att.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertFalse(Attendance.objects.filter(id=att.id).exists())


class DashboardAndReportsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cls = SchoolClass.objects.create(name="Class 1", teacher="Teacher 1")
        self.student = Student.objects.create(student_id="STU-001", name="Student 1", school_class=self.cls)
        Attendance.objects.create(
            student=self.student,
            school_class=self.cls,
            date=date.today(),
            status="Present",
        )

    def test_dashboard_stats_default_today(self):
        res = self.client.get('/api/dashboard/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["success"])
        stats = res.data["data"]["stats"]
        self.assertEqual(stats["totalStudents"], 1)
        self.assertEqual(stats["totalClasses"], 1)
        self.assertEqual(stats["presentToday"], 1)

    def test_dashboard_stats_custom_date(self):
        res = self.client.get(f'/api/dashboard/?date={date.today().strftime("%Y-%m-%d")}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["stats"]["presentToday"], 1)

    def test_reports_view_default_month(self):
        res = self.client.get(f'/api/reports/?classId={self.cls.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]), 1)
        row = res.data["data"][0]
        self.assertEqual(row["studentCode"], "STU-001")
        self.assertEqual(row["presentDays"], 1)
        self.assertIn("lateDays", row)
        self.assertIn("excusedDays", row)

    def test_reports_view_explicit_month(self):
        today = date.today()
        month_str = today.strftime("%Y-%m")
        res = self.client.get(f'/api/reports/?month={month_str}&classId={self.cls.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]), 1)


class SettingsAndDemoTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_settings_get_post_patch(self):
        get_res = self.client.get('/api/settings/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)

        # POST
        post_res = self.client.post('/api/settings/', {
            "schoolName": "Global High School",
            "academicSession": "2026/2027",
            "term": "Second Term",
        }, format="json")
        self.assertEqual(post_res.status_code, status.HTTP_200_OK)
        self.assertEqual(post_res.data["data"]["schoolName"], "Global High School")

        # PATCH
        patch_res = self.client.patch('/api/settings/', {
            "schoolName": "Global Academy",
        }, format="json")
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["data"]["schoolName"], "Global Academy")

    def test_demo_get_and_actions(self):
        # Test GET info
        get_res = self.client.get('/api/demo/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertIn("availableActions", get_res.data)

        # Test clear
        clear_res = self.client.post('/api/demo/', {"action": "clear"}, format="json")
        self.assertEqual(clear_res.status_code, status.HTTP_200_OK)
        self.assertEqual(Student.objects.count(), 0)
        self.assertEqual(SchoolClass.objects.count(), 0)

        # Test reset
        reset_res = self.client.post('/api/demo/', {"action": "reset"}, format="json")
        self.assertEqual(reset_res.status_code, status.HTTP_200_OK)
        self.assertGreater(Student.objects.count(), 0)
        self.assertGreater(SchoolClass.objects.count(), 0)
